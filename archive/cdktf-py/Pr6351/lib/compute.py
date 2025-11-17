"""Compute module for Lambda functions."""

import os
import zipfile
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

        # Create Lambda deployment package from lib/lambda/data_processor.py
        lambda_zip_path = self._create_lambda_zip()

        # Create CloudWatch Log Group for Lambda
        # Note: CloudWatch Logs are encrypted by default with AWS-managed keys
        # Customer-managed KMS keys require additional permissions configuration
        log_group = CloudwatchLogGroup(
            self,
            "lambda_log_group",
            name=f"/aws/lambda/data-processor-{environment_suffix}",
            retention_in_days=90,
            tags={
                "Name": f"lambda-logs-{environment_suffix}",
                "Environment": environment_suffix,
            },
        )

        # Create Lambda function
        # Note: AWS_REGION is a reserved environment variable automatically provided by Lambda
        # Do not set reserved variables: AWS_REGION, AWS_DEFAULT_REGION, AWS_ACCOUNT_ID, etc.
        self.lambda_function = LambdaFunction(
            self,
            "data_processor",
            function_name=f"data-processor-{environment_suffix}",
            role=lambda_role_arn,
            handler="data_processor.handler",
            runtime="python3.11",
            filename=lambda_zip_path,
            source_code_hash=self._get_file_hash(lambda_zip_path),
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
                }
            ),
            tags={
                "Name": f"data-processor-{environment_suffix}",
                "Environment": environment_suffix,
            },
            depends_on=[log_group],
        )

        self.lambda_function_arn = self.lambda_function.arn

    def _create_lambda_zip(self):
        """Create Lambda deployment package from lib/lambda directory."""
        # Get the project root directory (where tap.py is located)
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        lambda_source = os.path.join(project_root, "lib", "lambda", "data_processor.py")
        zip_path = os.path.join(project_root, "lambda_function.zip")

        # Create zip file with Lambda code
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            if os.path.exists(lambda_source):
                # Add the Lambda function with the correct name for the handler
                zipf.write(lambda_source, "data_processor.py")
            else:
                # Create a minimal placeholder if source doesn't exist
                zipf.writestr("data_processor.py", """
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Placeholder Lambda'})
    }
""")

        return zip_path

    def _get_file_hash(self, file_path):
        """Calculate base64-encoded SHA256 hash of file for source_code_hash."""
        import hashlib
        import base64

        with open(file_path, 'rb') as f:
            file_hash = hashlib.sha256(f.read()).digest()
            return base64.b64encode(file_hash).decode('utf-8')
