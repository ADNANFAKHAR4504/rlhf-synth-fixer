import json
import os
import unittest
import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Load the CloudFormation outputs from flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.load(f)
else:
    flat_outputs = {}

# Initialize boto3 clients
region = 'us-west-2'  # Based on your ALB DNS endpoint
ec2_client = boto3.client('ec2', region_name=region)
rds_client = boto3.client('rds', region_name=region)
s3_client = boto3.client('s3', region_name=region)
elbv2_client = boto3.client('elbv2', region_name=region)
autoscaling_client = boto3.client('autoscaling', region_name=region)
cloudwatch_client = boto3.client('cloudwatch', region_name=region)


@mark.describe("TapStack Integration Tests")
class TestTapStack(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up test data from CloudFormation outputs"""
        self.vpc_id = flat_outputs.get("VPCId")
        self.environment_suffix = flat_outputs.get("EnvironmentSuffix")
        self.alb_dns = flat_outputs.get("LoadBalancerDNS")
        self.s3_bucket_name = flat_outputs.get("S3BucketName")
        self.database_endpoint = flat_outputs.get("DatabaseEndpoint")

    @mark.it("validates VPC exists and has correct configuration")
    def test_vpc_validation(self):
        """Test that VPC exists and has the correct CIDR and configuration"""
        self.assertIsNotNone(self.vpc_id, "VPC ID is missing in outputs")
        
        try:
            response = ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            vpc = response['Vpcs'][0]
            
            # Validate VPC CIDR block
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC CIDR block is incorrect")
          
            
            # Validate VPC state
            self.assertEqual(vpc['State'], 'available', "VPC should be in available state")
            
        except ClientError as e:
            self.fail(f"VPC validation failed: {e}")

    @mark.it("validates subnets exist and are properly configured")
    def test_subnets_validation(self):
        """Test that subnets exist and are properly distributed across AZs"""
        self.assertIsNotNone(self.vpc_id, "VPC ID is missing in outputs")
        
        try:
            response = ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            subnets = response['Subnets']
            
            # Should have 4 subnets (2 public + 2 private)
            self.assertEqual(len(subnets), 4, "Should have 4 subnets")
            
            # Check availability zones (should span 2 AZs)
            azs = set(subnet['AvailabilityZone'] for subnet in subnets)
            self.assertEqual(len(azs), 2, "Subnets should span 2 availability zones")
            
            # Validate CIDR blocks
            cidr_blocks = [subnet['CidrBlock'] for subnet in subnets]
            expected_cidrs = ['10.0.0.0/24', '10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24', '10.0.4.0/24']
            for cidr in cidr_blocks:
                self.assertIn(cidr, expected_cidrs, f"Unexpected CIDR block: {cidr}")
                
        except ClientError as e:
            self.fail(f"Subnet validation failed: {e}")


    @mark.it("validates RDS instance exists and is configured correctly")
    def test_rds_instance_validation(self):
        """Test that RDS instance exists and has the correct configuration"""
        self.assertIsNotNone(self.database_endpoint, "Database endpoint is missing in outputs")
        
        # Extract DB instance identifier from endpoint
        db_identifier = self.database_endpoint.split('.')[0]
        
        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            db_instance = response['DBInstances'][0]
            
            # Validate database engine and version
            self.assertEqual(db_instance['Engine'], 'mysql', "Database engine should be MySQL")
            self.assertTrue(db_instance['EngineVersion'].startswith('8.0'), 
                          "MySQL version should be 8.0.x")
            
            # Validate instance class
            self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.micro', 
                          "Instance class should be db.t3.micro")
            
            # Validate storage encryption
            self.assertTrue(db_instance['StorageEncrypted'], "Storage should be encrypted")
            
            # Validate backup retention
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7, 
                          "Backup retention should be 7 days")
            
            # Validate database status
            self.assertEqual(db_instance['DBInstanceStatus'], 'available', 
                          "Database should be in available state")
            
        except ClientError as e:
            self.fail(f"RDS validation failed: {e}")

    @mark.it("validates S3 bucket exists and has correct configuration")
    def test_s3_bucket_validation(self):
        """Test that S3 bucket exists and has versioning and lifecycle configuration"""
        self.assertIsNotNone(self.s3_bucket_name, "S3 bucket name is missing in outputs")
        
        try:
            # Check if bucket exists
            s3_client.head_bucket(Bucket=self.s3_bucket_name)
            
            # Check versioning configuration
            versioning_response = s3_client.get_bucket_versioning(Bucket=self.s3_bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled', 
                          "S3 bucket versioning should be enabled")
            
            # Check lifecycle configuration
            lifecycle_response = s3_client.get_bucket_lifecycle_configuration(Bucket=self.s3_bucket_name)
            rules = lifecycle_response['Rules']
            self.assertGreater(len(rules), 0, "Should have lifecycle rules")
            
            # Check for Glacier transition rule
            glacier_rule = next((rule for rule in rules 
                               if any(t['StorageClass'] == 'GLACIER' for t in rule.get('Transitions', []))), None)
            self.assertIsNotNone(glacier_rule, "Should have Glacier transition rule")
            
        except ClientError as e:
            self.fail(f"S3 bucket validation failed: {e}")

    @mark.it("validates Application Load Balancer is accessible and healthy")
    def test_alb_validation(self):
        """Test that ALB exists and is accessible"""
        self.assertIsNotNone(self.alb_dns, "ALB DNS is missing in outputs")
        
        try:
            # Test HTTP connectivity to ALB
            response = requests.get(f"http://{self.alb_dns}", timeout=30)
            self.assertEqual(response.status_code, 200, 
                          "ALB should return HTTP 200 status code")
            
            # Validate response contains expected content
            self.assertIn("Hello from", response.text, 
                        "Response should contain 'Hello from' message")
            
            # Get ALB details using boto3
            response = elbv2_client.describe_load_balancers()
            albs = [alb for alb in response['LoadBalancers'] 
                   if alb['DNSName'] == self.alb_dns]
            self.assertEqual(len(albs), 1, "Should find exactly one ALB with the DNS name")
            
            alb = albs[0]
            self.assertEqual(alb['State']['Code'], 'active', "ALB should be in active state")
            self.assertEqual(alb['Scheme'], 'internet-facing', "ALB should be internet-facing")
            
        except (ClientError, requests.RequestException) as e:
            self.fail(f"ALB validation failed: {e}")

    @mark.it("validates Auto Scaling Group exists and has correct configuration")
    def test_auto_scaling_group_validation(self):
        """Test that Auto Scaling Group exists and is properly configured"""
        try:
            response = autoscaling_client.describe_auto_scaling_groups()
            
            # Find ASG with our environment suffix
            asgs = [asg for asg in response['AutoScalingGroups'] 
                   if self.environment_suffix in asg['AutoScalingGroupName']]
            self.assertGreater(len(asgs), 0, "Should find at least one ASG")
            
            asg = asgs[0]  # Take the first matching ASG
            
            # Validate capacity settings
            self.assertEqual(asg['MinSize'], 2, "Min capacity should be 2")
            self.assertEqual(asg['MaxSize'], 6, "Max capacity should be 6")
            self.assertEqual(asg['DesiredCapacity'], 2, "Desired capacity should be 2")
            
            # Validate health check
            self.assertIn('ELB', asg['HealthCheckType'], "Should use ELB health checks")
            
            # Validate instances are running
            instances = asg['Instances']
            healthy_instances = [i for i in instances if i['HealthStatus'] == 'Healthy']
            self.assertGreaterEqual(len(healthy_instances), 1, 
                                  "Should have at least 1 healthy instance")
            
        except ClientError as e:
            self.fail(f"Auto Scaling Group validation failed: {e}")

    @mark.it("validates CloudWatch alarms exist and are configured correctly")
    def test_cloudwatch_alarms_validation(self):
        """Test that CloudWatch alarms exist and are properly configured"""
        try:
            response = cloudwatch_client.describe_alarms()
            
            # Find alarms with our environment suffix
            alarms = [alarm for alarm in response['MetricAlarms'] 
                     if self.environment_suffix in alarm['AlarmName']]
            self.assertGreaterEqual(len(alarms), 2, "Should have at least 2 alarms")
            
            # Check for CPU alarm
            cpu_alarms = [alarm for alarm in alarms if 'CPU' in alarm['AlarmName']]
            self.assertGreater(len(cpu_alarms), 0, "Should have CPU utilization alarm")
            
            cpu_alarm = cpu_alarms[0]
            self.assertEqual(cpu_alarm['Threshold'], 80.0, "CPU alarm threshold should be 80%")
            self.assertEqual(cpu_alarm['EvaluationPeriods'], 2, "CPU alarm evaluation periods should be 2")
            
            # Check for response time alarm
            response_alarms = [alarm for alarm in alarms if 'ResponseTime' in alarm['AlarmName']]
            self.assertGreater(len(response_alarms), 0, "Should have response time alarm")
            
            response_alarm = response_alarms[0]
            self.assertEqual(response_alarm['Threshold'], 1.0, "Response time alarm threshold should be 1 second")
            
        except ClientError as e:
            self.fail(f"CloudWatch alarms validation failed: {e}")

    @mark.it("validates target group health and registration")
    def test_target_group_validation(self):
        """Test that target groups exist and have healthy targets"""
        try:
            # Get all target groups
            response = elbv2_client.describe_target_groups()
            
            # Find target groups associated with our ALB
            response = elbv2_client.describe_load_balancers()
            albs = [alb for alb in response['LoadBalancers'] 
                   if alb['DNSName'] == self.alb_dns]
            
            if albs:
                alb_arn = albs[0]['LoadBalancerArn']
                
                # Get target groups for this ALB
                tg_response = elbv2_client.describe_target_groups(LoadBalancerArn=alb_arn)
                target_groups = tg_response['TargetGroups']
                
                self.assertGreater(len(target_groups), 0, "Should have at least one target group")
                
                # Check target health for each target group
                for tg in target_groups:
                    health_response = elbv2_client.describe_target_health(
                        TargetGroupArn=tg['TargetGroupArn']
                    )
                    
                    targets = health_response['TargetHealthDescriptions']
                    healthy_targets = [t for t in targets if t['TargetHealth']['State'] == 'healthy']
                    
                    # Should have at least one healthy target
                    self.assertGreaterEqual(len(healthy_targets), 1, 
                                          f"Target group {tg['TargetGroupName']} should have at least 1 healthy target")
            
        except ClientError as e:
            self.fail(f"Target group validation failed: {e}")

    @mark.it("validates end-to-end functionality")
    def test_end_to_end_functionality(self):
        """Test the complete application flow from ALB to backend"""
        self.assertIsNotNone(self.alb_dns, "ALB DNS is missing in outputs")
        
        try:
            # Make multiple requests to test load balancing
            successful_requests = 0
            total_requests = 5
            
            for i in range(total_requests):
                try:
                    response = requests.get(f"http://{self.alb_dns}", timeout=10)
                    if response.status_code == 200:
                        successful_requests += 1
                        
                        # Validate response content
                        self.assertIn("Hello from", response.text, 
                                    "Response should contain application content")
                        
                except requests.RequestException:
                    continue
            
            # At least 80% of requests should be successful
            success_rate = successful_requests / total_requests
            self.assertGreaterEqual(success_rate, 0.8, 
                                  f"Success rate should be at least 80%, got {success_rate:.2%}")
            
        except Exception as e:
            self.fail(f"End-to-end functionality test failed: {e}")

    @mark.it("validates resource tagging")
    def test_resource_tagging(self):
        """Test that resources are properly tagged with environment suffix"""
        try:
            # Check VPC tags
            response = ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [self.vpc_id]},
                    {'Name': 'key', 'Values': ['Environment']}
                ]
            )
            
            tags = response['Tags']
            if tags:
                environment_tag = tags[0]['Value']
                self.assertEqual(environment_tag, self.environment_suffix, 
                               f"Environment tag should be {self.environment_suffix}")
            
        except ClientError as e:
            self.fail(f"Resource tagging validation failed: {e}")


if __name__ == '__main__':
    unittest.main()
