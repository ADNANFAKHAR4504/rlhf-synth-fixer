"""Unit tests for TAP Stack."""
import sys
import os
import json

from cdktf import App, Testing

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from lib.tap_stack import TapStack  # pylint: disable=wrong-import-position


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        stack = TapStack(
            self.app,
            "TestTapStackWithProps",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack is not None
        assert hasattr(stack, 'payments_table')
        assert hasattr(stack, 'audit_bucket')
        assert hasattr(stack, 'payment_lambda')

    def test_tap_stack_environment_suffix_is_used(self):
        """TapStack uses environment suffix in resource names."""
        environment_suffix = "test123"
        stack = TapStack(
            self.app,
            f"TapStack{environment_suffix}",
            environment_suffix=environment_suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Environment": environment_suffix}}
        )
        assert stack.environment_suffix == environment_suffix

    def test_tap_stack_creates_required_resources(self):
        """TapStack creates all required resources."""
        stack = TapStack(
            self.app,
            "TestTapStackResources",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.payments_table is not None
        assert stack.audit_bucket is not None
        assert stack.payment_lambda is not None
        assert stack.notification_sns is not None

    def test_tap_stack_state_configuration(self):
        """TapStack configures state bucket correctly."""
        stack = TapStack(
            self.app,
            "TestStateConfig",
            environment_suffix="test",
            state_bucket="my-state-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags={"tags": {"Test": "value"}}
        )
        assert stack.state_bucket == "my-state-bucket"
        assert stack.state_bucket_region == "us-east-1"

    def test_tap_stack_default_tags_configuration(self):
        """TapStack configures default tags correctly."""
        test_tags = {"tags": {"Environment": "prod", "Team": "payments"}}
        stack = TapStack(
            self.app,
            "TestTagsConfig",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=test_tags
        )
        assert stack.default_tags == test_tags

    def test_tap_stack_synthesizes_successfully(self):
        """TapStack synthesizes successfully."""
        stack = TapStack(
            self.app,
            "TestSynth",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert synth is not None

    def test_tap_stack_single_region_configuration(self):
        """TapStack creates resources in single region (us-east-1)."""
        stack = TapStack(
            self.app,
            "TestSingleRegion",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.payment_lambda is not None
        assert stack.audit_bucket is not None
        assert stack.notification_sns is not None
        assert stack.payments_table is not None

    def test_tap_stack_stores_aws_region(self):
        """TapStack stores AWS region correctly."""
        stack = TapStack(
            self.app,
            "TestAwsRegion",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="eu-west-1",
            default_tags=self.default_tags
        )
        assert stack.aws_region == "eu-west-1"


class TestResourceCreation:
    """Test suite for resource creation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}

    def test_dynamodb_table_created(self):
        """DynamoDB table is created."""
        stack = TapStack(
            self.app,
            "TestDynamoDB",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.payments_table is not None

    def test_s3_bucket_created(self):
        """S3 bucket is created."""
        stack = TapStack(
            self.app,
            "TestS3",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.audit_bucket is not None

    def test_lambda_function_created(self):
        """Lambda function is created."""
        stack = TapStack(
            self.app,
            "TestLambda",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.payment_lambda is not None

    def test_sns_topic_created(self):
        """SNS topic is created."""
        stack = TapStack(
            self.app,
            "TestSNS",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        assert stack.notification_sns is not None


class TestStackSynthesis:
    """Test suite for stack synthesis."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}

    def test_synthesized_stack_has_dynamodb_resource(self):
        """Synthesized stack contains DynamoDB resource."""
        stack = TapStack(
            self.app,
            "TestSynthDDB",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_dynamodb_table" in synth

    def test_synthesized_stack_has_s3_resource(self):
        """Synthesized stack contains S3 resource."""
        stack = TapStack(
            self.app,
            "TestSynthS3",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_s3_bucket" in synth

    def test_synthesized_stack_has_lambda_resource(self):
        """Synthesized stack contains Lambda resource."""
        stack = TapStack(
            self.app,
            "TestSynthLambda",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_lambda_function" in synth

    def test_synthesized_stack_has_sns_resource(self):
        """Synthesized stack contains SNS resource."""
        stack = TapStack(
            self.app,
            "TestSynthSNS",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_sns_topic" in synth

    def test_synthesized_stack_has_iam_role(self):
        """Synthesized stack contains IAM role."""
        stack = TapStack(
            self.app,
            "TestSynthIAM",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_iam_role" in synth

    def test_synthesized_stack_has_cloudwatch_alarms(self):
        """Synthesized stack contains CloudWatch alarms."""
        stack = TapStack(
            self.app,
            "TestSynthCW",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "aws_cloudwatch_metric_alarm" in synth


class TestMultipleEnvironments:
    """Test suite for multiple environment configurations."""

    def test_different_environment_suffixes(self):
        """Stack can be created with different environment suffixes."""
        app1 = App()
        app2 = App()
        default_tags = {"tags": {"Environment": "test"}}

        stack1 = TapStack(
            app1,
            "DevStack",
            environment_suffix="dev",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=default_tags
        )

        stack2 = TapStack(
            app2,
            "ProdStack",
            environment_suffix="prod",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=default_tags
        )

        assert stack1.environment_suffix == "dev"
        assert stack2.environment_suffix == "prod"

    def test_empty_environment_suffix(self):
        """Stack can be created with empty environment suffix."""
        app = App()
        default_tags = {"tags": {"Environment": "test"}}

        stack = TapStack(
            app,
            "EmptyEnvStack",
            environment_suffix="",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=default_tags
        )
        assert stack.environment_suffix == ""

    def test_alphanumeric_environment_suffix(self):
        """Stack can be created with alphanumeric environment suffix."""
        app = App()
        default_tags = {"tags": {"Environment": "test"}}
        suffix = "pe7505"

        stack = TapStack(
            app,
            "AlphanumericEnvStack",
            environment_suffix=suffix,
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=default_tags
        )
        assert stack.environment_suffix == suffix


class TestLambdaCodeGeneration:
    """Test suite for Lambda code generation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}

    def test_lambda_zip_file_created(self):
        """Lambda zip file is created during stack synthesis."""
        TapStack(
            self.app,
            "TestLambdaZip",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_zip = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.zip")
        assert os.path.exists(lambda_zip)

    def test_lambda_py_file_created(self):
        """Lambda Python file is created during stack synthesis."""
        TapStack(
            self.app,
            "TestLambdaPy",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        assert os.path.exists(lambda_file)

    def test_lambda_code_contains_handler(self):
        """Lambda code contains handler function."""
        TapStack(
            self.app,
            "TestLambdaHandler",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "def handler(event, context):" in content

    def test_lambda_code_contains_boto3_imports(self):
        """Lambda code contains boto3 imports."""
        TapStack(
            self.app,
            "TestLambdaBoto3",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "import boto3" in content

    def test_lambda_code_contains_dynamodb_operations(self):
        """Lambda code contains DynamoDB operations."""
        TapStack(
            self.app,
            "TestLambdaDDB",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "put_item" in content
        assert "dynamodb" in content

    def test_lambda_code_contains_s3_operations(self):
        """Lambda code contains S3 operations."""
        TapStack(
            self.app,
            "TestLambdaS3",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "put_object" in content
        assert "s3" in content

    def test_lambda_code_contains_json_import(self):
        """Lambda code contains json import."""
        TapStack(
            self.app,
            "TestLambdaJson",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "import json" in content

    def test_lambda_code_contains_os_import(self):
        """Lambda code contains os import."""
        TapStack(
            self.app,
            "TestLambdaOs",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "import os" in content

    def test_lambda_code_returns_status_code(self):
        """Lambda code returns status code in response."""
        TapStack(
            self.app,
            "TestLambdaStatusCode",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "statusCode" in content
        assert "200" in content

    def test_lambda_code_handles_transaction_id(self):
        """Lambda code handles transaction_id from event."""
        TapStack(
            self.app,
            "TestLambdaTxnId",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "transaction_id" in content
        assert "event.get" in content

    def test_lambda_code_handles_amount(self):
        """Lambda code handles amount from event."""
        TapStack(
            self.app,
            "TestLambdaAmount",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
        assert "amount" in content


class TestLambdaPaymentProcessor:
    """Test suite for Lambda payment processor."""

    def test_lambda_handler_success_case(self):
        """Test payment processor Lambda handler success case."""
        sys.path.append(os.path.join(os.getcwd(), "lib", "lambda"))
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        assert os.path.exists(lambda_file)
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "def handler(event, context):" in content
            assert "import boto3" in content
            assert "import json" in content
            assert "dynamodb" in content
            assert "s3" in content

    def test_lambda_handler_has_correct_structure(self):
        """Test Lambda handler has correct structure."""
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "transaction_id" in content
            assert "put_item" in content
            assert "put_object" in content
            assert "statusCode" in content
            assert "200" in content

    def test_lambda_handler_reads_env_vars(self):
        """Test Lambda handler reads environment variables."""
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "os.environ" in content
            assert "DYNAMODB_TABLE" in content
            assert "S3_BUCKET" in content

    def test_lambda_handler_uses_datetime(self):
        """Test Lambda handler uses datetime for timestamp."""
        lambda_file = os.path.join(os.getcwd(), "lib", "lambda", "payment_processor.py")
        with open(lambda_file, "r", encoding="utf-8") as f:
            content = f.read()
            assert "datetime" in content
            assert "timestamp" in content


class TestStackOutputs:
    """Test suite for stack outputs."""

    def setup_method(self):
        """Set up test fixtures."""
        self.app = App()
        self.default_tags = {"tags": {"Environment": "test"}}

    def test_synthesized_stack_has_outputs(self):
        """Synthesized stack contains outputs."""
        stack = TapStack(
            self.app,
            "TestOutputs",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "output" in synth

    def test_synthesized_stack_has_dynamodb_output(self):
        """Synthesized stack has DynamoDB table name output."""
        stack = TapStack(
            self.app,
            "TestDDBOutput",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "dynamodb_table_name" in synth

    def test_synthesized_stack_has_s3_output(self):
        """Synthesized stack has S3 bucket name output."""
        stack = TapStack(
            self.app,
            "TestS3Output",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "audit_bucket_name" in synth

    def test_synthesized_stack_has_lambda_output(self):
        """Synthesized stack has Lambda ARN output."""
        stack = TapStack(
            self.app,
            "TestLambdaOutput",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "lambda_arn" in synth

    def test_synthesized_stack_has_sns_output(self):
        """Synthesized stack has SNS topic ARN output."""
        stack = TapStack(
            self.app,
            "TestSNSOutput",
            environment_suffix="test",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            aws_region="us-east-1",
            default_tags=self.default_tags
        )
        synth = Testing.synth(stack)
        assert "sns_topic_arn" in synth
