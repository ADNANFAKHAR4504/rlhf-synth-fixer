**config.py**:

```python
import pulumi

config = pulumi.Config()
stack = pulumi.get_stack()
project = pulumi.get_project()

# Default region
aws_region = "us-east-1"

# Environment tags
tags = {
    "Environment": stack,
    "Project": project,
    "ManagedBy": "Pulumi",
}

# DynamoDB config
dynamodb_table_name = config.get("dynamodb_table_name") or f"{project}-{stack}-table"

# Lambda config
lambda_timeout = config.get_int("lambda_timeout") or 30
lambda_memory_size = config.get_int("lambda_memory_size") or 128

# S3 config
s3_bucket_name = config.get("s3_bucket_name") or f"{project}-{stack}-assets"

# API Gateway config
api_name = config.get("api_name") or f"{project}-{stack}-api"
```

**iam_roles.py**:

```python
import pulumi
import pulumi_aws as aws
from config import tags

def create_lambda_role(resource_name, dynamo_table_arn):
    """Create IAM role for Lambda with permissions to access DynamoDB and CloudWatch Logs"""

    # Lambda basic execution role policy
    lambda_role = aws.iam.Role(
        f"{resource_name}-role",
        assume_role_policy="""{
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }""",
        tags=tags,
    )

    # Attach managed policy for CloudWatch logs
    lambda_logging_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{resource_name}-logging-policy-attachment",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Create custom policy for DynamoDB access (following least privilege)
    dynamo_policy = aws.iam.Policy(
        f"{resource_name}-dynamo-policy",
        policy=dynamo_table_arn.apply(
            lambda arn: f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": "{arn}"
                    }}
                ]
            }}"""
        ),
        tags=tags,
    )

    # Attach DynamoDB policy to Lambda role
    dynamo_policy_attachment = aws.iam.RolePolicyAttachment(
        f"{resource_name}-dynamo-policy-attachment",
        role=lambda_role.name,
        policy_arn=dynamo_policy.arn
    )

    return lambda_role
```

**dynamo_db.py**:

```python
import pulumi
import pulumi_aws as aws
from config import tags, dynamodb_table_name

def create_dynamo_table():
    """Create DynamoDB table with appropriate configuration"""

    # Create the DynamoDB table
    table = aws.dynamodb.Table(
        "data-table",
        name=dynamodb_table_name,
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S",  # String type
            ),
        ],
        hash_key="id",
        billing_mode="PAY_PER_REQUEST",  # On-demand capacity mode
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,  # Enable point-in-time recovery for data protection
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,  # Enable server-side encryption
        ),
        tags=tags,
    )

    return table
```

**s3_bucket.py**:

```python
import pulumi
import pulumi_aws as aws
from config import tags, s3_bucket_name

def create_s3_bucket():
    """Create S3 bucket for static assets with strict security controls"""

    # Create the S3 bucket
    bucket = aws.s3.Bucket(
        "assets-bucket",
        bucket=s3_bucket_name,
        tags=tags,
    )

    # Configure public access block to ensure the bucket is private
    bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
        "assets-bucket-access-block",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
    )

    # Configure server-side encryption for the bucket
    bucket_encryption = aws.s3.BucketServerSideEncryptionConfiguration(
        "assets-bucket-encryption",
        bucket=bucket.id,
        rules=[
            aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                ),
            ),
        ],
    )

    # Enable versioning for the bucket
    bucket_versioning = aws.s3.BucketVersioning(
        "assets-bucket-versioning",
        bucket=bucket.id,
        versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
            status="Enabled",
        ),
    )

    return bucket
```

**lambda_functions.py**:

```python
import pulumi
import pulumi_aws as aws
import json
from config import tags, lambda_timeout, lambda_memory_size

def create_lambda_function(resource_name, handler, role_arn, environment_vars=None):
    """Create Lambda function with appropriate configuration and environment variables"""

    # Default Lambda code
    lambda_code = """
def handler(event, context):
    print('Lambda function invoked with event:', event)
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from Lambda!'
        })
    }
"""

    # Create Lambda function
    function = aws.lambda_.Function(
        resource_name,
        name=resource_name,
        runtime="python3.9",
        role=role_arn,
        handler=handler,
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive("./lambda"),  # Assuming there's a ./lambda directory with the code
        }),
        timeout=lambda_timeout,
        memory_size=lambda_memory_size,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables=environment_vars or {},
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active",  # Enable X-Ray tracing
        ),
        tags=tags,
    )

    # Create CloudWatch Log Group for Lambda with retention
    log_group = aws.cloudwatch.LogGroup(
        f"{resource_name}-log-group",
        name=pulumi.Output.concat("/aws/lambda/", function.name),
        retention_in_days=30,
        tags=tags,
    )

    return function
```

**api_gateway.py**:

```python
import pulumi
import pulumi_aws as aws
from config import tags, api_name

def create_api_gateway(lambda_functions):
    """Create API Gateway with Lambda integrations"""

    # Create REST API
    rest_api = aws.apigateway.RestApi(
        "api",
        name=api_name,
        description="API Gateway for serverless application",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"],
        ),
        tags=tags,
    )

    # Create API Gateway Resources and Methods
    resources = {}
    integrations = {}

    for name, lambda_function in lambda_functions.items():
        # Create resource
        resource = aws.apigateway.Resource(
            f"{name}-resource",
            rest_api=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part=name,
        )
        resources[name] = resource

        # Create method
        method = aws.apigateway.Method(
            f"{name}-method",
            rest_api=rest_api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE",  # In a real app, you might want to use AWS_IAM or a custom authorizer
            request_models={
                "application/json": "Empty",
            },
        )

        # Create Lambda permission
        lambda_permission = aws.lambda_.Permission(
            f"{name}-api-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                "arn:aws:execute-api:",
                pulumi.Config("aws").require("region"),
                ":",
                pulumi.Config("aws").require("account"),
                ":",
                rest_api.id,
                "/*",
                method.http_method,
                resource.path,
            ),
        )

        # Create integration
        integration = aws.apigateway.Integration(
            f"{name}-integration",
            rest_api=rest_api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
        )
        integrations[name] = integration

    # Deploy the API
    deployment = aws.apigateway.Deployment(
        "api-deployment",
        rest_api=rest_api.id,
        stage_name="",  # We'll create a separate stage
        # Ensure deployment happens after all integrations are set up
        opts=pulumi.ResourceOptions(depends_on=list(integrations.values())),
    )

    # Create stage
    stage = aws.apigateway.Stage(
        "api-stage",
        stage_name="v1",
        rest_api=rest_api.id,
        deployment=deployment.id,
        access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
            destination_arn=api_log_group.arn,
            format='{"requestId":"$context.requestId", "ip":"$context.identity.sourceIp", "requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod", "routeKey":"$context.routeKey", "status":"$context.status", "protocol":"$context.protocol", "responseLength":"$context.responseLength" }',
        ),
        xray_tracing_enabled=True,
        tags=tags,
    )

    # Create CloudWatch Log Group for API Gateway
    api_log_group = aws.cloudwatch.LogGroup(
        "api-log-group",
        name=f"/aws/apigateway/{api_name}",
        retention_in_days=30,
        tags=tags,
    )

    # Create API Gateway Method Settings for detailed CloudWatch metrics
    method_settings = aws.apigateway.MethodSettings(
        "api-method-settings",
        rest_api=rest_api.id,
        stage_name=stage.stage_name,
        method_path="*/*",  # Apply to all methods
        settings=aws.apigateway.MethodSettingsSettingsArgs(
            metrics_enabled=True,
            logging_level="INFO",
            data_trace_enabled=True,  # Enable request/response logging
            throttling_burst_limit=20,
            throttling_rate_limit=10,
        ),
    )

    return {
        "rest_api": rest_api,
        "stage": stage,
        "endpoint": stage.invoke_url,
    }
```

**monitoring.py**:

```python
import pulumi
import pulumi_aws as aws
from config import tags

def create_lambda_alarm(function_name, metric_name, threshold, comparison_operator, evaluation_periods):
    """Create CloudWatch Alarm for Lambda function"""

    alarm = aws.cloudwatch.MetricAlarm(
        f"{function_name}-{metric_name}-alarm",
        alarm_description=f"Alarm for {function_name} {metric_name}",
        namespace="AWS/Lambda",
        metric_name=metric_name,
        dimensions={
            "FunctionName": function_name,
        },
        statistic="Sum",
        period=60,
        threshold=threshold,
        comparison_operator=comparison_operator,
        evaluation_periods=evaluation_periods,
        alarm_actions=[],  # Add SNS topic ARN here if you want to send notifications
        insufficient_data_actions=[],
        ok_actions=[],
        tags=tags,
    )

    return alarm

def create_api_gateway_alarm(api_name, stage_name, metric_name, threshold, comparison_operator, evaluation_periods):
    """Create CloudWatch Alarm for API Gateway"""

    alarm = aws.cloudwatch.MetricAlarm(
        f"{api_name}-{stage_name}-{metric_name}-alarm",
        alarm_description=f"Alarm for {api_name} {stage_name} {metric_name}",
        namespace="AWS/ApiGateway",
        metric_name=metric_name,
        dimensions={
            "ApiName": api_name,
            "Stage": stage_name,
        },
        statistic="Average",
        period=60,
        threshold=threshold,
        comparison_operator=comparison_operator,
        evaluation_periods=evaluation_periods,
        alarm_actions=[],  # Add SNS topic ARN here if you want to send notifications
        insufficient_data_actions=[],
        ok_actions=[],
        tags=tags,
    )

    return alarm

def setup_monitoring(lambda_functions, api_gateway):
    """Set up CloudWatch monitoring for Lambda functions and API Gateway"""

    alarms = []

    # Create alarms for Lambda functions
    for name, function in lambda_functions.items():
        # Monitor errors
        errors_alarm = create_lambda_alarm(
            function.name,
            "Errors",
            1,
            "GreaterThanOrEqualToThreshold",
            1,
        )
        alarms.append(errors_alarm)

        # Monitor throttles
        throttles_alarm = create_lambda_alarm(
            function.name,
            "Throttles",
            1,
            "GreaterThanOrEqualToThreshold",
            1,
        )
        alarms.append(throttles_alarm)

        # Monitor duration
        duration_alarm = create_lambda_alarm(
            function.name,
            "Duration",
            lambda_timeout * 0.8 * 1000,  # 80% of timeout in milliseconds
            "GreaterThanThreshold",
            3,
        )
        alarms.append(duration_alarm)

    # Create alarms for API Gateway
    latency_alarm = create_api_gateway_alarm(
        api_gateway["rest_api"].name,
        api_gateway["stage"].stage_name,
        "Latency",
        1000,  # 1 second
        "GreaterThanThreshold",
        3,
    )
    alarms.append(latency_alarm)

    error_4xx_alarm = create_api_gateway_alarm(
        api_gateway["rest_api"].name,
        api_gateway["stage"].stage_name,
        "4XXError",
        5,
        "GreaterThanThreshold",
        3,
    )
    alarms.append(error_4xx_alarm)

    error_5xx_alarm = create_api_gateway_alarm(
        api_gateway["rest_api"].name,
        api_gateway["stage"].stage_name,
        "5XXError",
        1,
        "GreaterThanThreshold",
        1,
    )
    alarms.append(error_5xx_alarm)

    return alarms
```

Now, let's create the main entry point file:

\***\*main**.py\*\*:

```python
import pulumi
import pulumi_aws as aws
from config import aws_region, tags

# Import modules
from dynamo_db import create_dynamo_table
from s3_bucket import create_s3_bucket
from iam_roles import create_lambda_role
from lambda_functions import create_lambda_function
from api_gateway import create_api_gateway
from monitoring import setup_monitoring

# Configure AWS Provider
aws_provider = aws.Provider("aws", region=aws_region)

# Create DynamoDB Table
dynamo_table = create_dynamo_table()

# Create S3 Bucket
assets_bucket = create_s3_bucket()

# Create Lambda functions with appropriate IAM roles
# Create a role for Lambda that can access DynamoDB
lambda_role = create_lambda_role("serverless-app", dynamo_table.arn)

# Define Lambda functions
lambda_functions = {
    "get-items": create_lambda_function(
        "get-items",
        "app.handler",
        lambda_role.arn,
        {
            "DYNAMODB_TABLE": dynamo_table.name,
            "REGION": aws_region,
        }
    ),
    "create-item": create_lambda_function(
        "create-item",
        "app.handler",
        lambda_role.arn,
        {
            "DYNAMODB_TABLE": dynamo_table.name,
            "REGION": aws_region,
        }
    ),
    "update-item": create_lambda_function(
        "update-item",
        "app.handler",
        lambda_role.arn,
        {
            "DYNAMODB_TABLE": dynamo_table.name,
            "REGION": aws_region,
        }
    ),
    "delete-item": create_lambda_function(
        "delete-item",
        "app.handler",
        lambda_role.arn,
        {
            "DYNAMODB_TABLE": dynamo_table.name,
            "REGION": aws_region,
        }
    ),
}

# Create API Gateway
api_gateway = create_api_gateway(lambda_functions)

# Set up monitoring
alarms = setup_monitoring(lambda_functions, api_gateway)

# Export outputs
pulumi.export("dynamo_table_name", dynamo_table.name)
pulumi.export("assets_bucket_name", assets_bucket.bucket)
pulumi.export("api_endpoint", api_gateway["endpoint"])
pulumi.export("lambda_functions", {name: func.name for name, func in lambda_functions.items()})
```

Now we need to create a very basic Lambda function code to put in a `./lambda` directory:

**./lambda/app.py**:

```python
import json
import os
import boto3
import uuid
from datetime import datetime

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def handler(event, context):
    """Generic Lambda handler that processes API Gateway events"""
    print(f"Event received: {json.dumps(event)}")

    # Extract HTTP method and path from event
    http_method = event['httpMethod']
    path = event['path']

    # Get the operation from the path
    operation = path.split('/')[-1]

    # Process request based on operation
    if operation == 'get-items':
        return get_items(event)
    elif operation == 'create-item':
        return create_item(event)
    elif operation == 'update-item':
        return update_item(event)
    elif operation == 'delete-item':
        return delete_item(event)
    else:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': f'Unsupported operation: {operation}'})
        }

def get_items(event):
    """Get items from DynamoDB"""
    try:
        # Perform scan operation
        response = table.scan()
        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'items': items})
        }
    except Exception as e:
        print(f"Error getting items: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def create_item(event):
    """Create item in DynamoDB"""
    try:
        # Parse request body
        body = json.loads(event['body'])

        # Create item with unique ID
        item = {
            'id': str(uuid.uuid4()),
            'content': body.get('content', ''),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }

        # Put item in DynamoDB
        table.put_item(Item=item)

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(item)
        }
    except Exception as e:
        print(f"Error creating item: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def update_item(event):
    """Update item in DynamoDB"""
    try:
        # Parse request body
        body = json.loads(event['body'])
        item_id = body.get('id')

        if not item_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Item ID is required'})
            }

        # Update item
        update_expression = 'SET content = :content, updatedAt = :updatedAt'
        expression_values = {
            ':content': body.get('content', ''),
            ':updatedAt': datetime.utcnow().isoformat()
        }

        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response.get('Attributes', {}))
        }
    except Exception as e:
        print(f"Error updating item: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def delete_item(event):
    """Delete item from DynamoDB"""
    try:
        # Parse request body
        body = json.loads(event['body'])
        item_id = body.get('id')

        if not item_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Item ID is required'})
            }

        # Delete item
        table.delete_item(Key={'id': item_id})

        return {
            'statusCode': 204,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Item deleted successfully'})
        }
    except Exception as e:
        print(f"Error deleting item: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

And let's create a requirements.txt file for the Lambda:

**./lambda/requirements.txt**:

```
boto3==1.26.0
botocore==1.29.0
```

Now, here's a Pulumi.yaml configuration file:

**Pulumi.yaml**:

```yaml
name: serverless-app-architecture
runtime: python
description: A modular, secure serverless application architecture using Pulumi with Python
```

**Pulumi.dev.yaml** (for dev stack):

```yaml
config:
  aws:region: us-east-1
  serverless-app-architecture:dynamodb_table_name: serverless-app-dev-table
  serverless-app-architecture:lambda_timeout: 30
  serverless-app-architecture:lambda_memory_size: 128
  serverless-app-architecture:s3_bucket_name: serverless-app-dev-assets
  serverless-app-architecture:api_name: serverless-app-dev-api
```

### 2. IAM Roles and Policies (`modules/iam.py`)

```python
import pulumi
import pulumi_aws as aws
from config import tags

def create_lambda_role(table_arn):
    """Create an IAM role for Lambda with least privilege access to DynamoDB and CloudWatch"""

    # Create the Lambda execution role
    lambda_role = aws.iam.Role(
        "lambda-execution-role",
        assume_role_policy="""
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }]
        }
        """,
        tags=tags
    )

    # Attach the CloudWatch Logs policy
    aws.iam.RolePolicyAttachment(
        "lambda-logs-policy-attachment",
        role=lambda_role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )

    # Create a custom policy for DynamoDB access
    dynamo_policy = aws.iam.Policy(
        "lambda-dynamodb-policy",
        description="Allow Lambda to access specific DynamoDB table",
        policy=pulumi.Output.all(table_arn=table_arn).apply(
            lambda args: f"""{{
                "Version": "2012-10-17",
                "Statement": [{{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": "{args['table_arn']}"
                }}]
            }}"""
        ),
        tags=tags
    )

    # Attach the DynamoDB policy
    aws.iam.RolePolicyAttachment(
        "lambda-dynamodb-policy-attachment",
        role=lambda_role.name,
        policy_arn=dynamo_policy.arn
    )

    return lambda_role
```

### 3. DynamoDB Table (`modules/database.py`)

```python
import pulumi
import pulumi_aws as aws
from config import DYNAMODB_TABLE_NAME, tags

def create_dynamodb_table():
    """Create a DynamoDB table with appropriate configuration"""

    table = aws.dynamodb.Table(
        "data-table",
        name=DYNAMODB_TABLE_NAME,
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name="id",
                type="S"
            )
        ],
        hash_key="id",
        billing_mode="PAY_PER_REQUEST",  # On-demand capacity
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True  # Enable point-in-time recovery for data protection
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True  # Enable server-side encryption
        ),
        tags=tags
    )

    return table
```

### 4. S3 Bucket (`modules/storage.py`)

```python
import pulumi
import pulumi_aws as aws
from config import S3_BUCKET_NAME, tags

def create_assets_bucket():
    """Create a secure S3 bucket for static assets with public access blocked"""

    # Create the bucket
    bucket = aws.s3.Bucket(
        "assets-bucket",
        bucket=S3_BUCKET_NAME,
        tags=tags
    )

    # Block public access
    public_access_block = aws.s3.BucketPublicAccessBlock(
        "assets-bucket-public-access-block",
        bucket=bucket.id,
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True
    )

    # Enable default encryption
    encryption = aws.s3.BucketServerSideEncryptionConfiguration(
        "assets-bucket-encryption",
        bucket=bucket.id,
        rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )]
    )

    return bucket
```

### 5. Lambda Functions (`modules/functions.py`)

```python
import pulumi
import pulumi_aws as aws
from config import LAMBDA_MEMORY, LAMBDA_TIMEOUT, DYNAMODB_TABLE_NAME, tags, AWS_REGION

def create_lambda_functions(lambda_role_arn):
    """Create Lambda functions for our API endpoints"""

    # Common environment variables for all functions
    environment_vars = {
        "TABLE_NAME": DYNAMODB_TABLE_NAME,
        "REGION": AWS_REGION
    }

    # Create the functions
    functions = {}

    # Define the operations we want to support
    operations = ["get_item", "create_item", "update_item", "delete_item"]

    for op in operations:
        function = aws.lambda_.Function(
            f"{op}-function",
            name=f"{op}_handler",
            runtime="python3.9",
            handler=f"handlers.{op}.handler",
            role=lambda_role_arn,
            memory_size=LAMBDA_MEMORY,
            timeout=LAMBDA_TIMEOUT,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=environment_vars
            ),
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda")
            }),
            tags=tags
        )

        # Create a CloudWatch log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"{op}-logs",
            name=pulumi.Output.concat("/aws/lambda/", function.name),
            retention_in_days=30,
            tags=tags
        )

        functions[op] = function

    return functions
```

### 6. API Gateway (`modules/api.py`)

```python
import pulumi
import pulumi_aws as aws
from config import API_NAME, tags

def create_api_gateway(lambda_functions):
    """Create an API Gateway with Lambda integrations"""

    # Create the REST API
    rest_api = aws.apigateway.RestApi(
        "serverless-api",
        name=API_NAME,
        description="Serverless API for DynamoDB operations",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"]
        ),
        tags=tags
    )

    # Create a CloudWatch log group for API Gateway
    api_logs = aws.cloudwatch.LogGroup(
        "api-gateway-logs",
        name=f"API-Gateway-Execution-Logs_{rest_api.id}/prod",
        retention_in_days=30,
        tags=tags
    )

    # Create API resources and methods for each Lambda function
    resources = {}
    integrations = {}

    for name, func in lambda_functions.items():
        # Create resource path
        resource = aws.apigateway.Resource(
            f"{name}-resource",
            rest_api=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part=name.replace("_", "-")
        )
        resources[name] = resource

        # Create method
        method = aws.apigateway.Method(
            f"{name}-method",
            rest_api=rest_api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE",  # In production, use a proper authorization method
            request_models={
                "application/json": "Empty"
            }
        )

        # Create Lambda integration
        integration = aws.apigateway.Integration(
            f"{name}-integration",
            rest_api=rest_api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=func.invoke_arn
        )
        integrations[name] = integration

        # Grant API Gateway permission to invoke Lambda
        permission = aws.lambda_.Permission(
            f"{name}-api-permission",
            action="lambda:InvokeFunction",
            function=func.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                "arn:aws:execute-api:",
                AWS_REGION,
                ":",
                pulumi.get_account(),
                ":",
                rest_api.id,
                "/*/*/*"
            )
        )

    # Deploy the API
    deployment = aws.apigateway.Deployment(
        "api-deployment",
        rest_api=rest_api.id,
        # Make sure deployment happens after all integrations are set up
        opts=pulumi.ResourceOptions(depends_on=list(integrations.values()))
    )

    # Create a stage
    stage = aws.apigateway.Stage(
        "api-stage",
        deployment=deployment.id,
        rest_api=rest_api.id,
        stage_name="prod",
        xray_tracing_enabled=True,
        access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
            destination_arn=api_logs.arn,
            format='{"requestId":"$context.requestId", "ip":"$context.identity.sourceIp", "requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod", "routeKey":"$context.routeKey", "status":"$context.status", "responseLength":"$context.responseLength"}'
        ),
        tags=tags
    )

    # Create method settings for monitoring
    method_settings = aws.apigateway.MethodSettings(
        "api-method-settings",
        rest_api=rest_api.id,
        stage_name=stage.stage_name,
        method_path="*/*",  # Apply to all methods
        settings=aws.apigateway.MethodSettingsSettingsArgs(
            metrics_enabled=True,
            logging_level="INFO",
            data_trace_enabled=True,
            throttling_burst_limit=20,
            throttling_rate_limit=10
        )
    )

    return {
        "rest_api": rest_api,
        "stage": stage,
        "endpoint": pulumi.Output.concat("https://", rest_api.id, ".execute-api.", AWS_REGION, ".amazonaws.com/", stage.stage_name, "/")
    }
```

### 7. Monitoring (`modules/monitoring.py`)

```python
import pulumi
import pulumi_aws as aws
from config import tags

def setup_monitoring(lambda_functions, api_gateway):
    """Set up CloudWatch alarms and dashboards for monitoring"""

    alarms = []

    # Create alarms for each Lambda function
    for name, func in lambda_functions.items():
        # Errors alarm
        error_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-errors-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=1,
            alarm_description=f"Alarm if {name} function has errors",
            dimensions={
                "FunctionName": func.name,
            },
            tags=tags
        )
        alarms.append(error_alarm)

        # Duration alarm
        duration_alarm = aws.cloudwatch.MetricAlarm(
            f"{name}-duration-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=60,
            statistic="Average",
            threshold=3000,  # 3 seconds
            alarm_description=f"Alarm if {name} function duration is too high",
            dimensions={
                "FunctionName": func.name,
            },
            tags=tags
        )
        alarms.append(duration_alarm)

    # Create alarm for API Gateway
    api_5xx_alarm = aws.cloudwatch.MetricAlarm(
        "api-5xx-errors-alarm",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="5XXError",
        namespace="AWS/ApiGateway",
        period=60,
        statistic="Sum",
        threshold=1,
        alarm_description="Alarm if API returns 5XX errors",
        dimensions={
            "ApiName": api_gateway["rest_api"].name,
            "Stage": api_gateway["stage"].stage_name,
        },
        tags=tags
    )
    alarms.append(api_5xx_alarm)

    # Create a dashboard for monitoring
    dashboard = aws.cloudwatch.Dashboard(
        "serverless-dashboard",
        dashboard_name="ServerlessAppDashboard",
        dashboard_body=pulumi.Output.all(
            api_name=api_gateway["rest_api"].name,
            stage_name=api_gateway["stage"].stage_name,
            function_names=[f.name for f in lambda_functions.values()]
        ).apply(lambda args: create_dashboard_body(
            args["api_name"],
            args["stage_name"],
            args["function_names"]
        ))
    )

    return {
        "alarms": alarms,
        "dashboard": dashboard
    }

def create_dashboard_body(api_name, stage_name, function_names):
    """Create a CloudWatch dashboard JSON body"""
    widgets = []

    # API Gateway widgets
    widgets.append({
        "type": "metric",
        "width": 12,
        "height": 6,
        "properties": {
            "view": "timeSeries",
            "stacked": False,
            "metrics": [
                ["AWS/ApiGateway", "Count", "ApiName", api_name, "Stage", stage_name],
                [".", "4XXError", ".", ".", ".", "."],
                [".", "5XXError", ".", ".", ".", "."]
            ],
            "region": "us-east-1",
            "title": "API Gateway Requests and Errors"
        }
    })

    widgets.append({
        "type": "metric",
        "width": 12,
        "height": 6,
        "properties": {
            "view": "timeSeries",
            "stacked": False,
            "metrics": [
                ["AWS/ApiGateway", "Latency", "ApiName", api_name, "Stage", stage_name]
            ],
            "region": "us-east-1",
            "title": "API Gateway Latency"
        }
    })

    # Lambda widgets for each function
    for i, func_name in enumerate(function_names):
        widgets.append({
            "type": "metric",
            "width": 12,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": False,
                "metrics": [
                    ["AWS/Lambda", "Invocations", "FunctionName", func_name],
                    [".", "Errors", ".", "."],
                    [".", "Throttles", ".", "."]
                ],
                "region": "us-east-1",
                "title": f"{func_name} - Invocations and Errors"
            }
        })

        widgets.append({
            "type": "metric",
            "width": 12,
            "height": 6,
            "properties": {
                "view": "timeSeries",
                "stacked": False,
                "metrics": [
                    ["AWS/Lambda", "Duration", "FunctionName", func_name]
                ],
                "region": "us-east-1",
                "title": f"{func_name} - Duration"
            }
        })

    return json.dumps({"widgets": widgets})
```

### 8. Main Entry Point (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws
import json
from config import AWS_REGION, tags

# Import modules
from modules.database import create_dynamodb_table
from modules.storage import create_assets_bucket
from modules.iam import create_lambda_role
from modules.functions import create_lambda_functions
from modules.api import create_api_gateway
from modules.monitoring import setup_monitoring

# Set AWS provider
aws_provider = aws.Provider("aws-provider",
                           region=AWS_REGION)

# Create DynamoDB table
dynamo_table = create_dynamodb_table()

# Create S3 bucket for static assets
assets_bucket = create_assets_bucket()

# Create IAM role for Lambda functions
lambda_role = create_lambda_role(dynamo_table.arn)

# Create Lambda functions
lambda_functions = create_lambda_functions(lambda_role.arn)

# Create API Gateway
api = create_api_gateway(lambda_functions)

# Set up monitoring
monitoring = setup_monitoring(lambda_functions, api)

# Export outputs
pulumi.export("table_name", dynamo_table.name)
pulumi.export("bucket_name", assets_bucket.bucket)
pulumi.export("api_endpoint", api["endpoint"])
pulumi.export("function_names", {k: v.name for k, v in lambda_functions.items()})
```

### 9. Sample Lambda Handler (`lambda/handlers/create_item.py`)

```python
import json
import boto3
import os
import uuid
from datetime import datetime

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    """Lambda handler for creating items in DynamoDB"""

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Generate a unique ID
        item_id = str(uuid.uuid4())

        # Create the item
        timestamp = datetime.utcnow().isoformat()
        item = {
            'id': item_id,
            'content': body.get('content', ''),
            'createdAt': timestamp,
            'updatedAt': timestamp
        }

        # Save to DynamoDB
        table.put_item(Item=item)

        # Return success response
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Item created successfully',
                'item': item
            })
        }

    except Exception as e:
        # Log the error
        print(f"Error creating item: {str(e)}")

        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Error creating item',
                'error': str(e)
            })
        }
```
