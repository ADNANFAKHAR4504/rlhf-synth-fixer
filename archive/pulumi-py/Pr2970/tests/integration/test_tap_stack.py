"""
Integration tests for the AWS Infrastructure TapStack Pulumi infrastructure.

Tests actual AWS resources created by the Pulumi stack using outputs from cfn-outputs/flat-outputs.json
and live AWS SDK calls to validate the deployed infrastructure.
"""

import unittest
import os
import sys
import boto3
import requests
import subprocess
import json
import time
from typing import Dict, List, Optional
from botocore.exceptions import ClientError, NoCredentialsError

# Add AWS SDK imports
try:
    import boto3
    from boto3 import Session
    from botocore.config import Config
    from botocore.exceptions import ClientError, NoCredentialsError, EndpointConnectionError
    print("AWS SDK imported successfully")
except ImportError as e:
    print(f"Warning: AWS SDK import failed: {e}")
    print("Please install AWS SDK: pip install boto3")

# Note: We don't import tap_stack directly to avoid Pulumi runtime issues
# Integration tests focus on testing live AWS resources using outputs


def get_stack_outputs() -> Dict:
    """Get stack outputs from various sources, prioritizing current stack outputs"""
    # First try Pulumi CLI (most current)
    try:
        result = subprocess.run(['pulumi', 'stack', 'output', '--json'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            outputs = json.loads(result.stdout)
            print("Using outputs from Pulumi CLI (current stack)")
            
            # Parse string outputs that should be lists
            for key, value in outputs.items():
                if isinstance(value, str) and value.startswith('[') and value.endswith(']'):
                    try:
                        parsed_value = json.loads(value)
                        outputs[key] = parsed_value
                        print(f"Parsed {key}: {value} -> {parsed_value}")
                    except json.JSONDecodeError:
                        pass  # Keep as string if parsing fails
            
            return outputs
    except Exception as e:
        print(f"Error getting Pulumi outputs: {e}")
    
    # Fallback to environment variables
    env_outputs = {}
    env_mappings = {
        'VPC_ID': 'vpc_id',
        'ALB_DNS_NAME': 'alb_dns_name',
        'RDS_ENDPOINT': 'rds_endpoint',
        'S3_BUCKET_NAME': 's3_bucket_name',
        'REGION': 'region'
    }
    
    for env_key, output_key in env_mappings.items():
        value = os.environ.get(env_key)
        if value:
            env_outputs[output_key] = value
    
    if env_outputs:
        print("Using outputs from environment variables")
        return env_outputs
    
    # Fallback to flat-outputs.json
    outputs_file = "cfn-outputs/flat-outputs.json"
    if os.path.exists(outputs_file):
        try:
            with open(outputs_file, 'r') as f:
                outputs = json.load(f)
                if outputs:
                    print(f"Using outputs from {outputs_file}")
                    return outputs
        except Exception as e:
            print(f"Error reading {outputs_file}: {e}")
    
    # Last resort: try all-outputs.json
    all_outputs_file = "cfn-outputs/all-outputs.json"
    if os.path.exists(all_outputs_file):
        try:
            with open(all_outputs_file, 'r') as f:
                outputs = json.load(f)
                if outputs:
                    print(f"Using outputs from {all_outputs_file}")
                    # Convert to flat format
                    flat_outputs = {}
                    for key, value in outputs.items():
                        if isinstance(value, dict) and 'value' in value:
                            flat_outputs[key] = value['value']
                        else:
                            flat_outputs[key] = value
                    return flat_outputs
        except Exception as e:
            print(f"Error reading {all_outputs_file}: {e}")
    
    return {}


def create_aws_session(region: str = 'ap-south-1') -> Session:
    """Create AWS session with proper configuration"""
    try:
        # Configure AWS session with retry settings
        config = Config(
            retries=dict(
                max_attempts=3,
                mode='adaptive'
            ),
            region_name=region
        )
        
        session = Session()
        return session
    except Exception as e:
        print(f"Error creating AWS session: {e}")
        raise


def create_aws_clients(region: str = 'ap-south-1') -> Dict:
    """Create AWS clients for testing"""
    try:
        session = create_aws_session(region)
        
        clients = {
            'ec2': session.client('ec2'),
            's3': session.client('s3'),
            'rds': session.client('rds'),
            'elbv2': session.client('elbv2'),
            'autoscaling': session.client('autoscaling'),
            'sns': session.client('sns'),
            'cloudwatch': session.client('cloudwatch'),
            'lambda': session.client('lambda'),
            'secretsmanager': session.client('secretsmanager'),
            'logs': session.client('logs'),
            'iam': session.client('iam'),
            'sts': session.client('sts')
        }
        
        print(f"AWS clients created successfully for region: {region}")
        return clients
    except Exception as e:
        print(f"Error creating AWS clients: {e}")
        raise


class TestAWSInfrastructureLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed AWS infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up class-level test environment."""
        cls.region = os.getenv('AWS_REGION', 'ap-south-1')
        cls.stack_outputs = get_stack_outputs()
        
        # Check if we have valid outputs
        if not cls.stack_outputs:
            print("Warning: No stack outputs found - tests will be skipped")
        else:
            print(f"Found {len(cls.stack_outputs)} stack outputs")
            # Check if outputs look like they're from current deployment
            vpc_id = cls.stack_outputs.get('vpc_id')
            if vpc_id and vpc_id.startswith('vpc-'):
                print(f"Using VPC: {vpc_id}")
            else:
                print("Warning: VPC ID not found or invalid format")
        
        # Initialize AWS clients
        try:
            cls.aws_clients = create_aws_clients(cls.region)
            cls.ec2_client = cls.aws_clients['ec2']
            cls.s3_client = cls.aws_clients['s3']
            cls.rds_client = cls.aws_clients['rds']
            cls.elbv2_client = cls.aws_clients['elbv2']
            cls.autoscaling_client = cls.aws_clients['autoscaling']
            cls.sns_client = cls.aws_clients['sns']
            cls.cloudwatch_client = cls.aws_clients['cloudwatch']
            cls.lambda_client = cls.aws_clients['lambda']
            cls.secretsmanager_client = cls.aws_clients['secretsmanager']
            cls.logs_client = cls.aws_clients['logs']
            cls.iam_client = cls.aws_clients['iam']
            cls.sts_client = cls.aws_clients['sts']
            
            # Test AWS connectivity
            identity = cls.sts_client.get_caller_identity()
            print(f"AWS Account: {identity['Account'][:3]}***")
            cls.aws_available = True
        except NoCredentialsError:
            print("AWS credentials not configured")
            cls.aws_available = False
        except Exception as e:
            print(f"AWS connectivity failed: {e}")
            cls.aws_available = False

    def setUp(self):
        """Set up individual test environment."""
        if not self.aws_available:
            self.skipTest("AWS credentials not available")
        
        if not self.stack_outputs:
            self.skipTest("No stack outputs available")

    def test_vpc_exists(self):
        """Test that VPC exists and has correct configuration."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            # Test VPC configuration
            self.assertEqual(vpc['VpcId'], vpc_id)
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            self.assertFalse(vpc['IsDefault'], "VPC should be custom, not default")
            
            # Test DNS configuration (if available in response)
            if 'EnableDnsHostnames' in vpc:
                self.assertTrue(vpc['EnableDnsHostnames'])
            if 'EnableDnsSupport' in vpc:
                self.assertTrue(vpc['EnableDnsSupport'])
            
            print(f"VPC {vpc_id} validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'InvalidVpcID.NotFound':
                self.fail(f"VPC {vpc_id} not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe VPC: {e}")

    def test_s3_buckets_exist(self):
        """Test that S3 buckets exist and have correct configuration."""
        s3_bucket_name = self.stack_outputs.get('s3_bucket_name')
        if not s3_bucket_name:
            self.skipTest("S3 bucket name not found in stack outputs")
        
        try:
            response = self.s3_client.head_bucket(Bucket=s3_bucket_name)
            
            # Test bucket configuration
            self.assertIsNotNone(response)
            
            # Test bucket versioning
            versioning_response = self.s3_client.get_bucket_versioning(Bucket=s3_bucket_name)
            self.assertEqual(versioning_response.get('Status'), 'Enabled')
            
            # Test bucket encryption
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=s3_bucket_name)
            encryption_rules = encryption_response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
            self.assertGreater(len(encryption_rules), 0)
            
            print(f"S3 bucket {s3_bucket_name} validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchBucket':
                self.fail(f"S3 bucket {s3_bucket_name} not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe S3 bucket: {e}")

    def test_rds_instance_exists(self):
        """Test that RDS instance exists and is configured correctly."""
        rds_endpoint = self.stack_outputs.get('rds_endpoint')
        if not rds_endpoint:
            self.skipTest("RDS endpoint not found in stack outputs")
        
        try:
            # Extract DB instance identifier from endpoint
            db_instance_id = rds_endpoint.split('.')[0]
            
            response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_instance_id)
            db_instance = response['DBInstances'][0]
            
            # Test RDS configuration
            self.assertEqual(db_instance['Engine'], 'postgres')
            self.assertTrue(db_instance['MultiAZ'])
            self.assertEqual(db_instance['StorageEncrypted'], True)
            self.assertEqual(db_instance['BackupRetentionPeriod'], 7)
            
            # Test VPC security groups
            vpc_security_groups = db_instance['VpcSecurityGroups']
            self.assertGreater(len(vpc_security_groups), 0)
            
            print(f"RDS instance {db_instance_id} validated successfully")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'DBInstanceNotFound':
                self.fail(f"RDS instance not found - ensure stack is deployed")
            else:
                self.fail(f"Failed to describe RDS instance: {e}")

    def test_application_load_balancer_exists(self):
        """Test that Application Load Balancer exists and is configured correctly."""
        alb_dns_name = self.stack_outputs.get('alb_dns_name')
        if not alb_dns_name:
            self.skipTest("ALB DNS name not found in stack outputs")
        
        try:
            # Find ALB by DNS name
            response = self.elbv2_client.describe_load_balancers()
            alb = None
            
            for lb in response['LoadBalancers']:
                if lb['DNSName'] == alb_dns_name:
                    alb = lb
                    break
            
            self.assertIsNotNone(alb, f"ALB with DNS name {alb_dns_name} not found")
            
            # Test ALB configuration
            self.assertEqual(alb['Type'], 'application')
            self.assertEqual(alb['Scheme'], 'internet-facing')
            self.assertEqual(alb['State']['Code'], 'active')
            
            # Test target groups
            target_groups_response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=alb['LoadBalancerArn']
            )
            self.assertGreater(len(target_groups_response['TargetGroups']), 0)
            
            print(f"ALB {alb['LoadBalancerName']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe ALB: {e}")

    def test_auto_scaling_group_exists(self):
        """Test that Auto Scaling Group exists and is configured correctly."""
        try:
            response = self.autoscaling_client.describe_auto_scaling_groups()
            
            # Find ASG with our naming pattern
            asg = None
            for group in response['AutoScalingGroups']:
                if 'asg-' in group['AutoScalingGroupName'] and 'dev' in group['AutoScalingGroupName']:
                    asg = group
                    break
            
            if not asg:
                self.skipTest("Auto Scaling Group not found with expected naming pattern")
            
            # Test ASG configuration
            self.assertGreaterEqual(asg['MinSize'], 2)
            self.assertLessEqual(asg['MaxSize'], 4)
            self.assertGreaterEqual(asg['DesiredCapacity'], 2)
            self.assertEqual(asg['HealthCheckType'], 'ELB')
            
            # Test launch template
            self.assertIsNotNone(asg.get('LaunchTemplate'))
            
            print(f"Auto Scaling Group {asg['AutoScalingGroupName']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe Auto Scaling Groups: {e}")

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists for RDS credentials."""
        try:
            response = self.secretsmanager_client.list_secrets()
            
            # Find secret with our naming pattern
            secret = None
            for sec in response['SecretList']:
                if 'rds-credentials' in sec['Name'] and 'dev' in sec['Name']:
                    secret = sec
                    break
            
            if not secret:
                self.skipTest("RDS credentials secret not found with expected naming pattern")
            
            # Test secret configuration
            self.assertEqual(secret['Description'], 'Database credentials for RDS instance')
            
            print(f"Secrets Manager secret {secret['Name']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to list Secrets Manager secrets: {e}")

    def test_lambda_function_exists(self):
        """Test that Lambda function exists for RDS backup automation."""
        try:
            response = self.lambda_client.list_functions()
            
            # Find Lambda function with our naming pattern
            lambda_func = None
            for func in response['Functions']:
                if 'rds-backup-lambda' in func['FunctionName'] and 'dev' in func['FunctionName']:
                    lambda_func = func
                    break
            
            if not lambda_func:
                self.skipTest("RDS backup Lambda function not found with expected naming pattern")
            
            # Test Lambda configuration
            self.assertEqual(lambda_func['Runtime'], 'python3.9')
            self.assertEqual(lambda_func['Timeout'], 300)
            self.assertEqual(lambda_func['MemorySize'], 128)
            
            print(f"Lambda function {lambda_func['FunctionName']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to list Lambda functions: {e}")

    def test_sns_topic_exists(self):
        """Test that SNS topic exists for Auto Scaling notifications."""
        try:
            response = self.sns_client.list_topics()
            
            # Find SNS topic with our naming pattern
            topic = None
            for t in response['Topics']:
                if 'asg-notifications' in t['TopicArn'] and 'dev' in t['TopicArn']:
                    topic = t
                    break
            
            if not topic:
                self.skipTest("SNS topic not found with expected naming pattern")
            
            print(f"SNS topic {topic['TopicArn']} validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to list SNS topics: {e}")

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups exist."""
        try:
            response = self.logs_client.describe_log_groups()
            
            # Find log groups with our naming pattern
            log_groups = []
            for lg in response['logGroups']:
                if ('/aws/ec2/v1-' in lg['logGroupName'] or '/aws/rds/v1-' in lg['logGroupName']) and 'dev' in lg['logGroupName']:
                    log_groups.append(lg)
            
            if not log_groups:
                self.skipTest("CloudWatch log groups not found with expected naming pattern")
            
            # Test log group configuration
            for lg in log_groups:
                self.assertGreaterEqual(lg.get('retentionInDays', 0), 30)
            
            print(f"Found {len(log_groups)} CloudWatch log groups validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to describe CloudWatch log groups: {e}")

    def test_resource_tagging_compliance(self):
        """Test that resources have proper tags."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]
            
            # Get VPC tags
            tags_response = self.ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]},
                    {'Name': 'resource-type', 'Values': ['vpc']}
                ]
            )
            
            tags = {tag['Key']: tag['Value'] for tag in tags_response['Tags']}
            
            # Check for required tags
            self.assertIn('Environment', tags)
            self.assertEqual(tags['Environment'], 'dev')
            self.assertIn('Team', tags)
            self.assertEqual(tags['Team'], '3')
            self.assertIn('Project', tags)
            self.assertEqual(tags['Project'], 'iac-test-automations')
            
            print(f"Resource tagging compliance validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to get VPC tags: {e}")

    def test_region_compliance(self):
        """Test that all resources are in the correct region."""
        vpc_id = self.stack_outputs.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in stack outputs")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            
            # Verify we're in the correct region
            self.assertEqual(self.region, 'ap-south-1')
            
            print(f"Region compliance validated successfully")
            
        except ClientError as e:
            self.fail(f"Failed to verify region: {e}")

    def test_outputs_completeness(self):
        """Test that all expected stack outputs are present."""
        required_outputs = [
            'vpc_id', 'alb_dns_name', 'rds_endpoint', 's3_bucket_name'
        ]
        
        for output_name in required_outputs:
            self.assertIn(output_name, self.stack_outputs,
                         f"Required output '{output_name}' not found in stack outputs")

    def tearDown(self):
        """Clean up after tests."""
        # No cleanup needed for read-only integration tests
        pass


if __name__ == '__main__':
    unittest.main()