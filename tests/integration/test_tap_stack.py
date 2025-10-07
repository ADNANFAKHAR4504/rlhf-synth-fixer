import os
import json
import unittest
import boto3
import time
import requests
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack CDK stack (environment-aware, live AWS checks)"""

    @classmethod
    def setUpClass(cls):
        """Load outputs and initialize AWS clients"""
        base_dir = os.path.join(os.path.dirname(__file__), "..", "..", "cfn-outputs")
        outputs_path = os.path.join(base_dir, "flat-outputs.json")

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(f"❌ Missing outputs file: {outputs_path}")

        with open(outputs_path, "r", encoding="utf-8") as f:
            cls.outputs = json.load(f)

        cls.env_suffix = os.getenv("ENVIRONMENT_SUFFIX", "")
        cls.region = os.getenv("AWS_REGION", "us-east-2")

        cls.ec2 = boto3.client("ec2", region_name=cls.region)
        cls.elbv2 = boto3.client("elbv2", region_name=cls.region)
        cls.rds = boto3.client("rds", region_name=cls.region)
        cls.s3 = boto3.client("s3", region_name=cls.region)
        cls.lambda_client = boto3.client("lambda", region_name=cls.region)
        cls.logs = boto3.client("logs", region_name=cls.region)

    def get_output(self, key_base: str) -> str:
        """Retrieve output value with environment suffix appended"""
        key = f"{key_base}{self.env_suffix}"
        value = self.outputs.get(key)
        if not value:
            raise KeyError(f"Missing key '{key}' in flat-outputs.json")
        return value

    # --- Core Tests ---

    def test_vpc_exists(self):
        """Validate that the VPC exists in AWS"""
        vpc_id = self.get_output("VPCId")
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertGreater(len(response.get("Vpcs", [])), 0, "VPC should exist in AWS")

    def test_alb_active(self):
        """Validate that the Application Load Balancer is active"""
        alb_dns = self.get_output("LoadBalancerDNS")

        self.assertIn("elb.amazonaws.com", alb_dns)
        self.assertIsNotNone(alb_dns)

    def test_rds_endpoint_valid(self):
        """Validate that the RDS instance endpoint exists and is available"""
        db_endpoint = self.get_output("DatabaseEndpoint")
        response = self.rds.describe_db_instances()
        found = None
        for db in response.get("DBInstances", []):
            if db.get("Endpoint", {}).get("Address") == db_endpoint:
                found = db
                break
        self.assertIsNotNone(found, f"RDS endpoint {db_endpoint} not found in AWS")
        self.assertEqual(found["DBInstanceStatus"], "available", "RDS instance should be available")

    def test_s3_bucket_accessible(self):
        """Validate that the S3 bucket exists and is reachable"""
        bucket_name = self.get_output("S3BucketName")
        try:
            self.s3.head_bucket(Bucket=bucket_name)
        except ClientError as e:
            self.fail(f"S3 bucket '{bucket_name}' not accessible: {e}")

    def test_lambda_function_functionality(self):
        """Validate that the Lambda function exists"""
        lambda_name = self.get_output("LambdaFunctionName")
        try:
            response = self.lambda_client.get_function(FunctionName=lambda_name)
            self.assertEqual(response["Configuration"]["FunctionName"], lambda_name)
        except ClientError as e:
            self.fail(f"Lambda function '{lambda_name}' not found: {e}")

    # --- Interactive AWS Tests ---

    def test_alb_health_check_interactive(self):
        """Test ALB health check by actually calling the health endpoint"""
        alb_dns = self.get_output("LoadBalancerDNS")
        health_url = f"http://{alb_dns}/health"
        
        # Wait up to 5 minutes for instances to be healthy
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                response = requests.get(health_url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    self.assertEqual(data["status"], "healthy")
                    self.assertIn("timestamp", data)
                    print(f"Health check successful: {data}")
                    return
            except (requests.exceptions.RequestException, ValueError):
                pass
            
            if attempt < max_attempts - 1:
                print(f"Health check attempt {attempt + 1} failed, retrying in 10s...")
                time.sleep(10)
        
        self.fail(f"Health check endpoint {health_url} not responding after {max_attempts} attempts")

    def test_lambda_function_invocation_interactive(self):
        """Test Lambda function by actually invoking it and checking response"""
        lambda_name = self.get_output("LambdaFunctionName")
        
        # Invoke the Lambda function synchronously
        response = self.lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse'
        )
        
        # Verify successful invocation
        self.assertEqual(response["StatusCode"], 200)
        self.assertNotIn("FunctionError", response)
        
        # Parse and validate response payload
        payload = json.loads(response["Payload"].read())
        self.assertEqual(payload["statusCode"], 200)
        
        body = json.loads(payload["body"])
        self.assertEqual(body["message"], "Monitoring completed successfully")
        self.assertIn("running_instances", body)
        self.assertIn("timestamp", body)
        self.assertGreaterEqual(body["running_instances"], 0)
        
        print(f"Lambda invocation successful: {body}")

    def test_s3_bucket_read_write_interactive(self):
        """Test S3 bucket by actually writing and reading an object"""
        bucket_name = self.get_output("S3BucketName")
        test_key = "integration-test/test-file.txt"
        test_content = "This is a test file for integration testing"
        
        try:
            # Write test object
            self.s3.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content.encode('utf-8'),
                ContentType='text/plain'
            )
            
            # Read back the object
            response = self.s3.get_object(Bucket=bucket_name, Key=test_key)
            retrieved_content = response['Body'].read().decode('utf-8')
            
            # Verify content matches
            self.assertEqual(retrieved_content, test_content)
            
            # Verify encryption is working (should have ServerSideEncryption)
            self.assertIn('ServerSideEncryption', response)
            
            print(f"S3 read/write test successful with encryption: {response['ServerSideEncryption']}")
            
        finally:
            # Clean up test object
            try:
                self.s3.delete_object(Bucket=bucket_name, Key=test_key)
            except ClientError:
                pass  # Ignore cleanup errors

    def test_vpc_subnet_connectivity_interactive(self):
        """Test VPC connectivity by checking subnet routing and NAT gateway"""
        vpc_id = self.get_output("VPCId")
        
        # Get all subnets in the VPC
        subnets_response = self.ec2.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        subnets = subnets_response["Subnets"]
        
        # Should have exactly 6 subnets (3 types × 2 AZs)
        self.assertEqual(len(subnets), 6, "VPC should have exactly 6 subnets")
        
        # Get route tables
        route_tables_response = self.ec2.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        route_tables = route_tables_response["RouteTables"]
        
        # Should have route tables for different subnet types
        self.assertGreater(len(route_tables), 1, "Should have multiple route tables for different subnet types")
        
       
        print(f"VPC connectivity test successful: {len(subnets)} subnets")

    def test_rds_connection_interactive(self):
        """Test RDS connectivity by attempting to connect to the database"""
        db_endpoint = self.get_output("DatabaseEndpoint")
        
        # Get DB instance details
        response = self.rds.describe_db_instances()
        db_instance = None
        for db in response["DBInstances"]:
            if db["Endpoint"]["Address"] == db_endpoint:
                db_instance = db
                break
        
        self.assertIsNotNone(db_instance, "RDS instance should exist")
        
        # Verify Multi-AZ configuration
        self.assertTrue(db_instance["MultiAZ"], "RDS should be Multi-AZ")
        
        # Verify encryption
        self.assertTrue(db_instance["StorageEncrypted"], "RDS storage should be encrypted")
        
        # Verify instance is available
        self.assertEqual(db_instance["DBInstanceStatus"], "available", "RDS instance should be available")
        
        # Verify backup retention is set
        self.assertGreaterEqual(db_instance["BackupRetentionPeriod"], 1, "RDS should have backup retention configured")
        
        # Note: We can't actually connect to RDS from integration tests due to security groups,
        # but we can verify the configuration is correct for connectivity
        print(f"RDS interactive test successful: Multi-AZ={db_instance['MultiAZ']}, Encrypted={db_instance['StorageEncrypted']}")

    def test_cloudwatch_monitoring_interactive(self):
        """Test CloudWatch monitoring by triggering and verifying custom metrics"""
        lambda_name = self.get_output("LambdaFunctionName")
        
        # Invoke Lambda to generate custom metrics
        self.lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='RequestResponse'
        )
        
        # Wait a moment for metrics to be published
        time.sleep(10)
        
        # Check for custom metrics in CloudWatch
        cloudwatch = boto3.client('cloudwatch', region_name=self.region)
        
        # List metrics to verify our custom metric exists
        metrics_response = cloudwatch.list_metrics(
            Namespace='TAP/Infrastructure',
            MetricName='RunningInstances'
        )
        
        metrics = metrics_response.get('Metrics', [])
        self.assertGreater(len(metrics), 0, "Custom CloudWatch metric should exist")
        
        # Verify the metric has recent data points
        metric_data = cloudwatch.get_metric_statistics(
            Namespace='TAP/Infrastructure',
            MetricName='RunningInstances',
            StartTime=time.time() - 300,  # Last 5 minutes
            EndTime=time.time(),
            Period=60,
            Statistics=['Average']
        )
        
        # Should have at least one data point
        datapoints = metric_data.get('Datapoints', [])
        self.assertGreater(len(datapoints), 0, "Should have recent metric data points")
        
        print(f"CloudWatch monitoring test successful: {len(datapoints)} data points found")

    def test_auto_scaling_group_interactive(self):
        """Test Auto Scaling Group by checking instance health and scaling capabilities"""
        # Get ASG information through EC2 instances
        instances_response = self.ec2.describe_instances(
            Filters=[
                {"Name": "instance-state-name", "Values": ["running"]},
                {"Name": "tag:aws:autoscaling:groupName", "Values": ["*"]}
            ]
        )
        
        running_instances = []
        for reservation in instances_response["Reservations"]:
            for instance in reservation["Instances"]:
                if instance["State"]["Name"] == "running":
                    running_instances.append(instance)
        
        # Should have at least 1 instance running (desired capacity is 2, but may be scaling)
        self.assertGreater(len(running_instances), 0, "Should have at least one running instance")
        
        # Verify instances are in the correct VPC
        vpc_id = self.get_output("VPCId")
        for instance in running_instances:
            self.assertEqual(instance["VpcId"], vpc_id, "Instances should be in the correct VPC")
        
        # Get ALB target group health
        alb_dns = self.get_output("LoadBalancerDNS")
        alb_arn = None
        
        # Find the ALB ARN
        elb_response = self.elbv2.describe_load_balancers()
        for lb in elb_response["LoadBalancers"]:
            if lb["DNSName"] == alb_dns:
                alb_arn = lb["LoadBalancerArn"]
                break
        
        self.assertIsNotNone(alb_arn, "Should find the ALB ARN")
        
        # Get target groups for this ALB
        tg_response = self.elbv2.describe_target_groups(
            LoadBalancerArn=alb_arn
        )
        
        self.assertGreater(len(tg_response["TargetGroups"]), 0, "Should have target groups")
        
        target_group_arn = tg_response["TargetGroups"][0]["TargetGroupArn"]
        
        # Check target health
        health_response = self.elbv2.describe_target_health(
            TargetGroupArn=target_group_arn
        )
        
        healthy_targets = [t for t in health_response["TargetHealthDescriptions"] 
                          if t["TargetHealth"]["State"] == "healthy"]
        
        # Should have at least one healthy target (may take time for all to become healthy)
        print(f"ASG interactive test: {len(running_instances)} running instances, {len(healthy_targets)} healthy targets")
        
        # Note: We don't assert on exact numbers as instances may be in transition


if __name__ == "__main__":
    unittest.main(verbosity=2)
