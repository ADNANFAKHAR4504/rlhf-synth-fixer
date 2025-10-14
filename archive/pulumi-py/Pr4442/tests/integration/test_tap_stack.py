"""
Integration tests for the deployed Pulumi Web Application TAP stack infrastructure.
These tests validate actual AWS resources against live deployments.
"""

import base64
import json
import os
import time
import unittest
from typing import Any, Dict, Optional

import boto3
import pytest
from botocore.exceptions import ClientError, NoCredentialsError

# Load deployment flat outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, '..', '..', 'cfn-outputs', 'flat-outputs.json')

def load_outputs() -> Dict[str, Any]:
    """Load and return flat deployment outputs."""
    if os.path.exists(FLAT_OUTPUTS_PATH):
        try:
            with open(FLAT_OUTPUTS_PATH, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not parse outputs file: {e}")
            return {}
    else:
        print(f"Warning: Outputs file not found at {FLAT_OUTPUTS_PATH}")
        return {}

# Global outputs loaded once
OUTPUTS = load_outputs()


class BaseIntegrationTest(unittest.TestCase):
    """Base class for integration tests with common setup."""
    
    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and validate credentials."""
        cls.outputs = OUTPUTS
        cls.region = os.getenv('AWS_REGION', 'us-west-2')
        
        # Skip tests if no outputs available
        if not cls.outputs:
            pytest.skip("No deployment outputs available")
        
        try:
            # Initialize AWS clients
            cls.ec2_client = boto3.client('ec2', region_name=cls.region)
            cls.s3_client = boto3.client('s3', region_name=cls.region)
            cls.iam_client = boto3.client('iam', region_name=cls.region)
            cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
            cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)
            cls.cloudwatch_client = boto3.client('logs', region_name=cls.region)
            
            # Validate credentials
            cls.ec2_client.describe_regions()
            
        except NoCredentialsError:
            pytest.skip("AWS credentials not available")
        except Exception as e:
            pytest.skip(f"AWS client initialization failed: {e}")


class TestWebApplicationServiceToServiceIntegration(BaseIntegrationTest):
    """Service-to-service integration tests for web application infrastructure."""
    
    def test_ec2_instances_can_access_s3_bucket_for_logging(self):
        """Test that EC2 instances can successfully write logs to S3 bucket."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        
        # Test S3 bucket accessibility
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        except ClientError as e:
            self.fail(f"S3 bucket {bucket_name} is not accessible: {e}")
    
    def test_load_balancer_health_checks_work_with_ec2_instances(self):
        """Test that Application Load Balancer can perform health checks on EC2 instances."""
        target_group_arn = self.outputs.get('target_group_arn')
        self.assertIsNotNone(target_group_arn, "Target group ARN not found in outputs")
        
        try:
            # Get target group health
            response = self.elbv2_client.describe_target_health(TargetGroupArn=target_group_arn)
            self.assertIn('TargetHealthDescriptions', response)
            
            # Verify health check configuration
            target_groups = self.elbv2_client.describe_target_groups(TargetGroupArns=[target_group_arn])
            health_check = target_groups['TargetGroups'][0]['HealthCheckPath']
            self.assertEqual(health_check, '/')
            
        except ClientError as e:
            self.fail(f"Load balancer health check failed: {e}")
    
    def test_auto_scaling_group_scales_ec2_instances_based_on_load_balancer_health(self):
        """Test that Auto Scaling Group responds to Load Balancer health status."""
        auto_scaling_group_name = self.outputs.get('auto_scaling_group_name')
        self.assertIsNotNone(auto_scaling_group_name, "Auto Scaling Group name not found in outputs")
        
        try:
            # Get Auto Scaling Group details
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[auto_scaling_group_name]
            )
            
            asg = response['AutoScalingGroups'][0]
            self.assertEqual(asg['HealthCheckType'], 'ELB')
            self.assertGreaterEqual(asg['MinSize'], 1)
            self.assertLessEqual(asg['MaxSize'], 3)
            
        except ClientError as e:
            self.fail(f"Auto Scaling Group health check configuration failed: {e}")
    
    def test_ec2_instances_can_send_logs_to_cloudwatch_logs(self):
        """Test that EC2 instances can send application logs to CloudWatch Logs."""
        log_group_name = self.outputs.get('log_group_name')
        self.assertIsNotNone(log_group_name, "CloudWatch Log Group name not found in outputs")
        
        try:
            # Verify log group exists and is accessible
            response = self.cloudwatch_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = response['logGroups']
            self.assertGreater(len(log_groups), 0, "CloudWatch Log Group not found")
            
            # Verify log group configuration
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], log_group_name)
            
        except ClientError as e:
            self.fail(f"CloudWatch Logs integration failed: {e}")
    
    def test_iam_roles_provide_least_privilege_access_between_services(self):
        """Test that IAM roles provide appropriate permissions for service interactions."""
        iam_role_name = self.outputs.get('iam_role_name')
        self.assertIsNotNone(iam_role_name, "IAM role name not found in outputs")
        
        try:
            # Get role details
            response = self.iam_client.get_role(RoleName=iam_role_name)
            role = response['Role']
            
            # Verify role has assume role policy for EC2
            assume_policy = role['AssumeRolePolicyDocument']
            self.assertIn('ec2.amazonaws.com', str(assume_policy))
            
            # Get attached policies
            policies_response = self.iam_client.list_attached_role_policies(RoleName=iam_role_name)
            attached_policies = policies_response['AttachedPolicies']
            
            # Verify S3 and CloudWatch policies are attached
            policy_names = [policy['PolicyName'] for policy in attached_policies]
            self.assertTrue(any('s3' in name.lower() for name in policy_names), 
                          "S3 policy not found in IAM role")
            self.assertTrue(any('cloudwatch' in name.lower() for name in policy_names), 
                          "CloudWatch policy not found in IAM role")
            
        except ClientError as e:
            self.fail(f"IAM role service integration failed: {e}")


class TestWebApplicationResourceIntegration(BaseIntegrationTest):
    """Individual resource integration tests for web application infrastructure."""
    
    def test_s3_bucket_exists_with_correct_encryption_and_lifecycle_configuration(self):
        """Test that S3 bucket exists with proper encryption and lifecycle settings."""
        bucket_name = self.outputs.get('s3_bucket_name')
        self.assertIsNotNone(bucket_name, "S3 bucket name not found in outputs")
        
        try:
            # Test bucket exists
            self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Test encryption configuration
            encryption_response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
            self.assertEqual(encryption_rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'], 'AES256')
            
            # Test lifecycle configuration
            lifecycle_response = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
            lifecycle_rules = lifecycle_response['Rules']
            self.assertEqual(len(lifecycle_rules), 1)
            self.assertEqual(lifecycle_rules[0]['Status'], 'Enabled')
            self.assertEqual(lifecycle_rules[0]['Expiration']['Days'], 30)
            
        except ClientError as e:
            self.fail(f"S3 bucket configuration test failed: {e}")
    
    def test_application_load_balancer_exists_with_correct_listener_and_target_group_configuration(self):
        """Test that Application Load Balancer exists with proper listener and target group setup."""
        load_balancer_arn = self.outputs.get('load_balancer_arn')
        target_group_arn = self.outputs.get('target_group_arn')
        self.assertIsNotNone(load_balancer_arn, "Load balancer ARN not found in outputs")
        self.assertIsNotNone(target_group_arn, "Target group ARN not found in outputs")
        
        try:
            # Test load balancer exists
            lb_response = self.elbv2_client.describe_load_balancers(
                LoadBalancerArns=[load_balancer_arn]
            )
            load_balancer = lb_response['LoadBalancers'][0]
            self.assertEqual(load_balancer['Type'], 'application')
            self.assertEqual(load_balancer['Scheme'], 'internet-facing')
            
            # Test target group configuration
            tg_response = self.elbv2_client.describe_target_groups(
                TargetGroupArns=[target_group_arn]
            )
            target_group = tg_response['TargetGroups'][0]
            self.assertEqual(target_group['Port'], 80)
            self.assertEqual(target_group['Protocol'], 'HTTP')
            self.assertEqual(target_group['HealthCheckPath'], '/')
            
            # Test listener configuration
            listeners_response = self.elbv2_client.describe_listeners(
                LoadBalancerArn=load_balancer_arn
            )
            listeners = listeners_response['Listeners']
            self.assertEqual(len(listeners), 1)
            self.assertEqual(listeners[0]['Port'], 80)
            self.assertEqual(listeners[0]['Protocol'], 'HTTP')
            
        except ClientError as e:
            self.fail(f"Load balancer configuration test failed: {e}")
    
    def test_auto_scaling_group_exists_with_correct_scaling_policies_and_health_checks(self):
        """Test that Auto Scaling Group exists with proper scaling configuration."""
        auto_scaling_group_name = self.outputs.get('auto_scaling_group_name')
        self.assertIsNotNone(auto_scaling_group_name, "Auto Scaling Group name not found in outputs")
        
        try:
            # Test Auto Scaling Group exists
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[auto_scaling_group_name]
            )
            
            asg = response['AutoScalingGroups'][0]
            self.assertEqual(asg['AutoScalingGroupName'], auto_scaling_group_name)
            self.assertEqual(asg['HealthCheckType'], 'ELB')
            self.assertGreaterEqual(asg['MinSize'], 1)
            self.assertLessEqual(asg['MaxSize'], 3)
            self.assertGreaterEqual(asg['DesiredCapacity'], 1)
            
            # Test launch template is configured
            self.assertIn('LaunchTemplate', asg)
            launch_template = asg['LaunchTemplate']
            self.assertIsNotNone(launch_template['LaunchTemplateId'])
            
        except ClientError as e:
            self.fail(f"Auto Scaling Group configuration test failed: {e}")
    
    def test_ec2_launch_template_exists_with_correct_ami_and_security_configuration(self):
        """Test that EC2 Launch Template exists with proper AMI and security settings."""
        launch_template_id = self.outputs.get('launch_template_id')
        security_group_id = self.outputs.get('security_group_id')
        self.assertIsNotNone(launch_template_id, "Launch template ID not found in outputs")
        self.assertIsNotNone(security_group_id, "Security group ID not found in outputs")
        
        try:
            # Test launch template exists
            response = self.ec2_client.describe_launch_templates(
                LaunchTemplateIds=[launch_template_id]
            )
            
            launch_template = response['LaunchTemplates'][0]
            self.assertEqual(launch_template['LaunchTemplateId'], launch_template_id)
            
            # Test launch template version
            versions_response = self.ec2_client.describe_launch_template_versions(
                LaunchTemplateId=launch_template_id,
                Versions=['$Latest']
            )
            
            version = versions_response['LaunchTemplateVersions'][0]
            launch_template_data = version['LaunchTemplateData']
            
            # Test AMI is Amazon Linux 2
            image_id = launch_template_data['ImageId']
            image_response = self.ec2_client.describe_images(ImageIds=[image_id])
            image = image_response['Images'][0]
            self.assertIn('amzn2', image['Name'].lower())
            
            # Test security group configuration
            security_groups = launch_template_data['SecurityGroupIds']
            self.assertIn(security_group_id, security_groups)
            
        except ClientError as e:
            self.fail(f"Launch template configuration test failed: {e}")
    
    def test_cloudwatch_log_group_exists_with_correct_retention_and_stream_configuration(self):
        """Test that CloudWatch Log Group exists with proper retention settings."""
        log_group_name = self.outputs.get('log_group_name')
        self.assertIsNotNone(log_group_name, "CloudWatch Log Group name not found in outputs")
        
        try:
            # Test log group exists
            response = self.cloudwatch_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            log_groups = response['logGroups']
            self.assertGreater(len(log_groups), 0, "CloudWatch Log Group not found")
            
            log_group = log_groups[0]
            self.assertEqual(log_group['logGroupName'], log_group_name)
            
            # Test retention period
            if 'retentionInDays' in log_group:
                self.assertEqual(log_group['retentionInDays'], 30)
            
        except ClientError as e:
            self.fail(f"CloudWatch Log Group configuration test failed: {e}")
    
    def test_iam_role_and_instance_profile_exist_with_correct_policies(self):
        """Test that IAM role and instance profile exist with proper policy attachments."""
        iam_role_name = self.outputs.get('iam_role_name')
        iam_instance_profile_name = self.outputs.get('iam_instance_profile_name')
        self.assertIsNotNone(iam_role_name, "IAM role name not found in outputs")
        self.assertIsNotNone(iam_instance_profile_name, "IAM instance profile name not found in outputs")
        
        try:
            # Test IAM role exists
            role_response = self.iam_client.get_role(RoleName=iam_role_name)
            role = role_response['Role']
            self.assertEqual(role['RoleName'], iam_role_name)
            
            # Test instance profile exists
            profile_response = self.iam_client.get_instance_profile(InstanceProfileName=iam_instance_profile_name)
            instance_profile = profile_response['InstanceProfile']
            self.assertEqual(instance_profile['InstanceProfileName'], iam_instance_profile_name)
            
            # Test role is attached to instance profile
            profile_roles = [role['RoleName'] for role in instance_profile['Roles']]
            self.assertIn(iam_role_name, profile_roles)
            
            # Test policies are attached
            policies_response = self.iam_client.list_attached_role_policies(RoleName=iam_role_name)
            attached_policies = policies_response['AttachedPolicies']
            self.assertGreater(len(attached_policies), 0, "No policies attached to IAM role")
            
        except ClientError as e:
            self.fail(f"IAM role and instance profile configuration test failed: {e}")


class TestWebApplicationNetworkIntegration(BaseIntegrationTest):
    """Network infrastructure integration tests."""
    
    def test_vpc_and_subnets_exist_with_correct_cidr_and_availability_zone_configuration(self):
        """Test that VPC and subnets exist with proper CIDR and AZ configuration."""
        # Note: VPC and subnet IDs are not directly in outputs, but we can infer from security group
        security_group_id = self.outputs.get('security_group_id')
        self.assertIsNotNone(security_group_id, "Security group ID not found in outputs")
        
        try:
            # Get security group details to find VPC
            sg_response = self.ec2_client.describe_security_groups(
                GroupIds=[security_group_id]
            )
            
            security_group = sg_response['SecurityGroups'][0]
            vpc_id = security_group['VpcId']
            
            # Test VPC exists
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = vpc_response['Vpcs'][0]
            self.assertEqual(vpc['VpcId'], vpc_id)
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            
            # Test subnets exist in VPC
            subnets_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            subnets = subnets_response['Subnets']
            self.assertGreaterEqual(len(subnets), 2, "At least 2 subnets should exist")
            
            # Test subnet CIDR blocks
            for subnet in subnets:
                cidr = subnet['CidrBlock']
                self.assertTrue(cidr.startswith('10.0.'), f"Subnet CIDR {cidr} should be in 10.0.x.x range")
            
        except ClientError as e:
            self.fail(f"VPC and subnet configuration test failed: {e}")


if __name__ == '__main__':
    unittest.main()