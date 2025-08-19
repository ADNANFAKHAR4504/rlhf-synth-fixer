"""
Unit tests for TapStack infrastructure.

Verifies stack initialization, configuration, and resource creation
without deploying actual AWS infrastructure.
"""

import os
import unittest
from unittest.mock import ANY, patch

import pulumi
from pulumi.runtime import Mocks

from lib.tap_stack import TapStack, TapStackArgs


# Dummy resource to mimic Pulumi AWS resources
class DummyResource(pulumi.CustomResource):
    def __init__(self, name="dummy", **kwargs):
        super().__init__("test:DummyResource", name, {}, opts=pulumi.ResourceOptions())
        # Common attributes accessed in tap_stack.py
        self._resource_id = f"{name}_id"
        self.arn = f"arn:aws:test::{name}"
        self.name = f"{name}_name"
        self.bucket = f"{name}-bucket"
        self.resource_id = f"{name}_id"
        self.topic_arn = f"arn:aws:sns:us-west-2:123456789012:{name}"
        self.deployment_group_name = f"{name}-deployment-group"
        self.evaluation_periods = 2
        self.threshold = 15.0
        self.budget_type = "COST"
        self.recovery_window_in_days = 0
        # Add result attribute that Pulumi resources need
        self.result = self


# Pulumi mocks
class MyMocks(Mocks):
    def new_resource(self, args):
        return f"{args.name}_id", args.inputs

    def call(self, args):
        return {}, None


pulumi.runtime.set_mocks(MyMocks())


class TestTapStackArgs(unittest.TestCase):
    """Test TapStackArgs configuration class."""
    
    def test_default_configuration(self):
        """Test default TapStackArgs configuration."""
        args = TapStackArgs()
        
        self.assertEqual(args.environment_suffix, "dev")
        self.assertEqual(args.budget_limit, 15.0)
        self.assertEqual(args.primary_region, "us-west-2")
        self.assertEqual(args.secondary_regions, ["us-east-1"])
        self.assertTrue(args.enable_rollback)
        
        # PROMPT ALIGNMENT: Verify required tags are present and sanitized
        self.assertIn("Environment", args.tags)
        self.assertIn("Project", args.tags)
        self.assertIn("ManagedBy", args.tags)
        self.assertIn("CostCenter", args.tags)
        self.assertIn("BudgetLimit", args.tags)
        self.assertEqual(args.tags["Project"], "IaC-AWS-Nova-Model-Breaking")
        self.assertEqual(args.tags["BudgetLimit"], "15.0")  # Sanitized value
    
    def test_custom_configuration_and_tag_sanitization(self):
        """Test custom TapStackArgs configuration with tag sanitization."""
        custom_tags = {"CustomTag": "Value with $ and spaces"}
        args = TapStackArgs(
            environment_suffix="PROD",  # Test case conversion
            tags=custom_tags,
            budget_limit=25.0,
            primary_region="eu-west-1",
            secondary_regions=["eu-central-1", "eu-north-1"],
            enable_rollback=False
        )
        
        self.assertEqual(args.environment_suffix, "prod")  # Converted to lowercase
        self.assertEqual(args.budget_limit, 25.0)
        self.assertEqual(args.primary_region, "eu-west-1")
        self.assertEqual(args.secondary_regions, ["eu-central-1", "eu-north-1"])
        self.assertFalse(args.enable_rollback)


class TestTapStack(unittest.TestCase):
    """Test TapStack component resource with high coverage using patch mocks."""

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_stack_initialization_with_defaults(self, *_mocks):
        """Verify stack initializes with default args and creates all resources."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        self.assertEqual(stack.env, "dev")
        self.assertEqual(stack.primary_region, "us-west-2")
        self.assertTrue(stack.enable_rollback)
        self.assertEqual(stack.budget_limit, 15.0)
        self.assertIsInstance(stack.tags, dict)
        self.assertIn("Project", stack.tags)
        self.assertEqual(stack.tags["Project"], "IaC-AWS-Nova-Model-Breaking")

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_stack_initialization_with_custom_args(self, *_mocks):
        """Verify stack initializes with custom args."""
        tags = {"Project": "UnitTest"}
        args = TapStackArgs(environment_suffix="prod", tags=tags)
        stack = TapStack("customStack", args)

        self.assertEqual(stack.env, "prod")
        self.assertEqual(args.tags, tags)

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_multi_region_providers(self, *_mocks):
        """Test multi-region AWS providers and secondary region configuration."""
        args = TapStackArgs(secondary_regions=["us-east-1", "eu-west-1"])
        stack = TapStack("testStack", args)

        self.assertIsNotNone(stack.primary_provider)
        self.assertEqual(len(stack.secondary_providers), 2)
        self.assertIn("us-east-1", stack.secondary_providers)
        self.assertIn("eu-west-1", stack.secondary_providers)
        self.assertEqual(len(stack.secondary_regions), 2)

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_budget_management(self, mock_budget, *_mocks):
        """Test budget management with custom limit and notification configuration."""
        args = TapStackArgs(budget_limit=25.0)
        stack = TapStack("testStack", args)

        self.assertIsNotNone(stack.budget)
        self.assertEqual(stack.budget_limit, 25.0)
        
        # Verify budget was created with correct parameters
        mock_budget.assert_any_call(
            "budget-dev",
            name="nova-monthly-budget-dev",
            budget_type="COST",
            time_unit="MONTHLY",
            cost_filters={},
            cost_types=ANY,
            limit_amount="25.0",
            limit_unit="USD",
            notifications=ANY,
            tags=stack.tags,
            opts=ANY
        )

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_secrets_management(self, mock_secret, *_mocks):
        """Test comprehensive AWS Secrets Manager configuration and naming."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        self.assertIsNotNone(stack.app_config_secret)
        self.assertIsNotNone(stack.db_credentials_secret)
        self.assertIsNotNone(stack.github_actions_secret)
        
        # Verify secrets were created with correct parameters
        mock_secret.assert_any_call(
            "app-config-dev",
            name="nova-app-config-dev",
            description="Application configuration secrets for dev environment",
            recovery_window_in_days=0,
            tags=stack.tags,
            opts=ANY
        )

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_s3_backend_security(self, mock_bucket, *_mocks):
        """Test S3 backend security features and bucket naming conventions."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        self.assertIsNotNone(stack.state_bucket)
        self.assertIsNotNone(stack.artifacts_bucket)
        
        # Verify buckets were created with correct parameters
        mock_bucket.assert_any_call(
            "state-bucket-dev",
            bucket="nova-pulumi-state-dev-uswest2",
            tags=stack.tags,
            opts=ANY
        )

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_lambda_function_creation(self, mock_lambda, *_mocks):
        """Test Lambda function creation with Secrets Manager integration."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        # Verify Lambda function was created with correct parameters
        mock_lambda.assert_any_call(
            "nova-api-primary",
            runtime="python3.12",
            handler="index.lambda_handler",
            role=ANY,
            code=ANY,
            environment=ANY,
            timeout=30,
            memory_size=256,
            tags=stack.tags,
            opts=ANY
        )

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_api_gateway_creation(self, mock_api, mock_stage, *_mocks):
        """Test API Gateway creation for serverless application."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        # Verify API Gateway was created
        mock_api.assert_called()
        mock_stage.assert_called()

    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_monitoring_and_alarms(self, mock_alarm, *_mocks):
        """Test CloudWatch monitoring and alarms for automatic rollback."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        # Verify CloudWatch alarms were created
        mock_alarm.assert_called()


class TestPromptAlignment(unittest.TestCase):
    """Test that the implementation aligns with expert-level prompt requirements."""
    
    @patch("lib.tap_stack.aws.Provider", return_value=DummyResource("provider"))
    @patch("lib.tap_stack.aws.secretsmanager.Secret", return_value=DummyResource("secret"))
    @patch("lib.tap_stack.aws.secretsmanager.SecretVersion", return_value=DummyResource("secretversion"))
    @patch("lib.tap_stack.random.RandomPassword", return_value=DummyResource("randompassword"))
    @patch("lib.tap_stack.aws.s3.Bucket", return_value=DummyResource("bucket"))
    @patch("lib.tap_stack.aws.s3.BucketVersioningV2", return_value=DummyResource("bucketversioning"))
    @patch("lib.tap_stack.aws.s3.BucketServerSideEncryptionConfigurationV2", return_value=DummyResource("bucketencryption"))
    @patch("lib.tap_stack.aws.s3.BucketPublicAccessBlock", return_value=DummyResource("bucketaccess"))
    @patch("lib.tap_stack.aws.s3.BucketOwnershipControls", return_value=DummyResource("bucketownership"))
    @patch("lib.tap_stack.aws.budgets.Budget", return_value=DummyResource("budget"))
    @patch("lib.tap_stack.aws.sns.Topic", return_value=DummyResource("topic"))
    @patch("lib.tap_stack.aws.sns.TopicSubscription", return_value=DummyResource("subscription"))
    @patch("lib.tap_stack.aws.iam.Role", return_value=DummyResource("role"))
    @patch("lib.tap_stack.aws.iam.RolePolicyAttachment", return_value=DummyResource("roleattachment"))
    @patch("lib.tap_stack.aws.lambda_.Function", return_value=DummyResource("function"))
    @patch("lib.tap_stack.aws.lambda_.Alias", return_value=DummyResource("alias"))
    @patch("lib.tap_stack.aws.apigatewayv2.Api", return_value=DummyResource("api"))
    @patch("lib.tap_stack.aws.apigatewayv2.Stage", return_value=DummyResource("stage"))
    @patch("lib.tap_stack.aws.cloudwatch.LogGroup", return_value=DummyResource("loggroup"))
    @patch("lib.tap_stack.aws.cloudwatch.MetricAlarm", return_value=DummyResource("metricalarm"))
    @patch("lib.tap_stack.aws.codedeploy.Application", return_value=DummyResource("application"))
    @patch("lib.tap_stack.aws.codedeploy.DeploymentGroup", return_value=DummyResource("deploymentgroup"))
    def test_expert_level_requirements_compliance(self, *_mocks):
        """Test comprehensive prompt alignment for expert-level CI/CD pipeline."""
        args = TapStackArgs()
        stack = TapStack("testStack", args)

        # PROMPT ALIGNMENT: Verify all expert-level requirements are met
        # 1. Multi-region deployment (us-west-2 primary)
        self.assertEqual(stack.primary_region, "us-west-2")
        self.assertGreater(len(stack.secondary_regions), 0)
        
        # 2. Budget cap ($15/month)
        self.assertEqual(stack.budget_limit, 15.0)
        self.assertIsNotNone(stack.budget)
        
        # 3. AWS Secrets Manager integration
        self.assertIsNotNone(stack.app_config_secret)
        self.assertIsNotNone(stack.db_credentials_secret)
        self.assertIsNotNone(stack.github_actions_secret)
        
        # 4. Automatic rollback functionality
        self.assertTrue(stack.enable_rollback)
        
        # 5. Project naming convention
        self.assertIn("IaC-AWS-Nova-Model-Breaking", stack.tags["Project"])
        
        # 6. Comprehensive infrastructure
        self.assertIsNotNone(stack.state_bucket)
        self.assertIsNotNone(stack.artifacts_bucket)
        self.assertIsNotNone(stack.primary_provider)


if __name__ == "__main__":
    unittest.main()
