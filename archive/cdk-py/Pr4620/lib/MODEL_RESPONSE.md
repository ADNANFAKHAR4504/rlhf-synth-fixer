### Reasoning Trace
---

The user wants a fully serverless image processing application using AWS CDK in Python. Let me break down the requirements:

1. **Lambda function** that:
   - Handles image uploads (POST)
   - Retrieves stored images/metadata (GET)
   - Interacts with S3 for storage
   - Stores metadata in DynamoDB (image ID, timestamp, user info)

2. **API Gateway**:
   - Exposes Lambda through REST API
   - Supports GET and POST methods
   - CORS enabled for any origin
   - Proper error handling with HTTP status codes

3. **Storage**:
   - S3 bucket for image storage
   - DynamoDB table for metadata

4. **Security**:
   - IAM roles with least privilege
   - Lambda should only have necessary permissions for S3 and DynamoDB

5. **Monitoring**:
   - CloudWatch logs for Lambda and API Gateway
   - Log key events (data received, process start/end, errors)

6. **Error handling**:
   - Graceful error management
   - Proper HTTP status codes

I'll create a complete CDK stack in Python that includes:
- The CDK stack definition
- The Lambda function code
- All necessary IAM permissions
- Proper error handling and logging
### Answer 
---

I'll help you create a fully serverless image processing application using AWS CDK in Python. This solution includes a Lambda function for image processing, API Gateway for HTTP endpoints, S3 for storage, DynamoDB for metadata, and proper security/logging configurations.

## Project Structure

```
project/
├── main.py                 # CDK Stack definition
├── lambda/
│   └── image_handler.py    # Lambda function code
├── requirements.txt        # Python dependencies
└── cdk.json               # CDK configuration
```

## main.py - CDK Stack

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_iam as iam,
)
from constructs import Construct


class ServerlessImageProcessingStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ==================== S3 Bucket ====================
        # Create S3 bucket for image storage
        image_bucket = s3.Bucket(
            self, "ImageStorageBucket",
            bucket_name=f"serverless-images-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test only
            auto_delete_objects=True,  # For dev/test only
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD
                    ],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

        # ==================== DynamoDB Table ====================
        # Create DynamoDB table for image metadata
        metadata_table = dynamodb.Table(
            self, "ImageMetadataTable",
            table_name="image-metadata",
            partition_key=dynamodb.Attribute(
                name="imageId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test only
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            # Add global secondary index for user-based queries
            global_secondary_indexes=[
                dynamodb.GlobalSecondaryIndex(
                    index_name="UserIndex",
                    partition_key=dynamodb.Attribute(
                        name="userId",
                        type=dynamodb.AttributeType.STRING
                    ),
                    sort_key=dynamodb.Attribute(
                        name="timestamp",
                        type=dynamodb.AttributeType.NUMBER
                    ),
                    projection_type=dynamodb.ProjectionType.ALL
                )
            ]
        )

        # ==================== Lambda Function ====================
        # Create Lambda execution role with least privilege
        lambda_role = iam.Role(
            self, "ImageProcessorRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for image processing Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific S3 permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    image_bucket.bucket_arn,
                    f"{image_bucket.bucket_arn}/*"
                ]
            )
        )

        # Add specific DynamoDB permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                resources=[
                    metadata_table.table_arn,
                    f"{metadata_table.table_arn}/index/*"
                ]
            )
        )

        # Create CloudWatch log group for Lambda
        lambda_log_group = logs.LogGroup(
            self, "ImageProcessorLogs",
            log_group_name="/aws/lambda/image-processor",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Lambda function
        image_processor = lambda_.Function(
            self, "ImageProcessor",
            function_name="image-processor",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="image_handler.handler",
            code=lambda_.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "BUCKET_NAME": image_bucket.bucket_name,
                "TABLE_NAME": metadata_table.table_name,
                "LOG_LEVEL": "INFO",
                "REGION": self.region
            },
            tracing=lambda_.Tracing.ACTIVE,
            log_group=lambda_log_group,
            description="Processes image uploads and retrieves metadata"
        )

        # ==================== API Gateway ====================
        # Create CloudWatch log group for API Gateway
        api_log_group = logs.LogGroup(
            self, "ApiGatewayLogs",
            log_group_name="/aws/api-gateway/image-api",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create REST API with logging
        api = apigateway.RestApi(
            self, "ImageProcessingAPI",
            rest_api_name="image-processing-api",
            description="API for serverless image processing",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                tracing_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "X-Amz-User-Agent"
                ],
                allow_credentials=False,
                max_age=Duration.seconds(3000)
            ),
            binary_media_types=["image/*", "multipart/form-data"]
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            image_processor,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )

        # Create /images resource
        images_resource = api.root.add_resource("images")
        
        # Add GET method
        images_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )
        
        # Add POST method
        images_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Create /images/{id} resource for specific image operations
        image_item_resource = images_resource.add_resource("{id}")
        
        # Add GET method for specific image
        image_item_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # ==================== Outputs ====================
        # Output important values
        self.output_values = {
            "API_ENDPOINT": api.url,
            "BUCKET_NAME": image_bucket.bucket_name,
            "TABLE_NAME": metadata_table.table_name,
            "LAMBDA_FUNCTION": image_processor.function_name
        }

        for key, value in self.output_values.items():
            print(f"{key}: {value}")


# ==================== CDK App ====================
app = App()
ServerlessImageProcessingStack(
    app,
    "ServerlessImageProcessingStack",
    description="Serverless image processing application with API Gateway, Lambda, S3, and DynamoDB"
)
app.synth()
```

## lambda/image_handler.py - Lambda Function

```python
import json
import os
import base64
import uuid
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']
REGION = os.environ['REGION']

# DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for image processing
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Route based on method and path
        if path == '/images':
            if http_method == 'GET':
                return handle_list_images(query_parameters)
            elif http_method == 'POST':
                return handle_upload_image(event)
            else:
                return create_response(405, {'error': 'Method not allowed'})
                
        elif path.startswith('/images/') and path_parameters:
            image_id = path_parameters.get('id')
            if http_method == 'GET':
                return handle_get_image(image_id, query_parameters)
            else:
                return create_response(405, {'error': 'Method not allowed'})
                
        else:
            return create_response(404, {'error': 'Resource not found'})
            
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        return create_response(500, {
            'error': 'Internal server error',
            'message': str(e)
        })


def handle_upload_image(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle POST request to upload an image
    """
    try:
        logger.info("Processing image upload request")
        
        # Validate request body
        if not event.get('body'):
            return create_response(400, {'error': 'Request body is required'})
        
        # Parse request body
        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Validate required fields
        required_fields = ['image_data', 'content_type', 'user_id']
        missing_fields = [field for field in required_fields if field not in body]
        
        if missing_fields:
            return create_response(400, {
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            })
        
        # Extract data
        image_data_base64 = body['image_data']
        content_type = body['content_type']
        user_id = body['user_id']
        image_name = body.get('image_name', 'unnamed')
        tags = body.get('tags', {})
        
        # Validate content type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if content_type not in allowed_types:
            return create_response(400, {
                'error': 'Invalid content type',
                'allowed_types': allowed_types
            })
        
        # Decode base64 image
        try:
            image_data = base64.b64decode(image_data_base64)
        except Exception as e:
            return create_response(400, {'error': 'Invalid base64 image data'})
        
        # Generate unique image ID
        image_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)
        
        # Determine file extension
        extension_map = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp'
        }
        extension = extension_map.get(content_type, '.jpg')
        s3_key = f"images/{user_id}/{image_id}{extension}"
        
        logger.info(f"Uploading image to S3: {s3_key}")
        
        # Upload to S3
        try:
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=image_data,
                ContentType=content_type,
                Metadata={
                    'user_id': user_id,
                    'image_name': image_name,
                    'upload_timestamp': str(timestamp)
                }
            )
            logger.info(f"Successfully uploaded image to S3: {s3_key}")
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            return create_response(500, {'error': 'Failed to upload image to S3'})
        
        # Prepare metadata for DynamoDB
        metadata = {
            'imageId': image_id,
            'timestamp': timestamp,
            'userId': user_id,
            'imageName': image_name,
            's3Key': s3_key,
            'contentType': content_type,
            'uploadDate': datetime.utcnow().isoformat(),
            'tags': tags,
            'bucketName': BUCKET_NAME,
            'region': REGION,
            'size': len(image_data)
        }
        
        logger.info(f"Storing metadata in DynamoDB: {image_id}")
        
        # Store metadata in DynamoDB
        try:
            table.put_item(Item=metadata)
            logger.info(f"Successfully stored metadata for image: {image_id}")
        except ClientError as e:
            logger.error(f"Failed to store metadata in DynamoDB: {str(e)}")
            # Try to clean up S3 object
            try:
                s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
            except:
                pass
            return create_response(500, {'error': 'Failed to store image metadata'})
        
        # Generate presigned URL for accessing the image
        presigned_url = generate_presigned_url(s3_key)
        
        return create_response(201, {
            'message': 'Image uploaded successfully',
            'imageId': image_id,
            'url': presigned_url,
            'metadata': metadata
        })
        
    except Exception as e:
        logger.error(f"Error in handle_upload_image: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Failed to process image upload'})


def handle_get_image(image_id: str, query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle GET request for a specific image
    """
    try:
        logger.info(f"Retrieving image: {image_id}")
        
        # Query DynamoDB for image metadata
        response = table.query(
            KeyConditionExpression='imageId = :id',
            ExpressionAttributeValues={':id': image_id},
            Limit=1
        )
        
        if not response.get('Items'):
            return create_response(404, {'error': 'Image not found'})
        
        metadata = response['Items'][0]
        
        # Generate presigned URL if requested
        if query_params.get('url') == 'true':
            presigned_url = generate_presigned_url(metadata['s3Key'])
            metadata['url'] = presigned_url
        
        logger.info(f"Successfully retrieved image metadata: {image_id}")
        
        return create_response(200, {
            'imageId': image_id,
            'metadata': metadata
        })
        
    except Exception as e:
        logger.error(f"Error in handle_get_image: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Failed to retrieve image'})


def handle_list_images(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    Handle GET request to list images
    """
    try:
        logger.info("Listing images")
        
        user_id = query_params.get('userId')
        limit = int(query_params.get('limit', '20'))
        limit = min(limit, 100)  # Cap at 100 items
        
        if user_id:
            # Query by user ID using GSI
            logger.info(f"Querying images for user: {user_id}")
            response = table.query(
                IndexName='UserIndex',
                KeyConditionExpression='userId = :uid',
                ExpressionAttributeValues={':uid': user_id},
                Limit=limit,
                ScanIndexForward=False  # Most recent first
            )
        else:
            # Scan all images (limited)
            logger.info("Scanning all images")
            response = table.scan(Limit=limit)
        
        items = response.get('Items', [])
        
        # Add presigned URLs if requested
        if query_params.get('urls') == 'true':
            for item in items:
                item['url'] = generate_presigned_url(item['s3Key'])
        
        logger.info(f"Successfully retrieved {len(items)} images")
        
        return create_response(200, {
            'images': items,
            'count': len(items),
            'hasMore': response.get('LastEvaluatedKey') is not None
        })
        
    except Exception as e:
        logger.error(f"Error in handle_list_images: {str(e)}", exc_info=True)
        return create_response(500, {'error': 'Failed to list images'})


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> Optional[str]:
    """
    Generate a presigned URL for S3 object access
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': s3_key},
            ExpiresIn=expiration
        )
        return url
    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {str(e)}")
        return None


def create_response(status_code: int, body: Any) -> Dict[str, Any]:
    """
    Create a properly formatted API Gateway response
    """
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(body, default=str)
    }
    
    # Log response (without body for large responses)
    log_response = {**response, 'body': f"<{len(response['body'])} chars>"}
    logger.info(f"Returning response: {json.dumps(log_response)}")
    
    return response
```

## requirements.txt

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.28.0
```

## cdk.json

```json
{
  "app": "python3 main.py",
  "watch": {
    "include": [
      "**"
    ],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap
```

3. **Deploy the stack:**
```bash
cdk deploy
```

## API Usage Examples

### Upload an image (POST):
```bash
curl -X POST https://your-api-gateway-url/images \
  -H "Content-Type: application/json" \
  -d '{
    "image_data": "base64_encoded_image_data_here",
    "content_type": "image/jpeg",
    "user_id": "user123",
    "image_name": "vacation_photo.jpg",
    "tags": {"location": "beach", "year": "2024"}
  }'
```

### Get image metadata (GET):
```bash
curl https://your-api-gateway-url/images/{image-id}?url=true
```

### List all images for a user (GET):
```bash
curl https://your-api-gateway-url/images?userId=user123&limit=10&urls=true
```

## Key Features Implemented

### Security:
- **Least privilege IAM roles** - Lambda only has specific permissions for S3 and DynamoDB operations
- **Encrypted storage** - Both S3 and DynamoDB use encryption
- **No public access** - S3 bucket blocks all public access
- **Secure API** - CORS configured, proper error handling

### Monitoring:
- **CloudWatch Logs** - Separate log groups for Lambda and API Gateway
- **Structured logging** - JSON format with detailed information
- **X-Ray tracing** - Enabled for debugging and performance monitoring
- **Detailed access logs** - API Gateway logs all requests

### Error Handling:
- **Validation** - Input validation before processing
- **Proper HTTP status codes** - 200, 201, 400, 404, 405, 500
- **Graceful failure** - Rollback operations on failure
- **Detailed error messages** - Clear error responses for debugging

### Performance:
- **DynamoDB on-demand** - Auto-scaling for any load
- **S3 presigned URLs** - Direct access to images without Lambda overhead
- **Global Secondary Index** - Efficient user-based queries
- **Optimized Lambda** - 512MB memory, 30-second timeout

This complete solution provides a production-ready serverless image processing application with all the requested features!