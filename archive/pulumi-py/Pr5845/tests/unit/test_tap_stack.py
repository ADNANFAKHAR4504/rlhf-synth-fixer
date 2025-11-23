"""
test_tap_stack.py
Unit tests for the serverless infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

os.environ['PULUMI_TEST_MODE'] = 'true'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

import pulumi

pulumi.runtime.settings.configure(
    pulumi.runtime.Settings(
        project='test-project',
        stack='test-stack',
        parallel=1,
        dry_run=True,
        monitor='',
        engine='',
    )
)

from infrastructure.config import ServerlessConfig


class TestServerlessConfig(unittest.TestCase):
    """Test ServerlessConfig resource configuration."""

    def test_config_initialization_with_defaults(self):
        """Test configuration initializes with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = ServerlessConfig()
            self.assertEqual(config.project_name, 'ServApp')
            self.assertEqual(config.environment, 'Production')
            self.assertEqual(config.primary_region, 'us-east-1')
            self.assertEqual(config.lambda_timeout, 15)
            self.assertEqual(config.lambda_memory_size, 512)

    def test_normalize_region_removes_hyphens(self):
        """Test region normalization removes hyphens."""
        config = ServerlessConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name_includes_components(self):
        """Test resource name generation includes all components."""
        config = ServerlessConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_primary_region, name)

    def test_get_common_tags_returns_dict(self):
        """Test common tags generation returns proper dict."""
        config = ServerlessConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    def test_provider_returns_none_by_default(self):
        """Test provider returns None by default."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessConfig()
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNone(provider)

    def test_get_resource_options_returns_options(self):
        """Test get_resource_options returns ResourceOptions."""
        from infrastructure.aws_provider import AWSProviderManager
        
        config = ServerlessConfig()
        
        manager = AWSProviderManager(config)
        opts = manager.get_resource_options()
        
        self.assertIsNotNone(opts)
        self.assertIsInstance(opts, pulumi.ResourceOptions)


class TestKMSStack(unittest.TestCase):
    """Test KMS Stack resource creation."""

    @patch('infrastructure.kms.aws.get_caller_identity')
    @patch('infrastructure.kms.aws.kms.Alias')
    @patch('infrastructure.kms.aws.kms.Key')
    def test_kms_keys_created_with_rotation(self, mock_key, mock_alias, mock_caller_id):
        """Test KMS keys are created with rotation enabled."""
        from infrastructure.kms import KMSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        kms_stack = KMSStack(config, mock_provider_manager)
        
        self.assertEqual(mock_key.call_count, 3)
        call_kwargs = mock_key.call_args[1]
        self.assertTrue(call_kwargs['enable_key_rotation'])


class TestDynamoDBStack(unittest.TestCase):
    """Test DynamoDB Stack resource creation."""

    @patch('infrastructure.dynamodb.aws.appautoscaling.Policy')
    @patch('infrastructure.dynamodb.aws.appautoscaling.Target')
    @patch('infrastructure.dynamodb.aws.dynamodb.ContributorInsights')
    @patch('infrastructure.dynamodb.aws.dynamodb.Table')
    def test_dynamodb_table_with_autoscaling(self, mock_table, mock_insights, mock_target, mock_policy):
        """Test DynamoDB table created with autoscaling."""
        from infrastructure.dynamodb import DynamoDBStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_table_instance = MagicMock(spec=pulumi.Resource)
        mock_table_instance.name = MagicMock()
        mock_table_instance.arn = MagicMock()
        mock_table.return_value = mock_table_instance
        
        dynamodb_stack = DynamoDBStack(config, mock_provider_manager, mock_kms_stack)
        
        mock_table.assert_called_once()
        mock_insights.assert_called_once()
        self.assertEqual(mock_target.call_count, 2)
        self.assertEqual(mock_policy.call_count, 2)


class TestS3Stack(unittest.TestCase):
    """Test S3 Stack resource creation."""

    @patch('infrastructure.s3.aws.lambda_.Permission')
    @patch('infrastructure.s3.aws.s3.BucketNotification')
    @patch('infrastructure.s3.aws.s3.BucketLifecycleConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.s3.aws.s3.BucketServerSideEncryptionConfiguration')
    @patch('infrastructure.s3.aws.s3.BucketVersioning')
    @patch('infrastructure.s3.aws.s3.Bucket')
    def test_s3_buckets_created_with_features(self, mock_bucket, mock_versioning,
                                             mock_encryption, mock_public_access,
                                             mock_lifecycle, mock_notification, mock_permission):
        """Test S3 buckets created with versioning, encryption, and lifecycle."""
        from infrastructure.s3 import S3Stack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.id = MagicMock()
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        s3_stack = S3Stack(config, mock_provider_manager, mock_kms_stack)
        
        self.assertEqual(mock_bucket.call_count, 2)
        self.assertEqual(mock_versioning.call_count, 2)
        self.assertEqual(mock_encryption.call_count, 2)


class TestSQSStack(unittest.TestCase):
    """Test SQS Stack resource creation."""

    @patch('infrastructure.sqs.aws.sqs.Queue')
    def test_sqs_dlq_created_with_kms(self, mock_queue):
        """Test SQS DLQ is created with KMS encryption."""
        from infrastructure.sqs import SQSStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_id.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue_instance.url = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        sqs_stack = SQSStack(config, mock_provider_manager, mock_kms_stack)
        
        dlq = sqs_stack.create_dlq('test-function')
        
        self.assertIsNotNone(dlq)
        mock_queue.assert_called_once()


class TestVPCStack(unittest.TestCase):
    """Test VPC Stack resource creation."""

    @patch('infrastructure.vpc.aws.ec2.VpcEndpoint')
    @patch('infrastructure.vpc.aws.ec2.SecurityGroup')
    @patch('infrastructure.vpc.aws.ec2.Route')
    @patch('infrastructure.vpc.aws.ec2.RouteTableAssociation')
    @patch('infrastructure.vpc.aws.ec2.RouteTable')
    @patch('infrastructure.vpc.aws.ec2.NatGateway')
    @patch('infrastructure.vpc.aws.ec2.Eip')
    @patch('infrastructure.vpc.aws.ec2.InternetGateway')
    @patch('infrastructure.vpc.aws.ec2.Subnet')
    @patch('infrastructure.vpc.aws.ec2.Vpc')
    @patch('infrastructure.vpc.aws.get_availability_zones')
    def test_vpc_with_networking_components(self, mock_azs, mock_vpc, mock_subnet, mock_igw,
                                           mock_eip, mock_nat, mock_rt, mock_rta, mock_route,
                                           mock_sg, mock_endpoint):
        """Test VPC created with all networking components."""
        from infrastructure.vpc import VPCStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_azs.return_value = MagicMock(names=['us-east-1a', 'us-east-1b'])
        
        mock_vpc_instance = MagicMock(spec=pulumi.Resource)
        mock_vpc_instance.id = MagicMock()
        mock_vpc.return_value = mock_vpc_instance
        
        mock_subnet_instance = MagicMock(spec=pulumi.Resource)
        mock_subnet_instance.id = MagicMock()
        mock_subnet.return_value = mock_subnet_instance
        
        mock_rt_instance = MagicMock(spec=pulumi.Resource)
        mock_rt_instance.id = MagicMock()
        mock_rt.return_value = mock_rt_instance
        
        vpc_stack = VPCStack(config, mock_provider_manager)
        
        mock_vpc.assert_called_once()
        self.assertEqual(mock_subnet.call_count, 4)
        self.assertEqual(mock_endpoint.call_count, 2)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack resource creation."""

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_lambda_role_with_all_permissions(self, mock_role, mock_role_policy, mock_caller_id):
        """Test Lambda role created with all permission types."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_lambda_role(
            'test-function',
            dynamodb_table_arns=[MagicMock()],
            s3_bucket_arns=[MagicMock()],
            kms_key_arns=[MagicMock()],
            dlq_arn=MagicMock(),
            log_group_arn=MagicMock()
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_codebuild_role_creation(self, mock_role, mock_role_policy, mock_caller_id):
        """Test CodeBuild role is created."""
        from infrastructure.iam import IAMStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        role = iam_stack.create_codebuild_role(
            [MagicMock()],
            [MagicMock()]
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called_once()


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.cloudwatch.LogGroup')
    def test_lambda_functions_created(self, mock_log_group, mock_function, mock_event_config):
        """Test Lambda functions are created with proper configuration."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        
        mock_iam_stack = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        mock_dynamodb_stack.get_table_arn.return_value = MagicMock()
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_name.return_value = MagicMock()
        mock_s3_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_sqs_stack = MagicMock()
        mock_sqs_stack.get_queue_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_vpc_stack = MagicMock()
        mock_vpc_stack.get_private_subnet_ids.return_value = [MagicMock(), MagicMock()]
        mock_vpc_stack.get_lambda_security_group_id.return_value = MagicMock()
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.arn = MagicMock()
        mock_log_instance.name = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        lambda_stack = LambdaStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_dynamodb_stack, mock_s3_stack, mock_sqs_stack,
            mock_kms_stack, mock_vpc_stack
        )
        
        self.assertEqual(mock_function.call_count, 2)
        self.assertEqual(mock_log_group.call_count, 2)


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api_gateway.aws.apigateway.ApiKey')
    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlan')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.apigateway.MethodResponse')
    @patch('infrastructure.api_gateway.aws.apigateway.IntegrationResponse')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.RequestValidator')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_with_lambda_integration(self, mock_api, mock_permission, mock_resource,
                                                mock_validator, mock_method, mock_integration,
                                                mock_int_response, mock_method_response,
                                                mock_deployment, mock_stage, mock_usage_plan,
                                                mock_api_key, mock_usage_plan_key, mock_caller_id):
        """Test API Gateway created with Lambda integration."""
        from infrastructure.api_gateway import APIGatewayStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = MagicMock()
        mock_method_instance.id = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.invoke_url = MagicMock()
        mock_stage_instance.stage_name = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        mock_api.assert_called_once()
        self.assertGreater(mock_method.call_count, 0)


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_alarms_created(self, mock_log_group, mock_topic, mock_alarm):
        """Test CloudWatch alarms are created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_dynamodb_stack = MagicMock()
        mock_dynamodb_stack.get_table_name.return_value = MagicMock()
        
        mock_log_instance = MagicMock(spec=pulumi.Resource)
        mock_log_instance.name = MagicMock()
        mock_log_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_instance
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(
            config, mock_provider_manager, mock_lambda_stack, mock_dynamodb_stack
        )
        
        self.assertGreater(mock_alarm.call_count, 0)
        mock_topic.assert_called_once()


class TestCICDStack(unittest.TestCase):
    """Test CI/CD Stack resource creation."""

    @patch('infrastructure.cicd.aws.get_caller_identity')
    @patch('infrastructure.cicd.aws.codebuild.Project')
    def test_codebuild_project_created(self, mock_project, mock_caller_id):
        """Test CodeBuild project is created."""
        from infrastructure.cicd import CICDStack
        
        config = ServerlessConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = None
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codebuild_role.return_value = mock_role
        
        mock_s3_stack = MagicMock()
        mock_s3_stack.get_bucket_name.return_value = MagicMock()
        mock_s3_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_kms_stack = MagicMock()
        mock_kms_stack.get_key_arn.return_value = MagicMock()
        
        mock_project_instance = MagicMock(spec=pulumi.Resource)
        mock_project_instance.name = MagicMock()
        mock_project_instance.arn = MagicMock()
        mock_project.return_value = mock_project_instance
        
        cicd_stack = CICDStack(
            config, mock_provider_manager, mock_iam_stack,
            mock_s3_stack, mock_kms_stack
        )
        
        mock_project.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack component resource."""

    @patch('lib.tap_stack.pulumi.export')
    @patch('lib.tap_stack.CICDStack')
    @patch('lib.tap_stack.MonitoringStack')
    @patch('lib.tap_stack.APIGatewayStack')
    @patch('lib.tap_stack.LambdaStack')
    @patch('lib.tap_stack.IAMStack')
    @patch('lib.tap_stack.VPCStack')
    @patch('lib.tap_stack.SQSStack')
    @patch('lib.tap_stack.S3Stack')
    @patch('lib.tap_stack.DynamoDBStack')
    @patch('lib.tap_stack.KMSStack')
    @patch('lib.tap_stack.AWSProviderManager')
    @patch('lib.tap_stack.ServerlessConfig')
    def test_tap_stack_initialization_and_exports(
        self, mock_config, mock_provider, mock_kms, mock_dynamodb,
        mock_s3, mock_sqs, mock_vpc, mock_iam, mock_lambda, mock_api,
        mock_monitoring, mock_cicd, mock_export
    ):
        """Test TapStack initializes all components and exports outputs."""
        from lib.tap_stack import TapStack, TapStackArgs
        
        mock_config_instance = MagicMock()
        mock_config_instance.get_resource_name.return_value = 'test-resource'
        mock_config_instance.get_common_tags.return_value = {}
        mock_config.return_value = mock_config_instance
        
        mock_kms.return_value.get_key_arn.return_value = MagicMock()
        mock_kms.return_value.get_key_id.return_value = MagicMock()
        mock_dynamodb.return_value.get_table_name.return_value = MagicMock()
        mock_s3.return_value.get_bucket_name.return_value = MagicMock()
        mock_sqs.return_value.get_queue_url.return_value = MagicMock()
        mock_vpc.return_value.get_vpc_id.return_value = MagicMock()
        mock_vpc.return_value.get_dynamodb_endpoint_id.return_value = MagicMock()
        mock_lambda.return_value.get_function_name.return_value = MagicMock()
        mock_lambda.return_value.get_function_arn.return_value = MagicMock()
        mock_lambda.return_value.get_log_group_name.return_value = MagicMock()
        mock_api.return_value.get_api_url.return_value = MagicMock()
        mock_api.return_value.get_api_id.return_value = MagicMock()
        mock_api.return_value.get_stage_name.return_value = MagicMock()
        mock_monitoring.return_value.get_sns_topic_arn.return_value = MagicMock()
        mock_cicd.return_value.get_codebuild_project_name.return_value = MagicMock()
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
            
            self.assertEqual(stack.environment_suffix, 'test')
            mock_config.assert_called_once()
            mock_provider.assert_called_once()
            mock_kms.assert_called_once()
            mock_dynamodb.assert_called_once()
            mock_s3.assert_called_once()
            mock_sqs.assert_called_once()
            mock_vpc.assert_called_once()
            mock_iam.assert_called_once()
            mock_lambda.assert_called_once()
            mock_api.assert_called_once()
            mock_monitoring.assert_called_once()
            mock_cicd.assert_called_once()


if __name__ == '__main__':
    unittest.main()
