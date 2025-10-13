"""Unit tests for TAP Stack."""
import os
import sys
import json
from unittest.mock import Mock, patch, MagicMock

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# pylint: disable=wrong-import-position
from cdktf import App, Testing
from lib.tap_stack import TapStack
from lib.content_moderation_stack import ContentModerationStack
# pylint: enable=wrong-import-position


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None
        
        # Check for AWS Provider configuration in synthesized output
        synth_dict = json.loads(synthesized)
        assert "provider" in synth_dict
        assert "aws" in synth_dict["provider"]

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_tap_stack_creates_content_moderation_resources(self):
        """TapStack creates content moderation resources."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackModeration",
            environment_suffix="test",
            aws_region="us-west-1",
        )

        synthesized = Testing.synth(stack)
        assert synthesized is not None

        # Convert synthesized to dict
        synth_dict = json.loads(synthesized)

        # Check for S3 bucket resources
        assert "aws_s3_bucket" in synth_dict.get("resource", {})

        # Check for DynamoDB table
        assert "aws_dynamodb_table" in synth_dict.get("resource", {})

        # Check for Lambda functions
        assert "aws_lambda_function" in synth_dict.get("resource", {})

        # Check for Step Functions
        assert "aws_sfn_state_machine" in synth_dict.get("resource", {})

        # Check for SQS queues
        assert "aws_sqs_queue" in synth_dict.get("resource", {})

        # Check for SNS topic
        assert "aws_sns_topic" in synth_dict.get("resource", {})

    def test_s3_backend_configuration(self):
        """Test S3 backend configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestBackend",
            environment_suffix="test",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)

        # Check for terraform backend configuration
        assert "terraform" in synth_dict
        assert "backend" in synth_dict["terraform"]
        assert "s3" in synth_dict["terraform"]["backend"]

        s3_backend = synth_dict["terraform"]["backend"]["s3"]
        assert s3_backend["bucket"] == "test-state-bucket"
        assert s3_backend["region"] == "us-east-1"
        assert s3_backend["encrypt"] is True
        assert "test" in s3_backend["key"]

    def test_aws_provider_with_tags(self):
        """Test AWS provider configuration with default tags."""
        app = App()
        default_tags = {
            "tags": {
                "Environment": "test",
                "Repository": "test-repo",
                "Author": "test-author",
            }
        }

        stack = TapStack(
            app,
            "TestProviderTags",
            environment_suffix="test",
            aws_region="us-west-1",
            default_tags=default_tags,
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)

        # Check for AWS provider configuration
        assert "provider" in synth_dict
        assert "aws" in synth_dict["provider"]

        aws_provider = synth_dict["provider"]["aws"][0]
        assert aws_provider["region"] == "us-west-1"
        assert "default_tags" in aws_provider


class TestContentModerationStack:
    """Test suite for Content Moderation Stack."""

    def test_content_moderation_stack_creates_all_resources(self):
        """Content Moderation Stack creates all required resources."""
        app = App()
        stack = TapStack(
            app,
            "TestContentModeration",
            environment_suffix="test",
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)
        resources = synth_dict.get("resource", {})

        # Check S3 resources
        assert "aws_s3_bucket" in resources
        assert "aws_s3_bucket_versioning" in resources
        assert "aws_s3_bucket_server_side_encryption_configuration" in resources
        assert "aws_s3_bucket_public_access_block" in resources
        assert "aws_s3_bucket_lifecycle_configuration" in resources

        # Check DynamoDB table with proper configuration
        dynamo_tables = resources.get("aws_dynamodb_table", {})
        assert len(dynamo_tables) > 0
        for table_name, table_config in dynamo_tables.items():
            assert "billing_mode" in table_config
            assert table_config["billing_mode"] == "PAY_PER_REQUEST"
            assert "hash_key" in table_config
            assert table_config["hash_key"] == "contentId"
            assert "range_key" in table_config
            assert table_config["range_key"] == "timestamp"
            assert "global_secondary_index" in table_config
            assert "server_side_encryption" in table_config
            assert table_config["server_side_encryption"]["enabled"] is True

        # Check SQS queues
        sqs_queues = resources.get("aws_sqs_queue", {})
        assert len(sqs_queues) >= 2  # DLQ and Human Review Queue

        # Check for DLQ configuration
        has_dlq = False
        has_review_queue = False
        for queue_name, queue_config in sqs_queues.items():
            if "dlq" in queue_name:
                has_dlq = True
                assert queue_config["message_retention_seconds"] == 1209600  # 14 days
            if "human-review" in queue_name:
                has_review_queue = True
                assert "redrive_policy" in queue_config

        assert has_dlq is True
        assert has_review_queue is True

        # Check SNS topic
        sns_topics = resources.get("aws_sns_topic", {})
        assert len(sns_topics) > 0
        for topic_name, topic_config in sns_topics.items():
            assert "kms_master_key_id" in topic_config

        # Check Lambda functions
        lambda_functions = resources.get("aws_lambda_function", {})
        assert len(lambda_functions) == 3  # image, text, result processor

        for func_name, func_config in lambda_functions.items():
            assert func_config["runtime"] == "python3.10"
            assert "environment" in func_config
            # Environment can be either a list with dicts or a dict directly
            env_data = func_config["environment"]
            if isinstance(env_data, list):
                assert "variables" in env_data[0]
                env_vars = env_data[0]["variables"]
            else:
                assert "variables" in env_data
                env_vars = env_data["variables"]

            if "image" in func_name:
                assert func_config["memory_size"] == 512
                assert func_config["timeout"] == 60
                assert "CONFIDENCE_THRESHOLD" in env_vars

            elif "text" in func_name:
                assert func_config["memory_size"] == 256
                assert func_config["timeout"] == 60
                assert "TOXICITY_THRESHOLD" in env_vars

            elif "result" in func_name:
                assert func_config["timeout"] == 30

        # Check Step Functions state machine
        sfn_machines = resources.get("aws_sfn_state_machine", {})
        assert len(sfn_machines) > 0
        for machine_name, machine_config in sfn_machines.items():
            assert "definition" in machine_config
            definition = json.loads(machine_config["definition"])
            assert "States" in definition
            assert "DetermineContentType" in definition["States"]
            assert "ProcessImage" in definition["States"]
            assert "ProcessText" in definition["States"]
            assert "CheckModerationResult" in definition["States"]
            assert "SendToHumanReview" in definition["States"]
            assert "StoreResult" in definition["States"]

        # Check IAM roles
        iam_roles = resources.get("aws_iam_role", {})
        assert len(iam_roles) >= 2  # Lambda role and Step Functions role

        # Check IAM policies
        iam_policies = resources.get("aws_iam_role_policy", {})
        assert len(iam_policies) >= 2

        # Check CloudWatch resources
        assert "aws_cloudwatch_dashboard" in resources
        assert "aws_cloudwatch_metric_alarm" in resources

        # Check CloudWatch alarms
        alarms = resources.get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 3  # Lambda errors, queue depth, step function failures

    def test_environment_suffix_applied_to_resources(self):
        """Test that environment suffix is applied to all resource names."""
        app = App()
        env_suffix = "test123"
        stack = TapStack(
            app,
            "TestEnvSuffix",
            environment_suffix=env_suffix,
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)
        resources = synth_dict.get("resource", {})

        # Check S3 bucket naming
        s3_buckets = resources.get("aws_s3_bucket", {})
        for bucket_name, bucket_config in s3_buckets.items():
            assert env_suffix in bucket_config["bucket"]

        # Check DynamoDB table naming
        dynamo_tables = resources.get("aws_dynamodb_table", {})
        for table_name, table_config in dynamo_tables.items():
            assert env_suffix in table_config["name"]

        # Check Lambda function naming
        lambda_functions = resources.get("aws_lambda_function", {})
        for func_name, func_config in lambda_functions.items():
            assert env_suffix in func_config["function_name"]

        # Check SQS queue naming
        sqs_queues = resources.get("aws_sqs_queue", {})
        for queue_name, queue_config in sqs_queues.items():
            assert env_suffix in queue_config["name"]

    def test_lambda_environment_variables(self):
        """Test that Lambda functions have correct environment variables."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaEnv",
            environment_suffix="test",
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)
        lambda_functions = synth_dict.get("resource", {}).get("aws_lambda_function", {})

        for func_name, func_config in lambda_functions.items():
            # Environment can be either a list with dicts or a dict directly
            env_data = func_config["environment"]
            if isinstance(env_data, list):
                env_vars = env_data[0]["variables"]
            else:
                env_vars = env_data["variables"]

            # All Lambda functions should have these
            assert "MODERATION_TABLE" in env_vars

            if "image" in func_name:
                assert "HUMAN_REVIEW_QUEUE" in env_vars
                assert "NOTIFICATION_TOPIC" in env_vars
                assert "CONFIDENCE_THRESHOLD" in env_vars
                assert env_vars["CONFIDENCE_THRESHOLD"] == "75"

            elif "text" in func_name:
                assert "HUMAN_REVIEW_QUEUE" in env_vars
                assert "NOTIFICATION_TOPIC" in env_vars
                assert "TOXICITY_THRESHOLD" in env_vars
                assert env_vars["TOXICITY_THRESHOLD"] == "0.7"

            elif "result" in func_name:
                assert "CONTENT_BUCKET" in env_vars

    def test_region_configuration(self):
        """Test that resources are configured for the correct region."""
        test_region = "us-west-2"
        app = App()
        stack = TapStack(
            app,
            "TestRegion",
            environment_suffix="test",
            aws_region=test_region
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)

        # Check provider region
        aws_provider = synth_dict["provider"]["aws"][0]
        assert aws_provider["region"] == test_region

        # Check S3 bucket region in naming
        s3_buckets = synth_dict.get("resource", {}).get("aws_s3_bucket", {})
        for bucket_name, bucket_config in s3_buckets.items():
            assert test_region in bucket_config["bucket"]

    def test_security_configurations(self):
        """Test that security best practices are followed."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurity",
            environment_suffix="test",
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)
        resources = synth_dict.get("resource", {})

        # Check S3 bucket encryption
        s3_encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
        assert len(s3_encryption) > 0
        for enc_name, enc_config in s3_encryption.items():
            assert enc_config["rule"][0]["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"

        # Check S3 public access block
        s3_pab = resources.get("aws_s3_bucket_public_access_block", {})
        assert len(s3_pab) > 0
        for pab_name, pab_config in s3_pab.items():
            assert pab_config["block_public_acls"] is True
            assert pab_config["block_public_policy"] is True
            assert pab_config["ignore_public_acls"] is True
            assert pab_config["restrict_public_buckets"] is True

        # Check DynamoDB encryption
        dynamo_tables = resources.get("aws_dynamodb_table", {})
        for table_name, table_config in dynamo_tables.items():
            assert table_config["server_side_encryption"]["enabled"] is True

        # Check SQS encryption
        sqs_queues = resources.get("aws_sqs_queue", {})
        for queue_name, queue_config in sqs_queues.items():
            assert queue_config["sqs_managed_sse_enabled"] is True

    def test_lifecycle_configuration(self):
        """Test S3 lifecycle configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestLifecycle",
            environment_suffix="test",
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)

        lifecycle_configs = synth_dict.get("resource", {}).get("aws_s3_bucket_lifecycle_configuration", {})
        assert len(lifecycle_configs) > 0

        for config_name, config in lifecycle_configs.items():
            rule = config["rule"][0]
            assert rule["id"] == "delete-processed-content"
            assert rule["status"] == "Enabled"
            assert rule["expiration"][0]["days"] == 30
            assert rule["filter"][0]["prefix"] == "processed/"

    def test_step_function_retry_logic(self):
        """Test Step Functions retry configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestRetry",
            environment_suffix="test",
            aws_region="us-west-1"
        )

        synthesized = Testing.synth(stack)
        synth_dict = json.loads(synthesized)

        sfn_machines = synth_dict.get("resource", {}).get("aws_sfn_state_machine", {})
        for machine_name, machine_config in sfn_machines.items():
            definition = json.loads(machine_config["definition"])

            # Check retry configuration for ProcessImage
            process_image = definition["States"]["ProcessImage"]
            assert "Retry" in process_image
            retry_config = process_image["Retry"][0]
            assert retry_config["MaxAttempts"] == 3
            assert retry_config["BackoffRate"] == 2
            assert retry_config["IntervalSeconds"] == 2

            # Check retry configuration for ProcessText
            process_text = definition["States"]["ProcessText"]
            assert "Retry" in process_text
            retry_config = process_text["Retry"][0]
            assert retry_config["MaxAttempts"] == 3
            assert retry_config["BackoffRate"] == 2
            assert retry_config["IntervalSeconds"] == 2
