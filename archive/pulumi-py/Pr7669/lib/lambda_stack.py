"""
lambda_stack.py

Lambda functions for payment processing and session management.
"""

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output
from typing import Optional, List
import json


class LambdaStack(pulumi.ComponentResource):
    """Lambda functions for API backend."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        memory_size: int,
        timeout: int,
        transactions_table_name: Output[str],
        transactions_table_arn: Output[str],
        sessions_table_name: Output[str],
        sessions_table_arn: Output[str],
        subnet_ids: List[Output[str]],
        security_group_id: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__("custom:lambda:LambdaStack", name, None, opts)

        # IAM role for Lambda
        lambda_role = aws.iam.Role(
            f"lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Effect": "Allow",
                }]
            }),
            tags={**tags, "Name": f"lambda-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC access policy
        aws.iam.RolePolicyAttachment(
            f"lambda-vpc-execution-{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # DynamoDB access policy
        dynamodb_policy = aws.iam.Policy(
            f"lambda-dynamodb-policy-{environment_suffix}",
            policy=Output.all(transactions_table_arn, sessions_table_arn).apply(
                lambda arns: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": arns
                    }]
                })
            ),
            tags={**tags, "Name": f"lambda-dynamodb-policy-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-dynamodb-policy-attachment-{environment_suffix}",
            role=lambda_role.name,
            policy_arn=dynamodb_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Payment processor Lambda
        self.payment_processor = aws.lambda_.Function(
            f"payment-processor-{environment_suffix}",
            name=f"payment-processor-{environment_suffix}",
            runtime=aws.lambda_.Runtime.PYTHON3D11,
            handler="payment_processor.lambda_handler",
            role=lambda_role.arn,
            code=pulumi.FileArchive("./lib/lambda"),
            memory_size=memory_size,
            timeout=timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TRANSACTIONS_TABLE": transactions_table_name,
                    "ENVIRONMENT": environment_suffix,
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=subnet_ids,
                security_group_ids=[security_group_id],
            ),
            tags={**tags, "Name": f"payment-processor-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # Session manager Lambda
        self.session_manager = aws.lambda_.Function(
            f"session-manager-{environment_suffix}",
            name=f"session-manager-{environment_suffix}",
            runtime=aws.lambda_.Runtime.PYTHON3D11,
            handler="session_manager.lambda_handler",
            role=lambda_role.arn,
            code=pulumi.FileArchive("./lib/lambda"),
            memory_size=memory_size,
            timeout=timeout,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SESSIONS_TABLE": sessions_table_name,
                    "ENVIRONMENT": environment_suffix,
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=subnet_ids,
                security_group_ids=[security_group_id],
            ),
            tags={**tags, "Name": f"session-manager-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch log groups
        log_retention = self._get_log_retention_days(environment_suffix)

        aws.cloudwatch.LogGroup(
            f"payment-processor-logs-{environment_suffix}",
            name=f"/aws/lambda/payment-processor-{environment_suffix}",
            retention_in_days=log_retention,
            tags={**tags, "Name": f"payment-processor-logs-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        aws.cloudwatch.LogGroup(
            f"session-manager-logs-{environment_suffix}",
            name=f"/aws/lambda/session-manager-{environment_suffix}",
            retention_in_days=log_retention,
            tags={**tags, "Name": f"session-manager-logs-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        self.register_outputs({
            "payment_processor_arn": self.payment_processor.arn,
            "payment_processor_invoke_arn": self.payment_processor.invoke_arn,
            "session_manager_arn": self.session_manager.arn,
            "session_manager_invoke_arn": self.session_manager.invoke_arn,
        })

    def _get_log_retention_days(self, environment: str) -> int:
        """Get log retention days based on environment."""
        retention_map = {
            "dev": 7,
            "staging": 30,
            "prod": 90
        }
        return retention_map.get(environment, 7)
