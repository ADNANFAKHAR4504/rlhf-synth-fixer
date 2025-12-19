## Inventory Management API — Ideal Implementation (AWS CDK, Python)

Note: Lambda runtime is Python 3.11 for improved performance and support.

### lib/tap_stack.py

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) inventory management project.
It orchestrates the instantiation of constructs for a serverless inventory API and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    Tags,
    aws_logs as logs,
)
from constructs import Construct

# Import constructs
from .constructs.database_construct import DatabaseConstruct
from .constructs.lambda_construct import LambdaConstruct
from .constructs.api_construct import ApiConstruct


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
  Represents the main CDK stack for the TAP inventory management project.

  This stack is responsible for orchestrating the instantiation of constructs for a
  serverless inventory management API. It determines the environment suffix from the
  provided properties, CDK context, or defaults to 'dev'.

  The stack creates:
    - DynamoDB table with auto-scaling and GSIs for inventory data
    - Lambda functions for CRUD operations with proper IAM roles
    - API Gateway REST API with validation and security features
    - CloudWatch logging and monitoring
    - Parameter Store for configuration management

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
    table: The DynamoDB table for inventory data.
    api_endpoint: The API Gateway endpoint URL.
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

    # Store environment suffix for reference
    self.environment_suffix = environment_suffix

    # Add stack-level tags
    Tags.of(self).add("Environment", environment_suffix)
    Tags.of(self).add("Application", "InventoryManagement")
    Tags.of(self).add("ManagedBy", "CDK")
    Tags.of(self).add("Project", "TAP")

    # Create DynamoDB table with auto-scaling
    database = DatabaseConstruct(
        self,
        "Database",
        env_name=environment_suffix
    )

    # Create Lambda functions with proper IAM roles
    lambda_functions = LambdaConstruct(
        self,
        "LambdaFunctions",
        table=database.table,
        env_name=environment_suffix
    )

    # Create API Gateway
    api = ApiConstruct(
        self,
        "Api",
        lambda_functions=lambda_functions.functions,
        env_name=environment_suffix
    )

    # Make resources available as properties of this stack
    self.table = database.table
    self.api_endpoint = api.rest_api.url

    # Outputs
    CfnOutput(
        self,
        "ApiEndpoint",
        value=api.rest_api.url,
        description="API Gateway endpoint URL",
        export_name=f"InventoryApi-{environment_suffix}-Endpoint"
    )

    CfnOutput(
        self,
        "TableName",
        value=database.table.table_name,
        description="DynamoDB table name",
        export_name=f"InventoryApi-{environment_suffix}-TableName"
    )

    CfnOutput(
        self,
        "EnvironmentName",
        value=environment_suffix,
        description="Environment name",
        export_name=f"InventoryApi-{environment_suffix}-Environment"
    )
```

### lib/constructs/**init**.py

```python
"""
Constructs package for the TAP (Test Automation Platform) inventory management system.

This package contains reusable CDK constructs for building a serverless inventory API:
- DatabaseConstruct: DynamoDB table with auto-scaling and GSIs
- LambdaConstruct: Lambda functions for CRUD operations
- ApiConstruct: API Gateway REST API with proper validation and security
"""
```

### lib/constructs/database_construct.py

```python
from aws_cdk import (
    aws_dynamodb as dynamodb,
    RemovalPolicy,
    Duration,
    aws_ssm as ssm,
)
from constructs import Construct


class DatabaseConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # Create DynamoDB table
        self.table = dynamodb.Table(
            self,
            "InventoryTable",
            table_name=f"inventory-{env_name}",
            partition_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sku",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Cost-efficient for 3000 orders/day
            removal_policy=RemovalPolicy.RETAIN if env_name == "prod" else RemovalPolicy.DESTROY,
            point_in_time_recovery=True if env_name == "prod" else False,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,  # For future event-driven features
        )

        # Add GSI for querying by category
        self.table.add_global_secondary_index(
            index_name="category-index",
            partition_key=dynamodb.Attribute(
                name="category",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="updated_at",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Add GSI for querying by status
        self.table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # Store table name in Parameter Store
        ssm.StringParameter(
            self,
            "TableNameParameter",
            parameter_name=f"/inventory/{env_name}/table-name",
            string_value=self.table.table_name,
            description=f"DynamoDB table name for {env_name} environment"
        )

        # If using provisioned capacity (alternative for predictable workloads)
        # Uncomment below for auto-scaling configuration
        """
        if env_name == "prod":
            # Configure auto-scaling for read capacity
            read_scaling = self.table.auto_scale_read_capacity(
                min_capacity=5,
                max_capacity=100
            )
            read_scaling.scale_on_utilization(
                target_utilization_percent=70
            )

            # Configure auto-scaling for write capacity
            write_scaling = self.table.auto_scale_write_capacity(
                min_capacity=5,
                max_capacity=100
            )
            write_scaling.scale_on_utilization(
                target_utilization_percent=70
            )
        """
```

### lib/constructs/lambda_construct.py

```python
from aws_cdk import (
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_logs as logs,
    aws_ssm as ssm,
    Duration,
)
from aws_cdk.aws_lambda_python_alpha import PythonLayerVersion
from constructs import Construct
import os
import subprocess


def is_docker_available() -> bool:
    """Check if Docker is available and running"""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return False


class LambdaConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        table,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        self.functions = {}

        # Create shared layer for common dependencies (skip in test mode or if Docker unavailable)
        shared_layer = None
        skip_layer = os.environ.get('CDK_TEST_MODE') or not is_docker_available()

        if not skip_layer:
            shared_layer = PythonLayerVersion(
                self,
                "SharedLayer",
                entry="lib/lambda/layer",
                compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
                description="Shared utilities and dependencies"
            )
        elif not is_docker_available():
            print("⚠️  Docker not available - skipping Lambda layer creation")
            print("   Lambda functions will run without the shared layer")

        # Lambda execution role with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add DynamoDB permissions
        table.grant_read_write_data(lambda_role)

        # Add Parameter Store read permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["ssm:GetParameter", "ssm:GetParameters"],
                resources=[f"arn:aws:ssm:*:*:parameter/inventory/{env_name}/*"]
            )
        )

        # Store configuration in Parameter Store
        api_config = ssm.StringParameter(
            self,
            "ApiConfig",
            parameter_name=f"/inventory/{env_name}/config",
            string_value='{"max_items_per_page": 50, "default_page_size": 20}',
            description=f"API configuration for {env_name} environment"
        )

        # Common environment variables
        common_env = {
            "TABLE_NAME": table.table_name,
            "ENVIRONMENT": env_name,
            "CONFIG_PARAMETER": api_config.parameter_name,
            "LOG_LEVEL": "INFO" if env_name == "prod" else "DEBUG"
        }

        # Define Lambda functions
        lambda_configs = {
            "create_item": {
                "handler": "create_item.handler",
                "timeout": Duration.seconds(10),
                "memory": 256,
                "reserved_concurrent": 10 if env_name == "prod" else None
            },
            "get_item": {
                "handler": "get_item.handler",
                "timeout": Duration.seconds(5),
                "memory": 256,
                "reserved_concurrent": 20 if env_name == "prod" else None
            },
            "update_item": {
                "handler": "update_item.handler",
                "timeout": Duration.seconds(10),
                "memory": 256,
                "reserved_concurrent": 10 if env_name == "prod" else None
            },
            "delete_item": {
                "handler": "delete_item.handler",
                "timeout": Duration.seconds(5),
                "memory": 256,
                "reserved_concurrent": 5 if env_name == "prod" else None
            },
            "list_items": {
                "handler": "list_items.handler",
                "timeout": Duration.seconds(10),
                "memory": 512,
                "reserved_concurrent": 15 if env_name == "prod" else None
            }
        }

        # Create Lambda functions
        for func_name, config in lambda_configs.items():
            function = lambda_.Function(
                self,
                f"{func_name.replace('_', '-').title()}Function",
                function_name=f"inventory-{env_name}-{func_name.replace('_', '-')}",
                runtime=lambda_.Runtime.PYTHON_3_11,
                code=lambda_.Code.from_asset("lib/lambda/handlers"),
                handler=config["handler"],
                timeout=config["timeout"],
                memory_size=config["memory"],
                environment=common_env,
                role=lambda_role,
                layers=[shared_layer] if shared_layer else [],
                log_retention=logs.RetentionDays.ONE_WEEK if env_name == "dev" else logs.RetentionDays.ONE_MONTH,
                tracing=lambda_.Tracing.ACTIVE,
                reserved_concurrent_executions=config.get("reserved_concurrent")
            )

            self.functions[func_name] = function
```

### lib/constructs/api_construct.py

```python
from aws_cdk import (
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam,
    Duration,
    aws_wafv2 as waf,
)
from constructs import Construct


class ApiConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        lambda_functions: dict,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # Create CloudWatch log group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/inventory-{env_name}",
            retention=logs.RetentionDays.ONE_WEEK if env_name == "dev" else logs.RetentionDays.ONE_MONTH
        )

        # Create REST API
        self.rest_api = apigateway.RestApi(
            self,
            "InventoryApi",
            rest_api_name=f"inventory-api-{env_name}",
            description=f"Inventory Management API - {env_name}",
            deploy_options=apigateway.StageOptions(
                stage_name=env_name,
                logging_level=apigateway.MethodLoggingLevel.INFO,
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
                ),
                throttling_rate_limit=10000,  # requests per second
                throttling_burst_limit=5000,   # concurrent requests
                metrics_enabled=True,
                tracing_enabled=True,
                data_trace_enabled=False if env_name == "prod" else True
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"] if env_name == "dev" else ["https://yourdomain.com"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                max_age=Duration.seconds(300)
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL]
        )

        # Create API key and usage plan for production
        if env_name == "prod":
            api_key = apigateway.ApiKey(
                self,
                "ApiKey",
                api_key_name=f"inventory-api-key-{env_name}",
                description="API key for inventory management"
            )

            usage_plan = apigateway.UsagePlan(
                self,
                "UsagePlan",
                name=f"inventory-usage-plan-{env_name}",
                api_stages=[apigateway.UsagePlanPerApiStage(
                    api=self.rest_api,
                    stage=self.rest_api.deployment_stage
                )],
                throttle=apigateway.ThrottleSettings(
                    rate_limit=10000,
                    burst_limit=5000
                ),
                quota=apigateway.QuotaSettings(
                    limit=1000000,  # 1M requests
                    period=apigateway.Period.MONTH
                )
            )
            usage_plan.add_api_key(api_key)

        # Request validator
        request_validator = apigateway.RequestValidator(
            self,
            "RequestValidator",
            rest_api=self.rest_api,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Create request/response models
        item_model = apigateway.Model(
            self,
            "ItemModel",
            rest_api=self.rest_api,
            content_type="application/json",
            model_name="ItemModel",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                title="Item",
                type=apigateway.JsonSchemaType.OBJECT,
                required=["sku", "name", "quantity", "category"],
                properties={
                    "sku": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "name": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "description": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "quantity": apigateway.JsonSchema(type=apigateway.JsonSchemaType.INTEGER, minimum=0),
                    "price": apigateway.JsonSchema(type=apigateway.JsonSchemaType.NUMBER, minimum=0),
                    "category": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "status": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=["available", "out_of_stock", "discontinued"]
                    )
                }
            )
        )

        # Create /items resource
        items_resource = self.rest_api.root.add_resource("items")
        item_resource = items_resource.add_resource("{item_id}")

        # POST /items - Create item
        items_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                lambda_functions["create_item"],
                timeout=Duration.seconds(29)
            ),
            request_validator=request_validator,
            request_models={"application/json": item_model},
            api_key_required=True if env_name == "prod" else False
        )

        # GET /items - List items
        items_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions["list_items"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.querystring.category": False,
                "method.request.querystring.status": False,
                "method.request.querystring.page_size": False,
                "method.request.querystring.last_evaluated_key": False
            },
            api_key_required=True if env_name == "prod" else False
        )

        # GET /items/{item_id} - Get item
        item_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions["get_item"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.path.item_id": True,
                "method.request.querystring.sku": False
            },
            api_key_required=True if env_name == "prod" else False
        )

        # PUT /items/{item_id} - Update item
        item_resource.add_method(
            "PUT",
            apigateway.LambdaIntegration(
                lambda_functions["update_item"],
                timeout=Duration.seconds(29)
            ),
            request_validator=request_validator,
            request_models={"application/json": item_model},
            request_parameters={
                "method.request.path.item_id": True
            },
            api_key_required=True if env_name == "prod" else False
        )

        # DELETE /items/{item_id} - Delete item
        item_resource.add_method(
            "DELETE",
            apigateway.LambdaIntegration(
                lambda_functions["delete_item"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.path.item_id": True,
                "method.request.querystring.sku": True
            },
            api_key_required=True if env_name == "prod" else False
        )
```

<!-- Shared layer content omitted intentionally; handlers include inline fallbacks so the API works without packaging a layer. -->

### lib/lambda/handlers/create_item.py

```python
import json
import os
import boto3
from decimal import Decimal
import uuid
from datetime import datetime
from typing import Dict, Any
import logging
from botocore.exceptions import ClientError

# Import utilities from layer
try:
    from utils import DecimalEncoder, validate_item_data, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)

    def validate_item_data(item_data):
        required_fields = ['sku', 'name', 'quantity', 'category']
        for field in required_fields:
            if field not in item_data:
                return False, f"Missing required field: {field}"
        return True, "Valid"

    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

# Initialize clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Create a new inventory item"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate request data
        is_valid, validation_message = validate_item_data(body)
        if not is_valid:
            return format_response(400, {'error': validation_message})

        # Get table name from environment
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Generate item_id
        item_id = str(uuid.uuid4())

        # Prepare item
        item = {
            'item_id': item_id,
            'sku': body['sku'],
            'name': body['name'],
            'description': body.get('description', ''),
            'quantity': int(body['quantity']),
            'price': Decimal(str(body.get('price', 0))) if body.get('price') is not None else Decimal('0'),
            'category': body['category'],
            'status': body.get('status', 'available'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Note: SKU uniqueness is handled by the composite key (item_id + sku)
        # Multiple items can have the same SKU with different item_ids if needed

        # Put item in DynamoDB
        # UUID collision is extremely unlikely, so no condition expression needed
        table.put_item(Item=item)

        logger.info(f"Created item: {item_id}")

        return format_response(201, {
            'message': 'Item created successfully',
            'item': item
        })

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
```

### lib/lambda/handlers/get_item.py

```python
import json
import os
import boto3
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# Import utilities from layer
try:
    from utils import DecimalEncoder, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)

    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

dynamodb = boto3.resource('dynamodb')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Get an inventory item by ID and optionally SKU"""
    try:
        # Get path parameters
        path_params = event.get('pathParameters', {})
        item_id = path_params.get('item_id')

        if not item_id:
            return format_response(400, {'error': 'Missing item_id parameter'})

        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        sku = query_params.get('sku')

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        if sku:
            # Get specific item using both keys
            response = table.get_item(
                Key={
                    'item_id': item_id,
                    'sku': sku
                }
            )

            if 'Item' not in response:
                return format_response(404, {'error': 'Item not found'})

            item = response['Item']
        else:
            # If no SKU provided, scan to find item by item_id (less efficient)
            response = table.scan(
                FilterExpression=Attr('item_id').eq(item_id),
                Limit=1
            )

            if not response.get('Items'):
                return format_response(404, {'error': 'Item not found'})

            item = response['Items'][0]

        logger.info(f"Retrieved item: {item_id}")

        return format_response(200, {'item': item})

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return format_response(500, {'error': 'Internal server error'})
```

### lib/lambda/handlers/update_item.py

```python
import json
import os
import boto3
from datetime import datetime
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError
from decimal import Decimal

# Import utilities from layer
try:
    from utils import DecimalEncoder, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)

    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

dynamodb = boto3.resource('dynamodb')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Update an existing inventory item"""
    try:
        # Get path parameters
        path_params = event.get('pathParameters', {})
        item_id = path_params.get('item_id')

        if not item_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing item_id parameter'})
            }

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        if not body or 'sku' not in body:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing SKU in request body'})
            }

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Build update expression
        update_expression_parts = []
        expression_attribute_names = {}
        expression_attribute_values = {':updated_at': datetime.utcnow().isoformat()}

        # Add updated_at
        update_expression_parts.append('#updated_at = :updated_at')
        expression_attribute_names['#updated_at'] = 'updated_at'

        # Update fields if provided
        updateable_fields = ['name', 'description', 'quantity', 'price', 'category', 'status']
        for field in updateable_fields:
            if field in body:
                placeholder = f'#{field}'
                value_placeholder = f':{field}'
                update_expression_parts.append(f'{placeholder} = {value_placeholder}')
                expression_attribute_names[placeholder] = field

                # Handle numeric types
                if field == 'quantity':
                    expression_attribute_values[value_placeholder] = int(body[field])
                elif field == 'price':
                    expression_attribute_values[value_placeholder] = Decimal(str(body[field]))
                else:
                    expression_attribute_values[value_placeholder] = body[field]

        # Perform update
        response = table.update_item(
            Key={
                'item_id': item_id,
                'sku': body['sku']
            },
            UpdateExpression='SET ' + ', '.join(update_expression_parts),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression='attribute_exists(item_id)',
            ReturnValues='ALL_NEW'
        )

        logger.info(f"Updated item: {item_id}")

        return format_response(200, {
            'message': 'Item updated successfully',
            'item': response['Attributes']
        })

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Item not found'})
            }
        logger.error(f"DynamoDB error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### lib/lambda/handlers/delete_item.py

```python
import json
import os
import boto3
import logging
from typing import Dict, Any
from botocore.exceptions import ClientError

# Import utilities from layer
try:
    from utils import DecimalEncoder, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)

    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

dynamodb = boto3.resource('dynamodb')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Delete an inventory item"""
    try:
        # Get parameters
        path_params = event.get('pathParameters', {})
        query_params = event.get('queryStringParameters', {}) or {}

        item_id = path_params.get('item_id')
        sku = query_params.get('sku')

        if not item_id or not sku:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing item_id or sku parameter'})
            }

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Delete item
        response = table.delete_item(
            Key={
                'item_id': item_id,
                'sku': sku
            },
            ConditionExpression='attribute_exists(item_id)',
            ReturnValues='ALL_OLD'
        )

        if 'Attributes' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Item not found'})
            }

        logger.info(f"Deleted item: {item_id} with SKU: {sku}")

        return format_response(200, {
            'message': 'Item deleted successfully',
            'deleted_item': response['Attributes']
        })

    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Item not found'})
            }
        logger.error(f"DynamoDB error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### lib/lambda/handlers/list_items.py

```python
import json
import os
import boto3
import logging
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

# Import utilities from layer
try:
    from utils import DecimalEncoder, format_response
except ImportError:
    # Fallback if layer is not available
    class DecimalEncoder(json.JSONEncoder):
        def default(self, obj):
            from decimal import Decimal
            if isinstance(obj, Decimal):
                return float(obj)
            return super(DecimalEncoder, self).default(obj)

    def format_response(status_code, body, headers=None):
        return {
            'statusCode': status_code,
            'headers': headers or {'Content-Type': 'application/json'},
            'body': json.dumps(body, cls=DecimalEncoder)
        }

dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def get_config():
    """Get configuration from Parameter Store"""
    try:
        param_name = os.environ.get('CONFIG_PARAMETER')
        if param_name:
            response = ssm.get_parameter(Name=param_name)
            return json.loads(response['Parameter']['Value'])
    except Exception as e:
        logger.error(f"Error getting config: {str(e)}")

    return {'max_items_per_page': 50, 'default_page_size': 20}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """List inventory items with pagination and filtering"""
    try:
        # Get configuration
        config = get_config()

        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        category = query_params.get('category')
        status = query_params.get('status')
        page_size = min(
            int(query_params.get('page_size', config['default_page_size'])),
            config['max_items_per_page']
        )
        last_evaluated_key = query_params.get('last_evaluated_key')

        # Get table
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)

        # Build query parameters
        query_kwargs = {'Limit': page_size}

        if last_evaluated_key:
            query_kwargs['ExclusiveStartKey'] = json.loads(last_evaluated_key)

        # Query based on filters
        if category:
            # Use category index
            query_kwargs['IndexName'] = 'category-index'
            query_kwargs['KeyConditionExpression'] = Key('category').eq(category)
            response = table.query(**query_kwargs)
        elif status:
            # Use status index
            query_kwargs['IndexName'] = 'status-index'
            query_kwargs['KeyConditionExpression'] = Key('status').eq(status)
            response = table.query(**query_kwargs)
        else:
            # Scan table (less efficient but necessary for unfiltered listing)
            response = table.scan(**query_kwargs)

        # Prepare response
        result = {
            'items': response.get('Items', []),
            'count': response.get('Count', 0)
        }

        # Add pagination token if there are more results
        if 'LastEvaluatedKey' in response:
            result['next_page_token'] = json.dumps(response['LastEvaluatedKey'])

        logger.info(f"Listed {result['count']} items")

        return format_response(200, result)

    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```
