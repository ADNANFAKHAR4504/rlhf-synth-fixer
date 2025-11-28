"""Unit tests for TAP Stack - Security Configuration as Code."""
import os
import sys
import json
from cdktf import App, Testing
from lib.tap_stack import TapStack

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "TestTapStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )
        self.synth = Testing.synth(self.stack)

    def test_tap_stack_instantiates_successfully(self):
        """TapStack instantiates successfully with required parameters."""
        assert self.stack is not None
        assert self.synth is not None

    def test_stack_has_required_providers(self):
        """Stack has required AWS providers (primary and secondary)."""
        # Check that stack has provider configuration
        provider_config = json.loads(self.synth)
        assert "provider" in provider_config
        assert "aws" in provider_config["provider"]
        # Should have 2 providers (primary and secondary)
        assert len(provider_config["provider"]["aws"]) >= 2

    def test_s3_buckets_created(self):
        """S3 buckets for Config snapshots are created in both regions."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_s3_bucket" in resources
        s3_buckets = resources["aws_s3_bucket"]
        # Should have 2 S3 buckets (primary and secondary)
        assert len(s3_buckets) >= 2
        # Verify encryption is configured
        assert any("primary" in bucket_id for bucket_id in s3_buckets.keys())
        assert any("secondary" in bucket_id for bucket_id in s3_buckets.keys())

    def test_s3_bucket_encryption_configured(self):
        """S3 buckets have server-side encryption configured."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_s3_bucket_server_side_encryption_configuration" in resources
        encryption_configs = resources["aws_s3_bucket_server_side_encryption_configuration"]
        # Should have 2 encryption configurations
        assert len(encryption_configs) >= 2

    def test_s3_bucket_versioning_enabled(self):
        """S3 buckets have versioning enabled."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_s3_bucket_versioning" in resources
        versioning_configs = resources["aws_s3_bucket_versioning"]
        # Should have 2 versioning configurations
        assert len(versioning_configs) >= 2

    def test_config_recorders_created(self):
        """Config recorders are created in both regions."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_config_configuration_recorder" in resources
        config_recorders = resources["aws_config_configuration_recorder"]
        # Should have 2 config recorders (primary and secondary)
        assert len(config_recorders) >= 2
        assert any("primary" in recorder_id for recorder_id in config_recorders.keys())
        assert any("secondary" in recorder_id for recorder_id in config_recorders.keys())

    def test_config_delivery_channels_created(self):
        """Config delivery channels are created in both regions."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_config_delivery_channel" in resources
        delivery_channels = resources["aws_config_delivery_channel"]
        # Should have 2 delivery channels (primary and secondary)
        assert len(delivery_channels) >= 2

    def test_lambda_functions_created(self):
        """Lambda functions for compliance checks are created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_lambda_function" in resources
        lambda_functions = resources["aws_lambda_function"]
        # Should have 3 Lambda functions (EC2 tags, RDS encryption, S3 policies)
        assert len(lambda_functions) >= 3
        # Verify Lambda function configurations
        for lambda_func in lambda_functions.values():
            assert lambda_func["runtime"] == "python3.11"
            assert "filename" in lambda_func
            # Accept both relative and absolute paths for Lambda ZIP files
            filename = lambda_func["filename"]
            assert "lib/lambda/" in filename or "lib\\lambda\\" in filename, \
                f"Expected Lambda filename to contain lib/lambda/, got: {filename}"
            assert filename.endswith(".zip")
            assert lambda_func["timeout"] == 60

    def test_lambda_iam_roles_created(self):
        """IAM roles for Lambda functions are created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_iam_role" in resources
        iam_roles = resources["aws_iam_role"]
        # Should have at least 3 IAM roles (2 for Config recorders + 1 for Lambda)
        assert len(iam_roles) >= 3
        # Verify Lambda role has proper trust policy
        lambda_role = next((role for role in iam_roles.values()
                           if "lambda" in json.dumps(role)), None)
        assert lambda_role is not None

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch log groups for Lambda functions are created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_cloudwatch_log_group" in resources
        log_groups = resources["aws_cloudwatch_log_group"]
        # Should have 3 log groups (one per Lambda function)
        assert len(log_groups) >= 3
        # Verify retention is set
        for log_group in log_groups.values():
            assert log_group["retention_in_days"] == 7

    def test_config_rules_created(self):
        """AWS Config rules are created for compliance checks."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_config_config_rule" in resources
        config_rules = resources["aws_config_config_rule"]
        # Should have 3 config rules (EC2 tags, RDS encryption, S3 policies)
        assert len(config_rules) >= 3
        # Verify config rules use custom Lambda
        for rule in config_rules.values():
            assert rule["source"]["owner"] == "CUSTOM_LAMBDA"

    def test_lambda_permissions_created(self):
        """Lambda permissions allow Config to invoke functions."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_lambda_permission" in resources
        lambda_permissions = resources["aws_lambda_permission"]
        # Should have 3 Lambda permissions (one per function)
        assert len(lambda_permissions) >= 3
        # Verify permissions allow Config
        for permission in lambda_permissions.values():
            assert permission["principal"] == "config.amazonaws.com"
            assert permission["action"] == "lambda:InvokeFunction"

    def test_sns_topics_created(self):
        """SNS topics for notifications are created in both regions."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_sns_topic" in resources
        sns_topics = resources["aws_sns_topic"]
        # Should have 2 SNS topics (primary and secondary)
        assert len(sns_topics) >= 2

    def test_sns_topic_policies_created(self):
        """SNS topic policies allow EventBridge to publish."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_sns_topic_policy" in resources
        sns_policies = resources["aws_sns_topic_policy"]
        # Should have 2 SNS policies (primary and secondary)
        assert len(sns_policies) >= 2
        # Verify policies allow EventBridge
        for policy in sns_policies.values():
            policy_doc = json.loads(policy["policy"])
            assert policy_doc["Statement"][0]["Principal"]["Service"] == "events.amazonaws.com"

    def test_eventbridge_rules_created(self):
        """EventBridge rules for compliance changes are created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_cloudwatch_event_rule" in resources
        event_rules = resources["aws_cloudwatch_event_rule"]
        # Should have 2 event rules (primary and secondary)
        assert len(event_rules) >= 2
        # Verify event pattern
        for rule in event_rules.values():
            event_pattern = json.loads(rule["event_pattern"])
            assert event_pattern["source"] == ["aws.config"]

    def test_eventbridge_targets_created(self):
        """EventBridge targets point to SNS topics."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_cloudwatch_event_target" in resources
        event_targets = resources["aws_cloudwatch_event_target"]
        # Should have 2 event targets (primary and secondary)
        assert len(event_targets) >= 2

    def test_ssm_documents_created(self):
        """SSM automation documents for remediation are created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_ssm_document" in resources
        ssm_documents = resources["aws_ssm_document"]
        # Should have 2 SSM documents (EC2 tags, RDS encryption)
        assert len(ssm_documents) >= 2
        # Verify document type
        for document in ssm_documents.values():
            assert document["document_type"] == "Automation"

    def test_config_aggregator_created(self):
        """Config aggregator is created in primary region."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_config_configuration_aggregator" in resources
        aggregators = resources["aws_config_configuration_aggregator"]
        # Should have 1 aggregator
        assert len(aggregators) >= 1
        # Verify aggregator configuration
        for aggregator in aggregators.values():
            assert aggregator["account_aggregation_source"]["all_regions"] is True

    def test_cloudwatch_dashboard_created(self):
        """CloudWatch dashboard for compliance monitoring is created."""
        resources = json.loads(self.synth)["resource"]
        assert "aws_cloudwatch_dashboard" in resources
        dashboards = resources["aws_cloudwatch_dashboard"]
        # Should have 1 dashboard
        assert len(dashboards) >= 1
        # Verify dashboard has widgets
        for dashboard in dashboards.values():
            dashboard_body = json.loads(dashboard["dashboard_body"])
            assert "widgets" in dashboard_body
            assert len(dashboard_body["widgets"]) >= 4

    def test_terraform_outputs_defined(self):
        """Terraform outputs are properly defined."""
        outputs = json.loads(self.synth)["output"]
        # Verify key outputs exist
        required_outputs = [
            "config_bucket_primary_name",
            "config_bucket_secondary_name",
            "config_recorder_primary_name",
            "config_recorder_secondary_name",
            "config_aggregator_name",
            "ec2_lambda_arn",
            "rds_lambda_arn",
            "s3_lambda_arn",
            "sns_topic_primary_arn",
            "sns_topic_secondary_arn",
            "dashboard_name",
        ]
        for output_name in required_outputs:
            assert output_name in outputs

    def test_stack_uses_default_values(self):
        """Stack uses default values when optional parameters not provided."""
        app = App()
        stack = TapStack(app, "TestDefaultStack")
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_resource_tagging(self):
        """Resources are properly tagged with default tags."""
        app = App()
        default_tags = {
            "tags": {
                "Environment": "test",
                "Team": "security"
            }
        }
        stack = TapStack(
            app,
            "TestTaggedStack",
            environment_suffix="test",
            default_tags=default_tags
        )
        assert stack is not None
        synth = Testing.synth(stack)
        provider_config = json.loads(synth)["provider"]
        # Verify default tags are set on provider
        assert "aws" in provider_config
        # Tags are configured in provider default_tags
        for provider in provider_config["aws"]:
            if isinstance(provider, dict) and "default_tags" in provider:
                assert provider["default_tags"] is not None


class TestResourceConfiguration:
    """Test suite for Resource Configuration."""

    def setup_method(self):
        """Setup test fixtures."""
        self.app = App()
        self.stack = TapStack(
            self.app,
            "ConfigTestStack",
            environment_suffix="config-test",
            aws_region="us-east-1",
        )
        self.synth = Testing.synth(self.stack)
        self.resources = json.loads(self.synth)["resource"]

    def test_s3_bucket_names_include_environment(self):
        """S3 bucket names include environment suffix."""
        s3_buckets = self.resources["aws_s3_bucket"]
        for bucket in s3_buckets.values():
            assert "test" in bucket["bucket"]

    def test_lambda_function_names_include_environment(self):
        """Lambda function names include environment suffix."""
        lambda_functions = self.resources["aws_lambda_function"]
        for func in lambda_functions.values():
            assert "test" in func["function_name"]

    def test_iam_role_names_include_environment(self):
        """IAM role names include environment suffix."""
        iam_roles = self.resources["aws_iam_role"]
        for role in iam_roles.values():
            if "name" in role:
                assert "test" in role["name"]

    def test_config_recorder_names_include_environment(self):
        """Config recorder names include environment suffix."""
        config_recorders = self.resources["aws_config_configuration_recorder"]
        for recorder in config_recorders.values():
            assert "test" in recorder["name"]

    def test_lambda_source_code_policy_references(self):
        """Lambda IAM roles reference proper policy ARNs."""
        iam_policy_attachments = self.resources.get("aws_iam_role_policy_attachment", {})
        # Should have policy attachments for Lambda basic execution role
        assert len(iam_policy_attachments) >= 1
        for attachment in iam_policy_attachments.values():
            if "lambda" in attachment["role"]:
                assert "AWSLambdaBasicExecutionRole" in attachment["policy_arn"]
