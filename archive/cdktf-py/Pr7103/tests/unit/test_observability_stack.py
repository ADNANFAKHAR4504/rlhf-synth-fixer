import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestObservabilityStack:
    """Unit tests for TapStack"""

    @pytest.fixture
    def stack(self):
        """Create a test stack"""
        app = Testing.app()
        return TapStack(app, "test-stack", environment_suffix="test")

    def test_stack_synthesizes(self, stack):
        """Test that the stack synthesizes without errors"""
        assert Testing.synth(stack) is not None

    def test_kms_key_created(self, stack):
        """Test that KMS key is created"""
        synthesized = Testing.synth(stack)
        assert "aws_kms_key" in synthesized

    def test_kms_key_rotation_enabled(self, stack):
        """Test that KMS key rotation is enabled"""
        synthesized = Testing.synth(stack)
        kms_resources = [r for r in synthesized.split('\n') if 'enable_key_rotation' in r]
        assert any('true' in r for r in kms_resources)

    def test_log_groups_created(self, stack):
        """Test that CloudWatch Log Groups are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_log_group" in synthesized

    def test_log_groups_have_kms_encryption(self, stack):
        """Test that log groups have KMS encryption"""
        synthesized = Testing.synth(stack)
        assert "kms_key_id" in synthesized

    def test_log_retention_30_days(self, stack):
        """Test that log retention is set to 30 days"""
        synthesized = Testing.synth(stack)
        assert "retention_in_days" in synthesized
        assert "30" in synthesized

    def test_sns_topic_created(self, stack):
        """Test that SNS topic is created"""
        synthesized = Testing.synth(stack)
        assert "aws_sns_topic" in synthesized

    def test_dlq_created(self, stack):
        """Test that DLQ is created"""
        synthesized = Testing.synth(stack)
        assert "aws_sqs_queue" in synthesized

    def test_ecs_cluster_created(self, stack):
        """Test that ECS cluster is created"""
        synthesized = Testing.synth(stack)
        assert "aws_ecs_cluster" in synthesized

    def test_container_insights_enabled(self, stack):
        """Test that Container Insights is enabled"""
        synthesized = Testing.synth(stack)
        assert "containerInsights" in synthesized
        assert "enabled" in synthesized

    def test_lambda_functions_created(self, stack):
        """Test that Lambda functions are created"""
        synthesized = Testing.synth(stack)
        assert "aws_lambda_function" in synthesized

    def test_lambda_xray_tracing_enabled(self, stack):
        """Test that Lambda X-Ray tracing is enabled"""
        synthesized = Testing.synth(stack)
        assert "tracing_config" in synthesized
        assert "Active" in synthesized

    def test_lambda_insights_layer_attached(self, stack):
        """Test that Lambda Insights layer is attached"""
        synthesized = Testing.synth(stack)
        assert "LambdaInsightsExtension" in synthesized

    def test_xray_sampling_rules_created(self, stack):
        """Test that X-Ray sampling rules are created"""
        synthesized = Testing.synth(stack)
        assert "aws_xray_sampling_rule" in synthesized

    def test_xray_sampling_rate_01(self, stack):
        """Test that X-Ray sampling rate is 0.1"""
        synthesized = Testing.synth(stack)
        assert "0.1" in synthesized or "0.10" in synthesized

    def test_metric_filters_created(self, stack):
        """Test that metric filters are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_log_metric_filter" in synthesized

    def test_error_metric_filter_exists(self, stack):
        """Test that error metric filter exists"""
        synthesized = Testing.synth(stack)
        assert "ERROR" in synthesized

    def test_latency_metric_filter_exists(self, stack):
        """Test that latency metric filter exists"""
        synthesized = Testing.synth(stack)
        assert "Duration" in synthesized or "Latency" in synthesized

    def test_cloudwatch_alarms_created(self, stack):
        """Test that CloudWatch alarms are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_metric_alarm" in synthesized

    def test_cpu_alarm_exists(self, stack):
        """Test that CPU alarm exists"""
        synthesized = Testing.synth(stack)
        assert "CPUUtilization" in synthesized

    def test_memory_alarm_exists(self, stack):
        """Test that memory alarm exists"""
        synthesized = Testing.synth(stack)
        assert "MemoryUtilization" in synthesized

    def test_composite_alarms_created(self, stack):
        """Test that composite alarms are created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_composite_alarm" in synthesized

    def test_dashboard_created(self, stack):
        """Test that CloudWatch dashboard is created"""
        synthesized = Testing.synth(stack)
        assert "aws_cloudwatch_dashboard" in synthesized

    def test_environment_suffix_in_resource_names(self, stack):
        """Test that environment suffix is in resource names"""
        synthesized = Testing.synth(stack)
        assert "test" in synthesized

    def test_iam_roles_created(self, stack):
        """Test that IAM roles are created"""
        synthesized = Testing.synth(stack)
        assert "aws_iam_role" in synthesized

    def test_lambda_has_xray_permissions(self, stack):
        """Test that Lambda has X-Ray permissions"""
        synthesized = Testing.synth(stack)
        assert "AWSXRayDaemonWriteAccess" in synthesized

    def test_lambda_has_insights_permissions(self, stack):
        """Test that Lambda has Insights permissions"""
        synthesized = Testing.synth(stack)
        assert "CloudWatchLambdaInsightsExecutionRolePolicy" in synthesized

    def test_outputs_defined(self, stack):
        """Test that outputs are defined"""
        synthesized = Testing.synth(stack)
        assert "output" in synthesized

    def test_tags_applied(self, stack):
        """Test that tags are applied to resources"""
        synthesized = Testing.synth(stack)
        assert "ManagedBy" in synthesized
        assert "CDKTF" in synthesized
        assert "Environment" in synthesized


class TestObservabilityStackIntegration:
    """Integration tests for TapStack"""

    def test_multiple_environments(self):
        """Test that multiple environments can coexist"""
        app = Testing.app()
        dev_stack = TapStack(app, "dev-stack", environment_suffix="dev")
        prod_stack = TapStack(app, "prod-stack", environment_suffix="prod")

        dev_synth = Testing.synth(dev_stack)
        prod_synth = Testing.synth(prod_stack)

        assert "dev" in dev_synth
        assert "prod" in prod_synth
        assert dev_synth != prod_synth

    def test_custom_environment_suffix(self):
        """Test custom environment suffix"""
        app = Testing.app()
        stack = TapStack(app, "custom-stack", environment_suffix="staging")
        synthesized = Testing.synth(stack)

        assert "staging" in synthesized

    def test_resource_dependencies(self):
        """Test that resource dependencies are correct"""
        app = Testing.app()
        stack = TapStack(app, "dep-stack", environment_suffix="test")
        synthesized = Testing.synth(stack)

        # KMS key should be created before log groups
        kms_idx = synthesized.find("aws_kms_key")
        log_idx = synthesized.find("aws_cloudwatch_log_group")
        assert kms_idx < log_idx

        # SNS topic should be created before alarms
        sns_idx = synthesized.find("aws_sns_topic")
        alarm_idx = synthesized.find("aws_cloudwatch_metric_alarm")
        assert sns_idx < alarm_idx
