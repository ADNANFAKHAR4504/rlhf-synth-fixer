```python
import pulumi
import pulumi_aws as aws
import json
import base64

# Get current AWS region and account
current = aws.get_caller_identity()
current_region = aws.get_region()

# Configuration
config = pulumi.Config()
environment = config.get("environment") or "prod"
project_name = pulumi.get_project()

# Common tags for all resources
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "CostCenter": "Engineering",
    "Owner": "DevOps"
}

# Create KMS key for encryption
kms_key = aws.kms.Key("app-kms-key",
    description=f"{project_name} encryption key",
    deletion_window_in_days=7,
    tags=common_tags
)

kms_alias = aws.kms.Alias("app-kms-alias",
    name=f"alias/{project_name}-key",
    target_key_id=kms_key.key_id
)

# Create DynamoDB table with encryption
tasks_table = aws.dynamodb.Table("tasks-table",
    name=f"{project_name}-tasks-{environment}",
    billing_mode="PAY_PER_REQUEST",
    hash_key="task_id",
    attributes=[
        aws.dynamodb.TableAttributeArgs(
            name="task_id",
            type="S",
        ),
        aws.dynamodb.TableAttributeArgs(
            name="user_id",
            type="S",
        ),
        aws.dynamodb.TableAttributeArgs(
            name="status",
            type="S",
        ),
    ],
    global_secondary_indexes=[
        aws.dynamodb.TableGlobalSecondaryIndexArgs(
            name="user-index",
            hash_key="user_id",
            projection_type="ALL",
        ),
        aws.dynamodb.TableGlobalSecondaryIndexArgs(
            name="status-index",
            hash_key="status",
            projection_type="ALL",
        ),
    ],
    server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
        enabled=True,
        kms_key_arn=kms_key.arn,
    ),
    point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
        enabled=True,
    ),
    tags=common_tags
)

# Create Parameter Store parameters for configuration
db_table_param = aws.ssm.Parameter("db-table-name",
    name=f"/{project_name}/{environment}/db/table-name",
    type="String",
    value=tasks_table.name,
    description="DynamoDB table name for tasks",
    tags=common_tags
)

api_key_param = aws.ssm.Parameter("api-key",
    name=f"/{project_name}/{environment}/api/key",
    type="SecureString",
    value="your-secure-api-key-here",
    description="API key for authentication",
    key_id=kms_key.key_id,
    tags=common_tags
)

# IAM role for Lambda functions
lambda_role = aws.iam.Role("lambda-execution-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    }),
    tags=common_tags
)

# IAM policy for Lambda functions
lambda_policy = aws.iam.Policy("lambda-policy",
    policy=pulumi.Output.all(
        tasks_table.arn,
        kms_key.arn,
        db_table_param.arn,
        api_key_param.arn
    ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                "Resource": [
                    args[0],  # tasks_table.arn
                    f"{args[0]}/index/*"
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": args[1]  # kms_key.arn
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                ],
                "Resource": [
                    args[2],  # db_table_param.arn
                    args[3]   # api_key_param.arn
                ]
            }
        ]
    })),
    tags=common_tags
)

# Attach policy to role
lambda_role_attachment = aws.iam.RolePolicyAttachment("lambda-policy-attachment",
    role=lambda_role.name,
    policy_arn=lambda_policy.arn
)

# Lambda function code for CRUD operations
lambda_code = """
import json
import boto3
import uuid
import logging
import os
from datetime import datetime
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
ssm = boto3.client('ssm')

# Cache for parameters
_cache = {}

def get_parameter(name, with_decryption=False):
    if name not in _cache:
        try:
            response = ssm.get_parameter(Name=name, WithDecryption=with_decryption)
            _cache[name] = response['Parameter']['Value']
        except ClientError as e:
            logger.error(f"Error getting parameter {name}: {e}")
            raise
    return _cache[name]

def lambda_handler(event, context):
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get table name from parameter store
        table_name = get_parameter(f"/{os.environ['PROJECT_NAME']}/{os.environ['ENVIRONMENT']}/db/table-name")
        table = dynamodb.Table(table_name)
        
        # Parse the request
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}
        
        # Route the request
        if http_method == 'GET' and path == '/tasks':
            return get_tasks(table, query_params)
        elif http_method == 'GET' and '/tasks/' in path:
            task_id = path_params.get('task_id')
            return get_task(table, task_id)
        elif http_method == 'POST' and path == '/tasks':
            return create_task(table, body)
        elif http_method == 'PUT' and '/tasks/' in path:
            task_id = path_params.get('task_id')
            return update_task(table, task_id, body)
        elif http_method == 'DELETE' and '/tasks/' in path:
            task_id = path_params.get('task_id')
            return delete_task(table, task_id)
        elif http_method == 'GET' and path == '/health':
            return create_response(200, {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})
        else:
            return create_response(404, {'error': 'Not Found'})
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal Server Error'})

def get_tasks(table, query_params):
    try:
        user_id = query_params.get('user_id')
        status = query_params.get('status')
        
        if user_id:
            response = table.query(
                IndexName='user-index',
                KeyConditionExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
        elif status:
            response = table.query(
                IndexName='status-index',
                KeyConditionExpression='status = :status',
                ExpressionAttributeValues={':status': status}
            )
        else:
            response = table.scan()
        
        return create_response(200, {'tasks': response['Items']})
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {'error': 'Database error'})

def get_task(table, task_id):
    try:
        if not task_id:
            return create_response(400, {'error': 'task_id is required'})
            
        response = table.get_item(Key={'task_id': task_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'Task not found'})
            
        return create_response(200, response['Item'])
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {'error': 'Database error'})

def create_task(table, body):
    try:
        # Validate required fields
        if not body.get('title') or not body.get('user_id'):
            return create_response(400, {'error': 'title and user_id are required'})
        
        task = {
            'task_id': str(uuid.uuid4()),
            'title': body['title'],
            'description': body.get('description', ''),
            'user_id': body['user_id'],
            'status': body.get('status', 'pending'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=task)
        return create_response(201, task)
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {'error': 'Database error'})

def update_task(table, task_id, body):
    try:
        if not task_id:
            return create_response(400, {'error': 'task_id is required'})
        
        # Check if task exists
        response = table.get_item(Key={'task_id': task_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Task not found'})
        
        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': datetime.utcnow().isoformat()}
        
        for field in ['title', 'description', 'status']:
            if field in body:
                update_expression += f", {field} = :{field}"
                expression_values[f':{field}'] = body[field]
        
        table.update_item(
            Key={'task_id': task_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="ALL_NEW"
        )
        
        # Get updated item
        updated_response = table.get_item(Key={'task_id': task_id})
        return create_response(200, updated_response['Item'])
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {'error': 'Database error'})

def delete_task(table, task_id):
    try:
        if not task_id:
            return create_response(400, {'error': 'task_id is required'})
        
        # Check if task exists
        response = table.get_item(Key={'task_id': task_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Task not found'})
        
        table.delete_item(Key={'task_id': task_id})
        return create_response(204, {})
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {'error': 'Database error'})

def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str)
    }
"""

# Create Lambda function
lambda_function = aws.lambda_.Function("api-handler",
    name=f"{project_name}-api-handler-{environment}",
    role=lambda_role.arn,
    handler="index.lambda_handler",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)
    }),
    timeout=30,
    memory_size=256,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "PROJECT_NAME": project_name,
            "ENVIRONMENT": environment,
            "LOG_LEVEL": "INFO"
        }
    ),
    dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
        target_arn="arn:aws:sqs:us-east-1:123456789012:dlq"  # Optional DLQ
    ),
    reserved_concurrent_executions=100,  # Limit for cost control
    tags=common_tags
)

# Create CloudWatch Log Group for Lambda
log_group = aws.cloudwatch.LogGroup("lambda-logs",
    name=pulumi.Output.concat("/aws/lambda/", lambda_function.name),
    retention_in_days=14,
    tags=common_tags
)

# Create API Gateway
api = aws.apigateway.RestApi("api",
    name=f"{project_name}-api-{environment}",
    description=f"REST API for {project_name}",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
    ),
    tags=common_tags
)

# API Gateway Resources
tasks_resource = aws.apigateway.Resource("tasks-resource",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="tasks"
)

task_resource = aws.apigateway.Resource("task-resource",
    rest_api=api.id,
    parent_id=tasks_resource.id,
    path_part="{task_id}"
)

health_resource = aws.apigateway.Resource("health-resource",
    rest_api=api.id,
    parent_id=api.root_resource_id,
    path_part="health"
)

# API Gateway Methods
def create_method(resource_id, http_method, authorization="NONE"):
    return aws.apigateway.Method(f"{http_method.lower()}-method-{resource_id}",
        rest_api=api.id,
        resource_id=resource_id,
        http_method=http_method,
        authorization=authorization
    )

def create_integration(resource_id, http_method):
    return aws.apigateway.Integration(f"{http_method.lower()}-integration-{resource_id}",
        rest_api=api.id,
        resource_id=resource_id,
        http_method=http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn
    )

# Create methods and integrations for each endpoint
methods = []
integrations = []

# Tasks collection endpoints
for method in ["GET", "POST"]:
    methods.append(create_method(tasks_resource.id, method))
    integrations.append(create_integration(tasks_resource.id, method))

# Individual task endpoints
for method in ["GET", "PUT", "DELETE"]:
    methods.append(create_method(task_resource.id, method))
    integrations.append(create_integration(task_resource.id, method))

# Health endpoint
methods.append(create_method(health_resource.id, "GET"))
integrations.append(create_integration(health_resource.id, "GET"))

# Lambda permission for API Gateway
lambda_permission = aws.lambda_.Permission("api-lambda-permission",
    statement_id="AllowExecutionFromAPIGateway",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api.execution_arn, "/*/*")
)

# API Gateway Deployment
deployment = aws.apigateway.Deployment("api-deployment",
    depends_on=methods + integrations,
    rest_api=api.id,
    stage_name=environment,
    stage_description=f"Deployment for {environment} environment"
)

# API Gateway Stage
stage = aws.apigateway.Stage("api-stage",
    deployment=deployment.id,
    rest_api=api.id,
    stage_name=environment,
    xray_tracing_enabled=True,
    tags=common_tags
)

# CloudWatch Alarms
lambda_error_alarm = aws.cloudwatch.MetricAlarm("lambda-error-alarm",
    name=f"{project_name}-lambda-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="Lambda function error count",
    dimensions={
        "FunctionName": lambda_function.name
    },
    tags=common_tags
)

lambda_duration_alarm = aws.cloudwatch.MetricAlarm("lambda-duration-alarm",
    name=f"{project_name}-lambda-duration-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Duration",
    namespace="AWS/Lambda",
    period=300,
    statistic="Average",
    threshold=15000,  # 15 seconds
    alarm_description="Lambda function duration",
    dimensions={
        "FunctionName": lambda_function.name
    },
    tags=common_tags
)

api_4xx_alarm = aws.cloudwatch.MetricAlarm("api-4xx-alarm",
    name=f"{project_name}-api-4xx-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="4XXError",
    namespace="AWS/ApiGateway",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="API Gateway 4XX errors",
    dimensions={
        "ApiName": api.name
    },
    tags=common_tags
)

api_5xx_alarm = aws.cloudwatch.MetricAlarm("api-5xx-alarm",
    name=f"{project_name}-api-5xx-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="5XXError",
    namespace="AWS/ApiGateway",
    period=300,
    statistic="Sum",
    threshold=1,
    alarm_description="API Gateway 5XX errors",
    dimensions={
        "ApiName": api.name
    },
    tags=common_tags
)

# CloudWatch Dashboard
dashboard = aws.cloudwatch.Dashboard("app-dashboard",
    dashboard_name=f"{project_name}-dashboard-{environment}",
    dashboard_body=pulumi.Output.all(
        lambda_function.name,
        api.name,
        tasks_table.name
    ).apply(lambda args: json.dumps({
        "widgets": [
            {
                "type": "metric",
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", "FunctionName", args[0]],
                        [".", "Errors", ".", "."],
                        [".", "Duration", ".", "."]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": current_region.name,
                    "title": "Lambda Metrics",
                    "period": 300
                }
            },
            {
                "type": "metric",
                "x": 12,
                "y": 0,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/ApiGateway", "Count", "ApiName", args[1]],
                        [".", "Latency", ".", "."],
                        [".", "4XXError", ".", "."],
                        [".", "5XXError", ".", "."]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": current_region.name,
                    "title": "API Gateway Metrics",
                    "period": 300
                }
            },
            {
                "type": "metric",
                "x": 0,
                "y": 6,
                "width": 12,
                "height": 6,
                "properties": {
                    "metrics": [
                        ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", args[2]],
                        [".", "ConsumedWriteCapacityUnits", ".", "."]
                    ],
                    "view": "timeSeries",
                    "stacked": False,
                    "region": current_region.name,
                    "title": "DynamoDB Metrics",
                    "period": 300
                }
            }
        ]
    }))
)

# Exports
pulumi.export("api_url", pulumi.Output.concat("https://", api.id, ".execute-api.", current_region.name, ".amazonaws.com/", environment))
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("dynamodb_table_name", tasks_table.name)
pulumi.export("kms_key_id", kms_key.key_id)
pulumi.export("dashboard_url", pulumi.Output.concat("https://console.aws.amazon.com/cloudwatch/home?region=", current_region.name, "#dashboards:name=", dashboard.dashboard_name))
```
