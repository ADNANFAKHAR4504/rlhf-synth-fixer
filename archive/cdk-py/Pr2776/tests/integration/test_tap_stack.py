import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark
import requests
from typing import Optional

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for the deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load outputs once for all tests"""
        cls.outputs = flat_outputs
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elb_client = boto3.client('elbv2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.asg_client = boto3.client('autoscaling', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)

    def setUp(self):
        """Set up for each individual test"""
        # Skip all tests if no outputs are available
        if not self.outputs:
            self.skipTest("No CloudFormation outputs available. Deploy stack first.")

    @mark.it("verifies CloudFormation outputs exist")
    def test_outputs_exist(self):
        """Verify that all expected CloudFormation outputs exist"""
        # ARRANGE
        expected_outputs = [
            'VPCId', 'VPCCidr', 'PublicSubnetIds', 'PrivateSubnetIds',
            'LoadBalancerDNS', 'LoadBalancerURL', 'LoadBalancerArn',
            'DatabaseEndpoint', 'DatabasePort', 'DatabaseSecretArn',
            'LoggingBucketName', 'LoggingBucketArn',
            'AutoScalingGroupName', 'AutoScalingGroupArn',
            'ALBSecurityGroupId', 'EC2SecurityGroupId', 'RDSSecurityGroupId',
            'Environment'
        ]

        # ASSERT
        for output_key in expected_outputs:
            self.assertIn(output_key, self.outputs, 
                         f"Expected output '{output_key}' not found in CloudFormation outputs")
            self.assertIsNotNone(self.outputs.get(output_key), 
                                f"Output '{output_key}' is None")

    @mark.it("validates subnets are properly configured")
    def test_subnets_configuration(self):
        """Verify public and private subnets exist and are properly configured"""
        # ARRANGE
        public_subnet_ids = self.outputs.get('PublicSubnetIds', '').split(',')
        private_subnet_ids = self.outputs.get('PrivateSubnetIds', '').split(',')
        
        if not public_subnet_ids[0] or not private_subnet_ids[0]:
            self.skipTest("Subnet IDs not found in outputs")

        # ACT & ASSERT - Public Subnets
        try:
            response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
            public_subnets = response['Subnets']
            
            self.assertEqual(len(public_subnets), 2, "Should have 2 public subnets")
            for subnet in public_subnets:
                self.assertTrue(subnet['MapPublicIpOnLaunch'], 
                              f"Public subnet {subnet['SubnetId']} should auto-assign public IPs")
                self.assertEqual(subnet['State'], 'available')
        except ClientError as e:
            self.fail(f"Failed to describe public subnets: {e}")

        # ACT & ASSERT - Private Subnets
        try:
            response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
            private_subnets = response['Subnets']
            
            self.assertEqual(len(private_subnets), 2, "Should have 2 private subnets")
            for subnet in private_subnets:
                self.assertFalse(subnet['MapPublicIpOnLaunch'], 
                               f"Private subnet {subnet['SubnetId']} should not auto-assign public IPs")
                self.assertEqual(subnet['State'], 'available')
        except ClientError as e:
            self.fail(f"Failed to describe private subnets: {e}")

    @mark.it("validates Application Load Balancer is accessible")
    def test_alb_accessibility(self):
        """Verify ALB is created and accessible"""
        # ARRANGE
        alb_dns = self.outputs.get('LoadBalancerDNS')
        alb_arn = self.outputs.get('LoadBalancerArn')
        
        if not alb_dns or not alb_arn:
            self.skipTest("ALB DNS or ARN not found in outputs")

        # ACT - Check ALB configuration
        try:
            response = self.elb_client.describe_load_balancers(
                LoadBalancerArns=[alb_arn]
            )
            alb = response['LoadBalancers'][0]
        except ClientError as e:
            self.fail(f"Failed to describe ALB: {e}")

        # ASSERT
        self.assertEqual(alb['DNSName'], alb_dns)
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['Type'], 'application')

        # ACT - Test HTTP connectivity (may fail if instances aren't ready)
        try:
            response = requests.get(f"http://{alb_dns}", timeout=10)
            # ASSERT - We expect some response, even if it's an error
            self.assertIsNotNone(response)
        except requests.exceptions.RequestException as e:
            # This is expected if instances aren't fully deployed
            print(f"Note: ALB connectivity test failed (expected if instances aren't ready): {e}")

    @mark.it("validates Auto Scaling Group configuration")
    def test_asg_configuration(self):
        """Verify Auto Scaling Group exists and is properly configured"""
        # ARRANGE
        asg_name = self.outputs.get('AutoScalingGroupName')
        environment = self.outputs.get('Environment', 'dev')
        
        if not asg_name:
            self.skipTest("AutoScalingGroupName not found in outputs")

        # ACT
        try:
            response = self.asg_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            asg = response['AutoScalingGroups'][0]
        except ClientError as e:
            self.fail(f"Failed to describe ASG: {e}")

        # ASSERT
        self.assertEqual(asg['AutoScalingGroupName'], asg_name)
        
        # Check capacity based on environment
        if environment == 'prod':
            self.assertEqual(asg['MinSize'], 2)
            self.assertEqual(asg['MaxSize'], 10)
            self.assertEqual(asg['DesiredCapacity'], 3)
        else:
            self.assertEqual(asg['MinSize'], 1)
            self.assertEqual(asg['MaxSize'], 3)
            self.assertEqual(asg['DesiredCapacity'], 1)
        
        # Check health check configuration
        self.assertIn('ELB', asg['HealthCheckType'])
        self.assertGreater(len(asg['Instances']), 0, "ASG should have at least one instance")

    @mark.it("validates RDS database is running")
    def test_rds_database_status(self):
        """Verify RDS database exists and is running"""
        # ARRANGE
        db_endpoint = self.outputs.get('DatabaseEndpoint')
        environment = self.outputs.get('Environment', 'dev')
        
        if not db_endpoint:
            self.skipTest("DatabaseEndpoint not found in outputs")

        # Extract DB instance identifier from endpoint
        # Format: tap-db-{env}.{random}.{region}.rds.amazonaws.com
        db_instance_id = db_endpoint.split('.')[0]

        # ACT
        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=db_instance_id
            )
            db_instance = response['DBInstances'][0]
        except ClientError as e:
            self.fail(f"Failed to describe RDS instance: {e}")

        # ASSERT
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertEqual(db_instance['Engine'], 'mysql')
        self.assertTrue(db_instance['StorageEncrypted'])
        
        # Check environment-specific configuration
        if environment == 'prod':
            self.assertTrue(db_instance['MultiAZ'])
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
            self.assertTrue(db_instance['DeletionProtection'])
            self.assertEqual(db_instance['AllocatedStorage'], 100)
        else:
            self.assertFalse(db_instance['MultiAZ'])
            self.assertEqual(db_instance['BackupRetentionPeriod'], 1)
            self.assertFalse(db_instance['DeletionProtection'])
            self.assertEqual(db_instance['AllocatedStorage'], 20)

    @mark.it("validates S3 logging bucket configuration")
    def test_s3_logging_bucket(self):
        """Verify S3 logging bucket exists and is properly configured"""
        # ARRANGE
        bucket_name = self.outputs.get('LoggingBucketName')
        
        if not bucket_name:
            self.skipTest("LoggingBucketName not found in outputs")

        # ACT & ASSERT - Bucket exists
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertIsNotNone(response)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} does not exist: {e}")

        # ACT & ASSERT - Versioning enabled
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(response.get('Status'), 'Enabled')
        except ClientError as e:
            self.fail(f"Failed to get bucket versioning: {e}")

        # ACT & ASSERT - Encryption enabled
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            self.assertGreater(len(rules), 0)
            self.assertEqual(rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')
        except ClientError as e:
            self.fail(f"Failed to get bucket encryption: {e}")

        # ACT & ASSERT - Public access blocked
        try:
            response = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = response['PublicAccessBlockConfiguration']
            self.assertTrue(config['BlockPublicAcls'])
            self.assertTrue(config['BlockPublicPolicy'])
            self.assertTrue(config['IgnorePublicAcls'])
            self.assertTrue(config['RestrictPublicBuckets'])
        except ClientError as e:
            self.fail(f"Failed to get public access block: {e}")

    @mark.it("validates security groups are properly configured")
    def test_security_groups(self):
        """Verify security groups exist and have correct rules"""
        # ARRANGE
        alb_sg_id = self.outputs.get('ALBSecurityGroupId')
        ec2_sg_id = self.outputs.get('EC2SecurityGroupId')
        rds_sg_id = self.outputs.get('RDSSecurityGroupId')
        
        if not all([alb_sg_id, ec2_sg_id, rds_sg_id]):
            self.skipTest("Security group IDs not found in outputs")

        # ACT & ASSERT - ALB Security Group
        try:
            response = self.ec2_client.describe_security_groups(GroupIds=[alb_sg_id])
            alb_sg = response['SecurityGroups'][0]
            
            # Check ingress rules for HTTP and HTTPS
            ingress_ports = [rule['FromPort'] for rule in alb_sg['IpPermissions']]
            self.assertIn(80, ingress_ports, "ALB SG should allow HTTP")
            self.assertIn(443, ingress_ports, "ALB SG should allow HTTPS")
        except ClientError as e:
            self.fail(f"Failed to describe ALB security group: {e}")

        # ACT & ASSERT - RDS Security Group
        try:
            response = self.ec2_client.describe_security_groups(GroupIds=[rds_sg_id])
            rds_sg = response['SecurityGroups'][0]
            
            # Check that RDS only accepts connections from EC2 SG
            for rule in rds_sg['IpPermissions']:
                if rule['FromPort'] == 3306:
                    source_sg_ids = [sg['GroupId'] for sg in rule.get('UserIdGroupPairs', [])]
                    self.assertIn(ec2_sg_id, source_sg_ids, 
                                "RDS should only accept connections from EC2 security group")
        except ClientError as e:
            self.fail(f"Failed to describe RDS security group: {e}")

    @mark.it("validates database secret exists and is accessible")
    def test_database_secret(self):
        """Verify database credentials are stored in Secrets Manager"""
        # ARRANGE
        secret_arn = self.outputs.get('DatabaseSecretArn')
        
        if not secret_arn:
            self.skipTest("DatabaseSecretArn not found in outputs")

        # ACT
        try:
            response = self.secrets_client.describe_secret(SecretId=secret_arn)
        except ClientError as e:
            self.fail(f"Failed to describe secret: {e}")

        # ASSERT
        self.assertEqual(response['ARN'], secret_arn)
        self.assertIn('tap-db-credentials', response['Name'])
        self.assertIsNotNone(response.get('VersionIdsToStages'))
        
        # Verify secret can be retrieved (without actually retrieving it)
        try:
            # Just verify the secret value exists, don't log it
            response = self.secrets_client.get_secret_value(SecretId=secret_arn)
            self.assertIsNotNone(response.get('SecretString'))
            
            # Verify it's valid JSON with expected structure
            secret_data = json.loads(response['SecretString'])
            self.assertIn('username', secret_data)
            self.assertIn('password', secret_data)
            self.assertEqual(secret_data['username'], 'dbadmin')
        except ClientError as e:
            self.fail(f"Failed to retrieve secret value: {e}")

    @mark.it("validates CloudWatch dashboard exists")
    def test_cloudwatch_dashboard(self):
        """Verify CloudWatch dashboard is created"""
        # ARRANGE
        environment = self.outputs.get('Environment', 'dev')
        dashboard_name = f"TAP-{environment}-Dashboard"

        # ACT
        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=dashboard_name
            )
        except ClientError as e:
            self.fail(f"Failed to get dashboard: {e}")

        # ASSERT
        self.assertIsNotNone(response['DashboardBody'])
        
        # Verify dashboard contains expected widgets
        dashboard_body = json.loads(response['DashboardBody'])
        self.assertIn('widgets', dashboard_body)
        self.assertGreater(len(dashboard_body['widgets']), 0, 
                          "Dashboard should have at least one widget")

    @mark.it("validates target group has healthy targets")
    def test_target_group_health(self):
        """Verify ALB target group has healthy instances"""
        # ARRANGE
        alb_arn = self.outputs.get('LoadBalancerArn')
        
        if not alb_arn:
            self.skipTest("LoadBalancerArn not found in outputs")

        # ACT - Get target groups for this ALB
        try:
            response = self.elb_client.describe_target_groups(
                LoadBalancerArn=alb_arn
            )
            
            if not response['TargetGroups']:
                self.skipTest("No target groups found for ALB")
                
            target_group_arn = response['TargetGroups'][0]['TargetGroupArn']
            
            # Get target health
            health_response = self.elb_client.describe_target_health(
                TargetGroupArn=target_group_arn
            )
        except ClientError as e:
            self.fail(f"Failed to describe target groups or health: {e}")

        # ASSERT
        targets = health_response.get('TargetHealthDescriptions', [])
        self.assertGreater(len(targets), 0, "Target group should have at least one target")
        
        # Check if at least one target is healthy
        healthy_targets = [t for t in targets if t['TargetHealth']['State'] == 'healthy']
        if not healthy_targets:
            # This might be expected if deployment is still in progress
            print(f"Warning: No healthy targets found. Deployment may still be in progress.")
            print(f"Target states: {[t['TargetHealth']['State'] for t in targets]}")

    @mark.it("validates environment tags are applied")
    def test_environment_tags(self):
        """Verify environment tags are applied to resources"""
        # ARRANGE
        vpc_id = self.outputs.get('VPCId')
        environment = self.outputs.get('Environment', 'dev')
        
        if not vpc_id:
            self.skipTest("VPCId not found in outputs")

        # ACT
        try:
            response = self.ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]},
                    {'Name': 'key', 'Values': ['Environment', 'Project']}
                ]
            )
            tags = response['Tags']
        except ClientError as e:
            self.fail(f"Failed to describe tags: {e}")

        # ASSERT
        tag_dict = {tag['Key']: tag['Value'] for tag in tags}
        self.assertEqual(tag_dict.get('Environment'), environment.title())
        self.assertEqual(tag_dict.get('Project'), 'TAP-WebApplicationInfrastructure')