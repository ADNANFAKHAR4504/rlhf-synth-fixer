### Reasoning Trace
---

The user wants me to create a comprehensive serverless application architecture using AWS CDK with Python. Let me break down the requirements:

1. Single stack in main.py
2. Components needed:
   - AWS Lambda functions (Python 3.8, 15s timeout)
   - API Gateway (REST API)
   - DynamoDB table with streams enabled
3. Specific requirements:
   - Lambda function for API requests
   - Lambda function triggered by DynamoDB Streams
   - DynamoDB table with partition key `id` (string)
   - KMS encryption for Lambda environment variables
   - Environment variable `STAGE` set to `EnvironmentSuffix`
   - IAM roles and policies
   - API Gateway caching (min 30s TTL)
   - CORS support for https://example.com
   - CloudWatch alarms for Lambda errors and API Gateway 4XX/5XX errors
   - CloudWatch logging for all API requests
   - Dynamic log creation per function
   - Deploy to us-west-2
   - CloudFormation rollback support

Let me structure this step by step:

1. Create the main stack class
2. Create DynamoDB table with streams
3. Create KMS key for encryption
4. Create Lambda functions with proper IAM roles
5. Create API Gateway with caching and CORS
6. Set up CloudWatch alarms and logging
7. Configure proper permissions between services

I'll need to create the lambda function code as well, so I'll include that in separate files.
### Answer 
---

I'll help you create a comprehensive serverless application architecture using AWS CDK with Python. Let me break this down into the main CDK stack and the Lambda function code.

## Project Structure

```
project/
├── main.py                 # Main CDK stack
├── lambda/
│   ├── api_handler.py     # API Lambda function
│   └── stream_handler.py  # DynamoDB Stream Lambda function
├── requirements.txt       # CDK dependencies
└── cdk.json              # CDK configuration
```

## Main CDK Stack (main.py)

```python
#!/usr/bin/env python3
from aws_cdk import (
    App, Stack, Environment,
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_lambda_event_sources as event_sources,
    Duration, RemovalPolicy
)
from constructs import Construct


class ServerlessAppStack(Stack):
    
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Environment suffix for resource naming
        environment_suffix = self.node.try_get_context("environment") or "dev"
        
        # Create KMS key for Lambda environment variable encryption
        kms_key = kms.Key(
            self, "LambdaKMSKey",
            description="KMS key for Lambda environment variable encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create DynamoDB table with streams enabled
        dynamodb_table = dynamodb.Table(
            self, "DataTable",
            table_name=f"serverless-data-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )
        
        # Create CloudWatch Log Groups for Lambda functions
        api_log_group = logs.LogGroup(
            self, "ApiLambdaLogGroup",
            log_group_name=f"/aws/lambda/api-handler-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        stream_log_group = logs.LogGroup(
            self, "StreamLambdaLogGroup",
            log_group_name=f"/aws/lambda/stream-handler-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        # Create IAM role for API Lambda function
        api_lambda_role = iam.Role(
            self, "ApiLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Add DynamoDB permissions to API Lambda role
        api_lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            resources=[dynamodb_table.table_arn]
        ))
        
        # Add KMS permissions to API Lambda role
        kms_key.grant_decrypt(api_lambda_role)
        
        # Create IAM role for Stream Lambda function
        stream_lambda_role = iam.Role(
            self, "StreamLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Add DynamoDB Stream permissions to Stream Lambda role
        stream_lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:DescribeStream",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:ListStreams"
            ],
            resources=[dynamodb_table.table_stream_arn]
        ))
        
        # Add KMS permissions to Stream Lambda role
        kms_key.grant_decrypt(stream_lambda_role)
        
        # Create API Lambda function
        api_lambda = _lambda.Function(
            self, "ApiHandler",
            function_name=f"api-handler-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="api_handler.handler",
            code=_lambda.Code.from_asset("lambda"),
            timeout=Duration.seconds(15),
            role=api_lambda_role,
            log_group=api_log_group,
            environment={
                "TABLE_NAME": dynamodb_table.table_name,
                "STAGE": environment_suffix
            },
            environment_encryption=kms_key
        )
        
        # Create DynamoDB Stream Lambda function
        stream_lambda = _lambda.Function(
            self, "StreamHandler",
            function_name=f"stream-handler-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="stream_handler.handler",
            code=_lambda.Code.from_asset("lambda"),
            timeout=Duration.seconds(15),
            role=stream_lambda_role,
            log_group=stream_log_group,
            environment={
                "STAGE": environment_suffix
            },
            environment_encryption=kms_key
        )
        
        # Add DynamoDB Stream as event source for Stream Lambda
        stream_lambda.add_event_source(
            event_sources.DynamoEventSource(
                table=dynamodb_table,
                starting_position=_lambda.StartingPosition.TRIM_HORIZON,
                batch_size=10,
                max_batching_window=Duration.seconds(5)
            )
        )
        
        # Create API Gateway with caching and CORS
        api = apigw.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"serverless-api-{environment_suffix}",
            description="Serverless application API",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=["https://example.com"],
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            ),
            deploy_options=apigw.StageOptions(
                stage_name=environment_suffix,
                caching_enabled=True,
                cache_ttl=Duration.seconds(30),
                cache_key_parameters=["method.request.path.proxy"],
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # Create API Gateway integration with Lambda
        lambda_integration = apigw.LambdaIntegration(
            api_lambda,
            request_templates={"application/json": '{"statusCode": "200"}'}
        )
        
        # Add API Gateway resources and methods
        # Root resource for health check
        api.root.add_method("GET", lambda_integration)
        
        # Items resource for CRUD operations
        items_resource = api.root.add_resource("items")
        items_resource.add_method("GET", lambda_integration)     # List items
        items_resource.add_method("POST", lambda_integration)    # Create item
        
        item_resource = items_resource.add_resource("{id}")
        item_resource.add_method("GET", lambda_integration)      # Get item
        item_resource.add_method("PUT", lambda_integration)      # Update item
        item_resource.add_method("DELETE", lambda_integration)   # Delete item
        
        # Create CloudWatch Alarms
        
        # Lambda function error alarm
        api_lambda_error_alarm = cloudwatch.Alarm(
            self, "ApiLambdaErrorAlarm",
            alarm_name=f"api-lambda-errors-{environment_suffix}",
            alarm_description="API Lambda function error rate",
            metric=api_lambda.metric_errors(),
            threshold=1,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        stream_lambda_error_alarm = cloudwatch.Alarm(
            self, "StreamLambdaErrorAlarm",
            alarm_name=f"stream-lambda-errors-{environment_suffix}",
            alarm_description="Stream Lambda function error rate",
            metric=stream_lambda.metric_errors(),
            threshold=1,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        # API Gateway 4XX error alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self, "Api4xxErrorAlarm",
            alarm_name=f"api-4xx-errors-{environment_suffix}",
            alarm_description="API Gateway 4XX error rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={
                    "ApiName": api.rest_api_name,
                    "Stage": environment_suffix
                },
                statistic="Sum"
            ),
            threshold=10,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        # API Gateway 5XX error alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self, "Api5xxErrorAlarm",
            alarm_name=f"api-5xx-errors-{environment_suffix}",
            alarm_description="API Gateway 5XX error rate",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiName": api.rest_api_name,
                    "Stage": environment_suffix
                },
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            datapoints_to_alarm=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )


# Create the app and stack
app = App()

ServerlessAppStack(
    app, 
    "ServerlessAppStack",
    env=Environment(region="us-west-2")
)

app.synth()
```

## Lambda Function Code

### API Handler (lambda/api_handler.py)

```python
import json
import boto3
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle API Gateway requests for DynamoDB operations
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters') or {}
        
        # Route requests based on method and path
        if path == '/' and http_method == 'GET':
            return health_check()
        elif path == '/items' and http_method == 'GET':
            return list_items()
        elif path == '/items' and http_method == 'POST':
            return create_item(json.loads(event['body']))
        elif path.startswith('/items/') and http_method == 'GET':
            return get_item(path_parameters['id'])
        elif path.startswith('/items/') and http_method == 'PUT':
            return update_item(path_parameters['id'], json.loads(event['body']))
        elif path.startswith('/items/') and http_method == 'DELETE':
            return delete_item(path_parameters['id'])
        else:
            return create_response(404, {'error': 'Not found'})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def health_check() -> Dict[str, Any]:
    """Health check endpoint"""
    return create_response(200, {
        'message': 'API is healthy',
        'stage': os.environ.get('STAGE', 'unknown')
    })

def list_items() -> Dict[str, Any]:
    """List all items in the table"""
    try:
        response = table.scan()
        return create_response(200, {
            'items': response.get('Items', []),
            'count': response.get('Count', 0)
        })
    except Exception as e:
        logger.error(f"Error listing items: {str(e)}")
        return create_response(500, {'error': 'Failed to list items'})

def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item"""
    try:
        if 'id' not in data:
            return create_response(400, {'error': 'Missing required field: id'})
        
        # Add metadata
        data['created_at'] = context.aws_request_id if 'context' in globals() else 'unknown'
        data['stage'] = os.environ.get('STAGE', 'unknown')
        
        table.put_item(Item=data)
        return create_response(201, {'message': 'Item created', 'item': data})
    except Exception as e:
        logger.error(f"Error creating item: {str(e)}")
        return create_response(500, {'error': 'Failed to create item'})

def get_item(item_id: str) -> Dict[str, Any]:
    """Get a specific item by ID"""
    try:
        response = table.get_item(Key={'id': item_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Item not found'})
        return create_response(200, {'item': response['Item']})
    except Exception as e:
        logger.error(f"Error getting item: {str(e)}")
        return create_response(500, {'error': 'Failed to get item'})

def update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing item"""
    try:
        # Remove id from update data if present
        data.pop('id', None)
        
        if not data:
            return create_response(400, {'error': 'No data to update'})
        
        # Build update expression
        update_expression = "SET "
        expression_attribute_values = {}
        
        for key, value in data.items():
            update_expression += f"#{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value
        
        update_expression = update_expression.rstrip(", ")
        expression_attribute_names = {f"#{key}": key for key in data.keys()}
        
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )
        
        return create_response(200, {
            'message': 'Item updated',
            'item': response['Attributes']
        })
    except Exception as e:
        logger.error(f"Error updating item: {str(e)}")
        return create_response(500, {'error': 'Failed to update item'})

def delete_item(item_id: str) -> Dict[str, Any]:
    """Delete an item by ID"""
    try:
        response = table.delete_item(
            Key={'id': item_id},
            ReturnValues="ALL_OLD"
        )
        
        if 'Attributes' not in response:
            return create_response(404, {'error': 'Item not found'})
        
        return create_response(200, {
            'message': 'Item deleted',
            'item': response['Attributes']
        })
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        return create_response(500, {'error': 'Failed to delete item'})

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create a standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://example.com',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key'
        },
        'body': json.dumps(body)
    }
```

### DynamoDB Stream Handler (lambda/stream_handler.py)

```python
import json
import logging
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle DynamoDB Stream events
    """
    try:
        logger.info(f"Received {len(event['Records'])} DynamoDB stream records")
        
        for record in event['Records']:
            process_stream_record(record)
        
        return {'statusCode': 200, 'processedRecords': len(event['Records'])}
        
    except Exception as e:
        logger.error(f"Error processing stream records: {str(e)}")
        raise e

def process_stream_record(record: Dict[str, Any]) -> None:
    """
    Process a single DynamoDB stream record
    """
    event_name = record['eventName']
    event_source = record['eventSource']
    
    logger.info(f"Processing {event_name} event from {event_source}")
    
    # Extract the DynamoDB data
    if event_name in ['INSERT', 'MODIFY']:
        new_image = record['dynamodb'].get('NewImage', {})
        logger.info(f"New image: {json.dumps(new_image, default=str)}")
        
        if event_name == 'INSERT':
            handle_item_created(new_image)
        elif event_name == 'MODIFY':
            old_image = record['dynamodb'].get('OldImage', {})
            handle_item_modified(old_image, new_image)
            
    elif event_name == 'REMOVE':
        old_image = record['dynamodb'].get('OldImage', {})
        logger.info(f"Old image: {json.dumps(old_image, default=str)}")
        handle_item_deleted(old_image)

def handle_item_created(new_image: Dict[str, Any]) -> None:
    """
    Handle item creation events
    """
    item_id = new_image.get('id', {}).get('S', 'unknown')
    logger.info(f"Item created with ID: {item_id}")
    
    # Add your custom logic here
    # Examples:
    # - Send notifications
    # - Update search indexes
    # - Trigger workflows
    # - Update caches

def handle_item_modified(old_image: Dict[str, Any], new_image: Dict[str, Any]) -> None:
    """
    Handle item modification events
    """
    item_id = new_image.get('id', {}).get('S', 'unknown')
    logger.info(f"Item modified with ID: {item_id}")
    
    # Compare old and new images to detect specific changes
    changes = detect_changes(old_image, new_image)
    logger.info(f"Detected changes: {changes}")
    
    # Add your custom logic here based on what changed

def handle_item_deleted(old_image: Dict[str, Any]) -> None:
    """
    Handle item deletion events
    """
    item_id = old_image.get('id', {}).get('S', 'unknown')
    logger.info(f"Item deleted with ID: {item_id}")
    
    # Add your custom logic here
    # Examples:
    # - Clean up related resources
    # - Send notifications
    # - Update search indexes

def detect_changes(old_image: Dict[str, Any], new_image: Dict[str, Any]) -> List[str]:
    """
    Detect what fields changed between old and new images
    """
    changes = []
    
    # Get all unique keys from both images
    all_keys = set(old_image.keys()) | set(new_image.keys())
    
    for key in all_keys:
        old_value = old_image.get(key)
        new_value = new_image.get(key)
        
        if old_value != new_value:
            changes.append(key)
    
    return changes
```

## Supporting Files

### requirements.txt

```txt
aws-cdk-lib>=2.90.0
constructs>=10.0.0
boto3>=1.26.0
```

### cdk.json

```json
{
  "app": "python main.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/.venv"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-normlizedkeys:RDS": true,
    "@aws-cdk/aws-events:newRuleRenderer": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Bootstrap CDK (if not done before):**
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

3. **Deploy with environment context:**
   ```bash
   # Deploy to development
   cdk deploy -c environment=dev
   
   # Deploy to production
   cdk deploy -c environment=prod
   ```

4. **Test the API:**
   ```bash
   # Get API endpoint from CDK output
   curl https://your-api-id.execute-api.us-west-2.amazonaws.com/dev/
   
   # Create an item
   curl -X POST https://your-api-id.execute-api.us-west-2.amazonaws.com/dev/items \
        -H "Content-Type: application/json" \
        -d '{"id": "test-1", "name": "Test Item", "description": "This is a test"}'
   ```

## Key Features Implemented

✅ **Architecture Components:**
- AWS Lambda (Python 3.8, 15s timeout)
- API Gateway REST API with CORS
- DynamoDB with streams enabled
- KMS encryption for environment variables

✅ **Security & Permissions:**
- Least-privilege IAM roles
- KMS key rotation enabled
- Secure environment variable encryption

✅ **Monitoring & Logging:**
- CloudWatch alarms for Lambda and API Gateway errors
- Detailed logging with dynamic log groups
- Request tracing enabled

✅ **Performance & Caching:**
- API Gateway caching (30s minimum TTL)
- DynamoDB on-demand billing
- Point-in-time recovery enabled

✅ **Deployment & Reliability:**
- CloudFormation rollback support
- Environment-based resource naming
- Removal policies for cleanup

The architecture automatically handles scaling, provides comprehensive monitoring, and follows AWS best practices for security and reliability.