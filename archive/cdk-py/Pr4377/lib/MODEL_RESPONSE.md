### Reasoning Trace
---

This is a comprehensive request for a serverless AWS application using CDK in Python. Let me break down the requirements:

1. Single CDK stack in Python (main.py)
2. Lambda function (Python) with CRUD operations
3. API Gateway with REST endpoints
4. DynamoDB table with sample data
5. Proper IAM permissions (least privilege)
6. Environment variables for configuration
7. CloudWatch logging
8. Error handling and retry logic
9. CORS configuration
10. Environment parameters for easy switching
11. Test suite
12. AWS best practices

Let me create a complete project structure:

1. CDK Stack (main.py)
2. Lambda function code
3. Requirements files
4. Test suite
5. README with instructions

I'll make sure to include:
- Proper error handling in Lambda
- Retry logic using boto3 retry configuration
- Environment-based configuration
- Sample data population
- Comprehensive CRUD operations
- Proper logging
- Test cases
### Answer 
---

I'll help you build a complete serverless application with AWS CDK in Python. This will include all the components you've requested with best practices built in.

## Project Structure

```
serverless-crud-app/
├── app.py                  # CDK app entry point
├── main.py                 # CDK stack definition
├── lambda/
│   ├── handler.py         # Lambda function code
│   └── requirements.txt   # Lambda dependencies
├── tests/
│   └── test_api.py        # API integration tests
├── requirements.txt        # CDK dependencies
├── cdk.json               # CDK configuration
└── README.md              # Documentation
```

## 1. CDK Stack Definition (main.py)

```python
import json
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_iam as iam,
    custom_resources as cr,
    CustomResource,
)
from constructs import Construct


class ServerlessCrudStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment: str = "dev",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Stack parameters based on environment
        self.environment = environment
        self.table_config = self._get_table_config(environment)
        
        # Create DynamoDB table
        self.table = self._create_dynamodb_table()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Create API Gateway
        self.api = self._create_api_gateway()
        
        # Populate sample data
        self._populate_sample_data()
        
        # Output the API endpoint
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self,
            "TableName",
            value=self.table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self,
            "Environment",
            value=self.environment,
            description="Deployment environment"
        )
    
    def _get_table_config(self, environment: str) -> dict:
        """Get environment-specific configuration"""
        configs = {
            "dev": {
                "read_capacity": 5,
                "write_capacity": 5,
                "removal_policy": RemovalPolicy.DESTROY,
                "point_in_time_recovery": False
            },
            "staging": {
                "read_capacity": 10,
                "write_capacity": 10,
                "removal_policy": RemovalPolicy.SNAPSHOT,
                "point_in_time_recovery": True
            },
            "prod": {
                "read_capacity": 20,
                "write_capacity": 20,
                "removal_policy": RemovalPolicy.RETAIN,
                "point_in_time_recovery": True
            }
        }
        return configs.get(environment, configs["dev"])
    
    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with environment-specific settings"""
        table = dynamodb.Table(
            self,
            f"ItemsTable-{self.environment}",
            table_name=f"items-table-{self.environment}-{self.stack_name}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=self.table_config["read_capacity"],
            write_capacity=self.table_config["write_capacity"],
            removal_policy=self.table_config["removal_policy"],
            point_in_time_recovery=self.table_config["point_in_time_recovery"],
            # Add GSI for querying by status
            global_secondary_indexes=[
                dynamodb.GlobalSecondaryIndex(
                    index_name="status-index",
                    partition_key=dynamodb.Attribute(
                        name="status",
                        type=dynamodb.AttributeType.STRING
                    ),
                    read_capacity=2,
                    write_capacity=2,
                    projection_type=dynamodb.ProjectionType.ALL
                )
            ]
        )
        
        # Add auto-scaling for production
        if self.environment == "prod":
            read_scaling = table.auto_scale_read_capacity(
                min_capacity=20,
                max_capacity=100
            )
            read_scaling.scale_on_utilization(target_utilization_percent=70)
            
            write_scaling = table.auto_scale_write_capacity(
                min_capacity=20,
                max_capacity=100
            )
            write_scaling.scale_on_utilization(target_utilization_percent=70)
        
        return table
    
    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function with proper configuration"""
        
        # Create CloudWatch log group with retention
        log_group = logs.LogGroup(
            self,
            f"LambdaLogGroup-{self.environment}",
            log_group_name=f"/aws/lambda/crud-handler-{self.environment}",
            retention=logs.RetentionDays.ONE_WEEK if self.environment == "dev" else logs.RetentionDays.ONE_MONTH,
            removal_policy=self.table_config["removal_policy"]
        )
        
        # Create Lambda execution role with least privilege
        lambda_role = iam.Role(
            self,
            f"LambdaExecutionRole-{self.environment}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for CRUD Lambda in {self.environment}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Create Lambda function
        lambda_function = lambda_.Function(
            self,
            f"CrudHandler-{self.environment}",
            function_name=f"crud-handler-{self.environment}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda"),
            handler="handler.lambda_handler",
            environment={
                "TABLE_NAME": self.table.table_name,
                "ENVIRONMENT": self.environment,
                "LOG_LEVEL": "DEBUG" if self.environment == "dev" else "INFO",
                "ENABLE_XRAY": "true" if self.environment != "dev" else "false"
            },
            timeout=Duration.seconds(30),
            memory_size=256 if self.environment == "dev" else 512,
            role=lambda_role,
            log_group=log_group,
            retry_attempts=2,
            tracing=lambda_.Tracing.ACTIVE if self.environment != "dev" else lambda_.Tracing.DISABLED,
            reserved_concurrent_executions=None if self.environment == "dev" else 100
        )
        
        # Grant DynamoDB permissions (least privilege)
        self.table.grant_read_write_data(lambda_function)
        
        # Add additional monitoring for production
        if self.environment == "prod":
            lambda_function.add_alarm(
                f"HighErrorRate-{self.environment}",
                alarm_name=f"lambda-high-error-rate-{self.environment}",
                threshold=5,
                evaluation_periods=2
            )
        
        return lambda_function
    
    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with CORS and proper configuration"""
        
        # API Gateway configuration based on environment
        api_config = {
            "dev": {
                "throttle_rate_limit": 100,
                "throttle_burst_limit": 200,
                "deploy_options": {
                    "logging_level": apigateway.MethodLoggingLevel.INFO,
                    "data_trace_enabled": True,
                    "metrics_enabled": True
                }
            },
            "staging": {
                "throttle_rate_limit": 500,
                "throttle_burst_limit": 1000,
                "deploy_options": {
                    "logging_level": apigateway.MethodLoggingLevel.ERROR,
                    "data_trace_enabled": False,
                    "metrics_enabled": True
                }
            },
            "prod": {
                "throttle_rate_limit": 1000,
                "throttle_burst_limit": 2000,
                "deploy_options": {
                    "logging_level": apigateway.MethodLoggingLevel.ERROR,
                    "data_trace_enabled": False,
                    "metrics_enabled": True
                }
            }
        }
        
        config = api_config.get(self.environment, api_config["dev"])
        
        # Create API Gateway
        api = apigateway.RestApi(
            self,
            f"ItemsApi-{self.environment}",
            rest_api_name=f"items-api-{self.environment}",
            description=f"CRUD API for items management ({self.environment})",
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment,
                **config["deploy_options"],
                throttling_rate_limit=config["throttle_rate_limit"],
                throttling_burst_limit=config["throttle_burst_limit"]
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"],
                allow_credentials=True,
                max_age=Duration.hours(1)
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{"statusCode": 200}'}
        )
        
        # Define API resources and methods
        items = api.root.add_resource("items")
        item = items.add_resource("{id}")
        
        # GET /items - List all items
        items.add_method(
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
        
        # POST /items - Create item
        items.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="201",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )
        
        # GET /items/{id} - Get specific item
        item.add_method(
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
        
        # PUT /items/{id} - Update item
        item.add_method(
            "PUT",
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
        
        # DELETE /items/{id} - Delete item
        item.add_method(
            "DELETE",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="204",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )
        
        return api
    
    def _populate_sample_data(self):
        """Populate DynamoDB table with sample data using Custom Resource"""
        
        sample_data = [
            {
                "id": "item-001",
                "name": "Sample Product 1",
                "description": "This is a sample product for testing",
                "price": 29.99,
                "status": "active",
                "category": "electronics"
            },
            {
                "id": "item-002",
                "name": "Sample Product 2",
                "description": "Another sample product",
                "price": 49.99,
                "status": "active",
                "category": "books"
            },
            {
                "id": "item-003",
                "name": "Sample Product 3",
                "description": "Third sample product",
                "price": 19.99,
                "status": "inactive",
                "category": "clothing"
            }
        ]
        
        # Create a Lambda function for populating data
        populate_function = lambda_.Function(
            self,
            f"PopulateData-{self.environment}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline(f"""
import json
import boto3
import cfnresponse

def handler(event, context):
    print(f"Event: {{json.dumps(event)}}")
    
    if event['RequestType'] == 'Delete':
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {{}})
        return
    
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('{self.table.table_name}')
    
    try:
        sample_data = {json.dumps(sample_data)}
        
        with table.batch_writer() as batch:
            for item in sample_data:
                batch.put_item(Item=item)
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {{"Message": "Sample data populated"}})
    except Exception as e:
        print(f"Error: {{str(e)}}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {{"Error": str(e)}})
"""),
            timeout=Duration.seconds(60)
        )
        
        self.table.grant_write_data(populate_function)
        
        # Create custom resource
        cr.AwsCustomResource(
            self,
            f"PopulateSampleData-{self.environment}",
            on_create=cr.AwsSdkCall(
                service="Lambda",
                action="invoke",
                parameters={
                    "FunctionName": populate_function.function_name,
                    "Payload": json.dumps({
                        "RequestType": "Create",
                        "ResponseURL": "https://dummy-url.com"
                    })
                },
                physical_resource_id=cr.PhysicalResourceId.of(f"populate-{self.table.table_name}")
            ),
            policy=cr.AwsCustomResourcePolicy.from_statements([
                iam.PolicyStatement(
                    actions=["lambda:InvokeFunction"],
                    resources=[populate_function.function_arn]
                )
            ])
        )
```

## 2. Lambda Function (lambda/handler.py)

```python
import json
import os
import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from botocore.config import Config

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Configure boto3 with retries
config = Config(
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb', config=config)
table_name = os.environ.get('TABLE_NAME')
environment = os.environ.get('ENVIRONMENT', 'dev')

if not table_name:
    raise ValueError("TABLE_NAME environment variable is not set")

table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal to float for JSON serialization"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def build_response(status_code: int, body: Any = None, error: str = None) -> Dict:
    """Build standardized API response"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        }
    }
    
    if error:
        response['body'] = json.dumps({
            'error': error,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment
        })
    elif body is not None:
        response['body'] = json.dumps(body, cls=DecimalEncoder)
    
    return response


def validate_item(item: Dict) -> Optional[str]:
    """Validate item data"""
    required_fields = ['name']
    
    for field in required_fields:
        if field not in item:
            return f"Missing required field: {field}"
    
    if 'price' in item:
        try:
            price = float(item['price'])
            if price < 0:
                return "Price must be non-negative"
        except (ValueError, TypeError):
            return "Invalid price format"
    
    return None


def create_item(data: Dict) -> Dict:
    """Create a new item in DynamoDB"""
    logger.info(f"Creating item: {json.dumps(data)}")
    
    # Validate input
    validation_error = validate_item(data)
    if validation_error:
        logger.warning(f"Validation failed: {validation_error}")
        return build_response(400, error=validation_error)
    
    try:
        # Generate ID if not provided
        item_id = data.get('id', str(uuid.uuid4()))
        
        # Prepare item
        item = {
            'id': item_id,
            'name': data['name'],
            'description': data.get('description', ''),
            'price': Decimal(str(data.get('price', 0))),
            'status': data.get('status', 'active'),
            'category': data.get('category', 'uncategorized'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Add any additional fields
        for key, value in data.items():
            if key not in item and key != 'id':
                item[key] = value
        
        # Put item with condition check (item shouldn't exist)
        table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(id)'
        )
        
        logger.info(f"Successfully created item: {item_id}")
        return build_response(201, {'message': 'Item created', 'item': item})
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Item already exists: {data.get('id')}")
            return build_response(409, error="Item with this ID already exists")
        logger.error(f"DynamoDB error: {str(e)}")
        return build_response(500, error=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error creating item: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")


def get_item(item_id: str) -> Dict:
    """Get a single item from DynamoDB"""
    logger.info(f"Getting item: {item_id}")
    
    try:
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' not in response:
            logger.warning(f"Item not found: {item_id}")
            return build_response(404, error="Item not found")
        
        logger.info(f"Successfully retrieved item: {item_id}")
        return build_response(200, response['Item'])
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return build_response(500, error=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error getting item: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")


def list_items(query_params: Dict = None) -> Dict:
    """List all items from DynamoDB with optional filtering"""
    logger.info(f"Listing items with params: {query_params}")
    
    try:
        # Check if we should filter by status
        status_filter = query_params.get('status') if query_params else None
        
        if status_filter:
            # Use GSI for status filtering
            response = table.query(
                IndexName='status-index',
                KeyConditionExpression=Key('status').eq(status_filter)
            )
            items = response.get('Items', [])
        else:
            # Scan all items
            response = table.scan()
            items = response.get('Items', [])
            
            # Handle pagination for large datasets
            while 'LastEvaluatedKey' in response:
                response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
                items.extend(response.get('Items', []))
        
        # Sort by created_at if available
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        logger.info(f"Successfully retrieved {len(items)} items")
        return build_response(200, {'items': items, 'count': len(items)})
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return build_response(500, error=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error listing items: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")


def update_item(item_id: str, data: Dict) -> Dict:
    """Update an existing item in DynamoDB"""
    logger.info(f"Updating item {item_id}: {json.dumps(data)}")
    
    if not data:
        return build_response(400, error="No update data provided")
    
    try:
        # Build update expression
        update_expressions = []
        expression_attribute_names = {}
        expression_attribute_values = {}
        
        for key, value in data.items():
            if key != 'id':  # Don't update the primary key
                safe_key = f"#{key}"
                expression_attribute_names[safe_key] = key
                expression_attribute_values[f":{key}"] = value
                update_expressions.append(f"{safe_key} = :{key}")
        
        # Add updated_at timestamp
        expression_attribute_values[':updated_at'] = datetime.utcnow().isoformat()
        update_expressions.append("#updated_at = :updated_at")
        expression_attribute_names['#updated_at'] = 'updated_at'
        
        # Perform update
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=f"SET {', '.join(update_expressions)}",
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression='attribute_exists(id)',
            ReturnValues='ALL_NEW'
        )
        
        logger.info(f"Successfully updated item: {item_id}")
        return build_response(200, {'message': 'Item updated', 'item': response['Attributes']})
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Item not found for update: {item_id}")
            return build_response(404, error="Item not found")
        logger.error(f"DynamoDB error: {str(e)}")
        return build_response(500, error=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error updating item: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")


def delete_item(item_id: str) -> Dict:
    """Delete an item from DynamoDB"""
    logger.info(f"Deleting item: {item_id}")
    
    try:
        # Delete with condition check (item should exist)
        table.delete_item(
            Key={'id': item_id},
            ConditionExpression='attribute_exists(id)'
        )
        
        logger.info(f"Successfully deleted item: {item_id}")
        return build_response(204)
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            logger.warning(f"Item not found for deletion: {item_id}")
            return build_response(404, error="Item not found")
        logger.error(f"DynamoDB error: {str(e)}")
        return build_response(500, error=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error deleting item: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")


def lambda_handler(event: Dict, context: Any) -> Dict:
    """Main Lambda handler for CRUD operations"""
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', '').upper()
        path = event.get('path', '')
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {})
        
        # Parse request body for POST and PUT
        body = None
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                logger.error("Invalid JSON in request body")
                return build_response(400, error="Invalid JSON in request body")
        
        # Route to appropriate handler
        if path == '/items':
            if http_method == 'GET':
                return list_items(query_parameters)
            elif http_method == 'POST':
                if not body:
                    return build_response(400, error="Request body is required")
                return create_item(body)
            
        elif path.startswith('/items/') and path_parameters:
            item_id = path_parameters.get('id')
            if not item_id:
                return build_response(400, error="Item ID is required")
            
            if http_method == 'GET':
                return get_item(item_id)
            elif http_method == 'PUT':
                if not body:
                    return build_response(400, error="Request body is required")
                return update_item(item_id, body)
            elif http_method == 'DELETE':
                return delete_item(item_id)
        
        # Method not allowed
        logger.warning(f"Method not allowed: {http_method} {path}")
        return build_response(405, error="Method not allowed")
        
    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}")
        return build_response(500, error=f"Internal server error: {str(e)}")
```

## 3. CDK App Entry Point (app.py)

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from main import ServerlessCrudStack

app = cdk.App()

# Get environment from context or environment variable
environment = app.node.try_get_context("environment") or os.environ.get("ENVIRONMENT", "dev")

# Create stack with environment-specific configuration
ServerlessCrudStack(
    app,
    f"ServerlessCrudStack-{environment}",
    environment=environment,
    env=cdk.Environment(
        account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
        region=os.environ.get("CDK_DEFAULT_REGION", "us-east-1")
    ),
    description=f"Serverless CRUD application stack for {environment} environment"
)

app.synth()
```

## 4. Test Suite (tests/test_api.py)

```python
import os
import json
import time
import uuid
import requests
import pytest
from typing import Dict, Optional

# Get API endpoint from environment or use placeholder
API_ENDPOINT = os.environ.get("API_ENDPOINT", "https://your-api-gateway-url/dev")


class TestCrudApi:
    """Integration tests for the CRUD API"""
    
    @pytest.fixture
    def sample_item(self) -> Dict:
        """Generate a sample item for testing"""
        return {
            "name": f"Test Item {uuid.uuid4()}",
            "description": "Test item description",
            "price": 99.99,
            "status": "active",
            "category": "test"
        }
    
    @pytest.fixture
    def created_item_id(self, sample_item) -> str:
        """Create an item and return its ID for cleanup"""
        response = requests.post(f"{API_ENDPOINT}/items", json=sample_item)
        assert response.status_code == 201
        item_id = response.json()["item"]["id"]
        yield item_id
        # Cleanup
        requests.delete(f"{API_ENDPOINT}/items/{item_id}")
    
    def test_create_item(self, sample_item):
        """Test creating a new item"""
        response = requests.post(f"{API_ENDPOINT}/items", json=sample_item)
        assert response.status_code == 201
        
        data = response.json()
        assert "item" in data
        assert "id" in data["item"]
        assert data["item"]["name"] == sample_item["name"]
        
        # Cleanup
        item_id = data["item"]["id"]
        requests.delete(f"{API_ENDPOINT}/items/{item_id}")
    
    def test_create_item_missing_fields(self):
        """Test creating an item with missing required fields"""
        response = requests.post(f"{API_ENDPOINT}/items", json={"description": "No name"})
        assert response.status_code == 400
        assert "error" in response.json()
    
    def test_get_item(self, created_item_id):
        """Test retrieving a specific item"""
        response = requests.get(f"{API_ENDPOINT}/items/{created_item_id}")
        assert response.status_code == 200
        
        item = response.json()
        assert item["id"] == created_item_id
    
    def test_get_nonexistent_item(self):
        """Test retrieving a non-existent item"""
        response = requests.get(f"{API_ENDPOINT}/items/nonexistent-id")
        assert response.status_code == 404
        assert "error" in response.json()
    
    def test_list_items(self):
        """Test listing all items"""
        response = requests.get(f"{API_ENDPOINT}/items")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "count" in data
        assert isinstance(data["items"], list)
    
    def test_list_items_with_filter(self):
        """Test listing items with status filter"""
        response = requests.get(f"{API_ENDPOINT}/items?status=active")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
    
    def test_update_item(self, created_item_id):
        """Test updating an existing item"""
        update_data = {
            "name": "Updated Name",
            "price": 199.99
        }
        
        response = requests.put(f"{API_ENDPOINT}/items/{created_item_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["item"]["name"] == "Updated Name"
        assert float(data["item"]["price"]) == 199.99
    
    def test_update_nonexistent_item(self):
        """Test updating a non-existent item"""
        response = requests.put(
            f"{API_ENDPOINT}/items/nonexistent-id",
            json={"name": "Updated"}
        )
        assert response.status_code == 404
    
    def test_delete_item(self, sample_item):
        """Test deleting an item"""
        # Create item first
        create_response = requests.post(f"{API_ENDPOINT}/items", json=sample_item)
        item_id = create_response.json()["item"]["id"]
        
        # Delete item
        response = requests.delete(f"{API_ENDPOINT}/items/{item_id}")
        assert response.status_code == 204
        
        # Verify deletion
        get_response = requests.get(f"{API_ENDPOINT}/items/{item_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_item(self):
        """Test deleting a non-existent item"""
        response = requests.delete(f"{API_ENDPOINT}/items/nonexistent-id")
        assert response.status_code == 404
    
    def test_cors_headers(self):
        """Test that CORS headers are properly set"""
        response = requests.get(f"{API_ENDPOINT}/items")
        assert "Access-Control-Allow-Origin" in response.headers
        assert response.headers["Access-Control-Allow-Origin"] == "*"


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
```

## 5. Requirements Files

### requirements.txt (CDK dependencies)
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### lambda/requirements.txt (Lambda dependencies)
```txt
boto3>=1.28.0
botocore>=1.31.0
```

### tests/requirements.txt (Test dependencies)
```txt
pytest>=7.4.0
requests>=2.31.0
pytest-cov>=4.1.0
```

## 6. CDK Configuration (cdk.json)

```json
{
  "app": "python3 app.py",
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
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## 7. Deployment Script (deploy.sh)

```bash
#!/bin/bash

# Deploy script for the serverless CRUD application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENVIRONMENT=${1:-dev}

echo -e "${GREEN}Deploying Serverless CRUD Stack to ${ENVIRONMENT} environment${NC}"

# Install dependencies
echo -e "${YELLOW}Installing CDK dependencies...${NC}"
pip install -r requirements.txt

echo -e "${YELLOW}Installing Lambda dependencies...${NC}"
pip install -r lambda/requirements.txt -t lambda/

# Bootstrap CDK (if needed)
echo -e "${YELLOW}Bootstrapping CDK...${NC}"
cdk bootstrap

# Synthesize the stack
echo -e "${YELLOW}Synthesizing stack...${NC}"
cdk synth --context environment=$ENVIRONMENT

# Deploy the stack
echo -e "${YELLOW}Deploying stack...${NC}"
cdk deploy ServerlessCrudStack-$ENVIRONMENT --context environment=$ENVIRONMENT --require-approval never

# Get outputs
echo -e "${GREEN}Deployment complete! Stack outputs:${NC}"
aws cloudformation describe-stacks \
  --stack-name ServerlessCrudStack-$ENVIRONMENT \
  --query 'Stacks[0].Outputs' \
  --output table

# Run tests if in dev environment
if [ "$ENVIRONMENT" == "dev" ]; then
    echo -e "${YELLOW}Running integration tests...${NC}"
    API_ENDPOINT=$(aws cloudformation describe-stacks \
      --stack-name ServerlessCrudStack-$ENVIRONMENT \
      --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
      --output text)
    
    export API_ENDPOINT
    pytest tests/test_api.py -v
fi

echo -e "${GREEN}Deployment and testing complete!${NC}"
```

## 8. README.md

```markdown
# Serverless CRUD Application

A production-ready serverless CRUD application built with AWS CDK, featuring API Gateway, Lambda, and DynamoDB.

## Architecture

- **API Gateway**: RESTful API with CORS support
- **Lambda Function**: Python-based handler with full CRUD operations
- **DynamoDB**: NoSQL database with GSI for querying
- **CloudWatch**: Comprehensive logging and monitoring
- **IAM**: Least-privilege access controls

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Environment-based configuration (dev, staging, prod)
- ✅ Automatic retry logic and error handling
- ✅ CORS configuration for web clients
- ✅ Sample data population
- ✅ Comprehensive test suite
- ✅ CloudWatch logging and monitoring
- ✅ Auto-scaling for production
- ✅ X-Ray tracing (staging/prod)

## Prerequisites

- Python 3.11+
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)
- Valid AWS credentials

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd serverless-crud-app
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
pip install -r lambda/requirements.txt -t lambda/
```

## Deployment

### Deploy to Development
```bash
cdk deploy --context environment=dev
```

### Deploy to Staging
```bash
cdk deploy --context environment=staging
```

### Deploy to Production
```bash
cdk deploy --context environment=prod
```

### Using the deployment script
```bash
chmod +x deploy.sh
./deploy.sh dev  # or staging, prod
```

## API Endpoints

- `GET /items` - List all items
- `GET /items?status=active` - List items by status
- `POST /items` - Create new item
- `GET /items/{id}` - Get specific item
- `PUT /items/{id}` - Update item
- `DELETE /items/{id}` - Delete item

## Testing

Run integration tests:
```bash
export API_ENDPOINT=<your-api-gateway-url>
pytest tests/test_api.py -v
```

## Sample Request

### Create Item
```bash
curl -X POST https://your-api-gateway-url/dev/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 29.99,
    "status": "active",
    "category": "electronics"
  }'
```

### Get All Items
```bash
curl https://your-api-gateway-url/dev/items
```

### Update Item
```bash
curl -X PUT https://your-api-gateway-url/dev/items/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product",
    "price": 39.99
  }'
```

### Delete Item
```bash
curl -X DELETE https://your-api-gateway-url/dev/items/{id}
```

## Environment Configuration

| Environment | Read/Write Capacity | Auto-scaling | X-Ray | Log Retention |
|------------|-------------------|--------------|-------|---------------|
| dev        | 5/5               | No           | No    | 7 days        |
| staging    | 10/10             | No           | Yes   | 30 days       |
| prod       | 20/20             | Yes (20-100) | Yes   | 30 days       |

## Monitoring

- CloudWatch Logs: `/aws/lambda/crud-handler-{environment}`
- CloudWatch Metrics: API Gateway and Lambda metrics
- X-Ray Tracing: Available in staging and production
- DynamoDB Metrics: Table and GSI metrics

## Clean Up

Remove the stack:
```bash
cdk destroy --context environment=dev
```

## Best Practices Implemented

- ✅ Least-privilege IAM roles
- ✅ Environment-based configuration
- ✅ Proper error handling and retries
- ✅ Structured logging
- ✅ Input validation
- ✅ Auto-scaling for production
- ✅ Monitoring and alerting
- ✅ CORS configuration
- ✅ Cost optimization (provisioned capacity for predictable workloads)

## Cost Optimization

- DynamoDB uses provisioned capacity for predictable costs
- Lambda reserved concurrency in production
- CloudWatch log retention based on environment
- Auto-scaling only in production

## License

MIT
```

## Deployment Instructions

1. **Set up your environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure AWS CLI:**
```bash
aws configure
```

3. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap
```

4. **Deploy the stack:**
```bash
# Development
cdk deploy --context environment=dev

# Staging
cdk deploy --context environment=staging

# Production
cdk deploy --context environment=prod
```

5. **Test the deployment:**
```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ServerlessCrudStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test the API
curl $API_ENDPOINT/items
```

This complete solution provides:

1. **Full CRUD functionality** with proper error handling
2. **Environment-based configuration** for easy deployment across dev/staging/prod
3. **AWS best practices** including least-privilege IAM, monitoring, and auto-scaling
4. **Comprehensive testing** with integration tests
5. **Production-ready features** like retry logic, CORS, and observability
6. **Sample data** for quick testing
7. **Clean, extensible architecture** that's easy to modify and enhance

The stack automatically handles all infrastructure provisioning, and the Lambda function includes robust error handling with automatic retries for transient failures.