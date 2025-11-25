"""Validation Stack - Lambda functions for validation and rollback."""

from typing import Dict, List, Any
from cdktf import Fn, TerraformAsset, AssetType
from constructs import Construct
import os
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission


class ValidationConstruct(Construct):
    """Validation Construct with Lambda functions for validation and rollback."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        lambda_security_group_id: str,
        private_subnet_ids: List[str],
        db_endpoint: str,
        db_secret_arn: str,
        **kwargs: Any
    ) -> None:
        """Initialize Validation construct.

        Args:
            scope: CDK construct scope
            construct_id: Unique identifier for the construct
            environment_suffix: Environment suffix for resource naming
            lambda_security_group_id: Security group ID for Lambda
            private_subnet_ids: List of private subnet IDs
            db_endpoint: Database cluster endpoint
            db_secret_arn: Database secret ARN
            **kwargs: Additional keyword arguments
        """
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Create IAM role for validation Lambda
        self.validation_role = IamRole(
            self,
            f"validation-role-{environment_suffix}",
            name=f"payment-validation-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-validation-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach policies
        IamRolePolicyAttachment(
            self,
            f"validation-basic-execution-{environment_suffix}",
            role=self.validation_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        IamRolePolicyAttachment(
            self,
            f"validation-vpc-execution-{environment_suffix}",
            role=self.validation_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Custom policy for validation
        validation_policy = IamPolicy(
            self,
            f"validation-policy-{environment_suffix}",
            name=f"payment-validation-policy-{environment_suffix}",
            description="Allow validation Lambda to access resources",
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData",
                            "cloudwatch:GetMetricData"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:DescribeReplicationTasks",
                            "dms:DescribeTableStatistics"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"payment-validation-policy-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"validation-policy-attachment-{environment_suffix}",
            role=self.validation_role.name,
            policy_arn=validation_policy.arn
        )

        # Create CloudWatch Log Group for validation
        validation_log_group = CloudwatchLogGroup(
            self,
            f"validation-log-group-{environment_suffix}",
            name=f"/aws/lambda/payment-validation-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"payment-validation-logs-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Package validation Lambda function code
        validation_asset = TerraformAsset(
            self,
            f"validation-asset-{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "../lambda/validation"),
            type=AssetType.ARCHIVE
        )

        # Create validation Lambda function
        self.validation_lambda = LambdaFunction(
            self,
            f"validation-lambda-{environment_suffix}",
            function_name=f"payment-validation-{environment_suffix}",
            description="Pre/post migration validation checks",
            runtime="python3.11",
            handler="handler.lambda_handler",
            role=self.validation_role.arn,
            filename=validation_asset.path,
            source_code_hash=validation_asset.asset_hash,
            timeout=300,
            memory_size=256,
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
                "Name": f"payment-validation-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

        # Create rollback Lambda function
        rollback_log_group = CloudwatchLogGroup(
            self,
            f"rollback-log-group-{environment_suffix}",
            name=f"/aws/lambda/payment-rollback-{environment_suffix}",
            retention_in_days=7,
            tags={
                "Name": f"payment-rollback-logs-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # IAM role for rollback Lambda
        self.rollback_role = IamRole(
            self,
            f"rollback-role-{environment_suffix}",
            name=f"payment-rollback-role-{environment_suffix}",
            assume_role_policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-rollback-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"rollback-basic-execution-{environment_suffix}",
            role=self.rollback_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )

        # Custom policy for rollback
        rollback_policy = IamPolicy(
            self,
            f"rollback-policy-{environment_suffix}",
            name=f"payment-rollback-policy-{environment_suffix}",
            description="Allow rollback Lambda to modify Route53",
            policy=Fn.jsonencode({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "route53:ChangeResourceRecordSets",
                            "route53:GetHostedZone",
                            "route53:ListResourceRecordSets"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "cloudwatch:PutMetricData"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dms:StopReplicationTask"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"payment-rollback-policy-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        IamRolePolicyAttachment(
            self,
            f"rollback-policy-attachment-{environment_suffix}",
            role=self.rollback_role.name,
            policy_arn=rollback_policy.arn
        )

        # Package rollback Lambda function code
        rollback_asset = TerraformAsset(
            self,
            f"rollback-asset-{environment_suffix}",
            path=os.path.join(os.path.dirname(__file__), "../lambda/rollback"),
            type=AssetType.ARCHIVE
        )

        self.rollback_lambda = LambdaFunction(
            self,
            f"rollback-lambda-{environment_suffix}",
            function_name=f"payment-rollback-{environment_suffix}",
            description="Rollback mechanism for failed migration",
            runtime="python3.11",
            handler="handler.lambda_handler",
            role=self.rollback_role.arn,
            filename=rollback_asset.path,
            source_code_hash=rollback_asset.asset_hash,
            timeout=300,
            memory_size=256,
            environment={
                "variables": {
                    "ENVIRONMENT": environment_suffix,
                    "LOG_LEVEL": "INFO"
                }
            },
            tags={
                "Name": f"payment-rollback-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "payment-migration"
            }
        )

    def get_validation_lambda_arn(self) -> str:
        """Get validation Lambda ARN."""
        return self.validation_lambda.arn

    def get_rollback_lambda_arn(self) -> str:
        """Get rollback Lambda ARN."""
        return self.rollback_lambda.arn
