"""
lambda_stack.py

Lambda functions infrastructure module.
Creates Lambda functions for data validation and API authorization.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output, FileArchive, AssetArchive, FileAsset
import json
import os


class LambdaStackArgs:
    """Arguments for LambdaStack component."""

    def __init__(
        self,
        environment_suffix: str,
        vpc_id: Output[str],
        lambda_subnet_ids: list,
        lambda_security_group_id: Output[str],
        source_db_endpoint: Output[str],
        target_db_endpoint: Output[str],
        sns_topic_arn: Output[str],
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.lambda_subnet_ids = lambda_subnet_ids
        self.lambda_security_group_id = lambda_security_group_id
        self.source_db_endpoint = source_db_endpoint
        self.target_db_endpoint = target_db_endpoint
        self.sns_topic_arn = sns_topic_arn
        self.tags = tags or {}


class LambdaStack(pulumi.ComponentResource):
    """
    Lambda functions infrastructure for migration project.

    Creates:
    - IAM roles for Lambda execution
    - Data validation Lambda function
    - API authorizer Lambda function
    - Lambda layers for dependencies
    """

    def __init__(
        self,
        name: str,
        args: LambdaStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:lambda:LambdaStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'EnvironmentSuffix': self.environment_suffix,
            'Component': 'Lambda'
        }

        # Create Lambda execution role for data validation
        self.validation_lambda_role = self._create_lambda_execution_role(
            "validation",
            include_vpc_permissions=True,
            include_rds_permissions=True,
            include_cloudwatch_permissions=True,
            include_sns_permissions=True
        )

        # Create Lambda execution role for API authorizer
        self.authorizer_lambda_role = self._create_lambda_execution_role(
            "authorizer",
            include_vpc_permissions=False,
            include_ssm_permissions=True
        )

        # Data Validation Lambda Function
        self.validation_lambda = aws.lambda_.Function(
            f"data-validation-lambda-{self.environment_suffix}",
            name=f"data-validation-{self.environment_suffix}",
            runtime="python3.9",
            role=self.validation_lambda_role.arn,
            handler="data_validation.lambda_handler",
            code=FileArchive("./lib/lambda"),
            timeout=300,
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SOURCE_DB_ENDPOINT": args.source_db_endpoint,
                    "TARGET_DB_ENDPOINT": args.target_db_endpoint,
                    "DB_NAME": "payments",
                    "DB_USER": "dbadmin",
                    "DB_PASSWORD": "ChangeMe123!",  # Should be from Secrets Manager
                    "SNS_TOPIC_ARN": args.sns_topic_arn,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=args.lambda_subnet_ids,
                security_group_ids=[args.lambda_security_group_id]
            ),
            tags={
                **self.tags,
                'Name': f"data-validation-lambda-{self.environment_suffix}",
                'FunctionType': 'DataValidation'
            },
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for validation Lambda
        self.validation_log_group = aws.cloudwatch.LogGroup(
            f"validation-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/data-validation-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                'Name': f"validation-lambda-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.validation_lambda)
        )

        # API Authorizer Lambda Function
        self.authorizer_lambda = aws.lambda_.Function(
            f"api-authorizer-lambda-{self.environment_suffix}",
            name=f"api-authorizer-{self.environment_suffix}",
            runtime="python3.9",
            role=self.authorizer_lambda_role.arn,
            handler="api_authorizer.lambda_handler",
            code=FileArchive("./lib/lambda"),
            timeout=30,
            memory_size=256,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            tags={
                **self.tags,
                'Name': f"api-authorizer-lambda-{self.environment_suffix}",
                'FunctionType': 'Authorizer'
            },
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch Log Group for authorizer Lambda
        self.authorizer_log_group = aws.cloudwatch.LogGroup(
            f"authorizer-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/api-authorizer-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                'Name': f"authorizer-lambda-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self.authorizer_lambda)
        )

        # Register outputs
        self.register_outputs({
            'validation_lambda_arn': self.validation_lambda.arn,
            'validation_lambda_name': self.validation_lambda.name,
            'authorizer_lambda_arn': self.authorizer_lambda.arn,
            'authorizer_lambda_name': self.authorizer_lambda.name
        })

    def _create_lambda_execution_role(
        self,
        role_suffix: str,
        include_vpc_permissions: bool = False,
        include_rds_permissions: bool = False,
        include_cloudwatch_permissions: bool = False,
        include_sns_permissions: bool = False,
        include_ssm_permissions: bool = False
    ) -> aws.iam.Role:
        """Create IAM role for Lambda execution with specified permissions."""

        role = aws.iam.Role(
            f"lambda-{role_suffix}-role-{self.environment_suffix}",
            name=f"lambda-{role_suffix}-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={
                **self.tags,
                'Name': f"lambda-{role_suffix}-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-{role_suffix}-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        # VPC access policy
        if include_vpc_permissions:
            aws.iam.RolePolicyAttachment(
                f"lambda-{role_suffix}-vpc-execution-{self.environment_suffix}",
                role=role.name,
                policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
                opts=ResourceOptions(parent=role)
            )

        # Custom inline policies
        policy_statements = []

        if include_rds_permissions:
            policy_statements.append({
                "Effect": "Allow",
                "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                ],
                "Resource": "*"
            })

        if include_cloudwatch_permissions:
            policy_statements.append({
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData"
                ],
                "Resource": "*"
            })

        if include_sns_permissions:
            policy_statements.append({
                "Effect": "Allow",
                "Action": [
                    "sns:Publish"
                ],
                "Resource": "*"
            })

        if include_ssm_permissions:
            policy_statements.append({
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                "Resource": "*"
            })

        if policy_statements:
            inline_policy = aws.iam.RolePolicy(
                f"lambda-{role_suffix}-inline-policy-{self.environment_suffix}",
                role=role.name,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": policy_statements
                }),
                opts=ResourceOptions(parent=role)
            )

        return role
