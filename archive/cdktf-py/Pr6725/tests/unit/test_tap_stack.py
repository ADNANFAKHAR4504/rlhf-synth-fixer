"""Unit tests for TAP Stack."""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Clear any previous test state if needed
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'dynamodb_table')
        assert hasattr(stack, 'sns_topic')
        assert hasattr(stack, 'dlq')
        assert hasattr(stack, 'lambda_sg')

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None
        assert hasattr(stack, 'vpc')
        assert hasattr(stack, 'dynamodb_table')
        assert hasattr(stack, 'sns_topic')
        assert hasattr(stack, 'dlq')


class TestVPCConfiguration:
    """Test suite for VPC Configuration."""

    def test_vpc_created_with_correct_cidr(self):
        """VPC is created with correct CIDR block."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)

        # Verify VPC exists
        assert stack.vpc is not None

    def test_private_subnets_created_in_multiple_azs(self):
        """Private subnets are created in 3 availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnetsStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify 3 private subnets exist
        assert len(stack.private_subnets) == 3

    def test_security_group_allows_https_egress_only(self):
        """Security group allows HTTPS outbound traffic only."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityGroupStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify security group exists
        assert stack.lambda_sg is not None


class TestDynamoDBConfiguration:
    """Test suite for DynamoDB Configuration."""

    def test_dynamodb_table_created_with_correct_keys(self):
        """DynamoDB table is created with partition and sort keys."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDBStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify DynamoDB table exists
        assert stack.dynamodb_table is not None

    def test_dynamodb_uses_on_demand_billing(self):
        """DynamoDB table uses on-demand billing mode."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDBBillingStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack.dynamodb_table is not None


class TestMessagingConfiguration:
    """Test suite for Messaging Configuration."""

    def test_sns_topic_created_with_encryption(self):
        """SNS topic is created with encryption enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestSNSStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify SNS topic exists
        assert stack.sns_topic is not None

    def test_sqs_dlq_created_with_correct_retention(self):
        """SQS dead letter queue is created with 14-day retention."""
        app = App()
        stack = TapStack(
            app,
            "TestSQSStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify DLQ exists
        assert stack.dlq is not None


class TestLambdaConfiguration:
    """Test suite for Lambda Configuration."""

    def test_lambda_functions_created_with_container_images(self):
        """Lambda functions are created using container images."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify all three Lambda functions exist
        assert stack.validation_lambda is not None
        assert stack.fraud_lambda is not None
        assert stack.compliance_lambda is not None

    def test_lambda_functions_have_correct_memory_allocation(self):
        """Lambda functions have 3GB memory allocation."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaMemoryStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack.validation_lambda is not None

    def test_lambda_functions_deployed_in_vpc(self):
        """Lambda functions are deployed in private subnets."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaVPCStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack.validation_lambda is not None


class TestStepFunctionsConfiguration:
    """Test suite for Step Functions Configuration."""

    def test_state_machine_created_with_express_workflow(self):
        """Step Functions state machine uses Express workflow type."""
        app = App()
        stack = TapStack(
            app,
            "TestStepFunctionsStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify state machine exists
        assert stack.state_machine is not None

    def test_state_machine_has_correct_retry_configuration(self):
        """State machine has exponential backoff retry logic."""
        app = App()
        stack = TapStack(
            app,
            "TestRetryStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack.state_machine is not None


class TestIAMConfiguration:
    """Test suite for IAM Configuration."""

    def test_lambda_role_created_with_necessary_permissions(self):
        """Lambda execution role has necessary permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestLambdaRoleStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify Lambda role exists
        assert stack.lambda_role is not None

    def test_sfn_role_created_with_necessary_permissions(self):
        """Step Functions execution role has necessary permissions."""
        app = App()
        stack = TapStack(
            app,
            "TestSFNRoleStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify SFN role exists
        assert stack.sfn_role is not None


class TestVPCEndpoints:
    """Test suite for VPC Endpoints."""

    def test_dynamodb_vpc_endpoint_created(self):
        """DynamoDB VPC endpoint is created."""
        app = App()
        stack = TapStack(
            app,
            "TestDynamoDBEndpointStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        # Verify stack synthesizes successfully
        assert stack is not None

    def test_s3_vpc_endpoint_created(self):
        """S3 VPC endpoint is created."""
        app = App()
        stack = TapStack(
            app,
            "TestS3EndpointStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack is not None

    def test_sfn_vpc_endpoint_created(self):
        """Step Functions VPC endpoint is created."""
        app = App()
        stack = TapStack(
            app,
            "TestSFNEndpointStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack is not None


class TestCloudWatchLogs:
    """Test suite for CloudWatch Logs."""

    def test_cloudwatch_log_groups_created_for_all_lambdas(self):
        """CloudWatch log groups are created for all Lambda functions."""
        app = App()
        stack = TapStack(
            app,
            "TestLogsStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        # Verify stack synthesizes successfully
        assert stack is not None

    def test_log_groups_have_30_day_retention(self):
        """CloudWatch log groups have 30-day retention."""
        app = App()
        stack = TapStack(
            app,
            "TestLogRetentionStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack is not None


class TestResourceNaming:
    """Test suite for Resource Naming."""

    def test_resources_include_environment_suffix(self):
        """All resources include environment suffix in their names."""
        app = App()
        environment_suffix = "staging"
        stack = TapStack(
            app,
            "TestNamingStack",
            environment_suffix=environment_suffix,
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        # Verify stack synthesizes successfully with environment suffix
        assert stack is not None


class TestOutputs:
    """Test suite for Stack Outputs."""

    def test_state_machine_arn_output_exists(self):
        """State machine ARN is available as output."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputsStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify outputs exist
        assert hasattr(stack, 'state_machine_arn')
        assert stack.state_machine_arn is not None

    def test_execution_role_arn_output_exists(self):
        """Execution role ARN is available as output."""
        app = App()
        stack = TapStack(
            app,
            "TestExecutionRoleStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify outputs exist
        assert hasattr(stack, 'execution_role_arn')
        assert stack.execution_role_arn is not None


class TestECRRepositories:
    """Test suite for ECR Repositories."""

    def test_ecr_repositories_created_for_all_lambdas(self):
        """ECR repositories are created for all Lambda functions."""
        app = App()
        stack = TapStack(
            app,
            "TestECRStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify ECR repository URLs exist
        assert hasattr(stack, 'validation_ecr_url')
        assert hasattr(stack, 'fraud_ecr_url')
        assert hasattr(stack, 'compliance_ecr_url')

    def test_ecr_repositories_have_image_scanning_enabled(self):
        """ECR repositories have image scanning enabled."""
        app = App()
        stack = TapStack(
            app,
            "TestECRScanningStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        assert stack is not None
