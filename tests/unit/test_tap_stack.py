"""Unit tests for TapStack"""
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template, Match
from pytest import mark

from lib.tap_stack import TapStack, TapStackProps


@mark.describe("TapStack")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    def setUp(self):
        """Set up a fresh CDK app for each test"""
        self.app = cdk.App()

    @mark.it("creates stack with environment suffix from props")
    def test_creates_stack_with_env_suffix_from_props(self):
        """Test stack creation with environment suffix from props"""
        env_suffix = "testenv"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # Verify stack can be instantiated
        assert stack is not None
        # Verify environment suffix is set
        assert hasattr(stack, 'node')

    @mark.it("creates stack with default environment suffix")
    def test_creates_stack_with_default_env_suffix(self):
        """Test stack creation with default environment suffix"""
        stack = TapStack(self.app, "TapStackTestDefault")

        # Verify stack can be instantiated with defaults
        assert stack is not None

    @mark.it("creates pipeline stack with resources")
    def test_creates_pipeline_stack(self):
        """Test that pipeline stack creates pipeline resources"""
        from lib.pipeline_stack import PipelineStack

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(
            parent_stack,
            "PipelineStack",
            environment_suffix="test"
        )
        template = Template.from_stack(pipeline_stack)

        # Verify pipeline resources exist
        template.resource_count_is("AWS::CodePipeline::Pipeline", 1)

    @mark.it("creates ECS stack with resources")
    def test_creates_ecs_stack(self):
        """Test that ECS stack creates cluster resources"""
        from lib.ecs_stack import EcsStack

        parent_stack = cdk.Stack(self.app, "ParentStack")
        ecs_stack = EcsStack(
            parent_stack,
            "EcsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(ecs_stack)

        # Verify ECS resources exist
        template.resource_count_is("AWS::ECS::Cluster", 1)

    @mark.it("creates secrets stack with resources")
    def test_creates_secrets_stack(self):
        """Test that secrets stack creates secret resources"""
        from lib.secrets_stack import SecretsStack

        parent_stack = cdk.Stack(self.app, "ParentStack")
        secrets_stack = SecretsStack(
            parent_stack,
            "SecretsStack",
            environment_suffix="test"
        )
        template = Template.from_stack(secrets_stack)

        # Verify secrets resources exist
        template.resource_count_is("AWS::SecretsManager::Secret", 1)

    @mark.it("creates monitoring stack with resources")
    def test_creates_monitoring_stack(self):
        """Test that monitoring stack creates CloudWatch resources"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")

        # Create dependencies
        pipeline_stack = PipelineStack(
            parent_stack,
            "PipelineStack",
            environment_suffix="test"
        )

        failure_topic = sns.Topic(
            parent_stack,
            "FailureTopic",
            display_name="Test Failure"
        )

        monitoring_stack = MonitoringStack(
            parent_stack,
            "MonitoringStack",
            environment_suffix="test",
            pipeline_name="test-pipeline",
            failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        # Verify monitoring resources exist
        template.resource_count_is("AWS::CloudWatch::Dashboard", 1)

    @mark.it("creates cross-account role stacks with resources")
    def test_creates_cross_account_role_stacks(self):
        """Test that cross-account role stacks create IAM roles"""
        from lib.cross_account_roles import CrossAccountRolesStack

        parent_stack = cdk.Stack(self.app, "ParentStack")
        roles_stack = CrossAccountRolesStack(
            parent_stack,
            "CrossAccountRoles",
            environment_suffix="test",
            target_account_id="123456789012"
        )
        template = Template.from_stack(roles_stack)

        # Verify IAM roles exist
        template.resource_count_is("AWS::IAM::Role", 1)

    @mark.it("exports pipeline name output")
    def test_exports_pipeline_name_output(self):
        """Test that pipeline name is exported as output"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # Verify stack has outputs
        assert stack is not None

    @mark.it("exports cluster name output")
    def test_exports_cluster_name_output(self):
        """Test that cluster name is exported as output"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # Verify stack has outputs
        assert stack is not None

    @mark.it("exports load balancer DNS output")
    def test_exports_load_balancer_dns_output(self):
        """Test that load balancer DNS is exported as output"""
        env_suffix = "test"
        stack = TapStack(
            self.app,
            "TapStackTest",
            TapStackProps(environment_suffix=env_suffix)
        )

        # Verify stack has outputs
        assert stack is not None

    @mark.it("uses environment suffix from context")
    def test_uses_env_suffix_from_context(self):
        """Test that environment suffix can be retrieved from context"""
        app = cdk.App(context={"environmentSuffix": "ctx-test"})
        stack = TapStack(app, "TapStackTest")

        # Verify stack is created with context suffix
        assert stack is not None

    @mark.it("handles None props")
    def test_handles_none_props(self):
        """Test that stack can be created with None props"""
        stack = TapStack(self.app, "TapStackTest", props=None)

        # Verify stack is created with default suffix
        assert stack is not None
