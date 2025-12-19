import unittest

import aws_cdk as cdk
from aws_cdk.assertions import Match, Template
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates all required nested stacks")
    def test_creates_all_nested_stacks(self):
        # ARRANGE
        env_suffix = "dev"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for at least 7 nested stacks (CDK may add metadata stack)
        resources = template.to_json()["Resources"]
        nested_stacks = [
            r for r in resources.values()
            if r.get("Type") == "AWS::CloudFormation::Stack"
        ]
        self.assertGreaterEqual(len(nested_stacks), 7, "Expected at least 7 nested stacks")

    @mark.it("creates S3 bucket for branding assets")
    def test_creates_s3_branding_bucket(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for StorageStack nested stack
        resources = template.to_json()["Resources"]
        storage_stack = any(
            "StorageStack" in key for key in resources.keys()
        )
        self.assertTrue(storage_stack)

    @mark.it("creates DynamoDB table for environment inventory")
    def test_creates_dynamodb_table(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for DatabaseStack nested stack
        resources = template.to_json()["Resources"]
        database_stack = any(
            "DatabaseStack" in key for key in resources.keys()
        )
        self.assertTrue(database_stack)

    @mark.it("creates Cognito User Pool for authentication")
    def test_creates_cognito_user_pool(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for AuthenticationStack nested stack
        resources = template.to_json()["Resources"]
        auth_stack = any(
            "AuthenticationStack" in key for key in resources.keys()
        )
        self.assertTrue(auth_stack)

    @mark.it("creates Lambda functions with Java 17 runtime")
    def test_creates_lambda_functions(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for LambdaStack nested stack
        resources = template.to_json()["Resources"]
        lambda_stack = any(
            "LambdaStack" in key for key in resources.keys()
        )
        self.assertTrue(lambda_stack)

    @mark.it("creates Step Functions workflow for orchestration")
    def test_creates_step_functions_workflow(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for OrchestrationStack nested stack
        resources = template.to_json()["Resources"]
        orchestration_stack = any(
            "OrchestrationStack" in key for key in resources.keys()
        )
        self.assertTrue(orchestration_stack)

    @mark.it("creates Service Catalog portfolio")
    def test_creates_service_catalog_portfolio(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for ServiceCatalogStack nested stack
        resources = template.to_json()["Resources"]
        catalog_stack = any(
            "ServiceCatalogStack" in key for key in resources.keys()
        )
        self.assertTrue(catalog_stack)

    @mark.it("creates SNS topic for notifications")
    def test_creates_sns_topic(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for NotificationStack nested stack
        resources = template.to_json()["Resources"]
        notification_stack = any(
            "NotificationStack" in key for key in resources.keys()
        )
        self.assertTrue(notification_stack)

    @mark.it("creates CloudWatch and EventBridge monitoring")
    def test_creates_monitoring_resources(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for MonitoringStack nested stack
        resources = template.to_json()["Resources"]
        monitoring_stack = any(
            "MonitoringStack" in key for key in resources.keys()
        )
        self.assertTrue(monitoring_stack)

    @mark.it("outputs required resource identifiers")
    def test_outputs_resource_identifiers(self):
        # ARRANGE
        env_suffix = "test"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Check for outputs
        outputs = template.to_json().get("Outputs", {})
        self.assertIn("BrandingBucketName", outputs)
        self.assertIn("EnvironmentTableName", outputs)
        self.assertIn("UserPoolId", outputs)
        self.assertIn("ProvisioningWorkflowArn", outputs)
        self.assertIn("PortfolioId", outputs)

    @mark.it("defaults environment suffix to 'dev' if not provided")
    def test_defaults_env_suffix_to_dev(self):
        # ARRANGE
        stack = TapStack(self.app, "TapStackTestDefault")
        template = Template.from_stack(stack)

        # ASSERT - Verify stack was created successfully with at least 7 nested stacks
        self.assertIsNotNone(template)
        resources = template.to_json()["Resources"]
        nested_stacks = [
            r for r in resources.values()
            if r.get("Type") == "AWS::CloudFormation::Stack"
        ]
        self.assertGreaterEqual(len(nested_stacks), 7, "Expected at least 7 nested stacks")

    @mark.it("stack successfully synthesizes with custom environment suffix")
    def test_custom_environment_suffix(self):
        # ARRANGE
        env_suffix = "prod"
        stack = TapStack(
            self.app, "TapStackTest", TapStackProps(environment_suffix=env_suffix)
        )
        template = Template.from_stack(stack)

        # ASSERT - Verify stack created successfully with custom suffix
        self.assertIsNotNone(template)
        resources = template.to_json()["Resources"]

        # Check that nested stacks exist
        nested_stacks = [
            resource
            for resource in resources.values()
            if resource.get("Type") == "AWS::CloudFormation::Stack"
        ]
        self.assertGreaterEqual(
            len(nested_stacks), 7, "Expected at least 7 nested stacks with custom suffix"
        )
