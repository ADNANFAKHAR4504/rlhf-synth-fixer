"""
Integration tests for the deployed EC2 Recovery Pulumi stack infrastructure.
These tests validate actual AWS resources against live deployments.
"""

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
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Skip tests if no outputs available
        if not cls.outputs:
            pytest.skip("No deployment outputs available - infrastructure may not be deployed")
        
        try:
            # Initialize AWS clients
            cls.lambda_client = boto3.client('lambda', region_name=cls.region)
            cls.s3_client = boto3.client('s3', region_name=cls.region)
            cls.sns_client = boto3.client('sns', region_name=cls.region)
            cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
            cls.logs_client = boto3.client('logs', region_name=cls.region)
            cls.cloudwatch_events_client = boto3.client('events', region_name=cls.region)
            cls.iam_client = boto3.client('iam', region_name=cls.region)
            cls.ssm_client = boto3.client('ssm', region_name=cls.region)
            cls.ec2_client = boto3.client('ec2', region_name=cls.region)
            
            # Test AWS credentials
            sts_client = boto3.client('sts', region_name=cls.region)
            cls.account_id = sts_client.get_caller_identity()['Account']
            
        except NoCredentialsError:
            pytest.skip("AWS credentials not configured - skipping integration tests")
        except Exception as e:
            pytest.skip(f"Failed to initialize AWS clients: {e}")
    
    def get_output_value(self, key: str) -> Optional[str]:
        """Helper to get output value by key with fallback logic."""
        if key in self.outputs:
            return self.outputs[key]
        
        # Try case-insensitive lookup
        for output_key, value in self.outputs.items():
            if output_key.lower() == key.lower():
                return value
        
        return None
    
    def skip_if_resource_missing(self, resource_key: str, resource_name: str):
        """Skip test if resource output is not available."""
        if not self.get_output_value(resource_key):
            pytest.skip(f"{resource_name} not found in outputs - may not be deployed")


class TestLambdaFunctionIntegration(BaseIntegrationTest):
    """Test Lambda function resources and configuration."""
    
    
    def test_lambda_function_role_attached(self):
        """Test that Lambda function has correct IAM role attached."""
        function_name = self.get_output_value('lambda_function_name')
        role_arn = self.get_output_value('iam_role_arn')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        self.skip_if_resource_missing('iam_role_arn', 'IAM role')
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            actual_role = response['Configuration']['Role']
            
            # Validate role ARN matches
            self.assertEqual(actual_role, role_arn)
            
            # Validate role exists and has correct policies
            role_name = role_arn.split('/')[-1]
            role_response = self.iam_client.get_role(RoleName=role_name)
            self.assertEqual(role_response['Role']['RoleName'], role_name)
            
        except ClientError as e:
            self.fail(f"Lambda function role validation failed: {e}")
    
    def test_lambda_function_code_deployed(self):
        """Test that Lambda function has code deployed and is ready."""
        function_name = self.get_output_value('lambda_function_name')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        
        try:
            response = self.lambda_client.get_function(FunctionName=function_name)
            
            # Validate function state
            config = response['Configuration']
            self.assertEqual(config['State'], 'Active')
            self.assertEqual(config['LastUpdateStatus'], 'Successful')
            
            # Validate code is deployed
            code_response = self.lambda_client.get_function_code_signing_config(FunctionName=function_name)
            # This should not raise an exception if code is properly deployed
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'CodeSigningConfigNotFoundException':
                # This is expected for functions without code signing
                pass
            else:
                self.fail(f"Lambda function code validation failed: {e}")


class TestS3BucketIntegration(BaseIntegrationTest):
    """Test S3 bucket resources and configuration."""
    
    def test_s3_bucket_exists_and_accessible(self):
        """Test that S3 bucket exists and is accessible."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.skip_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            # If no exception is raised, bucket exists and is accessible
            
        except ClientError as e:
            self.fail(f"S3 bucket not accessible: {e}")
    
    def test_s3_bucket_has_correct_tags(self):
        """Test that S3 bucket has correct tags applied."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.skip_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        try:
            response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
            tags = {tag['Key']: tag['Value'] for tag in response['TagSet']}
            
            # Validate required tags
            self.assertIn('Name', tags)
            self.assertIn('Environment', tags)
            self.assertIn('Project', tags)
            self.assertIn('Purpose', tags)
            self.assertEqual(tags['Purpose'], 'EC2-Recovery-State')
            
        except ClientError as e:
            self.fail(f"S3 bucket tags validation failed: {e}")
    
    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 bucket has encryption enabled."""
        bucket_name = self.get_output_value('s3_bucket_name')
        self.skip_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_rules = response['ServerSideEncryptionConfiguration']['Rules']
            
            # Validate encryption is configured
            self.assertGreater(len(encryption_rules), 0)
            
        except ClientError as e:
            self.fail(f"S3 bucket encryption validation failed: {e}")


class TestSNSIntegration(BaseIntegrationTest):
    """Test SNS topic resources and configuration."""
    
    def test_sns_topic_exists_and_accessible(self):
        """Test that SNS topic exists and is accessible."""
        topic_arn = self.get_output_value('sns_topic_arn')
        self.skip_if_resource_missing('sns_topic_arn', 'SNS topic')
        
        try:
            response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
            
            # Validate topic attributes
            self.assertIn('TopicArn', response['Attributes'])
            self.assertEqual(response['Attributes']['TopicArn'], topic_arn)
            
        except ClientError as e:
            self.fail(f"SNS topic not accessible: {e}")
    
    def test_sns_topic_has_email_subscription(self):
        """Test that SNS topic has email subscription configured."""
        topic_arn = self.get_output_value('sns_topic_arn')
        alert_email = self.get_output_value('alert_email')
        self.skip_if_resource_missing('sns_topic_arn', 'SNS topic')
        self.skip_if_resource_missing('alert_email', 'Alert email')
        
        try:
            response = self.sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
            subscriptions = response['Subscriptions']
            
            # Find email subscription
            email_subscription = None
            for sub in subscriptions:
                if sub['Protocol'] == 'email' and sub['Endpoint'] == alert_email:
                    email_subscription = sub
                    break
            
            self.assertIsNotNone(email_subscription, "Email subscription not found")
            self.assertEqual(email_subscription['Protocol'], 'email')
            self.assertEqual(email_subscription['Endpoint'], alert_email)
            
        except ClientError as e:
            self.fail(f"SNS topic subscription validation failed: {e}")


class TestCloudWatchIntegration(BaseIntegrationTest):
    """Test CloudWatch resources and configuration."""
    


class TestCloudWatchEventsIntegration(BaseIntegrationTest):
    """Test CloudWatch Events resources and configuration."""
    
    def test_cloudwatch_events_rule_exists(self):
        """Test that CloudWatch Events rule exists and is accessible."""
        rule_name = self.get_output_value('event_rule_name')
        self.skip_if_resource_missing('event_rule_name', 'CloudWatch Events rule')
        
        try:
            response = self.cloudwatch_events_client.describe_rule(Name=rule_name)
            
            # Validate rule configuration
            self.assertEqual(response['Name'], rule_name)
            self.assertEqual(response['State'], 'ENABLED')
            self.assertIn('ScheduleExpression', response)
            
        except ClientError as e:
            self.fail(f"CloudWatch Events rule validation failed: {e}")
    
    def test_cloudwatch_events_rule_schedule_expression(self):
        """Test that CloudWatch Events rule has correct schedule expression."""
        rule_name = self.get_output_value('event_rule_name')
        self.skip_if_resource_missing('event_rule_name', 'CloudWatch Events rule')
        
        try:
            response = self.cloudwatch_events_client.describe_rule(Name=rule_name)
            schedule_expression = response.get('ScheduleExpression', '')
            
            # Validate schedule expression format (should be rate-based)
            self.assertIn('rate', schedule_expression.lower())
            self.assertIn('10', schedule_expression)  # 10 minutes
            
        except ClientError as e:
            self.fail(f"CloudWatch Events rule schedule validation failed: {e}")
    
    def test_cloudwatch_events_rule_targets_lambda(self):
        """Test that CloudWatch Events rule targets the Lambda function."""
        rule_name = self.get_output_value('event_rule_name')
        lambda_function_arn = self.get_output_value('lambda_function_arn')
        self.skip_if_resource_missing('event_rule_name', 'CloudWatch Events rule')
        self.skip_if_resource_missing('lambda_function_arn', 'Lambda function ARN')
        
        try:
            response = self.cloudwatch_events_client.list_targets_by_rule(Rule=rule_name)
            targets = response['Targets']
            
            # Find Lambda target
            lambda_target = None
            for target in targets:
                if target['Arn'] == lambda_function_arn:
                    lambda_target = target
                    break
            
            self.assertIsNotNone(lambda_target, "Lambda target not found in rule")
            self.assertEqual(lambda_target['Arn'], lambda_function_arn)
            
        except ClientError as e:
            self.fail(f"CloudWatch Events rule target validation failed: {e}")


class TestIAMIntegration(BaseIntegrationTest):
    """Test IAM resources and configuration."""
    


class TestParameterStoreIntegration(BaseIntegrationTest):
    """Test Parameter Store resources and configuration."""
    


class TestServiceToServiceIntegration(BaseIntegrationTest):
    """Test service-to-service integrations and workflows."""
    
    def test_lambda_can_access_s3_bucket(self):
        """Test that Lambda function can access S3 bucket for state storage."""
        function_name = self.get_output_value('lambda_function_name')
        bucket_name = self.get_output_value('s3_bucket_name')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        self.skip_if_resource_missing('s3_bucket_name', 'S3 bucket')
        
        # This test validates the IAM permissions allow Lambda to access S3
        # We can't directly test the Lambda execution, but we can verify the resources exist
        # and the IAM role has the necessary permissions
        
        try:
            # Verify Lambda function exists
            lambda_response = self.lambda_client.get_function(FunctionName=function_name)
            lambda_role_arn = lambda_response['Configuration']['Role']
            
            # Verify S3 bucket exists
            s3_response = self.s3_client.head_bucket(Bucket=bucket_name)
            
            # Verify IAM role has S3 permissions
            role_name = lambda_role_arn.split('/')[-1]
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Check if any policy allows S3 access
            s3_access_found = False
            for policy in role_policies['AttachedPolicies']:
                policy_response = self.iam_client.get_policy(PolicyArn=policy['PolicyArn'])
                policy_version = self.iam_client.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_response['Policy']['DefaultVersionId']
                )
                
                policy_doc = policy_version['PolicyVersion']['Document']
                if self._policy_allows_s3_access(policy_doc):
                    s3_access_found = True
                    break
            
            self.assertTrue(s3_access_found, "Lambda role does not have S3 access permissions")
            
        except ClientError as e:
            self.fail(f"Lambda-S3 integration validation failed: {e}")
    
    def test_lambda_can_publish_to_sns(self):
        """Test that Lambda function can publish to SNS topic."""
        function_name = self.get_output_value('lambda_function_name')
        sns_topic_arn = self.get_output_value('sns_topic_arn')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        self.skip_if_resource_missing('sns_topic_arn', 'SNS topic')
        
        try:
            # Verify Lambda function exists
            lambda_response = self.lambda_client.get_function(FunctionName=function_name)
            lambda_role_arn = lambda_response['Configuration']['Role']
            
            # Verify SNS topic exists
            sns_response = self.sns_client.get_topic_attributes(TopicArn=sns_topic_arn)
            
            # Verify IAM role has SNS permissions
            role_name = lambda_role_arn.split('/')[-1]
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Check if any policy allows SNS access
            sns_access_found = False
            for policy in role_policies['AttachedPolicies']:
                policy_response = self.iam_client.get_policy(PolicyArn=policy['PolicyArn'])
                policy_version = self.iam_client.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_response['Policy']['DefaultVersionId']
                )
                
                policy_doc = policy_version['PolicyVersion']['Document']
                if self._policy_allows_sns_access(policy_doc):
                    sns_access_found = True
                    break
            
            self.assertTrue(sns_access_found, "Lambda role does not have SNS access permissions")
            
        except ClientError as e:
            self.fail(f"Lambda-SNS integration validation failed: {e}")
    
    def test_cloudwatch_events_triggers_lambda(self):
        """Test that CloudWatch Events can trigger Lambda function."""
        rule_name = self.get_output_value('event_rule_name')
        lambda_function_arn = self.get_output_value('lambda_function_arn')
        self.skip_if_resource_missing('event_rule_name', 'CloudWatch Events rule')
        self.skip_if_resource_missing('lambda_function_arn', 'Lambda function ARN')
        
        try:
            # Verify rule exists and is enabled
            rule_response = self.cloudwatch_events_client.describe_rule(Name=rule_name)
            self.assertEqual(rule_response['State'], 'ENABLED')
            
            # Verify rule targets Lambda
            targets_response = self.cloudwatch_events_client.list_targets_by_rule(Rule=rule_name)
            lambda_targets = [t for t in targets_response['Targets'] if t['Arn'] == lambda_function_arn]
            self.assertGreater(len(lambda_targets), 0, "Lambda not found as rule target")
            
            # Verify Lambda permission exists for CloudWatch Events
            try:
                lambda_permissions = self.lambda_client.get_policy(FunctionName=lambda_function_arn)
                policy_doc = json.loads(lambda_permissions['Policy'])
                
                # Check for CloudWatch Events permission
                events_permission_found = False
                for statement in policy_doc['Statement']:
                    if (statement.get('Effect') == 'Allow' and 
                        'events.amazonaws.com' in str(statement.get('Principal', {}))):
                        events_permission_found = True
                        break
                
                self.assertTrue(events_permission_found, "Lambda missing CloudWatch Events permission")
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'ResourceNotFoundException':
                    self.fail("Lambda resource-based policy not found")
                else:
                    raise
            
        except ClientError as e:
            self.fail(f"CloudWatch Events-Lambda integration validation failed: {e}")
    
    def test_lambda_can_access_parameter_store(self):
        """Test that Lambda function can access Parameter Store."""
        function_name = self.get_output_value('lambda_function_name')
        parameter_prefix = self.get_output_value('parameter_store_prefix')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        self.skip_if_resource_missing('parameter_store_prefix', 'Parameter Store prefix')
        
        try:
            # Verify Lambda function exists
            lambda_response = self.lambda_client.get_function(FunctionName=function_name)
            lambda_role_arn = lambda_response['Configuration']['Role']
            
            # Verify Parameter Store parameters exist
            ssm_response = self.ssm_client.get_parameters_by_path(
                Path=parameter_prefix,
                Recursive=True
            )
            self.assertGreater(len(ssm_response['Parameters']), 0)
            
            # Verify IAM role has SSM permissions
            role_name = lambda_role_arn.split('/')[-1]
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Check if any policy allows SSM access
            ssm_access_found = False
            for policy in role_policies['AttachedPolicies']:
                policy_response = self.iam_client.get_policy(PolicyArn=policy['PolicyArn'])
                policy_version = self.iam_client.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_response['Policy']['DefaultVersionId']
                )
                
                policy_doc = policy_version['PolicyVersion']['Document']
                if self._policy_allows_ssm_access(policy_doc):
                    ssm_access_found = True
                    break
            
            self.assertTrue(ssm_access_found, "Lambda role does not have SSM access permissions")
            
        except ClientError as e:
            self.fail(f"Lambda-Parameter Store integration validation failed: {e}")
    
    def test_lambda_can_access_ec2_instances(self):
        """Test that Lambda function can access EC2 instances."""
        function_name = self.get_output_value('lambda_function_name')
        self.skip_if_resource_missing('lambda_function_name', 'Lambda function')
        
        try:
            # Verify Lambda function exists
            lambda_response = self.lambda_client.get_function(FunctionName=function_name)
            lambda_role_arn = lambda_response['Configuration']['Role']
            
            # Verify IAM role has EC2 permissions
            role_name = lambda_role_arn.split('/')[-1]
            role_policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
            
            # Check if any policy allows EC2 access
            ec2_access_found = False
            for policy in role_policies['AttachedPolicies']:
                policy_response = self.iam_client.get_policy(PolicyArn=policy['PolicyArn'])
                policy_version = self.iam_client.get_policy_version(
                    PolicyArn=policy['PolicyArn'],
                    VersionId=policy_response['Policy']['DefaultVersionId']
                )
                
                policy_doc = policy_version['PolicyVersion']['Document']
                if self._policy_allows_ec2_access(policy_doc):
                    ec2_access_found = True
                    break
            
            self.assertTrue(ec2_access_found, "Lambda role does not have EC2 access permissions")
            
        except ClientError as e:
            self.fail(f"Lambda-EC2 integration validation failed: {e}")
    
    def _policy_allows_s3_access(self, policy_doc):
        """Helper to check if policy allows S3 access."""
        for statement in policy_doc.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                if any('s3:' in action for action in actions):
                    return True
        return False
    
    def _policy_allows_sns_access(self, policy_doc):
        """Helper to check if policy allows SNS access."""
        for statement in policy_doc.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                if any('sns:' in action for action in actions):
                    return True
        return False
    
    def _policy_allows_ssm_access(self, policy_doc):
        """Helper to check if policy allows SSM access."""
        for statement in policy_doc.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                if any('ssm:' in action for action in actions):
                    return True
        return False
    
    def _policy_allows_ec2_access(self, policy_doc):
        """Helper to check if policy allows EC2 access."""
        for statement in policy_doc.get('Statement', []):
            if statement.get('Effect') == 'Allow':
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]
                if any('ec2:' in action for action in actions):
                    return True
        return False


if __name__ == '__main__':
    unittest.main()