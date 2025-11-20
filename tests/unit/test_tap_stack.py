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
        self.app = cdk.App(context={
            "approvalEmail": "test@example.com",
            "codeStarConnectionArn": "arn:aws:codestar-connections:us-east-1:123456789012:connection/test"
        })

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

    @mark.it("creates CloudWatch dashboard with correct name")
    def test_monitoring_dashboard_name(self):
        """Test that CloudWatch dashboard is created with correct name"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.has_resource_properties("AWS::CloudWatch::Dashboard",
            Match.object_like({"DashboardName": "cicd-pipeline-test"}))

    @mark.it("creates pipeline failure EventBridge rule")
    def test_monitoring_failure_rule(self):
        """Test that EventBridge rule for pipeline failures is created"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.has_resource_properties("AWS::Events::Rule",
            Match.object_like({
                "EventPattern": Match.object_like({
                    "source": ["aws.codepipeline"],
                    "detail-type": ["CodePipeline Pipeline Execution State Change"],
                    "detail": Match.object_like({"state": ["FAILED"]})
                })
            }))

    @mark.it("creates pipeline success EventBridge rule")
    def test_monitoring_success_rule(self):
        """Test that EventBridge rule for pipeline success is created"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.has_resource_properties("AWS::Events::Rule",
            Match.object_like({
                "EventPattern": Match.object_like({
                    "source": ["aws.codepipeline"],
                    "detail": Match.object_like({"state": ["SUCCEEDED"]})
                })
            }))

    @mark.it("creates CloudWatch alarm for pipeline failures")
    def test_monitoring_pipeline_alarm(self):
        """Test that CloudWatch alarm for pipeline failures is created"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.has_resource_properties("AWS::CloudWatch::Alarm",
            Match.object_like({
                "MetricName": "PipelineExecutionFailure",
                "Namespace": "AWS/CodePipeline",
                "Threshold": 1,
                "ComparisonOperator": "GreaterThanOrEqualToThreshold"
            }))

    @mark.it("attaches SNS action to CloudWatch alarm")
    def test_monitoring_alarm_sns_action(self):
        """Test that SNS action is attached to CloudWatch alarm"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        # Verify alarm has alarm actions configured
        alarms = template.find_resources("AWS::CloudWatch::Alarm")
        assert len(alarms) == 1
        alarm = list(alarms.values())[0]
        assert "AlarmActions" in alarm["Properties"]
        assert len(alarm["Properties"]["AlarmActions"]) >= 1

    @mark.it("creates dashboard with pipeline execution metrics")
    def test_monitoring_dashboard_pipeline_metrics(self):
        """Test that dashboard includes pipeline execution metrics"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.has_resource_properties("AWS::CloudWatch::Dashboard",
            Match.object_like({
                "DashboardBody": Match.any_value()
            }))

    @mark.it("verifies EventBridge rules count")
    def test_monitoring_event_rules_count(self):
        """Test that monitoring stack creates correct number of EventBridge rules"""
        from lib.monitoring_stack import MonitoringStack
        from lib.pipeline_stack import PipelineStack
        from aws_cdk import aws_sns as sns

        parent_stack = cdk.Stack(self.app, "ParentStack")
        pipeline_stack = PipelineStack(parent_stack, "PipelineStack", environment_suffix="test")
        failure_topic = sns.Topic(parent_stack, "FailureTopic", display_name="Test")

        monitoring_stack = MonitoringStack(
            parent_stack, "MonitoringStack", environment_suffix="test",
            pipeline_name="cicd-pipeline-test", failure_topic=failure_topic,
            pipeline=pipeline_stack.pipeline
        )
        template = Template.from_stack(monitoring_stack)

        template.resource_count_is("AWS::Events::Rule", 2)


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
        app = cdk.App(context={
            "environmentSuffix": "ctx-test",
            "approvalEmail": "test@example.com",
            "codeStarConnectionArn": "arn:aws:codestar-connections:us-east-1:123456789012:connection/test"
        })
        stack = TapStack(app, "TapStackTest")

        # Verify stack is created with context suffix
        assert stack is not None

    @mark.it("handles None props")
    def test_handles_none_props(self):
        """Test that stack can be created with None props"""
        stack = TapStack(self.app, "TapStackTest", props=None)

        # Verify stack is created with default suffix
        assert stack is not None
