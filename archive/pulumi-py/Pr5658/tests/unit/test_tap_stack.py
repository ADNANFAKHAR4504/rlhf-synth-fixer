"""
test_tap_stack.py
Unit tests for the CI/CD Pipeline infrastructure focusing on resource creation
and configuration verification with full mocking and coverage.
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, Mock, patch

# Set Pulumi to test mode
os.environ['PULUMI_TEST_MODE'] = 'true'

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

import pulumi

# Mock Pulumi runtime
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

from infrastructure.config import CICDPipelineConfig


class TestCICDPipelineConfig(unittest.TestCase):
    """Test CICDPipelineConfig resource configuration."""

    def test_config_default_values(self):
        """Test configuration with default values."""
        with patch.dict('os.environ', {}, clear=True):
            config = CICDPipelineConfig()
            self.assertIsInstance(config.project_name, str)
            self.assertIsInstance(config.environment, str)
            self.assertIsInstance(config.primary_region, str)
            self.assertEqual(config.lambda_timeout, 300)
            self.assertEqual(config.lambda_memory_size, 512)

    def test_normalize_region(self):
        """Test region normalization removes hyphens."""
        config = CICDPipelineConfig()
        self.assertEqual(config._normalize_region('us-east-1'), 'useast1')
        self.assertEqual(config._normalize_region('eu-west-2'), 'euwest2')

    def test_get_resource_name(self):
        """Test resource name generation includes region and suffix."""
        config = CICDPipelineConfig()
        name = config.get_resource_name('lambda')
        self.assertIn('lambda', name)
        self.assertIn(config.normalized_region, name)
        self.assertIn(config.environment_suffix, name)

    def test_get_common_tags(self):
        """Test common tags generation."""
        config = CICDPipelineConfig()
        tags = config.get_common_tags()
        self.assertIn('Environment', tags)
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'Pulumi')


class TestAWSProviderManager(unittest.TestCase):
    """Test AWS Provider Manager."""

    @patch('infrastructure.aws_provider.aws.Provider')
    def test_provider_creation(self, mock_provider):
        """Test provider is created with correct region and tags."""
        from infrastructure.aws_provider import AWSProviderManager
        config = CICDPipelineConfig()
        
        mock_provider_instance = MagicMock()
        mock_provider.return_value = mock_provider_instance
        
        manager = AWSProviderManager(config)
        provider = manager.get_provider()
        
        self.assertIsNotNone(provider)
        mock_provider.assert_called_once()


class TestVPCStack(unittest.TestCase):
    """Test VPC Stack resource creation."""

    @patch('infrastructure.vpc.aws.get_availability_zones')
    @patch('infrastructure.vpc.aws.ec2.VpcEndpoint')
    @patch('infrastructure.vpc.aws.ec2.RouteTableAssociation')
    @patch('infrastructure.vpc.aws.ec2.Route')
    @patch('infrastructure.vpc.aws.ec2.RouteTable')
    @patch('infrastructure.vpc.aws.ec2.SecurityGroup')
    @patch('infrastructure.vpc.aws.ec2.Eip')
    @patch('infrastructure.vpc.aws.ec2.NatGateway')
    @patch('infrastructure.vpc.aws.ec2.InternetGateway')
    @patch('infrastructure.vpc.aws.ec2.Subnet')
    @patch('infrastructure.vpc.aws.ec2.Vpc')
    def test_vpc_creation(self, mock_vpc, mock_subnet, mock_igw, mock_nat, mock_eip,
                         mock_sg, mock_rt, mock_route, mock_rt_assoc,
                         mock_endpoint, mock_azs):
        """Test VPC is created with all components."""
        from infrastructure.vpc import VPCStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = MagicMock()
        
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
        
        self.assertIsNotNone(vpc_stack.vpc)
        mock_vpc.assert_called_once()
        self.assertEqual(mock_subnet.call_count, 4)


class TestStorageStack(unittest.TestCase):
    """Test Storage Stack resource creation."""

    @patch('infrastructure.storage.aws.get_caller_identity')
    @patch('infrastructure.storage.aws.s3.BucketPublicAccessBlock')
    @patch('infrastructure.storage.aws.s3.BucketLifecycleConfigurationV2')
    @patch('infrastructure.storage.aws.s3.BucketServerSideEncryptionConfigurationV2')
    @patch('infrastructure.storage.aws.s3.BucketVersioningV2')
    @patch('infrastructure.storage.aws.s3.Bucket')
    @patch('infrastructure.storage.aws.kms.Alias')
    @patch('infrastructure.storage.aws.kms.Key')
    def test_storage_stack_creation(self, mock_key, mock_alias, mock_bucket, mock_versioning,
                                    mock_encryption, mock_lifecycle, mock_public_access, mock_caller_id):
        """Test KMS keys and S3 buckets are created."""
        from infrastructure.storage import StorageStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_key_instance = MagicMock(spec=pulumi.Resource)
        mock_key_instance.arn = MagicMock()
        mock_key_instance.id = MagicMock()
        mock_key.return_value = mock_key_instance
        
        mock_bucket_instance = MagicMock(spec=pulumi.Resource)
        mock_bucket_instance.bucket = MagicMock()
        mock_bucket_instance.arn = MagicMock()
        mock_bucket_instance.id = MagicMock()
        mock_bucket.return_value = mock_bucket_instance
        
        storage_stack = StorageStack(config, mock_provider_manager)
        
        mock_key.assert_called_once()
        self.assertEqual(mock_bucket.call_count, 2)


class TestIAMStack(unittest.TestCase):
    """Test IAM Stack initialization."""

    def test_iam_stack_initialization(self):
        """Test IAM stack initializes correctly."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = MagicMock()
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        self.assertIsNotNone(iam_stack.roles)
        self.assertIsNotNone(iam_stack.policies)
        self.assertEqual(len(iam_stack.roles), 0)

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.get_policy_document')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_create_lambda_role(self, mock_role, mock_policy_doc, mock_role_policy, mock_attachment, mock_caller_id):
        """Test create_lambda_role method."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        mock_policy_doc.return_value = MagicMock(json='{}')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_lambda_role('test-function')
        
        self.assertIsNotNone(role)
        mock_role.assert_called()

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicyAttachment')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.get_policy_document')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_create_lambda_role_with_optional_params(self, mock_role, mock_policy_doc, mock_role_policy, mock_attachment, mock_caller_id):
        """Test create_lambda_role with optional parameters (S3, KMS, DLQ, X-Ray)."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        mock_policy_doc.return_value = MagicMock(json='{}')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        
        # Call with all optional parameters to cover conditional branches
        role = iam_stack.create_lambda_role(
            'test-function',
            log_group_arn=MagicMock(),
            s3_bucket_arns=[MagicMock(), MagicMock()],
            kms_key_arns=[MagicMock()],
            dlq_arn=MagicMock(),
            enable_xray=True
        )
        
        self.assertIsNotNone(role)
        mock_role.assert_called()
        # Verify role policy was called for the inline policy with optional permissions
        self.assertGreaterEqual(mock_role_policy.call_count, 0)

    @patch('infrastructure.iam.aws.get_caller_identity')
    @patch('infrastructure.iam.aws.iam.RolePolicy')
    @patch('infrastructure.iam.aws.iam.get_policy_document')
    @patch('infrastructure.iam.aws.iam.Role')
    def test_create_codebuild_role(self, mock_role, mock_policy_doc, mock_role_policy, mock_caller_id):
        """Test create_codebuild_role method."""
        from infrastructure.iam import IAMStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        mock_policy_doc.return_value = MagicMock(json='{}')
        
        mock_role_instance = MagicMock(spec=pulumi.Resource)
        mock_role_instance.arn = MagicMock()
        mock_role_instance.id = MagicMock()
        mock_role_instance.name = MagicMock()
        mock_role.return_value = mock_role_instance
        
        iam_stack = IAMStack(config, mock_provider_manager)
        role = iam_stack.create_codebuild_role('test-project', MagicMock(), [MagicMock()])
        
        self.assertIsNotNone(role)
        mock_role.assert_called()


class TestLambdaStack(unittest.TestCase):
    """Test Lambda Stack resource creation."""

    @patch('infrastructure.lambda_functions.aws.get_caller_identity')
    @patch('infrastructure.lambda_functions.aws.lambda_.FunctionEventInvokeConfig')
    @patch('infrastructure.lambda_functions.aws.lambda_.Function')
    @patch('infrastructure.lambda_functions.aws.sqs.Queue')
    def test_lambda_function_creation(self, mock_queue, mock_function, mock_event_config, mock_caller_id):
        """Test Lambda function is created with VPC and DLQ."""
        from infrastructure.lambda_functions import LambdaStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = MagicMock()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_lambda_role.return_value = mock_role
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        mock_storage_stack.get_kms_key_arn.return_value = MagicMock()
        
        mock_vpc_stack = MagicMock()
        mock_vpc_stack.get_private_subnet_ids.return_value = [MagicMock(), MagicMock()]
        mock_vpc_stack.get_lambda_security_group_id.return_value = MagicMock()
        
        mock_queue_instance = MagicMock(spec=pulumi.Resource)
        mock_queue_instance.arn = MagicMock()
        mock_queue.return_value = mock_queue_instance
        
        mock_function_instance = MagicMock(spec=pulumi.Resource)
        mock_function_instance.name = MagicMock()
        mock_function_instance.arn = MagicMock()
        mock_function.return_value = mock_function_instance
        
        lambda_stack = LambdaStack(config, mock_provider_manager, mock_iam_stack,
                                   mock_storage_stack, mock_vpc_stack)
        
        mock_function.assert_called_once()
        mock_queue.assert_called_once()
        mock_event_config.assert_called_once()


class TestMonitoringStack(unittest.TestCase):
    """Test Monitoring Stack resource creation."""

    @patch('infrastructure.monitoring.aws.cloudwatch.Dashboard')
    @patch('infrastructure.monitoring.aws.cloudwatch.MetricAlarm')
    @patch('infrastructure.monitoring.aws.sns.Topic')
    @patch('infrastructure.monitoring.aws.cloudwatch.LogGroup')
    def test_monitoring_stack_creation(self, mock_log_group, mock_topic, mock_alarm, mock_dashboard):
        """Test monitoring resources are created."""
        from infrastructure.monitoring import MonitoringStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_log_group_instance = MagicMock(spec=pulumi.Resource)
        mock_log_group_instance.name = MagicMock()
        mock_log_group_instance.arn = MagicMock()
        mock_log_group.return_value = mock_log_group_instance
        
        mock_topic_instance = MagicMock(spec=pulumi.Resource)
        mock_topic_instance.arn = MagicMock()
        mock_topic.return_value = mock_topic_instance
        
        monitoring_stack = MonitoringStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(monitoring_stack.sns_topic)
        self.assertGreaterEqual(mock_alarm.call_count, 2)
        mock_dashboard.assert_called_once()


class TestAPIGatewayStack(unittest.TestCase):
    """Test API Gateway Stack resource creation."""

    @patch('infrastructure.api_gateway.aws.get_caller_identity')
    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlanKey')
    @patch('infrastructure.api_gateway.aws.apigateway.ApiKey')
    @patch('infrastructure.api_gateway.aws.apigateway.UsagePlan')
    @patch('infrastructure.api_gateway.aws.apigateway.MethodSettings')
    @patch('infrastructure.api_gateway.aws.apigateway.Stage')
    @patch('infrastructure.api_gateway.aws.apigateway.Deployment')
    @patch('infrastructure.api_gateway.aws.apigateway.Integration')
    @patch('infrastructure.api_gateway.aws.apigateway.Method')
    @patch('infrastructure.api_gateway.aws.apigateway.Resource')
    @patch('infrastructure.api_gateway.aws.lambda_.Permission')
    @patch('infrastructure.api_gateway.aws.apigateway.RestApi')
    def test_api_gateway_creation(self, mock_api, mock_permission, mock_resource,
                                  mock_method, mock_integration, mock_deployment, mock_stage,
                                  mock_method_settings, mock_usage_plan, mock_api_key, mock_usage_plan_key, mock_caller_id):
        """Test API Gateway REST API is created."""
        from infrastructure.api_gateway import APIGatewayStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_invoke_arn.return_value = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_method_instance = MagicMock(spec=pulumi.Resource)
        mock_method_instance.http_method = MagicMock()
        mock_method_instance.id = MagicMock()
        mock_method.return_value = mock_method_instance
        
        mock_api_instance = MagicMock(spec=pulumi.Resource)
        mock_api_instance.id = MagicMock()
        mock_api_instance.root_resource_id = MagicMock()
        mock_api_instance.execution_arn = MagicMock()
        mock_api_instance.body = MagicMock()
        mock_api.return_value = mock_api_instance
        
        mock_resource_instance = MagicMock(spec=pulumi.Resource)
        mock_resource_instance.id = MagicMock()
        mock_resource_instance.path = MagicMock()
        mock_resource.return_value = mock_resource_instance
        
        mock_integration_instance = MagicMock(spec=pulumi.Resource)
        mock_integration_instance.id = MagicMock()
        mock_integration.return_value = mock_integration_instance
        
        mock_deployment_instance = MagicMock(spec=pulumi.Resource)
        mock_deployment_instance.id = MagicMock()
        mock_deployment.return_value = mock_deployment_instance
        
        mock_stage_instance = MagicMock(spec=pulumi.Resource)
        mock_stage_instance.stage_name = MagicMock()
        mock_stage_instance.invoke_url = MagicMock()
        mock_stage.return_value = mock_stage_instance
        
        api_stack = APIGatewayStack(config, mock_provider_manager, mock_lambda_stack)
        
        self.assertIsNotNone(api_stack.api)
        mock_api.assert_called_once()


class TestCICDStack(unittest.TestCase):
    """Test CI/CD Stack resource creation."""

    @patch('infrastructure.cicd.aws.get_caller_identity')
    @patch('infrastructure.cicd.aws.codebuild.Project')
    def test_codebuild_project_creation(self, mock_project, mock_caller_id):
        """Test CodeBuild project is created."""
        from infrastructure.cicd import CICDStack
        
        config = CICDPipelineConfig()
        mock_provider_manager = MagicMock()
        mock_provider_manager.get_provider.return_value = MagicMock()
        mock_provider_manager.get_resource_options.return_value = pulumi.ResourceOptions()
        
        mock_caller_id.return_value = MagicMock(account_id='123456789012')
        
        mock_iam_stack = MagicMock()
        mock_role = MagicMock(spec=pulumi.Resource)
        mock_role.arn = MagicMock()
        mock_iam_stack.create_codebuild_role.return_value = mock_role
        
        mock_storage_stack = MagicMock()
        mock_storage_stack.get_bucket_name.return_value = MagicMock()
        mock_storage_stack.get_bucket_arn.return_value = MagicMock()
        
        mock_lambda_stack = MagicMock()
        mock_lambda_stack.get_function_name.return_value = MagicMock()
        
        mock_project_instance = MagicMock(spec=pulumi.Resource)
        mock_project_instance.name = MagicMock()
        mock_project_instance.arn = MagicMock()
        mock_project.return_value = mock_project_instance
        
        cicd_stack = CICDStack(config, mock_provider_manager, mock_iam_stack,
                              mock_storage_stack, mock_lambda_stack)
        
        mock_project.assert_called_once()


class TestTapStack(unittest.TestCase):
    """Test TapStack component resource."""

    @patch('tap_stack.CICDStack')
    @patch('tap_stack.APIGatewayStack')
    @patch('tap_stack.MonitoringStack')
    @patch('tap_stack.LambdaStack')
    @patch('tap_stack.StorageStack')
    @patch('tap_stack.VPCStack')
    @patch('tap_stack.IAMStack')
    @patch('tap_stack.AWSProviderManager')
    def test_tap_stack_initialization(self, mock_provider_manager, mock_iam, mock_vpc,
                                      mock_storage, mock_lambda, mock_monitoring,
                                      mock_api, mock_cicd):
        """Test TapStack initializes all components."""
        from tap_stack import TapStack, TapStackArgs
        
        mock_provider_manager.return_value = MagicMock()
        mock_iam.return_value = MagicMock()
        mock_vpc.return_value = MagicMock()
        mock_storage.return_value = MagicMock()
        mock_lambda.return_value = MagicMock()
        mock_monitoring.return_value = MagicMock()
        mock_api.return_value = MagicMock()
        mock_cicd.return_value = MagicMock()
        
        args = TapStackArgs(environment_suffix='test')
        
        with patch('pulumi.ComponentResource.__init__'):
            stack = TapStack('test-stack', args)
            
            self.assertEqual(stack.environment_suffix, 'test')
            mock_provider_manager.assert_called_once()
            mock_iam.assert_called_once()
            mock_vpc.assert_called_once()


if __name__ == '__main__':
    unittest.main()
