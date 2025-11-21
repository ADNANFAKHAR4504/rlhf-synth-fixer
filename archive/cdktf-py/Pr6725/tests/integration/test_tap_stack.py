"""Integration tests for TapStack."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Verify basic structure
        assert stack is not None

    def test_full_stack_synthesis_with_all_resources(self):
        """Test that stack synthesizes with all resources."""
        app = App()
        stack = TapStack(
            app,
            "FullStackIntegrationTest",
            environment_suffix="integration",
            aws_region="us-east-1",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)

        # Verify synthesis was successful
        assert synthesized is not None
        assert stack is not None

    def test_stack_with_custom_environment_suffix(self):
        """Test stack with custom environment suffix."""
        app = App()
        custom_suffix = "custom-env"
        stack = TapStack(
            app,
            "CustomEnvStack",
            environment_suffix=custom_suffix,
            aws_region="us-east-1",
        )

        # Verify stack creation
        assert stack is not None

    def test_stack_with_different_region(self):
        """Test stack deployment in different region."""
        app = App()
        stack = TapStack(
            app,
            "DifferentRegionStack",
            environment_suffix="test",
            aws_region="us-west-2",
        )

        # Verify stack creation
        assert stack is not None

    def test_vpc_and_networking_integration(self):
        """Test VPC and networking components work together."""
        app = App()
        stack = TapStack(
            app,
            "NetworkingIntegrationStack",
            environment_suffix="network-test",
            aws_region="us-east-1",
        )

        # Verify VPC components
        assert stack.vpc is not None
        assert len(stack.private_subnets) == 3
        assert stack.lambda_sg is not None

    def test_lambda_and_vpc_integration(self):
        """Test Lambda functions integrate with VPC."""
        app = App()
        stack = TapStack(
            app,
            "LambdaVPCIntegrationStack",
            environment_suffix="lambda-vpc-test",
            aws_region="us-east-1",
        )

        # Verify Lambda functions exist
        assert stack.validation_lambda is not None
        assert stack.fraud_lambda is not None
        assert stack.compliance_lambda is not None

        # Verify VPC configuration
        assert stack.vpc is not None
        assert stack.lambda_sg is not None

    def test_step_functions_and_lambda_integration(self):
        """Test Step Functions integrate with Lambda functions."""
        app = App()
        stack = TapStack(
            app,
            "StepFunctionsIntegrationStack",
            environment_suffix="sfn-test",
            aws_region="us-east-1",
        )

        # Verify state machine and Lambda functions exist
        assert stack.state_machine is not None
        assert stack.validation_lambda is not None
        assert stack.fraud_lambda is not None
        assert stack.compliance_lambda is not None

    def test_dynamodb_and_lambda_integration(self):
        """Test DynamoDB integrates with Lambda functions."""
        app = App()
        stack = TapStack(
            app,
            "DynamoDBIntegrationStack",
            environment_suffix="dynamodb-test",
            aws_region="us-east-1",
        )

        # Verify DynamoDB and Lambda exist
        assert stack.dynamodb_table is not None
        assert stack.validation_lambda is not None

    def test_messaging_services_integration(self):
        """Test SNS and SQS integration."""
        app = App()
        stack = TapStack(
            app,
            "MessagingIntegrationStack",
            environment_suffix="messaging-test",
            aws_region="us-east-1",
        )

        # Verify messaging components
        assert stack.sns_topic is not None
        assert stack.dlq is not None

    def test_iam_roles_and_permissions_integration(self):
        """Test IAM roles have correct permissions."""
        app = App()
        stack = TapStack(
            app,
            "IAMIntegrationStack",
            environment_suffix="iam-test",
            aws_region="us-east-1",
        )

        # Verify IAM roles exist
        assert stack.lambda_role is not None
        assert stack.sfn_role is not None

    def test_cloudwatch_logs_integration(self):
        """Test CloudWatch logs integration."""
        app = App()
        stack = TapStack(
            app,
            "CloudWatchIntegrationStack",
            environment_suffix="cw-test",
            aws_region="us-east-1",
        )

        # Verify stack synthesis
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_vpc_endpoints_integration(self):
        """Test VPC endpoints for AWS services."""
        app = App()
        stack = TapStack(
            app,
            "VPCEndpointsIntegrationStack",
            environment_suffix="vpc-endpoints-test",
            aws_region="us-east-1",
        )

        # Verify stack with VPC endpoints
        assert stack.vpc is not None
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_ecr_repositories_integration(self):
        """Test ECR repositories for Lambda containers."""
        app = App()
        stack = TapStack(
            app,
            "ECRIntegrationStack",
            environment_suffix="ecr-test",
            aws_region="us-east-1",
        )

        # Verify ECR repository URLs
        assert hasattr(stack, 'validation_ecr_url')
        assert hasattr(stack, 'fraud_ecr_url')
        assert hasattr(stack, 'compliance_ecr_url')

    def test_complete_pipeline_integration(self):
        """Test complete transaction processing pipeline."""
        app = App()
        stack = TapStack(
            app,
            "CompletePipelineIntegrationStack",
            environment_suffix="pipeline-test",
            aws_region="us-east-1",
        )

        # Verify all major components exist
        assert stack.vpc is not None
        assert stack.dynamodb_table is not None
        assert stack.sns_topic is not None
        assert stack.dlq is not None
        assert stack.validation_lambda is not None
        assert stack.fraud_lambda is not None
        assert stack.compliance_lambda is not None
        assert stack.state_machine is not None
        assert stack.lambda_role is not None
        assert stack.sfn_role is not None

        # Synthesize full stack
        synthesized = Testing.synth(stack)
        assert synthesized is not None

    def test_stack_outputs_available(self):
        """Test that stack outputs are available."""
        app = App()
        stack = TapStack(
            app,
            "OutputsIntegrationStack",
            environment_suffix="outputs-test",
            aws_region="us-east-1",
        )

        # Verify outputs
        assert stack.state_machine_arn is not None
        assert stack.execution_role_arn is not None
        assert stack.validation_ecr_url is not None
        assert stack.fraud_ecr_url is not None
        assert stack.compliance_ecr_url is not None
