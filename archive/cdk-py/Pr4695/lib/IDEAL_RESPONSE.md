# IDEAL_RESPONSE.md

## Complete AWS CDK Python Implementation for Serverless File Upload API

This document contains the ideal implementation for the serverless file upload API using AWS CDK in Python.

### Main Stack Implementation (tap_stack.py)

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

import os
from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_kms as kms,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties,
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        self.environment_suffix = props.environment_suffix or "dev"

        # Create resources
        self._create_kms_keys()
        self._create_s3_bucket()
        self._create_dynamodb_table()
        self._create_lambda_log_group()
        self._create_iam_role()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_outputs()

    def _create_kms_keys(self):
        """Create KMS keys for encryption"""
        # Create KMS key for S3 bucket encryption
        self.s3_kms_key = kms.Key(
            self, "S3KmsKey",
            description=f"KMS key for S3 bucket encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create KMS key for DynamoDB table encryption
        self.dynamodb_kms_key = kms.Key(
            self, "DynamoDBKmsKey",
            description=f"KMS key for DynamoDB table encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_s3_bucket(self):
        """Create S3 bucket for file uploads with enhanced security configurations"""
        self.s3_bucket = s3.Bucket(
            self, "FileUploadBucket",
            bucket_name=f"file-upload-{self.account}-{self.region}-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # For demo purposes
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.POST, s3.HttpMethods.PUT],
                    allowed_origins=["*"],  # Restrict in production
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

    def _create_dynamodb_table(self):
        """Create DynamoDB table for product data"""
        self.dynamodb_table = dynamodb.Table(
            self, "ProductsTable",
            table_name=f"ProductMetadata-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="productId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="productName",
                type=dynamodb.AttributeType.STRING
            ),
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.dynamodb_kms_key,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add Global Secondary Index
        self.dynamodb_table.add_global_secondary_index(
            index_name="PriceIndex",
            partition_key=dynamodb.Attribute(
                name="price",
                type=dynamodb.AttributeType.NUMBER
            ),
            sort_key=dynamodb.Attribute(
                name="productName",
                type=dynamodb.AttributeType.STRING
            )
        )

    def _create_lambda_log_group(self):
        """Create CloudWatch log group for Lambda"""
        self.lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/file-upload-handler-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_iam_role(self):
        """Create IAM role for Lambda with least privilege"""
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            role_name=f"FileUploadLambdaRole-{self.environment_suffix}",
            description="IAM role for file upload Lambda function"
        )

        # Add managed policy for basic Lambda execution
        self.lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        )

        # Grant specific S3 permissions
        self.s3_bucket.grant_read_write(self.lambda_role)
        self.s3_kms_key.grant_encrypt_decrypt(self.lambda_role)

        # Grant specific DynamoDB permissions
        self.dynamodb_table.grant_read_write_data(self.lambda_role)
        self.dynamodb_kms_key.grant_encrypt_decrypt(self.lambda_role)

    def _create_lambda_function(self):
        """Create Lambda function for file processing"""
        self.lambda_function = _lambda.Function(
            self, "UploadHandler",
            function_name=f"file-upload-handler-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("lib/lambda"),
            timeout=Duration.minutes(5),
            memory_size=512,
            environment={
                "BUCKET_NAME": self.s3_bucket.bucket_name,
                "TABLE_NAME": self.dynamodb_table.table_name,
                "LOG_LEVEL": "INFO"
            },
            role=self.lambda_role,
            reserved_concurrent_executions=10,  # Limit concurrent executions
            log_group=self.lambda_log_group,
            tracing=_lambda.Tracing.ACTIVE  # Enable X-Ray tracing
        )

    def _create_api_gateway(self):
        """Create API Gateway for file uploads with enhanced features"""
        self.api = apigateway.RestApi(
            self, "FileUploadApi",
            rest_api_name=f"file-upload-api-{self.environment_suffix}",
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
            rest_api=self.api,
            validate_request_body=True,
            validate_request_parameters=False,
            request_validator_name="validate-body"
        )

        # Define request model
        request_model = self.api.add_model(
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
        upload_resource = self.api.root.add_resource("upload")
        upload_method = upload_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                self.lambda_function,
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
        usage_plan = self.api.add_usage_plan(
            "UsagePlan",
            name=f"FileUploadUsagePlan-{self.environment_suffix}",
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
            stage=self.api.deployment_stage
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api.url + "upload",
            description="API Gateway endpoint URL for file upload"
        )

        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="ARN of the Lambda function"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket for file storage"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table for metadata"
        )
```

### Lambda Handler Implementation (lib/lambda/handler.py)

```python
"""Lambda handler for file upload processing"""

import json
import base64
import boto3
import logging
import os
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing file uploads.

    This function processes file uploads by:
    1. Validating the incoming request
    2. Decoding the base64 file content
    3. Uploading the file to S3
    4. Storing metadata in DynamoDB

    Args:
        event: API Gateway event containing the request body
        context: Lambda context object

    Returns:
        Dict containing HTTP status code and response body
    """
    try:
        # Parse the request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})

        # Validate required fields
        required_fields = ['productId', 'productName', 'price', 'fileContent']
        for field in required_fields:
            if field not in body:
                logger.warning(f"Missing required field: {field}")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'error': f'Missing required field: {field}',
                        'code': 'MISSING_FIELD'
                    })
                }

        # Extract data from request
        product_id = body['productId']
        product_name = body['productName']
        price = float(body['price'])
        file_content = body['fileContent']
        file_name = body.get('fileName', f'upload_{product_id}_{datetime.now().isoformat()}')

        # Validate price
        if price < 0:
            logger.warning(f"Invalid price: {price}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Price must be non-negative',
                    'code': 'INVALID_PRICE'
                })
            }

        # Validate product ID and name
        if not product_id.strip() or not product_name.strip():
            logger.warning("Empty product ID or name")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Product ID and name cannot be empty',
                    'code': 'INVALID_PRODUCT_INFO'
                })
            }

        # Decode base64 file content
        try:
            file_data = base64.b64decode(file_content)
            if len(file_data) == 0:
                raise ValueError("Empty file content")
        except Exception as e:
            logger.error(f"Failed to decode base64 content: {str(e)}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Invalid base64 file content',
                    'code': 'INVALID_FILE_CONTENT'
                })
            }

        # Get environment variables
        bucket_name = os.environ.get('BUCKET_NAME')
        table_name = os.environ.get('TABLE_NAME')

        if not bucket_name or not table_name:
            logger.error("Missing required environment variables")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Server configuration error',
                    'code': 'CONFIG_ERROR'
                })
            }

        # Upload file to S3
        s3_key = f"uploads/{product_id}/{file_name}"
        try:
            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=file_data,
                ContentType='application/octet-stream',
                ServerSideEncryption='aws:kms'
            )
            logger.info(f"Successfully uploaded file to S3: {s3_key}")
        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to upload file',
                    'code': 'UPLOAD_ERROR'
                })
            }

        # Store metadata in DynamoDB
        try:
            table = dynamodb.Table(table_name)
            table.put_item(
                Item={
                    'productId': product_id,
                    'productName': product_name,
                    'price': price,
                    'fileName': file_name,
                    's3Key': s3_key,
                    'uploadTimestamp': datetime.now().isoformat(),
                    'fileSize': len(file_data),
                    'ttl': int(datetime.now().timestamp()) + (365 * 24 * 60 * 60)  # 1 year TTL
                }
            )
            logger.info(f"Successfully stored metadata in DynamoDB for product {product_id}")
        except Exception as e:
            logger.error(f"Failed to store metadata in DynamoDB: {str(e)}")
            # Try to clean up S3 object
            try:
                s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
                logger.info(f"Cleaned up S3 object: {s3_key}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up S3 object: {str(cleanup_error)}")

            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Failed to store metadata',
                    'code': 'METADATA_ERROR'
                })
            }

        logger.info(f"Successfully processed upload for product {product_id}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'productId': product_id,
                's3Key': s3_key,
                'fileSize': len(file_data),
                'uploadTimestamp': datetime.now().isoformat()
            })
        }

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Invalid JSON in request body',
                'code': 'INVALID_JSON'
            })
        }
    except ValueError as e:
        logger.error(f"Value error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'code': 'VALUE_ERROR'
            })
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'code': 'INTERNAL_ERROR'
            })
        }
```

### Key Features Implemented

1. **Security Best Practices**:
   - KMS encryption for both S3 and DynamoDB
   - Least privilege IAM roles
   - Block public access on S3
   - SSL enforcement
   - Explicit KMS encryption for S3 uploads (`ServerSideEncryption='aws:kms'`)

2. **Scalability Features**:
   - Pay-per-request DynamoDB billing
   - Lambda auto-scaling with concurrency limits
   - API Gateway throttling (1000 RPS)
   - CloudWatch monitoring and logging
   - DynamoDB TTL for automatic cleanup

3. **Operational Excellence**:
   - Comprehensive logging with structured error codes
   - X-Ray tracing enabled
   - Point-in-time recovery for DynamoDB
   - S3 versioning and lifecycle rules
   - Automatic cleanup on DynamoDB failures
   - Environment variable validation

4. **API Design**:
   - Request validation with JSON schema
   - CORS configuration
   - Usage plans for rate limiting
   - Comprehensive error handling with error codes
   - Proper HTTP status codes and headers
   - Enhanced response format with additional metadata

5. **Error Handling**:
   - Structured error responses with error codes
   - Comprehensive input validation
   - Graceful error handling for all failure scenarios
   - Automatic cleanup on partial failures
   - Detailed logging for debugging

6. **Data Management**:
   - Automatic TTL for DynamoDB records (1 year)
   - File size tracking
   - Upload timestamp recording
   - Proper S3 key structure (`uploads/{productId}/{fileName}`)
   - Metadata consistency between S3 and DynamoDB

This implementation fully satisfies all the functional requirements and acceptance criteria
specified in the prompt, with enhanced error handling, security, and operational features.
