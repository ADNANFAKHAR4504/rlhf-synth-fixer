# Model Response

Here's a serverless application using AWS CDK in Python that meets your requirements:

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class ServerlessAppStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create DynamoDB table with on-demand billing
        dynamodb_table = dynamodb.Table(
            self,
            "UserDataTable",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        # Create private S3 bucket with versioning
        s3_bucket = s3.Bucket(
            self,
            "DataStorageBucket",
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )
        
        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )
        
        # Add DynamoDB permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                resources=[dynamodb_table.table_arn],
            )
        )
        
        # Add S3 permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                ],
                resources=[
                    s3_bucket.bucket_arn,
                    f"{s3_bucket.bucket_arn}/*",
                ],
            )
        )
        
        # Create Lambda function
        lambda_function = lambda_.Function(
            self,
            "DataProcessorFunction",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda"),
            handler="handler.main",
            role=lambda_role,
            environment={
                "DYNAMODB_TABLE_NAME": dynamodb_table.table_name,
                "S3_BUCKET_NAME": s3_bucket.bucket_name,
                "LOG_LEVEL": "WARNING",
            },
            timeout=Duration.seconds(30),
            memory_size=256,
        )
        
        # Create API Gateway
        api = apigw.RestApi(
            self,
            "ServerlessApi",
            rest_api_name="Serverless Data API",
            default_cors_preflight_options={
                "allow_origins": apigw.Cors.ALL_ORIGINS,
                "allow_methods": ["GET", "OPTIONS"],
                "allow_headers": [
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                ],
            },
        )
        
        # Create Lambda integration
        lambda_integration = apigw.LambdaIntegration(lambda_function)
        
        # Add GET method
        api_resource = api.root.add_resource("data")
        api_resource.add_method("GET", lambda_integration)


# CDK App
app = App()
ServerlessAppStack(app, "ServerlessAppStack")
app.synth()
```

Lambda handler code:

```python
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

log_level = os.environ.get("LOG_LEVEL", "WARNING")
logging.basicConfig(level=getattr(logging, log_level))
logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BUCKET_NAME = os.environ["S3_BUCKET_NAME"]

table = dynamodb.Table(TABLE_NAME)


def main(event, context):
    try:
        query_params = event.get("queryStringParameters", {})
        user_id = query_params.get("userId")
        
        if not user_id:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "userId required"})
            }
        
        response = table.get_item(Key={"userId": user_id})
        
        if "Item" in response:
            data = response["Item"]
        else:
            data = {"userId": user_id, "status": "new"}
            table.put_item(Item=data)
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(data)
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Internal server error"})
        }
```