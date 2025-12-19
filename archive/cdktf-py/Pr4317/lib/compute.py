"""Compute infrastructure including Lambda functions."""

from constructs import Construct
from cdktf_cdktf_provider_aws.lambda_function import (
    LambdaFunction,
    LambdaFunctionEnvironment,
    LambdaFunctionVpcConfig,
)
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import (
    DataAwsIamPolicyDocument,
    DataAwsIamPolicyDocumentStatement,
)
from cdktf import AssetType, TerraformAsset
import json
import os


class ComputeConstruct(Construct):
    """Construct for Lambda compute infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        security_group_id: str,
        data_bucket_name: str,
        dynamodb_table_name: str,
        kms_key_arn: str,
    ):
        """Initialize compute infrastructure."""
        super().__init__(scope, construct_id)

        # Create Lambda execution role
        lambda_role = IamRole(
            self,
            "lambda_execution_role",
            name=f"healthcare-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"Service": "lambda.amazonaws.com"},
                            "Action": "sts:AssumeRole",
                        }
                    ],
                }
            ),
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_basic_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda_vpc_execution",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        )

        # Custom policy for S3, DynamoDB, and KMS access
        IamRolePolicy(
            self,
            "lambda_custom_policy",
            name=f"healthcare-lambda-policy-{environment_suffix}",
            role=lambda_role.id,
            policy=json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                            ],
                            "Resource": f"arn:aws:s3:::{data_bucket_name}/*",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "dynamodb:PutItem",
                                "dynamodb:GetItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                            ],
                            "Resource": f"arn:aws:dynamodb:*:*:table/{dynamodb_table_name}",
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey",
                            ],
                            "Resource": kms_key_arn,
                        },
                        {
                            "Effect": "Allow",
                            "Action": ["cloudwatch:PutMetricData"],
                            "Resource": "*",
                        },
                    ],
                }
            ),
        )

        # Create CloudWatch Log Groups
        data_processor_log_group = CloudwatchLogGroup(
            self,
            "data_processor_log_group",
            name=f"/aws/lambda/healthcare-data-processor-{environment_suffix}",
            retention_in_days=7,
        )

        health_check_log_group = CloudwatchLogGroup(
            self,
            "health_check_log_group",
            name=f"/aws/lambda/healthcare-health-check-{environment_suffix}",
            retention_in_days=7,
        )

        remediation_log_group = CloudwatchLogGroup(
            self,
            "remediation_log_group",
            name=f"/aws/lambda/healthcare-remediation-{environment_suffix}",
            retention_in_days=7,
        )

        # Package Lambda functions
        data_processor_asset = TerraformAsset(
            self,
            "data_processor_asset",
            path=os.path.join(os.path.dirname(__file__), "lambda"),
            type=AssetType.ARCHIVE,
        )

        # Data Processor Lambda
        self.data_processor_function = LambdaFunction(
            self,
            "data_processor_function",
            function_name=f"healthcare-data-processor-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="data_processor.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "DATA_BUCKET": data_bucket_name,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                    "ENVIRONMENT": environment_suffix,
                }
            ),
            vpc_config=LambdaFunctionVpcConfig(
                subnet_ids=private_subnet_ids, security_group_ids=[security_group_id]
            ),
            depends_on=[data_processor_log_group],
        )

        # Health Check Lambda
        self.health_check_function = LambdaFunction(
            self,
            "health_check_function",
            function_name=f"healthcare-health-check-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="health_check.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "ENVIRONMENT": environment_suffix,
                    "DYNAMODB_TABLE": dynamodb_table_name,
                }
            ),
            depends_on=[health_check_log_group],
        )

        # Auto-Remediation Lambda
        self.remediation_function = LambdaFunction(
            self,
            "remediation_function",
            function_name=f"healthcare-remediation-{environment_suffix}",
            filename=data_processor_asset.path,
            handler="auto_remediation.handler",
            runtime="python3.11",
            role=lambda_role.arn,
            timeout=60,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={"ENVIRONMENT": environment_suffix}
            ),
            depends_on=[remediation_log_group],
        )

        # Export values
        self.data_processor_function_name = self.data_processor_function.function_name
        self.data_processor_function_arn = self.data_processor_function.arn
        self.data_processor_invoke_arn = self.data_processor_function.invoke_arn
        self.health_check_function_name = self.health_check_function.function_name
        self.health_check_function_arn = self.health_check_function.arn
        self.remediation_function_arn = self.remediation_function.arn
