"""
Lambda functions for order processing in both regions.
BUG #11: Lambda timeout set to 30 seconds instead of 300
BUG #12: Missing VPC configuration for Lambda functions
BUG #13: IAM policy missing secretsmanager:GetSecretValue permission
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional


class LambdaStack(pulumi.ComponentResource):
    """Lambda functions for order processing in primary and secondary regions."""

    def __init__(
        self,
        name: str,
        environment_suffix: str,
        primary_region: str,
        secondary_region: str,
        aurora_endpoint: Output[str],
        dynamodb_table_name: Output[str],
        tags: dict,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:infrastructure:LambdaStack', name, None, opts)

        primary_provider = aws.Provider(
            f"aws-lambda-primary-{environment_suffix}",
            region=primary_region,
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-lambda-secondary-{environment_suffix}",
            region=secondary_region,
            opts=ResourceOptions(parent=self)
        )

        # IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"trading-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**tags, 'Name': f"trading-lambda-role-{environment_suffix}"},
            opts=ResourceOptions(parent=self)
        )

        # BUG #13: Missing secretsmanager:GetSecretValue permission
        self.lambda_policy = aws.iam.RolePolicy(
            f"trading-lambda-policy-{environment_suffix}",
            role=self.lambda_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:Query"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "rds:DescribeDBClusters",
                            "rds-data:ExecuteStatement"
                        ],
                        "Resource": "*"
                    }
                    # MISSING: secretsmanager:GetSecretValue permission!
                ]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f"trading-lambda-vpc-policy-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Lambda function code (placeholder)
        lambda_code = """
import json
import os
import boto3

def handler(event, context):
    # Process trading order
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    aurora_endpoint = os.environ.get('AURORA_ENDPOINT')

    # Placeholder logic
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Order processed'})
    }
"""

        # BUG #11: Timeout set to 30 instead of 300
        # BUG #12: Missing vpc_config
        self.primary_function = aws.lambda_.Function(
            f"trading-function-primary-{environment_suffix}",
            name=f"trading-function-primary-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            timeout=30,  # BUG #11: Should be 300
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'AURORA_ENDPOINT': aurora_endpoint,
                    'DYNAMODB_TABLE': dynamodb_table_name,
                    'REGION': primary_region
                }
            ),
            # BUG #12: Missing vpc_config!
            tags={**tags, 'Name': f"trading-function-primary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Secondary Lambda function
        self.secondary_function = aws.lambda_.Function(
            f"trading-function-secondary-{environment_suffix}",
            name=f"trading-function-secondary-{environment_suffix}",
            runtime="python3.11",
            handler="index.handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset(lambda_code)
            }),
            timeout=30,  # Same bug
            memory_size=512,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'AURORA_ENDPOINT': aurora_endpoint,
                    'DYNAMODB_TABLE': dynamodb_table_name,
                    'REGION': secondary_region
                }
            ),
            # BUG #12: Missing vpc_config!
            tags={**tags, 'Name': f"trading-function-secondary-{environment_suffix}"},
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        self.primary_function_arn = self.primary_function.arn
        self.secondary_function_arn = self.secondary_function.arn
        self.primary_function_name = self.primary_function.name

        self.register_outputs({
            'primary_function_arn': self.primary_function.arn,
            'secondary_function_arn': self.secondary_function.arn,
            'primary_function_name': self.primary_function.name,
        })
