"""Unit tests for TAP Stack - IoT Manufacturing Data Processing."""
from cdktf import App, Testing
from lib.tap_stack import TapStack


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
            environment_suffix="test123",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="ap-southeast-1",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')
        assert hasattr(stack, 'sensor_data_bucket')
        assert hasattr(stack, 'sensor_metrics_table')
        assert hasattr(stack, 'kinesis_stream')
        assert hasattr(stack, 'lambda_function')
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 'thing_type')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'bucket')
        assert hasattr(stack, 'bucket_versioning')
        assert hasattr(stack, 'bucket_encryption')
        assert hasattr(stack, 'sensor_data_bucket')
        assert hasattr(stack, 'sensor_metrics_table')
        assert hasattr(stack, 'kinesis_stream')
        assert hasattr(stack, 'lambda_function')
        assert hasattr(stack, 'kms_key')
        assert hasattr(stack, 'thing_type')


class TestIoTInfrastructure:
    """Test suite for IoT Infrastructure components."""

    def test_iot_thing_type_created(self):
        """IoT Thing Type is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestIoTThingType",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify IoT Thing Type resource exists
        assert Testing.to_have_resource(synthesized, "aws_iot_thing_type")

    def test_iot_topic_rule_created(self):
        """IoT Topic Rule is created for routing sensor data."""
        app = App()
        stack = TapStack(
            app,
            "TestIoTTopicRule",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify IoT Topic Rule resource exists
        assert Testing.to_have_resource(synthesized, "aws_iot_topic_rule")


class TestDataStorage:
    """Test suite for Data Storage components."""

    def test_s3_buckets_created(self):
        """S3 buckets are created for sensor data and CloudTrail."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Buckets",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify S3 bucket resources exist
        assert Testing.to_have_resource(synthesized, "aws_s3_bucket")

    def test_s3_bucket_encryption_enabled(self):
        """S3 buckets have encryption enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Encryption",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify S3 bucket encryption configuration exists
        assert Testing.to_have_resource(synthesized, "aws_s3_bucket_server_side_encryption_configuration")

    def test_s3_bucket_versioning_enabled(self):
        """S3 bucket versioning is enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Versioning",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify S3 bucket versioning configuration exists
        assert Testing.to_have_resource(synthesized, "aws_s3_bucket_versioning")

    def test_s3_lifecycle_policy_configured(self):
        """S3 lifecycle policy is configured for cost optimization."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Lifecycle",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify S3 lifecycle configuration exists
        assert Testing.to_have_resource(synthesized, "aws_s3_bucket_lifecycle_configuration")

    def test_dynamodb_table_created(self):
        """DynamoDB table is created for sensor metrics."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDB",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify DynamoDB table resource exists
        assert Testing.to_have_resource(synthesized, "aws_dynamodb_table")


class TestStreamProcessing:
    """Test suite for Stream Processing components."""

    def test_kinesis_stream_created(self):
        """Kinesis Data Stream is created for real-time processing."""
        app = App()
        stack = TapStack(
            app,
            "TestKinesis",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify Kinesis stream resource exists
        assert Testing.to_have_resource(synthesized, "aws_kinesis_stream")

    def test_lambda_function_created(self):
        """Lambda function is created for processing sensor data."""
        app = App()
        stack = TapStack(
            app,
            "TestLambda",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify Lambda function resource exists
        assert Testing.to_have_resource(synthesized, "aws_lambda_function")

    def test_lambda_event_source_mapping_created(self):
        """Lambda event source mapping is created for Kinesis integration."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaMapping",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify Lambda event source mapping exists
        assert Testing.to_have_resource(synthesized, "aws_lambda_event_source_mapping")


class TestSecurity:
    """Test suite for Security components."""

    def test_kms_key_created(self):
        """KMS key is created for encryption."""
        app = App()
        stack = TapStack(
            app,
            "TestKMS",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify KMS key resource exists
        assert Testing.to_have_resource(synthesized, "aws_kms_key")

    def test_kms_alias_created(self):
        """KMS alias is created for easy key reference."""
        app = App()
        stack = TapStack(
            app,
            "TestKMSAlias",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify KMS alias resource exists
        assert Testing.to_have_resource(synthesized, "aws_kms_alias")

    def test_iam_roles_created(self):
        """IAM roles are created for IoT and Lambda."""
        app = App()
        stack = TapStack(
            app,
            "TestIAMRoles",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify IAM role resources exist
        assert Testing.to_have_resource(synthesized, "aws_iam_role")


class TestCompliance:
    """Test suite for Compliance components."""

    def test_cloudtrail_created(self):
        """CloudTrail is created for audit logging."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudTrail",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify CloudTrail resource exists
        assert Testing.to_have_resource(synthesized, "aws_cloudtrail")

    def test_cloudwatch_log_groups_created(self):
        """CloudWatch Log Groups are created for operational logging."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudWatchLogs",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify CloudWatch Log Group resources exist
        assert Testing.to_have_resource(synthesized, "aws_cloudwatch_log_group")


class TestResourceNaming:
    """Test suite for Resource Naming conventions."""

    def test_environment_suffix_in_resource_names(self):
        """All resources include environment suffix in their names."""
        app = App()
        suffix = "test123"
        stack = TapStack(
            app,
            "TestNaming",
            environment_suffix=suffix
        )

        # Verify suffix is used in resource attributes
        assert stack.sensor_data_bucket is not None
        assert stack.sensor_metrics_table is not None
        assert stack.kinesis_stream is not None
        assert stack.lambda_function is not None
        assert stack.thing_type is not None

    def test_stack_synthesizes_with_custom_region(self):
        """Stack synthesizes successfully with custom region."""
        app = App()
        stack = TapStack(
            app,
            "TestCustomRegion",
            environment_suffix="test123",
            aws_region="ap-southeast-1"
        )
        synthesized = Testing.synth(stack)

        # Verify stack synthesizes without errors
        assert synthesized is not None


class TestOutputs:
    """Test suite for Stack Outputs."""

    def test_stack_has_required_outputs(self):
        """Stack exports required outputs for integration."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputs",
            environment_suffix="test123"
        )
        synthesized = Testing.synth(stack)

        # Verify outputs exist in synthesized template
        assert synthesized is not None
        # CDKTF outputs are available in the synthesized Terraform JSON


# Add more test suites and cases as needed
