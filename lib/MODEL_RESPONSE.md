### Reasoning Trace

---

The user wants a comprehensive AWS CDK Python application that creates a serverless file upload API with the following components:

1. API Gateway (REST API) with a POST /upload endpoint
2. Lambda function for file handling
3. S3 bucket for file storage
4. DynamoDB table for metadata

Key requirements:

- Single stack implementation in main.py
- Lambda in Python 3.9
- Proper IAM roles with least privilege
- S3 with versioning, encryption, and no public access
- DynamoDB with composite key and KMS encryption
- API Gateway rate limiting (1000 RPS)
- CloudWatch logging for both API Gateway and Lambda
- Stack outputs for API URL and Lambda ARN

I need to create a complete CDK application that meets all these requirements. Let me structure this properly.

### Answer

---

I'll help you create a comprehensive AWS CDK Python application for a serverless file upload API. This solution will include all the components you've specified with proper security configurations.

## Project Structure

First, let's set up the project structure:

```
file-upload-api/
├── main.py           # CDK stack definition
├── lambda/
│   └── handler.py    # Lambda function code
├── requirements.txt  # Python dependencies
└── cdk.json         # CDK configuration
```

## CDK Stack Implementation (main.py)

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
)
from constructs import Construct

class FileUploadApiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS keys for encryption
        s3_kms_key = kms.Key(
            self, "S3KmsKey",
            description="KMS key for S3 bucket encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        dynamodb_kms_key = kms.Key(
            self, "DynamoDBKmsKey",
            description="KMS key for DynamoDB table encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create S3 bucket with security configurations
        upload_bucket = s3.Bucket(
            self, "UploadBucket",
            bucket_name=f"file-upload-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # For demo purposes
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Create DynamoDB table
        products_table = dynamodb.Table(
            self, "ProductsTable",
            table_name="ProductMetadata",
            partition_key=dynamodb.Attribute(
                name="productId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="productName",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=dynamodb_kms_key,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create CloudWatch log group for Lambda
        lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name="/aws/lambda/file-upload-handler",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name="FileUploadLambdaRole",
            description="IAM role for file upload Lambda function"
        )

        # Add managed policy for basic Lambda execution
        lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        )

        # Grant specific S3 permissions
        upload_bucket.grant_read_write(lambda_role)
        s3_kms_key.grant_encrypt_decrypt(lambda_role)

        # Grant specific DynamoDB permissions
        products_table.grant_read_write_data(lambda_role)
        dynamodb_kms_key.grant_encrypt_decrypt(lambda_role)

        # Create Lambda function
        upload_handler = lambda_.Function(
            self, "UploadHandler",
            function_name="file-upload-handler",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda"),
            timeout=Duration.minutes(5),
            memory_size=512,
            environment={
                "BUCKET_NAME": upload_bucket.bucket_name,
                "TABLE_NAME": products_table.table_name,
                "LOG_LEVEL": "INFO"
            },
            role=lambda_role,
            reserved_concurrent_executions=1000,  # Limit concurrent executions
            log_group=lambda_log_group,
            tracing=lambda_.Tracing.ACTIVE  # Enable X-Ray tracing
        )

        # Create API Gateway REST API
        api = apigateway.RestApi(
            self, "FileUploadApi",
            rest_api_name="file-upload-api",
            description="API for file upload service",
            endpoint_types=[apigateway.EndpointType.REGIONAL],
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_rate_limit=1000,  # 1000 RPS
                throttling_burst_limit=2000
            ),
            cloud_watch_role=True,
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["POST"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Create request validator
        request_validator = apigateway.RequestValidator(
            self, "RequestValidator",
            rest_api=api,
            validate_request_body=True,
            validate_request_parameters=False,
            request_validator_name="validate-body"
        )

        # Define request model
        request_model = api.add_model(
            "UploadRequestModel",
            content_type="application/json",
            model_name="UploadRequest",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                title="uploadRequest",
                type=apigateway.JsonSchemaType.OBJECT,
                required=["productId", "productName", "price", "fileContent"],
                properties={
                    "productId": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        min_length=1,
                        max_length=128
                    ),
                    "productName": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        min_length=1,
                        max_length=256
                    ),
                    "price": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.NUMBER,
                        minimum=0
                    ),
                    "fileContent": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        description="Base64 encoded file content"
                    ),
                    "fileName": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        min_length=1,
                        max_length=256
                    )
                }
            )
        )

        # Add /upload resource and POST method
        upload_resource = api.root.add_resource("upload")
        upload_method = upload_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                upload_handler,
                proxy=True,
                integration_responses=[{
                    "statusCode": "200",
                    "responseTemplates": {
                        "application/json": '{"message": "Success"}'
                    }
                }]
            ),
            method_responses=[{
                "statusCode": "200",
                "responseModels": {
                    "application/json": apigateway.Model.EMPTY_MODEL
                }
            }],
            request_validator=request_validator,
            request_models={
                "application/json": request_model
            }
        )

        # Add usage plan for rate limiting
        usage_plan = api.add_usage_plan(
            "UsagePlan",
            name="FileUploadUsagePlan",
            description="Usage plan for file upload API",
            throttle={
                "rate_limit": 1000,
                "burst_limit": 2000
            },
            quota={
                "limit": 1000000,
                "period": apigateway.Period.DAY
            }
        )
        usage_plan.add_api_stage(
            stage=api.deployment_stage
        )

        # CloudFormation Outputs
        CfnOutput(
            self, "ApiGatewayUrl",
            value=api.url + "upload",
            description="API Gateway endpoint URL for file upload"
        )

        CfnOutput(
            self, "LambdaFunctionArn",
            value=upload_handler.function_arn,
            description="ARN of the Lambda function"
        )

        CfnOutput(
            self, "S3BucketName",
            value=upload_bucket.bucket_name,
            description="Name of the S3 bucket for file storage"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=products_table.table_name,
            description="Name of the DynamoDB table for metadata"
        )

def main():
    app = App()
    FileUploadApiStack(app, "FileUploadApiStack")
    app.synth()

if __name__ == "__main__":
    main()
```

## Lambda Function Code (lambda/handler.py)

```python
import json
import boto3
import base64
import os
import logging
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']

def lambda_handler(event, context):
    """
    Handle file upload requests from API Gateway
    """
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")

        # Parse the request body
        if event.get('body'):
            body = json.loads(event['body'])
        else:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Request body is required'})
            }

        # Extract required fields
        product_id = body.get('productId')
        product_name = body.get('productName')
        price = body.get('price')
        file_content = body.get('fileContent')
        file_name = body.get('fileName', f"{product_id}_{datetime.now().isoformat()}")

        # Validate required fields
        if not all([product_id, product_name, price, file_content]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields'})
            }

        # Decode base64 file content
        try:
            file_data = base64.b64decode(file_content)
        except Exception as e:
            logger.error(f"Failed to decode file content: {str(e)}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid file content encoding'})
            }

        # Upload file to S3
        s3_key = f"uploads/{product_id}/{file_name}"
        try:
            s3_response = s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_data,
                ServerSideEncryption='aws:kms',
                Metadata={
                    'productId': product_id,
                    'productName': product_name,
                    'uploadTimestamp': datetime.now().isoformat()
                }
            )
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to upload file'})
            }

        # Store metadata in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        timestamp = datetime.now().isoformat()

        try:
            dynamodb_response = table.put_item(
                Item={
                    'productId': product_id,
                    'productName': product_name,
                    'price': price,
                    's3Key': s3_key,
                    'fileName': file_name,
                    'uploadTimestamp': timestamp,
                    'fileSize': len(file_data),
                    'versionId': s3_response.get('VersionId', 'N/A')
                }
            )
            logger.info(f"Successfully stored metadata in DynamoDB for product: {product_id}")
        except ClientError as e:
            logger.error(f"Failed to store metadata in DynamoDB: {str(e)}")
            # Consider whether to delete the S3 object here
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Failed to store metadata'})
            }

        # Return success response
        response_body = {
            'message': 'File uploaded successfully',
            'productId': product_id,
            's3Key': s3_key,
            'timestamp': timestamp,
            'versionId': s3_response.get('VersionId', 'N/A')
        }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## Requirements Files

### requirements.txt

```
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### lambda/requirements.txt (optional, for local development)

```
boto3>=1.26.0
```

### cdk.json

```json
{
  "app": "python3 main.py",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## Deployment Instructions

1. **Install dependencies:**

```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (if not already done):**

```bash
cdk bootstrap
```

3. **Synthesize the CloudFormation template:**

```bash
cdk synth
```

4. **Deploy the stack:**

```bash
cdk deploy
```

## Testing the API

### Example request:

```bash
curl -X POST https://<your-api-id>.execute-api.<region>.amazonaws.com/prod/upload \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD-001",
    "productName": "Test Product",
    "price": 99.99,
    "fileName": "test-file.txt",
    "fileContent": "VGhpcyBpcyBhIHRlc3QgZmlsZQ=="
  }'
```

## Key Features Implemented

1. **Security:**
   - S3 bucket with KMS encryption and versioning
   - DynamoDB with KMS encryption
   - IAM roles with least privilege
   - API Gateway request validation
   - No public access to S3

2. **Scalability:**
   - Auto-scaling Lambda function
   - DynamoDB on-demand billing
   - API Gateway throttling

3. **Monitoring:**
   - CloudWatch logs for Lambda and API Gateway
   - X-Ray tracing enabled
   - Detailed metrics collection

4. **Best Practices:**
   - Infrastructure as Code
   - Environment variables for configuration
   - Proper error handling
   - CORS support
   - Request validation

The solution meets all the specified requirements and provides a secure, scalable serverless file upload API.
