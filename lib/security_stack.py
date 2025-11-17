"""
Security infrastructure module for KMS encryption and Parameter Store.

This module creates:
- KMS key for Parameter Store encryption
- Systems Manager Parameter Store parameters (SecureString)
- IAM roles for Lambda execution
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class SecurityStackArgs:
    """Arguments for SecurityStack component."""

    def __init__(
        self,
        environment_suffix: str,
        parameter_names: Optional[list] = None
    ):
        self.environment_suffix = environment_suffix
        self.parameter_names = parameter_names or [
            "trading-api-key-1",
            "trading-api-key-2",
            "trading-api-secret"
        ]


class SecurityStack(pulumi.ComponentResource):
    """
    SecurityStack component creates KMS keys and Parameter Store parameters.

    Exports:
        kms_key_id: KMS key identifier
        parameter_arns: List of Parameter Store ARNs
    """

    def __init__(
        self,
        name: str,
        args: SecurityStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:security:SecurityStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Create KMS key for Parameter Store encryption
        self.kms_key = aws.kms.Key(
            f"parameter-store-kms-{self.environment_suffix}",
            description=f"KMS key for Parameter Store encryption - {self.environment_suffix}",
            deletion_window_in_days=7,
            enable_key_rotation=True,
            tags={
                "Name": f"parameter-store-kms-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "security-team",
                "CostCenter": "security"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create KMS key alias
        aws.kms.Alias(
            f"parameter-store-kms-alias-{self.environment_suffix}",
            name=f"alias/parameter-store-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self.kms_key)
        )

        # Create Parameter Store parameters
        self.parameters = []
        for param_name in args.parameter_names:
            parameter = aws.ssm.Parameter(
                f"{param_name}-{self.environment_suffix}",
                name=f"/{self.environment_suffix}/{param_name}",
                type="SecureString",
                value="initial-placeholder-value",  # Will be rotated by Lambda
                key_id=self.kms_key.id,
                description=f"SecureString parameter for {param_name}",
                tags={
                    "Name": f"{param_name}-{self.environment_suffix}",
                    "Environment": self.environment_suffix,
                    "Owner": "security-team",
                    "CostCenter": "security"
                },
                opts=ResourceOptions(parent=self.kms_key)
            )
            self.parameters.append(parameter)

        # Create IAM role for Lambda rotation function
        lambda_assume_role = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                actions=["sts:AssumeRole"],
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type="Service",
                    identifiers=["lambda.amazonaws.com"]
                )]
            )]
        )

        self.lambda_role = aws.iam.Role(
            f"lambda-rotation-role-{self.environment_suffix}",
            assume_role_policy=lambda_assume_role.json,
            tags={
                "Name": f"lambda-rotation-role-{self.environment_suffix}",
                "Environment": self.environment_suffix,
                "Owner": "security-team",
                "CostCenter": "security"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach managed policies to Lambda role
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Create inline policy for SSM and KMS access
        lambda_policy = aws.iam.RolePolicy(
            f"lambda-rotation-policy-{self.environment_suffix}",
            role=self.lambda_role.id,
            policy=pulumi.Output.all(self.kms_key.arn).apply(
                lambda args: pulumi.Output.json_dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "ssm:GetParameter",
                                "ssm:PutParameter",
                                "ssm:DescribeParameters"
                            ],
                            "Resource": f"arn:aws:ssm:*:*:parameter/{self.environment_suffix}/*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:Encrypt",
                                "kms:GenerateDataKey"
                            ],
                            "Resource": args[0]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.lambda_role)
        )

        # Register outputs
        self.kms_key_id = self.kms_key.id
        self.kms_key_arn = self.kms_key.arn
        self.parameter_arns = [param.arn for param in self.parameters]
        self.lambda_role_arn = self.lambda_role.arn

        self.register_outputs({
            "kms_key_id": self.kms_key_id,
            "kms_key_arn": self.kms_key_arn,
            "parameter_arns": self.parameter_arns,
            "lambda_role_arn": self.lambda_role_arn
        })
