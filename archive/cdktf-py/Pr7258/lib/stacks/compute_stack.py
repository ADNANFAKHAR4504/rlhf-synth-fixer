"""Compute Stack - Lambda functions with auto-scaling."""

from typing import Dict, List, Any
from cdktf import Fn, TerraformAsset, AssetType
from constructs import Construct
import os
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_alias import LambdaAlias
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup


class ComputeConstruct(Construct):
    """Compute Construct with Lambda functions for payment API."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        lambda_security_group_id: str,
        private_subnet_ids: List[str],
        db_secret_arn: str,
        db_endpoint: str,
        **kwargs: Any
    ) -> None:
        """Initialize Compute construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            lambda_security_group_id: Security group ID for Lambda
            private_subnet_ids: List of private subnet IDs
            db_secret_arn: Database secret ARN
            db_endpoint: Database cluster endpoint
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create IAM role for Lambda execution
        self.lambda_role = IamRole(
            self,
            f"lambda-role-{environment_suffix}",
            name=f"payment-lambda-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-lambda-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach basic execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-basic-execution-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda-vpc-execution-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Create custom policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            f"lambda-secrets-policy-{environment_suffix}",
            name=f"payment-lambda-secrets-{environment_suffix}",
            description="Allow Lambda to read database secrets",
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": db_secret_arn
                }]
            }),
            tags={
                "Name": f"payment-lambda-secrets-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"lambda-secrets-attachment-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn=secrets_policy.arn
        )

        # Create CloudWatch Log Group
        log_group = CloudwatchLogGroup(
            self,
            f"lambda-log-group-{environment_suffix}",
            name=f"/aws/lambda/payment-api-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"payment-lambda-logs-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Package Lambda function code
        lambda_asset = TerraformAsset(
            self,
            f"lambda-asset-{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "../lambda/payment"),
            type=AssetType.ARCHIVE
        )

        # Create Lambda function for payment API
        self.payment_lambda = LambdaFunction(
            self,
            f"payment-lambda-{environment_suffix}",
            function_name=f"payment-api-{environment_suffix}",
            description="Payment processing API Lambda function",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            filename=lambda_asset.path,
            source_code_hash=lambda_asset.asset_hash,
            timeout=30,
            memory_size=512,
            reserved_concurrent_executions=10,
            vpc_config={
                "subnet_ids": private_subnet_ids,
                "security_group_ids": [lambda_security_group_id]
            },
            environment={
                "variables": {
                    "DB_SECRET_ARN": db_secret_arn,
                    "DB_ENDPOINT": db_endpoint,
                    "ENVIRONMENT": environment_suffix,
                    "LOG_LEVEL": "INFO"
                }
            },
            tags={
                "Name": f"payment-api-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create Lambda alias for traffic management
        self.lambda_alias = LambdaAlias(
            self,
            f"lambda-alias-{environment_suffix}",
            name="live",
            function_name=self.payment_lambda.function_name,
            function_version=self.payment_lambda.version,
            description="Live traffic alias for payment API"
        )

    def get_lambda_arn(self) -> str:
        """Get Lambda function ARN."""
        return self.payment_lambda.arn

    def get_lambda_alias_arn(self) -> str:
        """Get Lambda alias ARN."""
        return self.lambda_alias.arn

    def get_lambda_function_name(self) -> str:
        """Get Lambda function name."""
        return self.payment_lambda.function_name
