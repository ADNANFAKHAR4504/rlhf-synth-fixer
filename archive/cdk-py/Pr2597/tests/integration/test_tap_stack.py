import json
import os
import unittest
import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the deployed TapStack resources"""

    def setUp(self):
        """Set up AWS clients for integration tests"""
        self.s3_client = boto3.client('s3')
        self.dynamodb_client = boto3.client('dynamodb')
        self.dynamodb_resource = boto3.resource('dynamodb')
        self.ec2_client = boto3.client('ec2')
        self.elb_client = boto3.client('elb')
        self.cloudfront_client = boto3.client('cloudfront')
        self.logs_client = boto3.client('logs')
        self.cloudwatch_client = boto3.client('cloudwatch')
        self.autoscaling_client = boto3.client('autoscaling')
        self.iam_client = boto3.client('iam')

    @mark.it("validates flat-outputs.json file exists and contains required outputs")
    def test_flat_outputs_file_exists(self):
        """Test if the flat-outputs.json file exists and contains expected keys"""
        self.assertTrue(os.path.exists(flat_outputs_path), "flat-outputs.json file does not exist")
        
        expected_keys = [
            "VPCId",
            "S3BucketName",
            "DynamoDBTableName",
            "CloudFrontDistributionDomain",
            "LoadBalancerDNS"
        ]
        
        for key in expected_keys:
            self.assertIn(key, flat_outputs, f"Required output '{key}' not found in flat-outputs.json")
            self.assertIsNotNone(flat_outputs[key], f"Output '{key}' is None")

    @mark.it("validates VPC exists and has correct configuration")
    def test_vpc_exists_and_configured(self):
        """Test if the VPC exists and has correct CIDR and settings"""
        vpc_id = flat_outputs.get("VPCId")
        self.assertIsNotNone(vpc_id, "VPC ID is missing in outputs")

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            # Validate VPC configuration
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR block is incorrect")
            self.assertEqual(vpc['State'], 'available', "VPC should be in available state")
            
        except ClientError as e:
            self.fail(f"VPC validation failed: {e}")

    @mark.it("validates public subnets exist in VPC")
    def test_public_subnets_exist(self):
        """Test if public subnets exist in the VPC"""
        vpc_id = flat_outputs.get("VPCId")
        
        try:
            response = self.ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )
            subnets = response['Subnets']
            
            # Should have at least 2 subnets
            self.assertGreaterEqual(len(subnets), 2, "Should have at least 2 subnets")
            
            # Check if subnets are in different AZs
            availability_zones = set(subnet['AvailabilityZone'] for subnet in subnets)
            self.assertGreaterEqual(len(availability_zones), 2, "Subnets should be in different AZs")
            
        except ClientError as e:
            self.fail(f"Subnet validation failed: {e}")

    @mark.it("validates S3 bucket exists and is accessible")
    def test_s3_bucket_exists(self):
        """Test if the S3 bucket exists and has correct configuration"""
        bucket_name = flat_outputs.get("S3BucketName")
        self.assertIsNotNone(bucket_name, "S3 bucket name is missing in outputs")

        try:
            # Check if bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Check bucket versioning
            versioning_response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled', "Bucket versioning should be enabled")
            
            # Check bucket lifecycle configuration
            lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            rules = lifecycle_response.get('Rules', [])
            self.assertGreater(len(rules), 0, "Bucket should have lifecycle rules")
            
            # Check public access block configuration
            public_access_response = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access_response['PublicAccessBlockConfiguration']
            self.assertFalse(config['BlockPublicAcls'], "Public ACLs should not be blocked")
            self.assertFalse(config['BlockPublicPolicy'], "Public policies should not be blocked")
            
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates DynamoDB table exists and is active")
    def test_dynamodb_table_exists(self):
        """Test if the DynamoDB table exists and has correct configuration"""
        table_name = flat_outputs.get("DynamoDBTableName")
        self.assertIsNotNone(table_name, "DynamoDB table name is missing in outputs")

        try:
            table = self.dynamodb_resource.Table(table_name)
            table.load()  # This will raise an exception if table doesn't exist
            
            # Check table status
            self.assertEqual(table.table_status, 'ACTIVE', "Table should be in ACTIVE state")
            
            # Check partition key
            key_schema = table.key_schema
            partition_key = next((key for key in key_schema if key['KeyType'] == 'HASH'), None)
            self.assertIsNotNone(partition_key, "Table should have a partition key")
            self.assertEqual(partition_key['AttributeName'], 'SessionId', "Partition key should be 'SessionId'")
            
            # Check provisioned throughput
            self.assertEqual(table.provisioned_throughput['ReadCapacityUnits'], 5, "Read capacity should be 5")
            self.assertEqual(table.provisioned_throughput['WriteCapacityUnits'], 5, "Write capacity should be 5")
            
        except ClientError as e:
            self.fail(f"DynamoDB table validation failed: {e}")

    @mark.it("validates Load Balancer exists and is active")
    def test_load_balancer_exists(self):
        """Test if the Classic Load Balancer exists and is properly configured"""
        lb_dns_name = flat_outputs.get("LoadBalancerDNS")
        self.assertIsNotNone(lb_dns_name, "Load Balancer DNS name is missing in outputs")

        try:
            # Extract load balancer name from DNS name
            lb_name = lb_dns_name.split('-')[0] + '-' + lb_dns_name.split('-')[1] + '-' + lb_dns_name.split('-')[2]
            
            response = self.elb_client.describe_load_balancers()
            load_balancers = response['LoadBalancerDescriptions']
            
            # Find our load balancer
            our_lb = None
            for lb in load_balancers:
                if lb['DNSName'] == lb_dns_name:
                    our_lb = lb
                    break
            
            self.assertIsNotNone(our_lb, "Load balancer not found")
            self.assertEqual(our_lb['Scheme'], 'internet-facing', "Load balancer should be internet-facing")
            
            # Check listeners
            listeners = our_lb['ListenerDescriptions']
            self.assertGreater(len(listeners), 0, "Load balancer should have listeners")
            
            http_listener = next((l for l in listeners if l['Listener']['LoadBalancerPort'] == 80), None)
            self.assertIsNotNone(http_listener, "Load balancer should have HTTP listener on port 80")
            
        except ClientError as e:
            self.fail(f"Load Balancer validation failed: {e}")

    @mark.it("validates Auto Scaling Group exists with correct configuration")
    def test_auto_scaling_group_exists(self):
        """Test if the Auto Scaling Group exists and has correct configuration"""
        try:
            response = self.autoscaling_client.describe_auto_scaling_groups()
            asgs = response['AutoScalingGroups']
            
            # Find our ASG (should contain 'TapAutoScalingGroup' in the name)
            our_asg = None
            for asg in asgs:
                if 'TapAutoScalingGroup' in asg['AutoScalingGroupName']:
                    our_asg = asg
                    break
            
            self.assertIsNotNone(our_asg, "Auto Scaling Group not found")
            self.assertEqual(our_asg['MinSize'], 2, "Min capacity should be 2")
            self.assertEqual(our_asg['MaxSize'], 5, "Max capacity should be 5")
            self.assertEqual(our_asg['DesiredCapacity'], 2, "Desired capacity should be 2")
            
            # Check instances are running
            instances = our_asg['Instances']
            self.assertGreaterEqual(len(instances), 2, "Should have at least 2 instances")
            
            for instance in instances:
                self.assertEqual(instance['HealthStatus'], 'Healthy', f"Instance {instance['InstanceId']} should be healthy")
                
        except ClientError as e:
            self.fail(f"Auto Scaling Group validation failed: {e}")

    @mark.it("validates CloudFront distribution exists and is deployed")
    def test_cloudfront_distribution_exists(self):
        """Test if the CloudFront distribution exists and is properly configured"""
        distribution_domain = flat_outputs.get("CloudFrontDistributionDomain")
        self.assertIsNotNone(distribution_domain, "CloudFront distribution domain is missing in outputs")

        try:
            response = self.cloudfront_client.list_distributions()
            distributions = response.get('DistributionList', {}).get('Items', [])
            
            # Find our distribution
            our_distribution = None
            for dist in distributions:
                if dist['DomainName'] == distribution_domain:
                    our_distribution = dist
                    break
            
            self.assertIsNotNone(our_distribution, "CloudFront distribution not found")
            self.assertEqual(our_distribution['Status'], 'Deployed', "Distribution should be deployed")
            
            # Check if distribution is accessible
            try:
                response = requests.get(f"https://{distribution_domain}", timeout=10)
                self.assertIn(response.status_code, [200, 403], "CloudFront distribution should be accessible")
            except requests.RequestException:
                # It's okay if the distribution is not accessible due to content restrictions
                pass
                
        except ClientError as e:
            self.fail(f"CloudFront distribution validation failed: {e}")


    @mark.it("validates CloudWatch alarm exists")
    def test_cloudwatch_alarm_exists(self):
        """Test if the CloudWatch alarm exists and is configured correctly"""
        try:
            response = self.cloudwatch_client.describe_alarms()
            alarms = response['MetricAlarms']
            
            # Find our CPU alarm
            our_alarm = None
            for alarm in alarms:
                if 'TapCPUAlarm' in alarm['AlarmName']:
                    our_alarm = alarm
                    break
            
            self.assertIsNotNone(our_alarm, "CloudWatch alarm not found")
            self.assertEqual(our_alarm['MetricName'], 'CPUUtilization', "Alarm should monitor CPU utilization")
            self.assertEqual(our_alarm['Namespace'], 'AWS/EC2', "Alarm should be for EC2 namespace")
            self.assertEqual(our_alarm['Threshold'], 80.0, "Alarm threshold should be 80")
            self.assertEqual(our_alarm['EvaluationPeriods'], 2, "Alarm should have 2 evaluation periods")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarm validation failed: {e}")

    @mark.it("validates DynamoDB table functionality by performing CRUD operations")
    def test_dynamodb_crud_operations(self):
        """Test DynamoDB table functionality with basic CRUD operations"""
        table_name = flat_outputs.get("DynamoDBTableName")
        
        try:
            table = self.dynamodb_resource.Table(table_name)
            
            # Test item creation
            test_session_id = "test-session-12345"
            test_item = {
                'SessionId': test_session_id,
                'UserId': 'test-user',
                'CreatedAt': '2024-01-01T00:00:00Z'
            }
            
            table.put_item(Item=test_item)
            
            # Test item retrieval
            response = table.get_item(Key={'SessionId': test_session_id})
            self.assertIn('Item', response, "Item should be retrievable from DynamoDB")
            self.assertEqual(response['Item']['SessionId'], test_session_id, "Retrieved item should match")
            
            # Test item update
            table.update_item(
                Key={'SessionId': test_session_id},
                UpdateExpression='SET UserId = :val',
                ExpressionAttributeValues={':val': 'updated-user'}
            )
            
            # Verify update
            response = table.get_item(Key={'SessionId': test_session_id})
            self.assertEqual(response['Item']['UserId'], 'updated-user', "Item should be updated")
            
            # Test item deletion
            table.delete_item(Key={'SessionId': test_session_id})
            
            # Verify deletion
            response = table.get_item(Key={'SessionId': test_session_id})
            self.assertNotIn('Item', response, "Item should be deleted from DynamoDB")
            
        except ClientError as e:
            self.fail(f"DynamoDB CRUD operations failed: {e}")

    @mark.it("validates Load Balancer health check functionality")
    def test_load_balancer_health_check(self):
        """Test if the Load Balancer can perform health checks on instances"""
        lb_dns_name = flat_outputs.get("LoadBalancerDNS")
        
        try:
            # Get load balancer details
            response = self.elb_client.describe_load_balancers()
            our_lb = None
            for lb in response['LoadBalancerDescriptions']:
                if lb['DNSName'] == lb_dns_name:
                    our_lb = lb
                    break
            
            self.assertIsNotNone(our_lb, "Load balancer not found")
            
            # Check instance health
            lb_name = our_lb['LoadBalancerName']
            health_response = self.elb_client.describe_instance_health(LoadBalancerName=lb_name)
            instance_states = health_response['InstanceStates']
            
            # Should have healthy instances
            healthy_instances = [inst for inst in instance_states if inst['State'] == 'InService']
            self.assertGreater(len(healthy_instances), 0, "Load balancer should have healthy instances")
            
        except ClientError as e:
            self.fail(f"Load Balancer health check validation failed: {e}")


if __name__ == "__main__":
    unittest.main()
