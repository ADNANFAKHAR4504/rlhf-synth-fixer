## Ideal response

```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
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

    This stack creates a serverless image processing application with Lambda, API Gateway, 
    DynamoDB, and S3 based on the MODEL_RESPONSE requirements:
    - Lambda function for image uploads and retrieval (GET and POST methods)
    - DynamoDB table with imageId as partition key and timestamp as sort key
    - S3 bucket with versioning and CORS for image storage
    - API Gateway with full CORS support for GET and POST methods
    - CloudWatch logging for both Lambda and API Gateway
    - Least privilege IAM permissions

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        self.environment_suffix = environment_suffix

        # ==================== S3 Bucket for Image Storage ====================
        image_bucket = s3.Bucket(
            self,
            "ImageStorageBucket",
            bucket_name=f"serverless-images-{environment_suffix}-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix != "prod" else RemovalPolicy.RETAIN,
            auto_delete_objects=True if environment_suffix != "prod" else False,
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

        # ==================== DynamoDB Table for Image Metadata ====================
        metadata_table = dynamodb.Table(
            self,
            "ImageMetadataTable",
            table_name=f"image-metadata-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="imageId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix != "prod" else RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # Add Global Secondary Index for user-based queries
        metadata_table.add_global_secondary_index(
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

        # ==================== IAM Role for Lambda with Least Privilege ====================
        lambda_role = iam.Role(
            self,
            "ImageProcessorRole",
            role_name=f"image-processor-role-{environment_suffix}",
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

        # ==================== Lambda Function with Inline Code ====================
        lambda_code = '''
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
'''

        # Create Lambda function
        image_processor = lambda_.Function(
            self,
            "ImageProcessor",
            function_name=f"image-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline(lambda_code),
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
            log_retention=logs.RetentionDays.ONE_WEEK,
            description="Processes image uploads and retrieves metadata"
        )

        # ==================== API Gateway with Full CORS Support ====================
        # Create REST API with logging
        api = apigateway.RestApi(
            self,
            "ImageProcessingAPI",
            rest_api_name=f"image-processing-api-{environment_suffix}",
            description="API for serverless image processing",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                tracing_enabled=True
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
            proxy=True
        )

        # Create /images resource
        images_resource = api.root.add_resource("images")
        
        # Add GET method for listing images
        images_resource.add_method("GET", lambda_integration)
        
        # Add POST method for uploading images
        images_resource.add_method("POST", lambda_integration)

        # Create /images/{id} resource for specific image operations
        image_item_resource = images_resource.add_resource("{id}")
        
        # Add GET method for specific image
        image_item_resource.add_method("GET", lambda_integration)

        # ==================== CloudFormation Outputs ====================
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=image_bucket.bucket_name,
            description="S3 bucket name for image storage",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=metadata_table.table_name,
            description="DynamoDB table name for image metadata",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=image_processor.function_name,
            description="Lambda function name",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=image_processor.function_arn,
            description="Lambda function ARN",
        )

        # Store references for potential use
        self.api_url = api.url
        self.table_name = metadata_table.table_name
        self.bucket_name = image_bucket.bucket_name
        self.lambda_function = image_processor

        # ==================== Resource Tags ====================
        cdk.Tags.of(self).add("Environment", environment_suffix)
        cdk.Tags.of(self).add("Project", "serverless-image-processing")
        cdk.Tags.of(self).add("ManagedBy", "CDK")


```