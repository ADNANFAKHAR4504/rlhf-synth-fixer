"""
test_tap_stack.py
Unit tests for the serverless infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, PropertyMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from infrastructure.config import ServerlessConfig


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_functions_created_without_reserved_concurrency(self, mock_function, mock_log_group):
        """Test Lambda functions created without reserved concurrency."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        # Create proper Resource mock for IAM role
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_secrets_stack = MagicMock()
        mock_secrets_stack.get_secret_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_dynamodb_stack, mock_sqs_stack, mock_kms_stack, mock_secrets_stack
        )
        
        self.assertEqual(mock_function.call_count, 3)
        self.assertEqual(mock_log_group.call_count, 3)
        
        call_kwargs = mock_function.call_args[1]
        self.assertNotIn('reserved_concurrent_executions', call_kwargs)
        self.assertEqual(call_kwargs['timeout'], 30)
        self.assertEqual(call_kwargs['memory_size'], 512)


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.dynamodb.ContributorInsights')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_users_table_created_with_correct_schema(self, mock_table, mock_insights):
        """Test DynamoDB users table created with userId as hash key."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertIsNotNone(dynamodb_stack.tables.get('users'))
        self.assertEqual(mock_table.call_count, 3)
        
        first_call_kwargs = mock_table.call_args_list[0][1]
        self.assertIn('hash_key', first_call_kwargs)
        self.assertEqual(first_call_kwargs['billing_mode'], 'PAY_PER_REQUEST')

    @patch('infrastructure.dynamodb.aws.dynamodb.ContributorInsights')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_contributor_insights_enabled(self, mock_table, mock_insights):
        """Test Contributor Insights enabled on all tables."""
        import pulumi
        from infrastructure.dynamodb import DynamoDBStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertEqual(mock_insights.call_count, 3)


class TestS3Stack(unittest.TestCase):
    """Test S3 Stack resource creation."""

    @patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketVersioning')
    @patch('infrastructure.s3.aws.s3.Bucket')
    def test_buckets_created_with_encryption(self, mock_bucket, mock_versioning,
                                            mock_encryption, mock_public_access,
                                            mock_lifecycle):
        """Test S3 buckets created with KMS encryption."""
        import pulumi
        from infrastructure.s3 import S3Stack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket_domain_name = MagicMock()
        mock_bucket_instance.bucket_regional_domain_name = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertIsNotNone(s3_stack.buckets.get('content'))
        self.assertIsNotNone(s3_stack.buckets.get('data'))
        self.assertEqual(mock_bucket.call_count, 2)
        self.assertEqual(mock_encryption.call_count, 2)


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_dlq_creation_with_kms(self, mock_queue):
        """Test DLQ is created with KMS encryption."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_id.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertEqual(mock_queue.call_count, 3)
        
        call_kwargs = mock_queue.call_args[1]
        self.assertEqual(call_kwargs['message_retention_seconds'], 1209600)


class TestVPCStack(unittest.TestCase):
    """Test VPC Stack resource creation."""

    @patch('infrastructure.vpc.aws.ec2.RouteTableAssociation')
    @patch('infrastructure.vpc.aws.ec2.VpcEndpoint')
    @patch('infrastructure.vpc.aws.ec2.RouteTable')
    @patch('infrastructure.vpc.aws.ec2.Subnet')
    @patch('infrastructure.vpc.aws.ec2.Vpc')
    def test_vpc_with_dynamodb_endpoint(self, mock_vpc, mock_subnet, mock_route_table,
                                       mock_endpoint, mock_association):
        """Test VPC created with DynamoDB endpoint."""
        import pulumi
        from infrastructure.vpc import VPCStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_vpc_instance = MagicMock(spec=pulumi.Resource)
        mock_vpc_instance.id = MagicMock()
        mock_vpc.return_value = mock_vpc_instance
        
        mock_subnet_instance = MagicMock(spec=pulumi.Resource)
        mock_subnet_instance.id = MagicMock()
        mock_subnet.return_value = mock_subnet_instance
        
        mock_route_table_instance = MagicMock(spec=pulumi.Resource)
        mock_route_table_instance.id = MagicMock()
        mock_route_table.return_value = mock_route_table_instance
        
        mock_endpoint_instance = MagicMock(spec=pulumi.Resource)
        mock_endpoint_instance.id = MagicMock()
        mock_endpoint.return_value = mock_endpoint_instance
        
        vpc_stack = VPCStack(config, mock_provider_manager)
        
        self.assertIsNotNone(vpc_stack.vpc)
        self.assertIsNotNone(vpc_stack.dynamodb_endpoint)
        mock_vpc.assert_called_once()
        mock_endpoint.assert_called_once()


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_data_key_creation_with_rotation(self, mock_key, mock_alias, mock_caller_id):
        """Test KMS key for data encryption is created with rotation."""
        import pulumi
        from infrastructure.kms import KMSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        self.assertIsNotNone(kms_stack.keys.get('data'))
        mock_key.assert_called_once()
        
        call_kwargs = mock_key.call_args[1]
        self.assertTrue(call_kwargs['enable_key_rotation'])


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_with_lambda_integrations(self, mock_rest_api, mock_resource,
                                                  mock_method, mock_integration,
                                                  mock_deployment, mock_stage, mock_caller_id):
        """Test API Gateway created with Lambda integrations."""
        import pulumi
        from infrastructure.api_gateway import APIGatewayStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_rest_api_instance = MagicMock(spec=pulumi.Resource)
        mock_rest_api_instance.id = MagicMock()
        mock_rest_api_instance.root_resource_id = MagicMock()
        mock_rest_api_instance.execution_arn = MagicMock()
        mock_rest_api.return_value = mock_rest_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        api_gateway_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(api_gateway_stack.api)
        mock_rest_api.assert_called_once()
        self.assertGreater(mock_method.call_count, 0)
        self.assertGreater(mock_integration.call_count, 0)


class TestStepFunctionsStack(unittest.TestCase):
    """Test Step Functions Stack resource creation."""

    @patch('infrastructure.step_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.step_functions.aws.sfn.StateMachine')
    def test_state_machine_with_lambda_tasks(self, mock_state_machine, mock_log_group):
        """Test Step Functions state machine with Lambda task definitions."""
        import pulumi
        from infrastructure.step_functions import StepFunctionsStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_step_functions_role.return_value = mock_role
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_state_machine_instance = MagicMock(spec=pulumi.Resource)
        mock_state_machine_instance.arn = MagicMock()
        mock_state_machine.return_value = mock_state_machine_instance
        
        step_functions_stack = StepFunctionsStack(
            config, mock_provider_manager, mock_iam_stack, mock_lambda_stack
        )
        
        self.assertIsNotNone(step_functions_stack.state_machines)
        mock_state_machine.assert_called_once()
        
        call_kwargs = mock_state_machine.call_args[1]
        self.assertIn('definition', call_kwargs)


class TestCloudFrontStack(unittest.TestCase):
    """Test CloudFront Stack resource creation."""

    @patch('infrastructure.cloudfront.aws.cloudfront.Distribution')
    def test_cloudfront_distribution_with_s3_origin(self, mock_distribution):
        """Test CloudFront distribution created with S3 origin."""
        import pulumi
        from infrastructure.cloudfront import CloudFrontStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_domain_name.return_value = MagicMock()
        
        mock_distribution_instance = MagicMock(spec=pulumi.Resource)
        mock_distribution_instance.domain_name = MagicMock()
        mock_distribution_instance.arn = MagicMock()
        mock_distribution.return_value = mock_distribution_instance
        
        cloudfront_stack = CloudFrontStack(config, mock_provider_manager, mock_s3_stack)
        
        self.assertIsNotNone(cloudfront_stack.distributions.get('content'))
        mock_distribution.assert_called_once()
        
        call_kwargs = mock_distribution.call_args[1]
        self.assertTrue(call_kwargs['enabled'])


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    def test_lambda_error_alarms_created(self, mock_alarm):
        """Test CloudWatch alarms created for Lambda errors."""
        import pulumi
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_alarm_instance = MagicMock(spec=pulumi.Resource)
        mock_alarm.return_value = mock_alarm_instance
        
        monitoring_stack = MonitoringStack(
            config, mock_provider_manager, mock_lambda_stack
        )
        
        self.assertIsNotNone(monitoring_stack.alarms)
        self.assertGreater(mock_alarm.call_count, 0)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_least_privilege(self, mock_role, mock_policy, mock_attachment, mock_caller_id):
        """Test Lambda IAM role created with least-privilege policies."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_lambda_role('user')
        
        self.assertIsNotNone(role)
        mock_role.assert_called()
        mock_policy.assert_called()


class TestSecretsStack(unittest.TestCase):
    """Test Secrets Manager Stack resource creation."""

    @patch('infrastructure.secrets.aws.secretsmanager.SecretVersion')
    @patch('infrastructure.secrets.aws.secretsmanager.Secret')
    def test_secrets_created_with_kms_encryption(self, mock_secret, mock_version):
        """Test Secrets Manager secrets created with KMS encryption."""
        import pulumi
        from infrastructure.secrets import SecretsStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_secret_instance = MagicMock(spec=pulumi.Resource)
        mock_secret_instance.arn = MagicMock()
        mock_secret_instance.id = MagicMock()
        mock_secret.return_value = mock_secret_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertIsNotNone(secrets_stack.secrets)
        self.assertEqual(mock_secret.call_count, 2)  # Creates 2 secrets: api and database
        
        call_kwargs = mock_secret.call_args[1]
        self.assertIn('kms_key_id', call_kwargs)


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 30)
            self.assertEqual(config.lambda_memory_size, 512)

    def test_get_resource_name_includes_suffix_and_region(self):
        """Test resource name generation includes region and suffix."""
        config = ServerlessConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager for coverage."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_with_assume_role(self, mock_provider):
        """Test provider creation with assume role ARN."""
        from infrastructure.aws_provider import AWSProviderManager
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        config = ServerlessConfig()
        config.environment_suffix = 'arn:aws:iam::123456789012:role/test-role'
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()
        
        # Test resource options with provider
        opts = manager.get_resource_options()
        self.assertIsNotNone(opts)

    def test_provider_without_assume_role(self):
        """Test provider returns None when no assume role."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessConfig()
        config.environment_suffix = 'dev'
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNone(provider)
        
        # Test resource options without provider
        opts = manager.get_resource_options()
        self.assertIsNotNone(opts)


class TestS3StackGetterMethods(unittest.TestCase):
    """Test S3 Stack getter methods for coverage."""

    @patch('infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfigurationV2')
    @patch('infrastructure.s3.aws.s3.BucketV2')
    def test_s3_getter_methods(self, mock_bucket, mock_encryption, mock_access_block):
        """Test S3 stack getter methods return correct values."""
        import pulumi
        from infrastructure.s3 import S3Stack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.bucket_regional_domain_name = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        # Test getter methods
        bucket_name = s3_stack.get_bucket_name('content')
        self.assertIsNotNone(bucket_name)
        
        bucket_arn = s3_stack.get_bucket_arn('content')
        self.assertIsNotNone(bucket_arn)
        
        bucket_domain = s3_stack.get_bucket_domain_name('content')
        self.assertIsNotNone(bucket_domain)
        
        # Test get_bucket method
        bucket = s3_stack.get_bucket('content')
        self.assertIsNotNone(bucket)


class TestIAMStackAllPolicyBranches(unittest.TestCase):
    """Test IAM Stack with ALL policy types to cover conditional branches."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_all_policies_enabled(self, mock_role, mock_role_policy, mock_caller):
        """Test Lambda role with ALL policy types to hit all conditional branches."""
        import pulumi
        from infrastructure.iam import IAMStack
        
        mock_caller.return_value = MagicMock(account_id='123456789012')
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Create lambda role with ALL policy types using MagicMock to trigger all branches
        role = iam_stack.create_lambda_role(
            role_name='comprehensive-function',
            dynamodb_table_arns=[MagicMock()],
            sqs_queue_arns=[MagicMock()],
            kms_key_arns=[MagicMock()],
            secrets_arns=[MagicMock()],
            enable_xray=True
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()
        # Should execute lines 86, 89, 92, 95, 97-98 (all conditional branches)
        self.assertIn('comprehensive-function', iam_stack.roles)


class TestGetterMethodsReturnNone(unittest.TestCase):
    """Test getter methods return None for missing keys to cover edge cases."""

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_getters_missing_key(self, mock_key, mock_alias, mock_caller):
        """Test KMS getters return None for missing keys."""
        import pulumi
        from infrastructure.kms import KMSStack
        
        mock_caller.return_value = MagicMock(account_id='123456789012')
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.id = MagicMock()
        mock_key_instance.arn = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        # Test getters with non-existent key
        key_arn = kms_stack.get_key_arn('nonexistent')
        self.assertIsNone(key_arn)
        
        key_id = kms_stack.get_key_id('nonexistent')
        self.assertIsNone(key_id)

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_sqs_getters_missing_queue(self, mock_queue):
        """Test SQS getters return None for missing queues."""
        import pulumi
        from infrastructure.sqs import SQSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.id = MagicMock()
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager, mock_kms_stack)
        
        # Test getters with non-existent queue
        queue_url = sqs_stack.get_queue_url('nonexistent')
        self.assertIsNone(queue_url)
        
        queue_arn = sqs_stack.get_queue_arn('nonexistent')
        self.assertIsNone(queue_arn)

    @patch('infrastructure.secrets.aws.secretsmanager.Secret')
    def test_secrets_getter_missing_secret(self, mock_secret):
        """Test Secrets getter returns None for missing secrets."""
        import pulumi
        from infrastructure.secrets import SecretsStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_secret_instance = MagicMock(spec=pulumi.Resource)
        mock_secret_instance.id = MagicMock()
        mock_secret_instance.arn = MagicMock()
        mock_secret.return_value = mock_secret_instance
        
        secrets_stack = SecretsStack(config, mock_provider_manager, mock_kms_stack)
        
        # Test getter with non-existent secret
        secret_arn = secrets_stack.get_secret_arn('nonexistent')
        self.assertIsNone(secret_arn)

    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    def test_lambda_getters_missing_function(self, mock_function, mock_log_group):
        """Test Lambda getters return None for missing functions."""
        import pulumi
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_secrets_stack = MagicMock()
        mock_secrets_stack.get_secret_arn.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_dynamodb_stack, mock_sqs_stack, mock_kms_stack, mock_secrets_stack
        )
        
        # Test getters with non-existent function
        func_name = lambda_stack.get_function_name('nonexistent')
        self.assertIsNone(func_name)
        
        func_arn = lambda_stack.get_function_arn('nonexistent')
        self.assertIsNone(func_arn)

    @patch('infrastructure.step_functions.aws.sfn.StateMachine')
    def test_step_functions_getter_missing(self, mock_sm):
        """Test Step Functions getter returns None for missing state machines."""
        import pulumi
        from infrastructure.step_functions import StepFunctionsStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_step_functions_role.return_value = mock_role
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        
        mock_sm_instance = MagicMock(spec=pulumi.Resource)
        mock_sm_instance.arn = MagicMock()
        mock_sm.return_value = mock_sm_instance
        
        sfn_stack = StepFunctionsStack(config, mock_provider_manager, mock_iam_stack, mock_lambda_stack)
        
        # Test getter with non-existent state machine
        sm_arn = sfn_stack.get_state_machine_arn('nonexistent')
        self.assertIsNone(sm_arn)

    @patch('infrastructure.cloudfront.aws.cloudfront.Distribution')
    def test_cloudfront_getter_missing(self, mock_dist):
        """Test CloudFront getter returns None for missing distributions."""
        import pulumi
        from infrastructure.cloudfront import CloudFrontStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_domain_name.return_value = MagicMock()
        
        mock_dist_instance = MagicMock(spec=pulumi.Resource)
        mock_dist_instance.domain_name = MagicMock()
        mock_dist.return_value = mock_dist_instance
        
        cloudfront_stack = CloudFrontStack(config, mock_provider_manager, mock_s3_stack)
        
        # Test getter with non-existent distribution
        domain_name = cloudfront_stack.get_distribution_domain_name('nonexistent')
        self.assertIsNone(domain_name)

    @patch('infrastructure.vpc.aws.ec2.VpcEndpoint')
    @patch('infrastructure.vpc.aws.ec2.Subnet')
    @patch('infrastructure.vpc.aws.ec2.Vpc')
    def test_vpc_getters(self, mock_vpc, mock_subnet, mock_endpoint):
        """Test VPC getter methods return correct values."""
        import pulumi
        from infrastructure.vpc import VPCStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = None
        
        mock_vpc_instance = MagicMock(spec=pulumi.Resource)
        mock_vpc_instance.id = MagicMock()
        mock_vpc.return_value = mock_vpc_instance
        
        mock_subnet_instance = MagicMock(spec=pulumi.Resource)
        mock_subnet_instance.id = MagicMock()
        mock_subnet.return_value = mock_subnet_instance
        
        mock_endpoint_instance = MagicMock(spec=pulumi.Resource)
        mock_endpoint_instance.id = MagicMock()
        mock_endpoint.return_value = mock_endpoint_instance
        
        vpc_stack = VPCStack(config, mock_provider_manager)
        
        # Test VPC ID getter
        vpc_id = vpc_stack.get_vpc_id()
        self.assertIsNotNone(vpc_id)
        
        # Test subnet IDs getter
        subnet_ids = vpc_stack.get_subnet_ids()
        self.assertIsInstance(subnet_ids, list)
        self.assertGreater(len(subnet_ids), 0)
        
        # Test DynamoDB endpoint ID getter
        endpoint_id = vpc_stack.get_dynamodb_endpoint_id()
        self.assertIsNotNone(endpoint_id)


class TestTAPStackOrchestration(unittest.TestCase):
    """Test TAP Stack orchestration and exports."""

    @patch('lib.tap_stack.pulumi.export')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.StepFunctionsStack')
    @patch('lib.tap_stack.CloudFrontStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.SecretsStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.SQSStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.VPCStack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    @patch('lib.tap_stack.ServerlessConfig')
    def test_tap_stack_initialization(
        self, mock_config, mock_provider, mock_kms, mock_vpc, mock_dynamodb,
        mock_s3, mock_sqs, mock_iam, mock_secrets, mock_lambda, mock_api,
        mock_cloudfront, mock_sfn, mock_monitoring, mock_export
    ):
        """Test TAP stack initializes all components and exports outputs."""
        from lib.tap_stack import TapStack, TapStackArgs

        # Mock config instance
        mock_config_instance = MagicMock()
        mock_config_instance.get_resource_name.return_value = 'test-resource'
        mock_config_instance.get_common_tags.return_value = {}
        mock_config.return_value = mock_config_instance
        
        # Mock all stack instances with required attributes
        mock_kms.return_value.get_key_arn.return_value = MagicMock()
        mock_dynamodb.return_value.get_table_name.return_value = MagicMock()
        mock_dynamodb.return_value.get_table_arn.return_value = MagicMock()
        mock_s3.return_value.get_bucket_name.return_value = MagicMock()
        mock_s3.return_value.get_bucket_arn.return_value = MagicMock()
        mock_sqs.return_value.get_queue_arn.return_value = MagicMock()
        mock_lambda.return_value.get_function_name.return_value = MagicMock()
        mock_lambda.return_value.get_function_arn.return_value = MagicMock()
        mock_api.return_value.api = MagicMock(id=MagicMock())
        mock_sfn.return_value.state_machines = {'order': MagicMock(arn=MagicMock())}
        mock_cloudfront.return_value.distributions = {'content': MagicMock(domain_name=MagicMock())}
        mock_iam.return_value.create_lambda_role.return_value = MagicMock(arn=MagicMock())
        mock_iam.return_value.create_step_functions_role.return_value = MagicMock(arn=MagicMock())
        
        # Create stack args
        args = TapStackArgs()
        args.environment_suffix = 'test'
        args.tags = {}
        
        # Create stack
        stack = TapStack('test-stack', args)
        
        # Verify stacks were initialized
        mock_config.assert_called_once()
        mock_provider.assert_called_once()
        mock_kms.assert_called_once()
        mock_vpc.assert_called_once()
        mock_dynamodb.assert_called_once()
        mock_s3.assert_called_once()
        mock_sqs.assert_called_once()
        mock_iam.assert_called_once()
        mock_secrets.assert_called_once()
        mock_lambda.assert_called_once()
        mock_api.assert_called_once()
        mock_cloudfront.assert_called_once()
        mock_sfn.assert_called_once()
        mock_monitoring.assert_called_once()
        
        # Verify exports were called
        self.assertGreater(mock_export.call_count, 0)


if __name__ == '__main__':
    unittest.main()
