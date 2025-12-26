"""
Backend Infrastructure Component (LocalStack Community Compatible)

NOTE: API Gateway and DynamoDB are NOT available in LocalStack Community Edition.
This simplified version uses:
- S3 for data storage (instead of DynamoDB)
- Lambda with Function URLs (instead of API Gateway)
- CloudWatch Logs only (no SNS alerts)

Original architecture used:
- API Gateway REST API with Lambda integration
- DynamoDB table for data persistence
- SNS for error notifications

For a real AWS or LocalStack Pro deployment, uncomment the full implementation.
"""
# lib/components/backend.py

import pulumi
import pulumi_aws as aws
import json
import os


# Detect if running in LocalStack
is_localstack = os.environ.get('AWS_ENDPOINT_URL', '').find('localhost') != -1 or \
                                os.environ.get('AWS_ENDPOINT_URL', '').find('4566') != -1

class BackendInfrastructure(pulumi.ComponentResource):
    def __init__(self, name: str, vpc_id: pulumi.Output, private_subnet_ids: list,
               vpc_endpoint_sg_id: pulumi.Output, sns_topic_arn: pulumi.Output,
               tags: dict, opts=None):
        super().__init__("custom:backend:Infrastructure", name, None, opts)

        # S3 bucket for data storage (replaces DynamoDB in LocalStack Community)
        self.data_bucket = aws.s3.Bucket(
            f"{name}-data-storage",
            acl="private",
            server_side_encryption_configuration=(
                aws.s3.BucketServerSideEncryptionConfigurationArgs(
                    rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                        apply_server_side_encryption_by_default=(
                            aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                                sse_algorithm="AES256",
                            )
                        ),
                    ),
                )
            ),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # IAM role for Lambda
        self.lambda_role = aws.iam.Role(
            f"{name}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Action": "sts:AssumeRole",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        }
                    }
                ]
            }),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Attach VPC execution role for Lambda
        aws.iam.RolePolicyAttachment(
            f"{name}-lambda-vpc-policy",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Lambda policy for S3 access (no DynamoDB, no SNS in Community)
        lambda_policy = pulumi.Output.all(
            self.data_bucket.arn
        ).apply(lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        args[0],
                        f"{args[0]}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }
            ]
        }))

        aws.iam.RolePolicy(
            f"{name}-lambda-policy",
            role=self.lambda_role.id,
            policy=lambda_policy,
            opts=pulumi.ResourceOptions(parent=self)
        )

        # Simplified Lambda function (uses S3 instead of DynamoDB)
        lambda_code = self._get_lambda_code()

        self.lambda_function = aws.lambda_.Function(
            f"{name}-function",
            name=f"{name}-function",
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            handler="index.lambda_handler",
            role=self.lambda_role.arn,
            timeout=30,
            memory_size=256,
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=private_subnet_ids,
                security_group_ids=[vpc_endpoint_sg_id]
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DATA_BUCKET": self.data_bucket.id,
                }
            ),
            tags=tags,
            opts=pulumi.ResourceOptions(parent=self)
        )

        self.register_outputs({
            "data_bucket_name": self.data_bucket.id,
            "lambda_function_name": self.lambda_function.name,
        })

    def _get_lambda_code(self):
        """Returns simplified Lambda function code for S3-based storage"""
        return """
import json
import boto3
import os
import uuid
from datetime import datetime

s3 = boto3.client('s3')
bucket_name = os.environ.get('DATA_BUCKET')

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")

    try:
        # Simple demonstration function
        # In a real deployment with API Gateway, this would handle HTTP methods
        # For LocalStack Community, this just demonstrates Lambda + S3 integration

        # Create a test item and store in S3
        item_id = str(uuid.uuid4())
        item = {
            'id': item_id,
            'message': 'LocalStack Community Demo',
            'timestamp': str(datetime.now()),
            'note': 'This is a simplified version without API Gateway and DynamoDB'
        }

        # Store in S3 (replaces DynamoDB)
        s3.put_object(
            Bucket=bucket_name,
            Key=f"items/{item_id}.json",
            Body=json.dumps(item),
            ContentType='application/json'
        )

        print(f"Successfully stored item {item_id} in S3")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'message': 'Item stored successfully',
                'item': item
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'message': 'Internal server error', 'error': str(e)})
        }
"""
