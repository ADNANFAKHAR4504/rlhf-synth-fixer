"""Compute module for Lambda functions."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionVpcConfig, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_region import DataAwsRegion
import json


class ComputeModule(Construct):
    """Compute infrastructure module."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
        vpc_id: str,
        private_subnet_ids: list,
        security_group_id: str,
        kms_key_arn: str,
        data_bucket_arn: str,
        lambda_role_arn: str,
    ):
        """Initialize compute module."""
        super().__init__(scope, construct_id)

        region = DataAwsRegion(self, "region")

        # Create CloudWatch Log Group for Lambda
        log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/data-processor-{environment_suffix}",
            retention_in_days=90,
            kms_key_id=kms_key_arn,
            tags={
                "Name": f"lambda-logs-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create Lambda function
        self.lambda_function = LambdaFunction(
            self,
            "data_processor",
            function_name=f"data-processor-{environment_suffix}",
            role=lambda_role_arn,
            handler="index.handler",
            runtime="python3.11",
            filename="lambda_function.zip",  # Placeholder
            source_code_hash="placeholder",
            timeout=300,
            memory_size=512,
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=private_subnet_ids,
                security_group_ids=[security_group_id],
            ),
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT": environment_suffix,
                    "DATA_BUCKET": data_bucket_arn,
                    "AWS_REGION": aws_region,
                }
            ),
            tags={
                "Name": f"data-processor-{environment_suffix}",
                "Environment": environment_suffix,
            },
            depends_on=[log_group],
        )

        self.lambda_function_arn = self.lambda_function.arn
