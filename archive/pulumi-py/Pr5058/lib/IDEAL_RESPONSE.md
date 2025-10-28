## File: tap.py

```python
"""
Pulumi program entry point for serverless infrastructure.

This is the main entry point that Pulumi executes to deploy
the serverless infrastructure.
"""

import os
import sys

import pulumi

# Add lib directory to Python path for imports
lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

# Now import from the lib directory
from infrastructure.config import initialize_config
from tap_stack import TapStack

# Initialize configuration from environment variables
config = initialize_config()

# Log environment information
pulumi.log.info(f"Resolved environment suffix: {config.environment_suffix}")
pulumi.log.info(f"Deploying to region: {config.primary_region}")
pulumi.log.info(f"Project name: {config.project_name}")

# Create the main stack
stack = TapStack(
    name="serverless-infra",
    config=config
)

# Outputs are automatically exported by TapStack
pulumi.log.info("Infrastructure deployment complete")

```

## File: lib\*\*init\*\*.py

```python
# empty
```

## File: lib/tap_stack.py

```python
"""
Main TapStack orchestrator for serverless infrastructure.

This module brings together all infrastructure components and
exports outputs for integration testing.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import get_aws_provider
from infrastructure.config import ServerlessConfig, initialize_config
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.notifications import NotificationsStack
from infrastructure.storage import StorageStack
from infrastructure.validation import run_all_validations


class TapStack(pulumi.ComponentResource):
    """
    Main stack orchestrator for serverless infrastructure.

    This component creates and links all infrastructure components:
    - Configuration and validation
    - AWS provider
    - IAM roles and policies
    - DynamoDB tables
    - S3 buckets
    - SNS topics
    - Lambda functions
    - API Gateway
    - CloudWatch monitoring

    All outputs are exported for integration testing.
    """

    def __init__(
        self,
        name: str,
        config: ServerlessConfig,
        opts: pulumi.ResourceOptions = None
    ):
        """
        Initialize TapStack.

        Args:
            name: Stack name
            config: ServerlessConfig instance
            opts: Pulumi resource options
        """
        super().__init__(
            "serverless:stack:TapStack",
            name,
            None,
            opts
        )

        self.config = config

        # Log configuration
        pulumi.log.info(f"Initializing TapStack with environment suffix: {config.environment_suffix}")
        pulumi.log.info(f"Region: {config.primary_region} ({config.region_short})")
        pulumi.log.info(f"Project: {config.project_name}")

        # Run validation
        pulumi.log.info("Running configuration validation...")
        run_all_validations(config)
        pulumi.log.info("Configuration validation passed")

        # Create AWS provider
        self.provider = get_aws_provider(config)

        # Create infrastructure components in dependency order
        pulumi.log.info("Creating IAM roles and policies...")
        self.iam = IAMStack(
            config=config,
            provider=self.provider,
            parent=self
        )

        pulumi.log.info("Creating DynamoDB tables...")
        self.dynamodb = DynamoDBStack(
            config=config,
            provider=self.provider,
            parent=self
        )

        pulumi.log.info("Creating S3 buckets...")
        self.storage = StorageStack(
            config=config,
            provider=self.provider,
            parent=self
        )

        pulumi.log.info("Creating SNS topics...")
        self.notifications = NotificationsStack(
            config=config,
            provider=self.provider,
            parent=self
        )

        pulumi.log.info("Creating Lambda functions...")
        self.lambda_functions = LambdaStack(
            config=config,
            provider=self.provider,
            iam_stack=self.iam,
            dynamodb_stack=self.dynamodb,
            storage_stack=self.storage,
            notifications_stack=self.notifications,
            parent=self
        )

        pulumi.log.info("Creating API Gateway...")
        self.api_gateway = APIGatewayStack(
            config=config,
            provider=self.provider,
            lambda_stack=self.lambda_functions,
            parent=self
        )

        pulumi.log.info("Creating CloudWatch monitoring...")
        self.monitoring = MonitoringStack(
            config=config,
            provider=self.provider,
            lambda_stack=self.lambda_functions,
            dynamodb_stack=self.dynamodb,
            notifications_stack=self.notifications,
            parent=self
        )

        # Attach IAM policies after all resources are created
        pulumi.log.info("Attaching IAM policies...")
        self._attach_iam_policies()

        # Register and export all outputs
        pulumi.log.info("Registering outputs...")
        self._register_outputs()

        pulumi.log.info("TapStack initialization complete")

    def _attach_iam_policies(self) -> None:
        """Attach IAM policies to Lambda roles with least-privilege access."""
        # API Handler policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.api_handler_role,
            self.monitoring.api_handler_log_group.arn,
            "api-handler"
        )
        self.iam.attach_dynamodb_policy(
            self.iam.api_handler_role,
            self.dynamodb.items_table.arn,
            "api-handler",
            read_only=False
        )
        self.iam.attach_sns_policy(
            self.iam.api_handler_role,
            self.notifications.notifications_topic.arn,
            "api-handler"
        )

        # File Processor policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.file_processor_role,
            self.monitoring.file_processor_log_group.arn,
            "file-processor"
        )
        self.iam.attach_s3_policy(
            self.iam.file_processor_role,
            self.storage.files_bucket.arn,
            "file-processor",
            read_only=True
        )
        self.iam.attach_dynamodb_policy(
            self.iam.file_processor_role,
            self.dynamodb.items_table.arn,
            "file-processor",
            read_only=False
        )
        self.iam.attach_sns_policy(
            self.iam.file_processor_role,
            self.notifications.notifications_topic.arn,
            "file-processor"
        )

        # Stream Processor policies
        self.iam.attach_cloudwatch_logs_policy(
            self.iam.stream_processor_role,
            self.monitoring.stream_processor_log_group.arn,
            "stream-processor"
        )
        self.iam.attach_dynamodb_streams_policy(
            self.iam.stream_processor_role,
            self.dynamodb.items_table.arn,
            "stream-processor"
        )
        self.iam.attach_sns_policy(
            self.iam.stream_processor_role,
            self.notifications.notifications_topic.arn,
            "stream-processor"
        )

    def _register_outputs(self) -> None:
        """
        Register and export all stack outputs.

        These outputs are used by integration tests to interact
        with the deployed infrastructure.
        """
        outputs = {
            # Configuration
            "environment": self.config.environment,
            "environment_suffix": self.config.environment_suffix,
            "primary_region": self.config.primary_region,

            # DynamoDB
            "dynamodb_table_name": self.dynamodb.items_table.name,
            "dynamodb_table_arn": self.dynamodb.items_table.arn,

            # S3
            "s3_bucket_name": self.storage.files_bucket.id,
            "s3_bucket_arn": self.storage.files_bucket.arn,

            # SNS
            "sns_topic_arn": self.notifications.notifications_topic.arn,

            # Lambda Functions
            "api_handler_name": self.lambda_functions.api_handler.name,
            "api_handler_arn": self.lambda_functions.api_handler.arn,
            "file_processor_name": self.lambda_functions.file_processor.name,
            "file_processor_arn": self.lambda_functions.file_processor.arn,
            "stream_processor_name": self.lambda_functions.stream_processor.name,
            "stream_processor_arn": self.lambda_functions.stream_processor.arn,

            # API Gateway
            "api_gateway_id": self.api_gateway.rest_api.id,
            "api_gateway_url": self.api_gateway.api_url,

            # CloudWatch
            "api_handler_log_group_name": self.monitoring.api_handler_log_group.name,
            "api_handler_log_group_arn": self.monitoring.api_handler_log_group.arn,
            "file_processor_log_group_name": self.monitoring.file_processor_log_group.name,
            "file_processor_log_group_arn": self.monitoring.file_processor_log_group.arn,
            "stream_processor_log_group_name": self.monitoring.stream_processor_log_group.name,
            "stream_processor_log_group_arn": self.monitoring.stream_processor_log_group.arn,

            # IAM
            "api_handler_role_arn": self.iam.api_handler_role.arn,
            "file_processor_role_arn": self.iam.file_processor_role.arn,
            "stream_processor_role_arn": self.iam.stream_processor_role.arn,
        }

        # Register outputs with component
        self.register_outputs(outputs)

        # Export outputs at stack level for integration tests
        # Use try-except to handle environments where pulumi.export may not be available
        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception as e:
            pulumi.log.warn(f"Could not export outputs: {e}")

```

## File: lib\infrastructure\*\*init\*\*.py

```python
# empty
```

## File: lib\infrastructure\lambda_code\api_handler.py

```python
"""
API Handler Lambda function.

Processes requests from API Gateway and interacts with DynamoDB and SNS.
"""

import json
import os
import time
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', config=boto_config)
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.

    Supports:
    - POST /items: Create new item
    - GET /items: List items by status

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Parse request
        http_method = event.get('httpMethod', 'POST')
        path = event.get('path', '/items')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}

        # Route request
        if http_method == 'POST' and path == '/items':
            return create_item(body)
        elif http_method == 'GET' and path == '/items':
            query_params = event.get('queryStringParameters') or {}
            return list_items(query_params)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Not found'})
            }

    except Exception as e:
        print(f"Error processing request: {str(e)}")

        # Send error notification
        try:
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject="API Handler Error",
                Message=f"Error processing API request: {str(e)}"
            )
        except Exception as sns_error:
            print(f"Error sending SNS notification: {str(sns_error)}")

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }


def create_item(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new item in DynamoDB.

    Args:
        body: Request body with item data

    Returns:
        API Gateway response
    """
    # Generate item data
    item_id = body.get('item_id') or f"item-{int(time.time() * 1000)}"
    timestamp = Decimal(str(time.time()))

    item = {
        'item_id': item_id,
        'timestamp': timestamp,
        'status': body.get('status', 'pending'),
        'data': body.get('data', {}),
        'created_at': timestamp
    }

    # Store in DynamoDB
    table.put_item(Item=item)
    print(f"Created item: {item_id}")

    # Send success notification
    try:
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Item Created",
            Message=f"Successfully created item: {item_id}"
        )
    except Exception as e:
        print(f"Error sending SNS notification: {str(e)}")

    # Convert Decimal to float for JSON serialization
    item['timestamp'] = float(item['timestamp'])
    item['created_at'] = float(item['created_at'])

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'message': 'Item created successfully',
            'item': item
        })
    }


def list_items(query_params: Dict[str, str]) -> Dict[str, Any]:
    """
    List items from DynamoDB.

    Args:
        query_params: Query parameters (status filter)

    Returns:
        API Gateway response
    """
    status = query_params.get('status')

    if status:
        # Query by status using GSI
        response = table.query(
            IndexName='status-timestamp-index',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status},
            Limit=100
        )
    else:
        # Scan all items (limited)
        response = table.scan(Limit=100)

    items = response.get('Items', [])

    # Convert Decimal to float for JSON serialization
    for item in items:
        if 'timestamp' in item:
            item['timestamp'] = float(item['timestamp'])
        if 'created_at' in item:
            item['created_at'] = float(item['created_at'])

    print(f"Retrieved {len(items)} items")

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'count': len(items),
            'items': items
        })
    }


```

## File: lib\infrastructure\lambda_code\file_processor.py

```python
"""
File Processor Lambda function.

Processes files uploaded to S3 and stores metadata in DynamoDB.
"""

import json
import os
import time
from decimal import Decimal
from typing import Any, Dict
from urllib.parse import unquote_plus

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
s3_client = boto3.client('s3', config=boto_config)
dynamodb = boto3.resource('dynamodb', config=boto_config)
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for S3 events.

    Processes file uploads and stores metadata in DynamoDB.

    Args:
        event: S3 event
        context: Lambda context

    Returns:
        Processing result
    """
    print(f"Received event: {json.dumps(event)}")

    processed = 0
    errors = 0
    results = []

    # Process each S3 record
    for record in event.get('Records', []):
        try:
            # Extract S3 information
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])
            size = record['s3']['object']['size']

            print(f"Processing file: s3://{bucket}/{key} ({size} bytes)")

            # Get file metadata
            metadata = s3_client.head_object(Bucket=bucket, Key=key)

            # Store in DynamoDB
            item_id = f"file-{key.replace('/', '-')}"
            timestamp = Decimal(str(time.time()))

            item = {
                'item_id': item_id,
                'timestamp': timestamp,
                'status': 'processed',
                'data': {
                    'bucket': bucket,
                    'key': key,
                    'size': size,
                    'content_type': metadata.get('ContentType', 'unknown'),
                    'etag': metadata.get('ETag', ''),
                },
                'created_at': timestamp
            }

            table.put_item(Item=item)
            print(f"Stored metadata for: {key}")

            # Send success notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="File Processed",
                    Message=f"Successfully processed file: {key} ({size} bytes)"
                )
            except Exception as e:
                print(f"Error sending SNS notification: {str(e)}")

            processed += 1
            results.append({
                'key': key,
                'status': 'success'
            })

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            errors += 1
            results.append({
                'key': record.get('s3', {}).get('object', {}).get('key', 'unknown'),
                'status': 'error',
                'error': str(e)
            })

            # Send error notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="File Processing Error",
                    Message=f"Error processing file: {str(e)}"
                )
            except Exception as sns_error:
                print(f"Error sending SNS notification: {str(sns_error)}")

    return {
        'statusCode': 200 if errors == 0 else 500,
        'processed': processed,
        'errors': errors,
        'results': results
    }


```

## File: lib\infrastructure\lambda_code\requirements.txt

```python
boto3

```

## File: lib\infrastructure\lambda_code\stream_processor.py

```python
"""
Stream Processor Lambda function.

Processes DynamoDB stream events and sends notifications.
"""

import json
import os
from typing import Any, Dict

import boto3
from botocore.config import Config

# Configure boto3 with retries
boto_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
sns_client = boto3.client('sns', config=boto_config)

# Get environment variables
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for DynamoDB stream events.

    Processes stream records and sends notifications for changes.

    Args:
        event: DynamoDB stream event
        context: Lambda context

    Returns:
        Processing result
    """
    print(f"Received {len(event.get('Records', []))} stream records")

    processed = 0
    errors = 0

    # Process each stream record
    for record in event.get('Records', []):
        try:
            event_name = record.get('eventName')

            # Extract item data
            if event_name == 'INSERT':
                new_image = record['dynamodb'].get('NewImage', {})
                item_id = new_image.get('item_id', {}).get('S', 'unknown')
                status = new_image.get('status', {}).get('S', 'unknown')

                message = f"New item created: {item_id} with status: {status}"
                print(message)

                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: INSERT",
                    Message=message
                )

            elif event_name == 'MODIFY':
                old_image = record['dynamodb'].get('OldImage', {})
                new_image = record['dynamodb'].get('NewImage', {})
                item_id = new_image.get('item_id', {}).get('S', 'unknown')
                old_status = old_image.get('status', {}).get('S', 'unknown')
                new_status = new_image.get('status', {}).get('S', 'unknown')

                message = f"Item modified: {item_id} status changed from {old_status} to {new_status}"
                print(message)

                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: MODIFY",
                    Message=message
                )

            elif event_name == 'REMOVE':
                old_image = record['dynamodb'].get('OldImage', {})
                item_id = old_image.get('item_id', {}).get('S', 'unknown')

                message = f"Item removed: {item_id}"
                print(message)

                # Send notification
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="DynamoDB Stream: REMOVE",
                    Message=message
                )

            processed += 1

        except Exception as e:
            print(f"Error processing record: {str(e)}")
            errors += 1

            # Send error notification
            try:
                sns_client.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject="Stream Processing Error",
                    Message=f"Error processing stream record: {str(e)}"
                )
            except Exception as sns_error:
                print(f"Error sending SNS notification: {str(sns_error)}")

    print(f"Processed {processed} records, {errors} errors")

    return {
        'statusCode': 200 if errors == 0 else 500,
        'processed': processed,
        'errors': errors
    }


```

## File: lib\infrastructure\api_gateway.py

```python
"""
API Gateway management for serverless application.

This module creates a REST API with endpoints that trigger Lambda functions.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class APIGatewayStack(pulumi.ComponentResource):
    """
    Manages API Gateway for the serverless application.

    Creates a REST API with:
    - /items endpoint (POST, GET)
    - Lambda integration
    - Deployment and stage
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_stack: 'LambdaStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize API Gateway stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            lambda_stack: Lambda stack with functions
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:apigateway:APIGatewayStack",
            config.get_resource_name("apigateway"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider
        self.lambda_stack = lambda_stack

        # Create REST API
        self.rest_api = self._create_rest_api()

        # Create /items resource
        self.items_resource = self._create_items_resource()

        # Create POST method for /items
        self.post_method, self.post_integration = self._create_post_method()

        # Create GET method for /items
        self.get_method, self.get_integration = self._create_get_method()

        # Grant API Gateway permission to invoke Lambda
        self._grant_lambda_permission()

        # Create deployment and stage
        self.deployment = self._create_deployment()
        self.stage = self._create_stage()

        self.register_outputs({
            "rest_api_id": self.rest_api.id,
            "api_url": self.api_url,
        })

    def _create_rest_api(self) -> aws.apigateway.RestApi:
        """
        Create REST API.

        Returns:
            REST API resource
        """
        return aws.apigateway.RestApi(
            resource_name=self.config.get_resource_name("api"),
            name=self.config.get_resource_name("api"),
            description="Serverless application API",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_items_resource(self) -> aws.apigateway.Resource:
        """
        Create /items resource.

        Returns:
            API Gateway Resource
        """
        return aws.apigateway.Resource(
            resource_name=self.config.get_resource_name("api-resource-items"),
            rest_api=self.rest_api.id,
            parent_id=self.rest_api.root_resource_id,
            path_part="items",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_post_method(self) -> tuple:
        """
        Create POST method for /items.

        Returns:
            Tuple of (Method, Integration)
        """
        # Create method
        method = aws.apigateway.Method(
            resource_name=self.config.get_resource_name("api-method-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        # Create integration
        integration = aws.apigateway.Integration(
            resource_name=self.config.get_resource_name("api-integration-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.api_handler.invoke_arn,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )

        # Create method response
        aws.apigateway.MethodResponse(
            resource_name=self.config.get_resource_name("api-method-response-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            response_models={"application/json": "Empty"},
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )

        # Create integration response
        aws.apigateway.IntegrationResponse(
            resource_name=self.config.get_resource_name("api-integration-response-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[integration]
            )
        )

        return method, integration

    def _create_get_method(self) -> tuple:
        """
        Create GET method for /items.

        Returns:
            Tuple of (Method, Integration)
        """
        # Create method
        method = aws.apigateway.Method(
            resource_name=self.config.get_resource_name("api-method-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        # Create integration
        integration = aws.apigateway.Integration(
            resource_name=self.config.get_resource_name("api-integration-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.api_handler.invoke_arn,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )

        # Create method response
        aws.apigateway.MethodResponse(
            resource_name=self.config.get_resource_name("api-method-response-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            response_models={"application/json": "Empty"},
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )

        # Create integration response
        aws.apigateway.IntegrationResponse(
            resource_name=self.config.get_resource_name("api-integration-response-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[integration]
            )
        )

        return method, integration

    def _grant_lambda_permission(self) -> None:
        """Grant API Gateway permission to invoke Lambda function."""
        aws.lambda_.Permission(
            resource_name=self.config.get_resource_name("api-lambda-permission"),
            action="lambda:InvokeFunction",
            function=self.lambda_stack.api_handler.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.rest_api.execution_arn,
                "/*/*/*"
            ),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_deployment(self) -> aws.apigateway.Deployment:
        """
        Create API deployment.

        Returns:
            API Gateway Deployment
        """
        return aws.apigateway.Deployment(
            resource_name=self.config.get_resource_name("api-deployment"),
            rest_api=self.rest_api.id,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.post_integration,
                    self.get_integration
                ]
            )
        )

    def _create_stage(self) -> aws.apigateway.Stage:
        """
        Create API stage.

        Returns:
            API Gateway Stage
        """
        return aws.apigateway.Stage(
            resource_name=self.config.get_resource_name("api-stage"),
            rest_api=self.rest_api.id,
            deployment=self.deployment.id,
            stage_name=self.config.environment_suffix,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.deployment]
            )
        )

    @property
    def api_url(self) -> pulumi.Output[str]:
        """
        Get the full API Gateway endpoint URL.

        Returns:
            API Gateway URL
        """
        return pulumi.Output.concat(
            self.stage.invoke_url,
            "/items"
        )


```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider management for consistent resource deployment.

This module ensures all resources are deployed to the correct region
with consistent tagging by using a single provider instance.
"""

import pulumi_aws as aws

from .config import ServerlessConfig


def get_aws_provider(config: ServerlessConfig) -> aws.Provider:
    """
    Create and return a consistent AWS provider instance.

    This ensures all resources are deployed to the specified region
    and have consistent default tags applied.

    The provider name is deterministic (no random suffixes) to avoid
    creating new providers on each build, which would cause drift in CI/CD.

    Args:
        config: ServerlessConfig instance with region and tagging info

    Returns:
        AWS Provider instance configured for the target region
    """
    return aws.Provider(
        resource_name=f"aws-provider-{config.region_short}-{config.environment_suffix}",
        region=config.primary_region,
        default_tags=aws.ProviderDefaultTagsArgs(
            tags=config.get_common_tags()
        )
    )


```

## File: lib\infrastructure\config.py

```python
"""
Centralized configuration management for serverless infrastructure.

This module provides configuration management with:
- Environment variable integration
- Resource naming conventions
- Region normalization
- Common tagging
- Validation support
"""

import os
from dataclasses import dataclass
from typing import Dict


@dataclass
class ServerlessConfig:
    """
    Centralized configuration for serverless infrastructure.

    All configuration values are sourced from environment variables
    with sensible defaults to support idempotent deployments.
    """

    # Core configuration
    project_name: str
    environment_suffix: str
    primary_region: str
    environment: str

    # DynamoDB configuration
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    enable_dynamodb_streams: bool

    # Lambda configuration
    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_max_retry_attempts: int

    # S3 configuration
    s3_versioning_enabled: bool
    s3_lifecycle_days: int

    # Monitoring configuration
    enable_monitoring: bool
    alarm_evaluation_periods: int
    error_rate_threshold: float

    # Derived properties
    region_short: str

    def __post_init__(self):
        """Normalize region name after initialization."""
        self.region_short = self.normalize_region(self.primary_region)

    @staticmethod
    def normalize_region(region: str) -> str:
        """
        Normalize AWS region name for use in resource naming.

        Examples:
            us-east-1 -> useast1
            us-west-2 -> uswest2
            eu-west-1 -> euwest1

        Args:
            region: AWS region name

        Returns:
            Normalized region string without hyphens
        """
        return region.replace("-", "")

    @staticmethod
    def normalize_name(name: str) -> str:
        """
        Normalize resource names to be lowercase and hyphen-separated.

        This is especially important for S3 bucket names which are
        case-sensitive and have strict naming requirements.

        Args:
            name: Resource name to normalize

        Returns:
            Normalized name in lowercase with hyphens
        """
        return name.lower().replace("_", "-")

    def get_resource_name(self, resource_type: str) -> str:
        """
        Generate consistent resource names following the pattern:
        {project}-{resource_type}-{region_short}-{environment_suffix}

        Args:
            resource_type: Type of resource (e.g., 'lambda', 'dynamodb', 'api')

        Returns:
            Formatted resource name
        """
        return f"{self.project_name}-{resource_type}-{self.region_short}-{self.environment_suffix}"

    def get_dynamodb_table_name(self, table_type: str) -> str:
        """
        Generate DynamoDB table names.

        Args:
            table_type: Type of table (e.g., 'items', 'users')

        Returns:
            Formatted table name
        """
        return self.get_resource_name(f"table-{table_type}")

    def get_s3_bucket_name(self, bucket_type: str) -> str:
        """
        Generate S3 bucket names with proper normalization.

        S3 bucket names must be lowercase and globally unique.

        Args:
            bucket_type: Type of bucket (e.g., 'files', 'data')

        Returns:
            Normalized bucket name in lowercase
        """
        base_name = f"{self.project_name}-{bucket_type}-{self.region_short}-{self.environment_suffix}"
        return self.normalize_name(base_name)

    def get_lambda_function_name(self, function_type: str) -> str:
        """
        Generate Lambda function names.

        Args:
            function_type: Type of function (e.g., 'api-handler', 'processor')

        Returns:
            Formatted function name
        """
        return self.get_resource_name(function_type)

    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.

        Returns:
            Dictionary of common resource tags
        """
        return {
            "Environment": self.environment,
            "Project": self.project_name,
            "ManagedBy": "Pulumi",
            "Region": self.primary_region,
            "EnvironmentSuffix": self.environment_suffix,
        }


def initialize_config() -> ServerlessConfig:
    """
    Initialize configuration from environment variables.

    This function reads all configuration from environment variables
    to support different deployment environments without code changes.

    Returns:
        ServerlessConfig instance with all configuration loaded
    """
    return ServerlessConfig(
        # Core configuration
        project_name=os.getenv("PROJECT_NAME", "serverless-app"),
        environment_suffix=os.getenv("ENVIRONMENT_SUFFIX", "prod"),
        primary_region=os.getenv("PRIMARY_REGION", os.getenv("AWS_REGION", "us-east-1")),
        environment=os.getenv("ENVIRONMENT", "Production"),

        # DynamoDB configuration
        dynamodb_billing_mode=os.getenv("DYNAMODB_BILLING_MODE", "PAY_PER_REQUEST"),
        dynamodb_read_capacity=int(os.getenv("DYNAMODB_READ_CAPACITY", "5")),
        dynamodb_write_capacity=int(os.getenv("DYNAMODB_WRITE_CAPACITY", "5")),
        enable_dynamodb_streams=os.getenv("ENABLE_DYNAMODB_STREAMS", "true").lower() == "true",

        # Lambda configuration
        lambda_runtime=os.getenv("LAMBDA_RUNTIME", "python3.11"),
        lambda_timeout=int(os.getenv("LAMBDA_TIMEOUT", "180")),
        lambda_memory_size=int(os.getenv("LAMBDA_MEMORY_SIZE", "256")),
        lambda_max_retry_attempts=int(os.getenv("LAMBDA_MAX_RETRY_ATTEMPTS", "2")),

        # S3 configuration
        s3_versioning_enabled=os.getenv("S3_VERSIONING_ENABLED", "true").lower() == "true",
        s3_lifecycle_days=int(os.getenv("S3_LIFECYCLE_DAYS", "30")),

        # Monitoring configuration
        enable_monitoring=os.getenv("ENABLE_MONITORING", "true").lower() == "true",
        alarm_evaluation_periods=int(os.getenv("ALARM_EVALUATION_PERIODS", "2")),
        error_rate_threshold=float(os.getenv("ERROR_RATE_THRESHOLD", "5.0")),

        # region_short will be set in __post_init__
        region_short="",
    )


```

## File: lib\infrastructure\dynamodb.py

```python
"""
DynamoDB table management for serverless application.

This module creates DynamoDB tables with proper configuration
including streams, billing mode, and encryption.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class DynamoDBStack(pulumi.ComponentResource):
    """
    Manages DynamoDB tables for the serverless application.

    Creates tables with:
    - Configurable billing mode (PAY_PER_REQUEST or PROVISIONED)
    - DynamoDB Streams for event-driven processing
    - Server-side encryption
    - Point-in-time recovery
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize DynamoDB stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:dynamodb:DynamoDBStack",
            config.get_resource_name("dynamodb"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider

        # Create items table
        self.items_table = self._create_items_table()

        self.register_outputs({
            "items_table_name": self.items_table.name,
            "items_table_arn": self.items_table.arn,
        })

    def _create_items_table(self) -> aws.dynamodb.Table:
        """
        Create the main items table.

        Schema:
        - Partition key: item_id (String)
        - Sort key: timestamp (Number)
        - GSI: status-timestamp-index for querying by status

        Returns:
            DynamoDB Table resource
        """
        # Build table configuration
        table_config = {
            "resource_name": self.config.get_dynamodb_table_name("items"),
            "name": self.config.get_dynamodb_table_name("items"),
            "hash_key": "item_id",
            "range_key": "timestamp",
            "attributes": [
                aws.dynamodb.TableAttributeArgs(
                    name="item_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="status",
                    type="S"
                ),
            ],
            "global_secondary_indexes": [
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="status-timestamp-index",
                    hash_key="status",
                    range_key="timestamp",
                    projection_type="ALL",
                )
            ],
            "tags": self.config.get_common_tags(),
            "opts": pulumi.ResourceOptions(parent=self, provider=self.provider)
        }

        # Add billing mode configuration
        if self.config.dynamodb_billing_mode == "PROVISIONED":
            table_config["billing_mode"] = "PROVISIONED"
            table_config["read_capacity"] = self.config.dynamodb_read_capacity
            table_config["write_capacity"] = self.config.dynamodb_write_capacity
            # GSI also needs capacity for PROVISIONED mode
            table_config["global_secondary_indexes"][0].read_capacity = self.config.dynamodb_read_capacity
            table_config["global_secondary_indexes"][0].write_capacity = self.config.dynamodb_write_capacity
        else:
            table_config["billing_mode"] = "PAY_PER_REQUEST"

        # Add stream configuration if enabled
        if self.config.enable_dynamodb_streams:
            table_config["stream_enabled"] = True
            table_config["stream_view_type"] = "NEW_AND_OLD_IMAGES"

        # Enable point-in-time recovery
        table_config["point_in_time_recovery"] = aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True
        )

        # Enable server-side encryption
        table_config["server_side_encryption"] = aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True
        )

        return aws.dynamodb.Table(**table_config)


```

## File: lib\infrastructure\iam.py

```python
"""
IAM roles and policies with least-privilege access.

This module creates IAM roles for Lambda functions with minimal
permissions required for their specific operations.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class IAMStack(pulumi.ComponentResource):
    """
    Manages IAM roles and policies for Lambda functions.

    Creates separate roles for each Lambda function with only the
    permissions they need, following the principle of least privilege.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize IAM stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:iam:IAMStack",
            config.get_resource_name("iam"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider

        # Create IAM roles
        self.api_handler_role = self._create_api_handler_role()
        self.file_processor_role = self._create_file_processor_role()
        self.stream_processor_role = self._create_stream_processor_role()

        self.register_outputs({})

    def _create_api_handler_role(self) -> aws.iam.Role:
        """
        Create IAM role for API handler Lambda function.

        Permissions:
        - Write to CloudWatch Logs
        - Read/Write to DynamoDB
        - Publish to SNS

        Returns:
            IAM Role for API handler
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-api-handler"),
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        return role

    def _create_file_processor_role(self) -> aws.iam.Role:
        """
        Create IAM role for file processor Lambda function.

        Permissions:
        - Write to CloudWatch Logs
        - Read from S3
        - Write to DynamoDB
        - Publish to SNS

        Returns:
            IAM Role for file processor
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-file-processor"),
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        return role

    def _create_stream_processor_role(self) -> aws.iam.Role:
        """
        Create IAM role for stream processor Lambda function.

        Permissions:
        - Write to CloudWatch Logs
        - Read from DynamoDB Streams
        - Publish to SNS

        Returns:
            IAM Role for stream processor
        """
        role = aws.iam.Role(
            resource_name=self.config.get_resource_name("role-stream-processor"),
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        return role

    def attach_cloudwatch_logs_policy(
        self,
        role: aws.iam.Role,
        log_group_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach CloudWatch Logs policy to a role with least-privilege access.

        Args:
            role: IAM role to attach policy to
            log_group_arn: ARN of the CloudWatch Log Group
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-logs-{policy_name_suffix}"),
            description=f"CloudWatch Logs access for {policy_name_suffix}",
            policy=log_group_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [f"{arn}:*"]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-logs-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        table_arn: pulumi.Output[str],
        policy_name_suffix: str,
        read_only: bool = False
    ) -> None:
        """
        Attach DynamoDB policy to a role with least-privilege access.

        Args:
            role: IAM role to attach policy to
            table_arn: ARN of the DynamoDB table
            policy_name_suffix: Suffix for policy name
            read_only: If True, only grant read permissions
        """
        actions = [
            "dynamodb:GetItem",
            "dynamodb:Query",
            "dynamodb:Scan"
        ]

        if not read_only:
            actions.extend([
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ])

        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-dynamodb-{policy_name_suffix}"),
            description=f"DynamoDB access for {policy_name_suffix}",
            policy=table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": actions,
                    "Resource": [
                        arn,
                        f"{arn}/index/*"
                    ]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-dynamodb-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def attach_dynamodb_streams_policy(
        self,
        role: aws.iam.Role,
        table_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach DynamoDB Streams policy to a role.

        Args:
            role: IAM role to attach policy to
            table_arn: ARN of the DynamoDB table
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-streams-{policy_name_suffix}"),
            description=f"DynamoDB Streams access for {policy_name_suffix}",
            policy=table_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetRecords",
                        "dynamodb:GetShardIterator",
                        "dynamodb:DescribeStream",
                        "dynamodb:ListStreams"
                    ],
                    "Resource": [f"{arn}/stream/*"]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-streams-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def attach_s3_policy(
        self,
        role: aws.iam.Role,
        bucket_arn: pulumi.Output[str],
        policy_name_suffix: str,
        read_only: bool = True
    ) -> None:
        """
        Attach S3 policy to a role with least-privilege access.

        Args:
            role: IAM role to attach policy to
            bucket_arn: ARN of the S3 bucket
            policy_name_suffix: Suffix for policy name
            read_only: If True, only grant read permissions
        """
        actions = [
            "s3:GetObject",
            "s3:ListBucket"
        ]

        if not read_only:
            actions.extend([
                "s3:PutObject",
                "s3:DeleteObject"
            ])

        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-s3-{policy_name_suffix}"),
            description=f"S3 access for {policy_name_suffix}",
            policy=bucket_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": actions,
                    "Resource": [
                        arn,
                        f"{arn}/*"
                    ]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-s3-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def attach_sns_policy(
        self,
        role: aws.iam.Role,
        topic_arn: pulumi.Output[str],
        policy_name_suffix: str
    ) -> None:
        """
        Attach SNS policy to a role with least-privilege access.

        Args:
            role: IAM role to attach policy to
            topic_arn: ARN of the SNS topic
            policy_name_suffix: Suffix for policy name
        """
        policy = aws.iam.Policy(
            resource_name=self.config.get_resource_name(f"policy-sns-{policy_name_suffix}"),
            description=f"SNS access for {policy_name_suffix}",
            policy=topic_arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["sns:Publish"],
                    "Resource": [arn]
                }]
            })),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        aws.iam.RolePolicyAttachment(
            resource_name=self.config.get_resource_name(f"attachment-sns-{policy_name_suffix}"),
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda functions management for serverless application.

This module creates and configures Lambda functions with:
- API Handler: Processes API Gateway requests
- File Processor: Processes S3 file uploads
- Stream Processor: Processes DynamoDB stream events
"""

import os

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class LambdaStack(pulumi.ComponentResource):
    """
    Manages Lambda functions for the serverless application.

    Creates three Lambda functions with proper configuration:
    - Event invoke config for retries and DLQ
    - Environment variables
    - Permissions for triggers
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        iam_stack: 'IAMStack',
        dynamodb_stack: 'DynamoDBStack',
        storage_stack: 'StorageStack',
        notifications_stack: 'NotificationsStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize Lambda stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            iam_stack: IAM stack with roles
            dynamodb_stack: DynamoDB stack with tables
            storage_stack: Storage stack with buckets
            notifications_stack: Notifications stack with topics
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:lambda:LambdaStack",
            config.get_resource_name("lambda"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.storage_stack = storage_stack
        self.notifications_stack = notifications_stack

        # Create Lambda functions
        self.api_handler = self._create_api_handler()
        self.file_processor = self._create_file_processor()
        self.stream_processor = self._create_stream_processor()

        # Configure event invoke configs
        self._configure_event_invoke_config(self.api_handler, "api-handler")
        self._configure_event_invoke_config(self.file_processor, "file-processor")
        self._configure_event_invoke_config(self.stream_processor, "stream-processor")

        # Configure S3 trigger for file processor
        self._configure_s3_trigger()

        # Configure DynamoDB stream trigger for stream processor
        self._configure_stream_trigger()

        self.register_outputs({
            "api_handler_name": self.api_handler.name,
            "api_handler_arn": self.api_handler.arn,
            "file_processor_name": self.file_processor.name,
            "file_processor_arn": self.file_processor.arn,
            "stream_processor_name": self.stream_processor.name,
            "stream_processor_arn": self.stream_processor.arn,
        })

    def _create_api_handler(self) -> aws.lambda_.Function:
        """
        Create API handler Lambda function.

        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("api-handler"),
            name=self.config.get_lambda_function_name("api-handler"),
            runtime=self.config.lambda_runtime,
            handler="api_handler.handler",
            role=self.iam_stack.api_handler_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_stack.items_table.name,
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.api_handler_role,
                    self.dynamodb_stack.items_table,
                    self.notifications_stack.notifications_topic
                ]
            )
        )

    def _create_file_processor(self) -> aws.lambda_.Function:
        """
        Create file processor Lambda function.

        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("file-processor"),
            name=self.config.get_lambda_function_name("file-processor"),
            runtime=self.config.lambda_runtime,
            handler="file_processor.handler",
            role=self.iam_stack.file_processor_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": self.dynamodb_stack.items_table.name,
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.file_processor_role,
                    self.dynamodb_stack.items_table,
                    self.notifications_stack.notifications_topic
                ]
            )
        )

    def _create_stream_processor(self) -> aws.lambda_.Function:
        """
        Create stream processor Lambda function.

        Returns:
            Lambda Function resource
        """
        return aws.lambda_.Function(
            resource_name=self.config.get_lambda_function_name("stream-processor"),
            name=self.config.get_lambda_function_name("stream-processor"),
            runtime=self.config.lambda_runtime,
            handler="stream_processor.handler",
            role=self.iam_stack.stream_processor_role.arn,
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            code=pulumi.FileArchive(
                os.path.join(
                    os.path.dirname(__file__),
                    "lambda_code"
                )
            ),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "SNS_TOPIC_ARN": self.notifications_stack.notifications_topic.arn,
                }
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.iam_stack.stream_processor_role,
                    self.notifications_stack.notifications_topic
                ]
            )
        )

    def _configure_event_invoke_config(
        self,
        function: aws.lambda_.Function,
        function_type: str
    ) -> None:
        """
        Configure event invoke config for Lambda function.

        This enables AWS-native retry mechanism and DLQ.

        Args:
            function: Lambda function to configure
            function_type: Type of function for naming
        """
        aws.lambda_.FunctionEventInvokeConfig(
            resource_name=self.config.get_resource_name(f"lambda-event-config-{function_type}"),
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            maximum_event_age_in_seconds=180,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.notifications_stack.notifications_topic.arn
                )
            ),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[function, self.notifications_stack.notifications_topic]
            )
        )

    def _configure_s3_trigger(self) -> None:
        """Configure S3 bucket to trigger file processor Lambda."""
        # Grant S3 permission to invoke Lambda
        s3_permission = aws.lambda_.Permission(
            resource_name=self.config.get_resource_name("lambda-s3-permission"),
            action="lambda:InvokeFunction",
            function=self.file_processor.name,
            principal="s3.amazonaws.com",
            source_arn=self.storage_stack.files_bucket.arn,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        # Configure S3 bucket notification
        aws.s3.BucketNotification(
            resource_name=self.config.get_resource_name("s3-notification"),
            bucket=self.storage_stack.files_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=self.file_processor.arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.file_processor, s3_permission]
            )
        )

    def _configure_stream_trigger(self) -> None:
        """Configure DynamoDB stream to trigger stream processor Lambda."""
        # Create event source mapping
        aws.lambda_.EventSourceMapping(
            resource_name=self.config.get_resource_name("lambda-stream-mapping"),
            event_source_arn=self.dynamodb_stack.items_table.stream_arn,
            function_name=self.stream_processor.name,
            starting_position="LATEST",
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.stream_processor, self.dynamodb_stack.items_table]
            )
        )


```

## File: lib\infrastructure\monitoring.py

```python
"""
CloudWatch monitoring and alarms for serverless application.

This module creates CloudWatch Log Groups and Metric Alarms
for monitoring Lambda functions and other resources.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class MonitoringStack(pulumi.ComponentResource):
    """
    Manages CloudWatch monitoring for the serverless application.

    Creates:
    - Log Groups for Lambda functions
    - Metric Alarms for error rates
    - CloudWatch Dashboard
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_stack: 'LambdaStack',
        dynamodb_stack: 'DynamoDBStack',
        notifications_stack: 'NotificationsStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize monitoring stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            lambda_stack: Lambda stack with functions
            dynamodb_stack: DynamoDB stack with tables
            notifications_stack: Notifications stack with topics
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:monitoring:MonitoringStack",
            config.get_resource_name("monitoring"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        self.notifications_stack = notifications_stack

        # Create log groups
        self.api_handler_log_group = self._create_log_group("api-handler")
        self.file_processor_log_group = self._create_log_group("file-processor")
        self.stream_processor_log_group = self._create_log_group("stream-processor")

        # Create alarms if monitoring is enabled
        if self.config.enable_monitoring:
            self._create_lambda_error_alarms()
            self._create_dynamodb_alarms()

        self.register_outputs({
            "api_handler_log_group_name": self.api_handler_log_group.name,
            "api_handler_log_group_arn": self.api_handler_log_group.arn,
            "file_processor_log_group_name": self.file_processor_log_group.name,
            "file_processor_log_group_arn": self.file_processor_log_group.arn,
            "stream_processor_log_group_name": self.stream_processor_log_group.name,
            "stream_processor_log_group_arn": self.stream_processor_log_group.arn,
        })

    def _create_log_group(self, function_type: str) -> aws.cloudwatch.LogGroup:
        """
        Create CloudWatch Log Group for a Lambda function.

        Args:
            function_type: Type of function (e.g., 'api-handler')

        Returns:
            CloudWatch Log Group
        """
        function_name = self.config.get_lambda_function_name(function_type)

        return aws.cloudwatch.LogGroup(
            resource_name=self.config.get_resource_name(f"log-group-{function_type}"),
            name=f"/aws/lambda/{function_name}",
            retention_in_days=7,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _create_lambda_error_alarms(self) -> None:
        """Create error rate alarms for all Lambda functions."""
        functions = [
            ("api-handler", self.lambda_stack.api_handler),
            ("file-processor", self.lambda_stack.file_processor),
            ("stream-processor", self.lambda_stack.stream_processor),
        ]

        for function_type, function in functions:
            # Error rate alarm using metric math
            aws.cloudwatch.MetricAlarm(
                resource_name=self.config.get_resource_name(f"alarm-error-rate-{function_type}"),
                name=self.config.get_resource_name(f"alarm-error-rate-{function_type}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                threshold=self.config.error_rate_threshold,
                alarm_description=f"Error rate exceeds {self.config.error_rate_threshold}% for {function_type}",
                treat_missing_data="notBreaching",
                alarm_actions=[self.notifications_stack.notifications_topic.arn],
                metric_queries=[
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="error_rate",
                        expression="(errors / invocations) * 100",
                        label="Error Rate (%)",
                        return_data=True,
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="errors",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Errors",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={"FunctionName": function.name}
                        ),
                        return_data=False,
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="invocations",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Invocations",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={"FunctionName": function.name}
                        ),
                        return_data=False,
                    ),
                ],
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )

            # Throttle alarm
            aws.cloudwatch.MetricAlarm(
                resource_name=self.config.get_resource_name(f"alarm-throttle-{function_type}"),
                name=self.config.get_resource_name(f"alarm-throttle-{function_type}"),
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=self.config.alarm_evaluation_periods,
                metric_name="Throttles",
                namespace="AWS/Lambda",
                period=300,
                statistic="Sum",
                threshold=0,
                alarm_description=f"Throttling detected for {function_type}",
                dimensions={"FunctionName": function.name},
                treat_missing_data="notBreaching",
                alarm_actions=[self.notifications_stack.notifications_topic.arn],
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )

    def _create_dynamodb_alarms(self) -> None:
        """Create alarms for DynamoDB tables."""
        # Read throttle alarm
        aws.cloudwatch.MetricAlarm(
            resource_name=self.config.get_resource_name("alarm-dynamodb-read-throttle"),
            name=self.config.get_resource_name("alarm-dynamodb-read-throttle"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="ReadThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="DynamoDB read throttling detected",
            dimensions={"TableName": self.dynamodb_stack.items_table.name},
            treat_missing_data="notBreaching",
            alarm_actions=[self.notifications_stack.notifications_topic.arn],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

        # Write throttle alarm
        aws.cloudwatch.MetricAlarm(
            resource_name=self.config.get_resource_name("alarm-dynamodb-write-throttle"),
            name=self.config.get_resource_name("alarm-dynamodb-write-throttle"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=self.config.alarm_evaluation_periods,
            metric_name="WriteThrottleEvents",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="DynamoDB write throttling detected",
            dimensions={"TableName": self.dynamodb_stack.items_table.name},
            treat_missing_data="notBreaching",
            alarm_actions=[self.notifications_stack.notifications_topic.arn],
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )


```

## File: lib\infrastructure\notifications.py

```python
"""
SNS topic management for notifications.

This module creates SNS topics for sending notifications
from Lambda functions and CloudWatch alarms.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class NotificationsStack(pulumi.ComponentResource):
    """
    Manages SNS topics for the serverless application.

    Creates topics for:
    - Application notifications
    - CloudWatch alarm notifications
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize notifications stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:notifications:NotificationsStack",
            config.get_resource_name("notifications"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider

        # Create notifications topic
        self.notifications_topic = self._create_notifications_topic()

        self.register_outputs({
            "notifications_topic_arn": self.notifications_topic.arn,
        })

    def _create_notifications_topic(self) -> aws.sns.Topic:
        """
        Create SNS topic for application notifications.

        Returns:
            SNS Topic resource
        """
        return aws.sns.Topic(
            resource_name=self.config.get_resource_name("topic-notifications"),
            name=self.config.get_resource_name("topic-notifications"),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )


```

## File: lib\infrastructure\storage.py

```python
"""
S3 bucket management for serverless application.

This module creates S3 buckets with proper security configuration
including encryption, versioning, and public access blocking.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class StorageStack(pulumi.ComponentResource):
    """
    Manages S3 buckets for the serverless application.

    Creates buckets with:
    - Server-side encryption (AES256)
    - Versioning
    - Lifecycle policies
    - Public access blocking
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        parent: pulumi.Resource = None
    ):
        """
        Initialize storage stack.

        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:storage:StorageStack",
            config.get_resource_name("storage"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )

        self.config = config
        self.provider = provider

        # Create files bucket
        self.files_bucket = self._create_files_bucket()

        # Configure bucket settings
        self._configure_bucket_encryption()
        self._configure_bucket_versioning()
        self._configure_bucket_lifecycle()
        self._configure_public_access_block()

        self.register_outputs({
            "files_bucket_name": self.files_bucket.id,
            "files_bucket_arn": self.files_bucket.arn,
        })

    def _create_files_bucket(self) -> aws.s3.Bucket:
        """
        Create the main files bucket.

        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_s3_bucket_name("files")

        return aws.s3.Bucket(
            resource_name=bucket_name,
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _configure_bucket_encryption(self) -> None:
        """Configure server-side encryption for the bucket."""
        aws.s3.BucketServerSideEncryptionConfiguration(
            resource_name=f"{self.files_bucket._name}-encryption",
            bucket=self.files_bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True,
                )
            ],
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _configure_bucket_versioning(self) -> None:
        """Configure versioning for the bucket."""
        if self.config.s3_versioning_enabled:
            aws.s3.BucketVersioning(
                resource_name=f"{self.files_bucket._name}-versioning",
                bucket=self.files_bucket.id,
                versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
            )

    def _configure_bucket_lifecycle(self) -> None:
        """Configure lifecycle policy for the bucket."""
        aws.s3.BucketLifecycleConfiguration(
            resource_name=f"{self.files_bucket._name}-lifecycle",
            bucket=self.files_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="transition-to-ia",
                    status="Enabled",
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_days,
                            storage_class="STANDARD_IA"
                        )
                    ]
                )
            ],
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )

    def _configure_public_access_block(self) -> None:
        """Block all public access to the bucket."""
        aws.s3.BucketPublicAccessBlock(
            resource_name=f"{self.files_bucket._name}-public-access-block",
            bucket=self.files_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )


```

## File: lib\infrastructure\validation.py

```python
"""
Configuration validation module for serverless infrastructure.

This module provides validation functions that can run without
requiring live AWS credentials, supporting offline validation
and dry-run scenarios.
"""

import re
from typing import List, Tuple

from .config import ServerlessConfig


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


def validate_configuration(config: ServerlessConfig) -> Tuple[bool, List[str]]:
    """
    Validate configuration without requiring AWS credentials.

    This function performs offline validation of configuration values
    to catch errors before deployment. It does NOT make AWS API calls.

    Args:
        config: ServerlessConfig instance to validate

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Validate project name
    if not config.project_name:
        errors.append("Project name cannot be empty")
    elif not re.match(r'^[a-z0-9-]+$', config.project_name):
        errors.append("Project name must contain only lowercase letters, numbers, and hyphens")

    # Validate environment suffix
    if not config.environment_suffix:
        errors.append("Environment suffix cannot be empty")
    elif not re.match(r'^[a-z0-9]+$', config.environment_suffix):
        errors.append("Environment suffix must contain only lowercase letters and numbers")

    # Validate region format
    if not config.primary_region:
        errors.append("Primary region cannot be empty")
    elif not re.match(r'^[a-z]{2}-[a-z]+-\d+$', config.primary_region):
        errors.append(f"Invalid region format: {config.primary_region}. Expected format: us-east-1")

    # Validate Lambda configuration
    if config.lambda_timeout < 1 or config.lambda_timeout > 900:
        errors.append(f"Lambda timeout must be between 1 and 900 seconds, got {config.lambda_timeout}")

    if config.lambda_memory_size < 128 or config.lambda_memory_size > 10240:
        errors.append(f"Lambda memory must be between 128 and 10240 MB, got {config.lambda_memory_size}")

    if config.lambda_memory_size % 64 != 0:
        errors.append(f"Lambda memory must be a multiple of 64 MB, got {config.lambda_memory_size}")

    if config.lambda_max_retry_attempts < 0 or config.lambda_max_retry_attempts > 2:
        errors.append(f"Lambda max retry attempts must be between 0 and 2, got {config.lambda_max_retry_attempts}")

    # Validate DynamoDB configuration
    if config.dynamodb_billing_mode not in ["PROVISIONED", "PAY_PER_REQUEST"]:
        errors.append(f"Invalid DynamoDB billing mode: {config.dynamodb_billing_mode}")

    if config.dynamodb_billing_mode == "PROVISIONED":
        if config.dynamodb_read_capacity < 1:
            errors.append(f"DynamoDB read capacity must be >= 1, got {config.dynamodb_read_capacity}")
        if config.dynamodb_write_capacity < 1:
            errors.append(f"DynamoDB write capacity must be >= 1, got {config.dynamodb_write_capacity}")

    # Validate S3 configuration
    if config.s3_lifecycle_days < 1:
        errors.append(f"S3 lifecycle days must be >= 1, got {config.s3_lifecycle_days}")

    # Validate monitoring configuration
    if config.alarm_evaluation_periods < 1:
        errors.append(f"Alarm evaluation periods must be >= 1, got {config.alarm_evaluation_periods}")

    if config.error_rate_threshold < 0 or config.error_rate_threshold > 100:
        errors.append(f"Error rate threshold must be between 0 and 100, got {config.error_rate_threshold}")

    # Validate Lambda runtime
    valid_runtimes = [
        "python3.8", "python3.9", "python3.10", "python3.11", "python3.12",
        "nodejs18.x", "nodejs20.x"
    ]
    if config.lambda_runtime not in valid_runtimes:
        errors.append(f"Invalid Lambda runtime: {config.lambda_runtime}. Valid runtimes: {', '.join(valid_runtimes)}")

    return (len(errors) == 0, errors)


def validate_resource_names(config: ServerlessConfig) -> Tuple[bool, List[str]]:
    """
    Validate that generated resource names meet AWS naming requirements.

    Args:
        config: ServerlessConfig instance

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []

    # Validate S3 bucket name
    bucket_name = config.get_s3_bucket_name("files")
    if len(bucket_name) < 3 or len(bucket_name) > 63:
        errors.append(f"S3 bucket name length must be between 3 and 63 characters, got {len(bucket_name)}")

    if not re.match(r'^[a-z0-9][a-z0-9-]*[a-z0-9]$', bucket_name):
        errors.append(f"Invalid S3 bucket name format: {bucket_name}")

    if '..' in bucket_name or '.-' in bucket_name or '-.' in bucket_name:
        errors.append(f"S3 bucket name contains invalid character sequences: {bucket_name}")

    # Validate Lambda function name
    lambda_name = config.get_lambda_function_name("api-handler")
    if len(lambda_name) > 64:
        errors.append(f"Lambda function name exceeds 64 characters: {lambda_name}")

    if not re.match(r'^[a-zA-Z0-9-_]+$', lambda_name):
        errors.append(f"Invalid Lambda function name format: {lambda_name}")

    # Validate DynamoDB table name
    table_name = config.get_dynamodb_table_name("items")
    if len(table_name) < 3 or len(table_name) > 255:
        errors.append(f"DynamoDB table name length must be between 3 and 255 characters, got {len(table_name)}")

    if not re.match(r'^[a-zA-Z0-9_.-]+$', table_name):
        errors.append(f"Invalid DynamoDB table name format: {table_name}")

    return (len(errors) == 0, errors)


def run_all_validations(config: ServerlessConfig) -> None:
    """
    Run all validation checks and raise ValidationError if any fail.

    This function aggregates all validation errors and provides
    a comprehensive error message for troubleshooting.

    Args:
        config: ServerlessConfig instance to validate

    Raises:
        ValidationError: If any validation checks fail
    """
    all_errors = []

    # Run configuration validation
    config_valid, config_errors = validate_configuration(config)
    if not config_valid:
        all_errors.extend(config_errors)

    # Run resource name validation
    names_valid, name_errors = validate_resource_names(config)
    if not names_valid:
        all_errors.extend(name_errors)

    # If any errors, raise exception
    if all_errors:
        error_message = "Configuration validation failed:\n" + "\n".join(f"  - {error}" for error in all_errors)
        raise ValidationError(error_message)


```
