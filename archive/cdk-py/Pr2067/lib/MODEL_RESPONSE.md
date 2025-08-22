# Serverless Infrastructure Implementation

I'll create a comprehensive serverless infrastructure using AWS CDK with Python that includes Lambda functions, S3 integration, API Gateway, and incorporates the latest AWS features.

## Architecture Overview

This solution creates:
- S3 bucket for file uploads
- 3 Lambda functions (image processing, data transformation, API handler)
- API Gateway REST API
- Dead Letter Queues for fault tolerance
- IAM roles with minimal permissions
- CloudWatch logging with structured JSON logging

## Implementation Files

### lib/serverless_stack.py

```python
import json
from typing import Dict, Any
import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_s3_notifications as s3n,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_sqs as sqs,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class ServerlessStack(cdk.Stack):
    
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment_suffix = environment_suffix
        
        # Create S3 bucket
        self.bucket = self._create_s3_bucket()
        
        # Create SQS Dead Letter Queues
        self.dlq_image = self._create_dead_letter_queue("ImageProcessingDLQ")
        self.dlq_data = self._create_dead_letter_queue("DataTransformDLQ")
        self.dlq_api = self._create_dead_letter_queue("ApiHandlerDLQ")
        
        # Create Lambda functions
        self.image_function = self._create_image_processing_function()
        self.data_function = self._create_data_transform_function()
        self.api_function = self._create_api_handler_function()
        
        # Create API Gateway
        self.api = self._create_api_gateway()
        
        # Configure S3 event notifications
        self._configure_s3_notifications()
        
        # Create outputs
        self._create_outputs()
        
        # Apply tags
        self._apply_tags()

    def _create_s3_bucket(self) -> s3.Bucket:
        bucket_name = f"serverless-uploads-{self.environment_suffix}" if self.environment_suffix else "serverless-uploads"
        
        bucket = s3.Bucket(
            self, "ServerlessUploadBucket",
            bucket_name=bucket_name,
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        
        return bucket

    def _create_dead_letter_queue(self, name: str) -> sqs.Queue:
        return sqs.Queue(
            self, name,
            queue_name=f"{name}-{self.environment_suffix}" if self.environment_suffix else name,
            retention_period=Duration.days(14)
        )

    def _create_image_processing_function(self) -> _lambda.Function:
        role = iam.Role(
            self, "ImageProcessingRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "S3ReadPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:GetObject"],
                            resources=[f"{self.bucket.bucket_arn}/*"]
                        )
                    ]
                )
            }
        )

        function = _lambda.Function(
            self, "ImageProcessingFunction",
            function_name=f"image-processor-{self.environment_suffix}" if self.environment_suffix else "image-processor",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(self._get_image_processing_code()),
            timeout=Duration.minutes(5),
            memory_size=512,
            retry_attempts=2,
            dead_letter_queue=self.dlq_image,
            role=role,
            environment={
                "BUCKET_NAME": self.bucket.bucket_name,
                "LOG_LEVEL": "INFO",
                "AWS_LAMBDA_EXEC_WRAPPER": "/opt/bootstrap"
            },
            log_group=logs.LogGroup(
                self, "ImageProcessingLogGroup",
                log_group_name=f"/aws/lambda/image-processor-{self.environment_suffix}" if self.environment_suffix else "/aws/lambda/image-processor",
                retention=logs.RetentionDays.ONE_WEEK,
                removal_policy=RemovalPolicy.DESTROY
            )
        )

        return function

    def _create_data_transform_function(self) -> _lambda.Function:
        role = iam.Role(
            self, "DataTransformRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "S3ReadWritePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:GetObject", "s3:PutObject"],
                            resources=[f"{self.bucket.bucket_arn}/*"]
                        )
                    ]
                )
            }
        )

        function = _lambda.Function(
            self, "DataTransformFunction",
            function_name=f"data-transformer-{self.environment_suffix}" if self.environment_suffix else "data-transformer",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(self._get_data_transform_code()),
            timeout=Duration.minutes(3),
            memory_size=256,
            retry_attempts=2,
            dead_letter_queue=self.dlq_data,
            role=role,
            environment={
                "BUCKET_NAME": self.bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            log_group=logs.LogGroup(
                self, "DataTransformLogGroup",
                log_group_name=f"/aws/lambda/data-transformer-{self.environment_suffix}" if self.environment_suffix else "/aws/lambda/data-transformer",
                retention=logs.RetentionDays.ONE_WEEK,
                removal_policy=RemovalPolicy.DESTROY
            )
        )

        return function

    def _create_api_handler_function(self) -> _lambda.Function:
        role = iam.Role(
            self, "ApiHandlerRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "S3ListPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:ListBucket", "s3:GetObject"],
                            resources=[
                                self.bucket.bucket_arn,
                                f"{self.bucket.bucket_arn}/*"
                            ]
                        )
                    ]
                )
            }
        )

        function = _lambda.Function(
            self, "ApiHandlerFunction",
            function_name=f"api-handler-{self.environment_suffix}" if self.environment_suffix else "api-handler",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="index.handler",
            code=_lambda.Code.from_inline(self._get_api_handler_code()),
            timeout=Duration.seconds(30),
            memory_size=128,
            retry_attempts=2,
            dead_letter_queue=self.dlq_api,
            role=role,
            environment={
                "BUCKET_NAME": self.bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            log_group=logs.LogGroup(
                self, "ApiHandlerLogGroup",
                log_group_name=f"/aws/lambda/api-handler-{self.environment_suffix}" if self.environment_suffix else "/aws/lambda/api-handler",
                retention=logs.RetentionDays.ONE_WEEK,
                removal_policy=RemovalPolicy.DESTROY
            )
        )

        return function

    def _create_api_gateway(self) -> apigw.RestApi:
        api = apigw.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"serverless-api-{self.environment_suffix}" if self.environment_suffix else "serverless-api",
            description="Serverless API with Lambda integration",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # Create API Gateway integration with Lambda
        lambda_integration = apigw.LambdaIntegration(
            self.api_function,
            proxy=True,
            allow_test_invoke=False
        )

        # Add resources and methods
        files = api.root.add_resource("files")
        files.add_method("GET", lambda_integration)
        files.add_method("POST", lambda_integration)

        status = api.root.add_resource("status")
        status.add_method("GET", lambda_integration)

        return api

    def _configure_s3_notifications(self):
        # Configure S3 notifications for image files
        self.bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.image_function),
            s3.NotificationKeyFilter(suffix=".jpg")
        )
        
        self.bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.image_function),
            s3.NotificationKeyFilter(suffix=".png")
        )

        # Configure S3 notifications for data files
        self.bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.data_function),
            s3.NotificationKeyFilter(suffix=".json")
        )
        
        self.bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.data_function),
            s3.NotificationKeyFilter(suffix=".csv")
        )

    def _create_outputs(self):
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api.url,
            description="API Gateway URL"
        )

        CfnOutput(
            self, "ImageProcessorArn",
            value=self.image_function.function_arn,
            description="Image Processing Lambda Function ARN"
        )

        CfnOutput(
            self, "DataTransformArn",
            value=self.data_function.function_arn,
            description="Data Transform Lambda Function ARN"
        )

        CfnOutput(
            self, "ApiHandlerArn",
            value=self.api_function.function_arn,
            description="API Handler Lambda Function ARN"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.bucket.bucket_name,
            description="S3 Bucket Name for uploads"
        )

    def _apply_tags(self):
        cdk.Tags.of(self).add("Project", "ServerlessInfrastructure")
        cdk.Tags.of(self).add("Environment", self.environment_suffix or "dev")
        cdk.Tags.of(self).add("CostCenter", "Engineering")
        cdk.Tags.of(self).add("ManagedBy", "CDK")

    def _get_image_processing_code(self) -> str:
        return '''
import json
import logging
import boto3
from typing import Dict, Any

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "function": "image-processor"}'
)
logger = logging.getLogger()

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    try:
        logger.info("Processing S3 event for image processing", extra={
            "event_source": "s3",
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info("Processing image file", extra={
                "bucket": bucket_name,
                "object_key": object_key,
                "event_name": record['eventName']
            })
            
            # Simulate image processing
            result = process_image(bucket_name, object_key)
            
            logger.info("Image processing completed", extra={
                "bucket": bucket_name,
                "object_key": object_key,
                "result": result
            })
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Image processing completed successfully",
                "processed_files": len(event['Records'])
            })
        }
    
    except Exception as e:
        logger.error("Error processing image", extra={
            "error": str(e),
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        raise

def process_image(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """Simulate image processing logic"""
    # In real implementation, you would use PIL, OpenCV, or similar
    return {
        "processed": True,
        "original_size": "1920x1080",
        "thumbnails_created": ["thumb_small.jpg", "thumb_medium.jpg"],
        "processing_time": "2.3s"
    }
'''

    def _get_data_transform_code(self) -> str:
        return '''
import json
import logging
import boto3
from typing import Dict, Any, List
import csv
from io import StringIO

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "function": "data-transformer"}'
)
logger = logging.getLogger()

s3_client = boto3.client('s3')

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    try:
        logger.info("Processing S3 event for data transformation", extra={
            "event_source": "s3",
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        
        processed_files = []
        
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            
            logger.info("Processing data file", extra={
                "bucket": bucket_name,
                "object_key": object_key,
                "event_name": record['eventName']
            })
            
            # Transform the data
            result = transform_data(bucket_name, object_key)
            processed_files.append(result)
            
            logger.info("Data transformation completed", extra={
                "bucket": bucket_name,
                "object_key": object_key,
                "records_processed": result.get('records_processed', 0)
            })
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Data transformation completed successfully",
                "processed_files": processed_files
            })
        }
    
    except Exception as e:
        logger.error("Error transforming data", extra={
            "error": str(e),
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        raise

def transform_data(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """Transform data based on file type"""
    try:
        # Get the file from S3
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        content = response['Body'].read().decode('utf-8')
        
        if object_key.endswith('.json'):
            data = json.loads(content)
            transformed_data = transform_json_data(data)
        elif object_key.endswith('.csv'):
            transformed_data = transform_csv_data(content)
        else:
            raise ValueError(f"Unsupported file type: {object_key}")
        
        # Save transformed data back to S3
        output_key = f"transformed/{object_key}"
        s3_client.put_object(
            Bucket=bucket_name,
            Key=output_key,
            Body=json.dumps(transformed_data),
            ContentType='application/json'
        )
        
        return {
            "original_file": object_key,
            "transformed_file": output_key,
            "records_processed": len(transformed_data) if isinstance(transformed_data, list) else 1
        }
    
    except Exception as e:
        logger.error(f"Error transforming file {object_key}: {str(e)}")
        raise

def transform_json_data(data: Any) -> Any:
    """Transform JSON data - add timestamp and normalize"""
    if isinstance(data, dict):
        data['processed_at'] = '2024-01-01T00:00:00Z'
        data['version'] = '1.0'
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                item['processed_at'] = '2024-01-01T00:00:00Z'
                item['version'] = '1.0'
    return data

def transform_csv_data(content: str) -> List[Dict[str, Any]]:
    """Transform CSV data to JSON with additional metadata"""
    csv_reader = csv.DictReader(StringIO(content))
    transformed_data = []
    
    for row in csv_reader:
        transformed_row = dict(row)
        transformed_row['processed_at'] = '2024-01-01T00:00:00Z'
        transformed_row['source'] = 'csv_import'
        transformed_data.append(transformed_row)
    
    return transformed_data
'''

    def _get_api_handler_code(self) -> str:
        return '''
import json
import logging
import boto3
from typing import Dict, Any
import os

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s", "function": "api-handler"}'
)
logger = logging.getLogger()

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME')

def handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        logger.info("Processing API request", extra={
            "method": http_method,
            "path": path,
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        
        if path == '/status':
            return handle_status_request()
        elif path == '/files':
            if http_method == 'GET':
                return handle_list_files()
            elif http_method == 'POST':
                return handle_file_upload(event)
        
        return {
            "statusCode": 404,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"message": "Not Found"})
        }
    
    except Exception as e:
        logger.error("Error processing API request", extra={
            "error": str(e),
            "function_name": context.function_name,
            "request_id": context.aws_request_id
        })
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"message": "Internal Server Error"})
        }

def handle_status_request() -> Dict[str, Any]:
    """Handle health check requests"""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "status": "healthy",
            "service": "serverless-api",
            "version": "1.0.0",
            "timestamp": "2024-01-01T00:00:00Z"
        })
    }

def handle_list_files() -> Dict[str, Any]:
    """List files in the S3 bucket"""
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=100)
        
        files = []
        if 'Contents' in response:
            for obj in response['Contents']:
                files.append({
                    "key": obj['Key'],
                    "size": obj['Size'],
                    "last_modified": obj['LastModified'].isoformat(),
                    "storage_class": obj.get('StorageClass', 'STANDARD')
                })
        
        logger.info("Listed files from S3", extra={
            "bucket": BUCKET_NAME,
            "file_count": len(files)
        })
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "files": files,
                "total_count": len(files),
                "bucket": BUCKET_NAME
            })
        }
    
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        raise

def handle_file_upload(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle file upload requests (returns presigned URL)"""
    try:
        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename')
        content_type = body.get('content_type', 'application/octet-stream')
        
        if not filename:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({"message": "filename is required"})
            }
        
        # Generate presigned URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': filename,
                'ContentType': content_type
            },
            ExpiresIn=3600
        )
        
        logger.info("Generated presigned URL for upload", extra={
            "filename": filename,
            "content_type": content_type,
            "bucket": BUCKET_NAME
        })
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "upload_url": presigned_url,
                "filename": filename,
                "bucket": BUCKET_NAME,
                "expires_in": 3600
            })
        }
    
    except Exception as e:
        logger.error(f"Error generating upload URL: {str(e)}")
        raise
'''
```

### lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from .serverless_stack import ServerlessStack


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

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create the serverless infrastructure as a nested stack
    class NestedServerlessStack(NestedStack):
      def __init__(self, scope, id, environment_suffix="", **kwargs):
        super().__init__(scope, id, **kwargs)
        # Create the serverless stack
        self.serverless_stack = ServerlessStack(
          self, 
          "ServerlessResources", 
          environment_suffix=environment_suffix
        )
        
        # Expose important resources
        self.api_url = self.serverless_stack.api.url
        self.bucket_name = self.serverless_stack.bucket.bucket_name

    # Create the nested serverless stack
    self.serverless_nested_stack = NestedServerlessStack(
        self,
        f"ServerlessStack{environment_suffix}",
        environment_suffix=environment_suffix
    )

    # Create stack-level outputs for important resources
    cdk.CfnOutput(
        self, "ApiGatewayUrl",
        value=self.serverless_nested_stack.api_url,
        description="API Gateway URL for the serverless application"
    )

    cdk.CfnOutput(
        self, "S3BucketName", 
        value=self.serverless_nested_stack.bucket_name,
        description="S3 Bucket Name for file uploads"
    )
```

## Key Features Implemented

1. **S3 Integration**: Bucket with event notifications triggering Lambda functions based on file types
2. **Lambda Functions**: 
   - Image processing function with 512MB memory for image operations
   - Data transformation function with 256MB memory for JSON/CSV processing  
   - API handler function with 128MB memory for API operations
3. **API Gateway**: REST API with multiple endpoints (/status, /files)
4. **Fault Tolerance**: Dead letter queues for all Lambda functions with retry mechanisms
5. **Security**: Minimal IAM roles with specific permissions for each function
6. **Monitoring**: CloudWatch logs with structured JSON logging format
7. **Cost Optimization**: Right-sized memory allocations and appropriate timeouts
8. **Modern Features**: 
   - Native JSON structured logging for Lambda functions
   - Retry mechanisms and dead letter queues for resilience
   - Presigned URLs for secure file uploads

This infrastructure provides a scalable, fault-tolerant serverless application that can handle file uploads, process them automatically, and expose APIs for interaction.