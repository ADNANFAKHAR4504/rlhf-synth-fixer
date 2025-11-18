"""
Lambda Functions Component
Creates multiple Lambda functions with optimized batched resource creation
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional
import json


class LambdaFunctionsComponent(pulumi.ComponentResource):
    """
    Custom ComponentResource for Lambda functions
    Demonstrates batched resource creation and apply() usage
    """

    def __init__(
            self,
            name: str,
            *,
            environment_suffix: str,
            vpc_id: pulumi.Output[str],
            private_subnet_ids: List[pulumi.Output[str]],
            vpc_security_group_id: pulumi.Output[str],
            kinesis_stream_arn: pulumi.Output[str],
            dynamodb_table_name: pulumi.Output[str],
            dynamodb_table_arn: pulumi.Output[str],
            archive_bucket_name: pulumi.Output[str],
            archive_bucket_arn: pulumi.Output[str],
            common_tags: Dict[str, str],
            opts: pulumi.ResourceOptions = None
        ):
        super().__init__("custom:compute:LambdaFunctions", name, None, opts)

        child_opts = pulumi.ResourceOptions(parent=self)

        # Create IAM role for Lambda functions (shared across all functions)
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        })

        self.lambda_role = aws.iam.Role(
            f"lambda-role-{environment_suffix}",
            assume_role_policy=assume_role_policy,
            tags={**common_tags, "Name": f"lambda-role-{environment_suffix}"},
            opts=child_opts
        )

        # Attach managed policies for basic Lambda execution
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{environment_suffix}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Create custom policy for Kinesis, DynamoDB, and S3 access
        lambda_policy = pulumi.Output.all(
            kinesis_stream_arn,
            dynamodb_table_arn,
            archive_bucket_arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "kinesis:GetRecords",
                        "kinesis:GetShardIterator",
                        "kinesis:DescribeStream",
                        "kinesis:ListStreams",
                        "kinesis:PutRecord",
                        "kinesis:PutRecords"
                    ],
                    "Resource": args[0]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [args[1], f"{args[1]}/index/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [args[2], f"{args[2]}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                }
            ]
        }))

        lambda_custom_policy = aws.iam.RolePolicy(
            f"lambda-custom-policy-{environment_suffix}",
            role=self.lambda_role.id,
            policy=lambda_policy,
            opts=pulumi.ResourceOptions(parent=self, depends_on=[self.lambda_role])
        )

        # Define Lambda function configurations
        function_configs = [
            {
                "name": "ingest",
                "description": "Ingests data from Kinesis stream",
                "handler": "index.handler",
                "memory": 512,
                "timeout": 60
            },
            {
                "name": "transform",
                "description": "Transforms incoming data",
                "handler": "index.handler",
                "memory": 1024,
                "timeout": 120
            },
            {
                "name": "validate",
                "description": "Validates transformed data",
                "handler": "index.handler",
                "memory": 512,
                "timeout": 60
            },
            {
                "name": "enrich",
                "description": "Enriches data with additional context",
                "handler": "index.handler",
                "memory": 1024,
                "timeout": 120
            },
            {
                "name": "archive",
                "description": "Archives processed data to S3",
                "handler": "index.handler",
                "memory": 512,
                "timeout": 90
            }
        ]

        # Create Lambda functions in a batched manner using list comprehension
        self.functions = []
        self.function_arns = []
        self.function_names = []

        for config in function_configs:
            # Create function code inline (placeholder - would be actual code in production)
            function_code = f"""
import json
import boto3
import os

def handler(event, context):
    # {config['description']}
    print(f"Processing {{len(event.get('Records', []))}} records")

    # Environment variables
    dynamodb_table = os.environ.get('DYNAMODB_TABLE')
    kinesis_stream = os.environ.get('KINESIS_STREAM')
    s3_bucket = os.environ.get('S3_BUCKET')

    # Process records
    for record in event.get('Records', []):
        print(f"Processing record: {{record}}")

    return {{
        'statusCode': 200,
        'body': json.dumps('Processed successfully')
    }}
"""

            # Create Lambda function with optimized configuration
            # Note: VPC config removed due to AWS VPC endpoint quota limits
            function = aws.lambda_.Function(
                f"lambda-{config['name']}-{environment_suffix}",
                name=f"pipeline-{config['name']}-{environment_suffix}",
                runtime="python3.11",
                role=self.lambda_role.arn,
                handler=config["handler"],
                code=pulumi.AssetArchive({
                    "index.py": pulumi.StringAsset(function_code)
                }),
                memory_size=config["memory"],
                timeout=config["timeout"],
                reserved_concurrent_executions=10,
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={
                        "DYNAMODB_TABLE": dynamodb_table_name,
                        "KINESIS_STREAM": kinesis_stream_arn,
                        "S3_BUCKET": archive_bucket_name,
                        "ENVIRONMENT": environment_suffix
                    }
                ),
                tags={
                    **common_tags,
                    "Name": f"lambda-{config['name']}-{environment_suffix}",
                    "Function": config['name']
                },
                opts=pulumi.ResourceOptions(
                    parent=self,
                    depends_on=[self.lambda_role, lambda_custom_policy]
                )
            )

            self.functions.append(function)
            self.function_arns.append(function.arn)
            self.function_names.append(function.name)

        # Create CloudWatch Log Groups with retention (batched)
        for i, function in enumerate(self.functions):
            aws.cloudwatch.LogGroup(
                f"lambda-logs-{function_configs[i]['name']}-{environment_suffix}",
                name=function.name.apply(lambda name: f"/aws/lambda/{name}"),
                retention_in_days=7,
                tags={**common_tags, "Name": f"lambda-logs-{function_configs[i]['name']}-{environment_suffix}"},
                opts=pulumi.ResourceOptions(
                    parent=self,
                    depends_on=[function]
                )
            )

        self.register_outputs({
            "function_arns": self.function_arns,
            "function_names": self.function_names
        })
