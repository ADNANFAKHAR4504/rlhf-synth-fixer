"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider

from lib.compliance_validator import ComplianceValidator


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Initialize compliance validator
        self.compliance_validator = ComplianceValidator(
            self,
            "compliance-validator",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # Create stack outputs
        TerraformOutput(
            self,
            "reports_bucket_name",
            value=self.compliance_validator.reports_bucket.bucket,
            description="S3 bucket name for compliance reports"
        )

        TerraformOutput(
            self,
            "lambda_function_name",
            value=self.compliance_validator.validator_lambda.function_name,
            description="Lambda function name for compliance validation"
        )

        TerraformOutput(
            self,
            "lambda_function_arn",
            value=self.compliance_validator.validator_lambda.arn,
            description="Lambda function ARN"
        )

        TerraformOutput(
            self,
            "iam_role_name",
            value=self.compliance_validator.lambda_role.name,
            description="IAM role name for Lambda function"
        )

        TerraformOutput(
            self,
            "iam_role_arn",
            value=self.compliance_validator.lambda_role.arn,
            description="IAM role ARN"
        )
