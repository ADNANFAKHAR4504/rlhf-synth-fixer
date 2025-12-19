### Reasoning Trace
---

Alright, let's break down the requirements and build a single Python CDK stack that meets all the specified criteria:

1. AWS CDK with Python
2. Single stack in `main.py`
3. Deployment region: us-west-2
4. Resource naming to reflect environment (dev or prod)
5. Components needed:
   - Multiple Lambda functions with Python 3.9
   - API Gateway
   - DynamoDB tables with auto-scaling
   - S3 bucket with server-side encryption (KMS)
   - CloudWatch for monitoring
   - Each Lambda should have its own CloudWatch log group
6. Lambda versioning for rollback capability
7. Environment variables for deployment stages
8. API Gateway logging at INFO level
9. IAM roles with minimum privileges
10. No direct IAM user access, everything through roles

Let's start building the CDK stack:

```python
# main.py
from aws_cdk import (
    core,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
    aws_logs_destinations as logs_destinations,
)

class ServerlessStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define environment-based naming
        resource_prefix = f"{env_name}-serverless"
        
        # Create KMS key for S3 encryption
        encryption_key = kms.Key(
            self, 
            f"{resource_prefix}-encryption-key",
            alias=f"alias/{resource_prefix}-s3-key",
            enable_key_rotation=True
        )
        
        # Create S3 bucket with server-side encryption
        bucket = s3.Bucket(
            self, 
            f"{resource_prefix}-data-bucket",
            bucket_name=f"{resource_prefix}-data-bucket-{core.Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=encryption_key,
            removal_policy=core.RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Create DynamoDB tables with auto-scaling
        user_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-user-table",
            table_name=f"{resource_prefix}-user-table",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling with on-demand capacity
            removal_policy=core.RemovalPolicy.RETAIN
        )
        
        data_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-data-table",
            table_name=f"{resource_prefix}-data-table",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=core.RemovalPolicy.RETAIN
        )
        
        # Set up auto-scaling for the data table
        read_scaling = data_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        
        read_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        write_scaling = data_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        )
        
        write_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        # Define Lambda functions
        get_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-user",
            function_name=f"{resource_prefix}-get-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=core.RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        create_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-create-user",
            function_name=f"{resource_prefix}-create-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/create_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=core.RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        get_data_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-data",
            function_name=f"{resource_prefix}-get-data",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_data"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "DATA_TABLE": data_table.table_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=core.RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Create CloudWatch log groups for each Lambda
        get_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-user-log-group",
            log_group_name=f"/aws/lambda/{get_user_lambda.function_name}",
            removal_policy=core.RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        create_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-create-user-log-group",
            log_group_name=f"/aws/lambda/{create_user_lambda.function_name}",
            removal_policy=core.RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        get_data_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-data-log-group",
            log_group_name=f"/aws/lambda/{get_data_lambda.function_name}",
            removal_policy=core.RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Grant permissions
        user_table.grant_read_data(get_user_lambda)
        user_table.grant_read_write_data(create_user_lambda)
        data_table.grant_read_data(get_data_lambda)
        bucket.grant_read(get_data_lambda)
        
        # Create API Gateway with logging
        api = apigw.RestApi(
            self, 
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(
                stage_name=env_name,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # API Gateway resources and methods
        users_resource = api.root.add_resource("users")
        user_resource = users_resource.add_resource("{user_id}")
        
        # GET /users/{user_id}
        user_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_user_lambda)
        )
        
        # POST /users
        users_resource.add_method(
            "POST", 
            apigw.LambdaIntegration(create_user_lambda)
        )
        
        # Data resource
        data_resource = api.root.add_resource("data")
        data_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_data_lambda)
        )
        
        # Output the API URL
        core.CfnOutput(
            self, 
            "ApiUrl",
            value=api.url
        )

# App and stack creation
app = core.App()

# Get environment from context or use 'dev' as default
env_name = app.node.try_get_context("env") or "dev"

ServerlessStack(
    app, 
    f"{env_name}-serverless-stack",
    env_name=env_name,
    env=core.Environment(
        account=app.node.try_get_context("account") or process.env.CDK_DEFAULT_ACCOUNT,
        region="us-west-2"
    )
)

app.synth()
```

Wait, I need to update the imports as they changed in newer CDK versions. Let me update to use CDK v2 syntax:

```python
# main.py
from aws_cdk import (
    App, Stack, Environment, RemovalPolicy, Aws, CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define environment-based naming
        resource_prefix = f"{env_name}-serverless"
        
        # Create KMS key for S3 encryption
        encryption_key = kms.Key(
            self, 
            f"{resource_prefix}-encryption-key",
            alias=f"alias/{resource_prefix}-s3-key",
            enable_key_rotation=True
        )
        
        # Create S3 bucket with server-side encryption
        bucket = s3.Bucket(
            self, 
            f"{resource_prefix}-data-bucket",
            bucket_name=f"{resource_prefix}-data-bucket-{Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=encryption_key,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Create DynamoDB tables with auto-scaling
        user_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-user-table",
            table_name=f"{resource_prefix}-user-table",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling with on-demand capacity
            removal_policy=RemovalPolicy.RETAIN
        )
        
        data_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-data-table",
            table_name=f"{resource_prefix}-data-table",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Set up auto-scaling for the data table
        read_scaling = data_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        
        read_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        write_scaling = data_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        )
        
        write_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        # Define Lambda functions
        get_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-user",
            function_name=f"{resource_prefix}-get-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        create_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-create-user",
            function_name=f"{resource_prefix}-create-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/create_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        get_data_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-data",
            function_name=f"{resource_prefix}-get-data",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_data"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "DATA_TABLE": data_table.table_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Create CloudWatch log groups for each Lambda
        get_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-user-log-group",
            log_group_name=f"/aws/lambda/{get_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        create_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-create-user-log-group",
            log_group_name=f"/aws/lambda/{create_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        get_data_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-data-log-group",
            log_group_name=f"/aws/lambda/{get_data_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Grant permissions
        user_table.grant_read_data(get_user_lambda)
        user_table.grant_read_write_data(create_user_lambda)
        data_table.grant_read_data(get_data_lambda)
        bucket.grant_read(get_data_lambda)
        
        # Create API Gateway with logging
        api = apigw.RestApi(
            self, 
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(
                stage_name=env_name,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # API Gateway resources and methods
        users_resource = api.root.add_resource("users")
        user_resource = users_resource.add_resource("{user_id}")
        
        # GET /users/{user_id}
        user_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_user_lambda)
        )
        
        # POST /users
        users_resource.add_method(
            "POST", 
            apigw.LambdaIntegration(create_user_lambda)
        )
        
        # Data resource
        data_resource = api.root.add_resource("data")
        data_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_data_lambda)
        )
        
        # Output the API URL
        CfnOutput(
            self, 
            "ApiUrl",
            value=api.url
        )

# App and stack creation
app = App()

# Get environment from context or use 'dev' as default
env_name = app.node.try_get_context("env") or "dev"

ServerlessStack(
    app, 
    f"{env_name}-serverless-stack",
    env_name=env_name,
    env=Environment(
        account=app.node.try_get_context("account"),
        region="us-west-2"
    )
)

app.synth()
```

I see there's still a small issue with the account - let's fix that:

```python
# main.py
import os
from aws_cdk import (
    App, Stack, Environment, RemovalPolicy, Aws, CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_logs as logs,
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define environment-based naming
        resource_prefix = f"{env_name}-serverless"
        
        # Create KMS key for S3 encryption
        encryption_key = kms.Key(
            self, 
            f"{resource_prefix}-encryption-key",
            alias=f"alias/{resource_prefix}-s3-key",
            enable_key_rotation=True
        )
        
        # Create S3 bucket with server-side encryption
        bucket = s3.Bucket(
            self, 
            f"{resource_prefix}-data-bucket",
            bucket_name=f"{resource_prefix}-data-bucket-{Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=encryption_key,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Create DynamoDB tables with auto-scaling
        user_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-user-table",
            table_name=f"{resource_prefix}-user-table",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Auto-scaling with on-demand capacity
            removal_policy=RemovalPolicy.RETAIN
        )
        
        data_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-data-table",
            table_name=f"{resource_prefix}-data-table",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Set up auto-scaling for the data table
        read_scaling = data_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        
        read_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        write_scaling = data_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        )
        
        write_scaling.scale_on_utilization(
            target_utilization_percent=70
        )
        
        # Define Lambda functions
        get_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-user",
            function_name=f"{resource_prefix}-get-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        create_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-create-user",
            function_name=f"{resource_prefix}-create-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/create_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USER_TABLE": user_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        get_data_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-data",
            function_name=f"{resource_prefix}-get-data",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_data"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "DATA_TABLE": data_table.table_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Create CloudWatch log groups for each Lambda
        get_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-user-log-group",
            log_group_name=f"/aws/lambda/{get_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        create_user_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-create-user-log-group",
            log_group_name=f"/aws/lambda/{create_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        get_data_log_group = logs.LogGroup(
            self,
            f"{resource_prefix}-get-data-log-group",
            log_group_name=f"/aws/lambda/{get_data_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Grant permissions
        user_table.grant_read_data(get_user_lambda)
        user_table.grant_read_write_data(create_user_lambda)
        data_table.grant_read_data(get_data_lambda)
        bucket.grant_read(get_data_lambda)
        
        # Create API Gateway with logging
        api = apigw.RestApi(
            self, 
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(
                stage_name=env_name,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # API Gateway resources and methods
        users_resource = api.root.add_resource("users")
        user_resource = users_resource.add_resource("{user_id}")
        
        # GET /users/{user_id}
        user_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_user_lambda)
        )
        
        # POST /users
        users_resource.add_method(
            "POST", 
            apigw.LambdaIntegration(create_user_lambda)
        )
        
        # Data resource
        data_resource = api.root.add_resource("data")
        data_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_data_lambda)
        )
        
        # Output the API URL
        CfnOutput(
            self, 
            "ApiUrl",
            value=api.url
        )

# App and stack creation
app = App()

# Get environment from context or use 'dev' as default
env_name = app.node.try_get_context("env") or "dev"
account_id = app.node.try_get_context("account") or os.environ.get("CDK_DEFAULT_ACCOUNT")

ServerlessStack(
    app, 
    f"{env_name}-serverless-stack",
    env_name=env_name,
    env=Environment(
        account=account_id,
        region="us-west-2"
    )
)

app.synth()
```

Now the stack looks good, but I should also include a deployment section to make it easier for the user to understand how to deploy the infrastructure. Let's create a readme or deployment instructions:

```markdown
# Serverless Infrastructure with AWS CDK

This project sets up a complete serverless infrastructure in AWS using the AWS CDK with Python.

## Prerequisites

- AWS CLI configured
- Node.js and npm installed
- Python 3.x installed
- AWS CDK installed globally: `npm install -g aws-cdk`
- Required Python packages: `pip install -r requirements.txt`

## Directory Structure

```
.
├── lambda/
│   ├── get_user/
│   │   └── index.py
│   ├── create_user/
│   │   └── index.py
│   └── get_data/
│       └── index.py
├── main.py
├── requirements.txt
└── cdk.json
```

## Lambda Function Code

Create directories for each Lambda function:

```bash
mkdir -p lambda/get_user lambda/create_user lambda/get_data
```

Add sample code for each Lambda function.

### lambda/get_user/index.py:

```python
import os
import json
import boto3

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['USER_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    # Get path parameter
    user_id = event['pathParameters']['user_id']
    
    try:
        # Query DynamoDB
        response = table.get_item(
            Key={'user_id': user_id}
        )
        
        # Check if item exists
        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(response['Item'])
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'User not found'})
            }
    except Exception as e:
        # Log error
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### lambda/create_user/index.py:

```python
import os
import json
import boto3
import uuid

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['USER_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Generate a unique ID if not provided
        if 'user_id' not in body:
            body['user_id'] = str(uuid.uuid4())
        
        # Add environment info
        body['environment'] = os.environ['ENVIRONMENT']
        
        # Store in DynamoDB
        table.put_item(Item=body)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'User created successfully',
                'user': body
            })
        }
    except Exception as e:
        # Log error
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### lambda/get_data/index.py:

```python
import os
import json
import boto3

# Initialize clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get environment variables
data_table_name = os.environ['DATA_TABLE']
bucket_name = os.environ['BUCKET_NAME']
environment = os.environ['ENVIRONMENT']

data_table = dynamodb.Table(data_table_name)

def handler(event, context):
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        data_id = query_params.get('id')
        
        if data_id:
            # Get specific data from DynamoDB
            response = data_table.get_item(
                Key={'id': data_id}
            )
            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps(response['Item'])
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Data not found'})
                }
        else:
            # List objects in S3 bucket
            response = s3.list_objects_v2(
                Bucket=bucket_name,
                Prefix=f"{environment}/",
                MaxKeys=10
            )
            
            files = []
            if 'Contents' in response:
                files = [obj['Key'] for obj in response['Contents']]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'environment': environment,
                    'files': files
                })
            }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## Requirements

Create a `requirements.txt` file:

```
aws-cdk-lib>=2.0.0
constructs>=10.0.0
boto3>=1.20.0
```

## Deployment

1. Bootstrap your AWS environment (if not already done):

```bash
cdk bootstrap aws://<account-id>/us-west-2
```

2. Deploy to the 'dev' environment:

```bash
cdk deploy --context env=dev
```

3. Deploy to the 'prod' environment:

```bash
cdk deploy --context env=prod
```

## Cleanup

To remove the infrastructure:

```bash
cdk destroy --context env=dev
cdk destroy --context env=prod
```

## Notes

- The stack is configured to deploy to the us-west-2 region.
- Resources are named according to the environment (dev or prod).
- Lambda functions run on Python 3.9 runtime.
- CloudWatch logs are configured for monitoring.
- DynamoDB tables have auto-scaling enabled.
- S3 bucket has server-side encryption with KMS.
- IAM permissions follow the principle of least privilege.
```

Now I have a complete solution for the AWS CDK stack in Python that meets all the requirements. The stack includes:

1. Environment-specific resource naming (dev/prod)
2. Multiple Lambda functions running on Python 3.9 with versioning
3. API Gateway with INFO level logging
4. DynamoDB tables with auto-scaling
5. S3 bucket with server-side encryption via KMS
6. CloudWatch log groups for each Lambda function
7. Proper IAM permissions with least privilege principle
8. All resources are deployed in us-west-2

The solution also includes sample code for the Lambda functions and deployment instructions to make it easier for the user to understand and implement the infrastructure.
### Answer 
---

# Serverless AWS CDK Infrastructure in Python

Here's a complete serverless infrastructure implementation using AWS CDK in Python. This single stack handles both dev and prod environments with environment-aware naming and appropriate configurations.

## `main.py`

```python
import os
from aws_cdk import (
    App, Stack, Environment, RemovalPolicy, Aws, CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_kms as kms,
    aws_logs as logs,
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, id: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Environment-based resource prefix for consistent naming
        resource_prefix = f"{env_name}-serverless"
        
        # Create KMS key for S3 encryption
        encryption_key = kms.Key(
            self, 
            f"{resource_prefix}-encryption-key",
            alias=f"alias/{resource_prefix}-s3-key",
            enable_key_rotation=True,
            description=f"KMS key for {env_name} S3 bucket encryption"
        )
        
        # Create S3 bucket with server-side encryption
        bucket = s3.Bucket(
            self, 
            f"{resource_prefix}-bucket",
            bucket_name=f"{resource_prefix}-data-{Aws.ACCOUNT_ID}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=encryption_key,
            removal_policy=RemovalPolicy.RETAIN,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Create DynamoDB tables with auto-scaling
        users_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-users-table",
            table_name=f"{resource_prefix}-users",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand capacity with auto-scaling
            removal_policy=RemovalPolicy.RETAIN
        )
        
        orders_table = dynamodb.Table(
            self, 
            f"{resource_prefix}-orders-table",
            table_name=f"{resource_prefix}-orders",
            partition_key=dynamodb.Attribute(
                name="order_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.RETAIN
        )
        
        # Set up auto-scaling for the orders table
        read_scaling = orders_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        read_scaling.scale_on_utilization(target_utilization_percent=70)
        
        write_scaling = orders_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=50
        )
        write_scaling.scale_on_utilization(target_utilization_percent=70)
        
        # Define Lambda functions with versioning
        get_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-user",
            function_name=f"{resource_prefix}-get-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USERS_TABLE": users_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        create_user_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-create-user",
            function_name=f"{resource_prefix}-create-user",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/create_user"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "USERS_TABLE": users_table.table_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        get_orders_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-get-orders",
            function_name=f"{resource_prefix}-get-orders",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/get_orders"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "ORDERS_TABLE": orders_table.table_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE
        )
        
        upload_file_lambda = lambda_.Function(
            self, 
            f"{resource_prefix}-upload-file",
            function_name=f"{resource_prefix}-upload-file",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_asset("lambda/upload_file"),
            handler="index.handler",
            environment={
                "ENVIRONMENT": env_name,
                "BUCKET_NAME": bucket.bucket_name
            },
            current_version_options=lambda_.VersionOptions(
                removal_policy=RemovalPolicy.RETAIN,
                description=f"Version for {env_name} environment"
            ),
            tracing=lambda_.Tracing.ACTIVE,
            timeout=lambda_.Duration.seconds(30)
        )
        
        # Create CloudWatch log groups for each Lambda
        logs.LogGroup(
            self,
            f"{resource_prefix}-get-user-log",
            log_group_name=f"/aws/lambda/{get_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        logs.LogGroup(
            self,
            f"{resource_prefix}-create-user-log",
            log_group_name=f"/aws/lambda/{create_user_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        logs.LogGroup(
            self,
            f"{resource_prefix}-get-orders-log",
            log_group_name=f"/aws/lambda/{get_orders_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        logs.LogGroup(
            self,
            f"{resource_prefix}-upload-file-log",
            log_group_name=f"/aws/lambda/{upload_file_lambda.function_name}",
            removal_policy=RemovalPolicy.DESTROY,
            retention=logs.RetentionDays.ONE_WEEK
        )
        
        # Grant minimal required permissions
        users_table.grant_read_data(get_user_lambda)
        users_table.grant_read_write_data(create_user_lambda)
        orders_table.grant_read_data(get_orders_lambda)
        bucket.grant_read(get_orders_lambda)
        bucket.grant_read_write(upload_file_lambda)
        
        # Create API Gateway with logging enabled
        api = apigw.RestApi(
            self, 
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(
                stage_name=env_name,
                logging_level=apigw.MethodLoggingLevel.INFO,  # Enable INFO level logging
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # API Gateway resources and methods
        users_resource = api.root.add_resource("users")
        user_resource = users_resource.add_resource("{user_id}")
        orders_resource = api.root.add_resource("orders")
        files_resource = api.root.add_resource("files")
        
        # GET /users/{user_id}
        user_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_user_lambda)
        )
        
        # POST /users
        users_resource.add_method(
            "POST", 
            apigw.LambdaIntegration(create_user_lambda)
        )
        
        # GET /orders
        orders_resource.add_method(
            "GET", 
            apigw.LambdaIntegration(get_orders_lambda)
        )
        
        # POST /files
        files_resource.add_method(
            "POST",
            apigw.LambdaIntegration(upload_file_lambda)
        )
        
        # Output the API URL
        CfnOutput(
            self, 
            "ApiUrl",
            value=api.url,
            description=f"URL for {env_name} API Gateway"
        )

# App and stack creation
app = App()

# Get environment from context or use 'dev' as default
env_name = app.node.try_get_context("env") or "dev"
account_id = app.node.try_get_context("account") or os.environ.get("CDK_DEFAULT_ACCOUNT")

ServerlessStack(
    app, 
    f"{env_name}-serverless-stack",
    env_name=env_name,
    env=Environment(
        account=account_id,
        region="us-west-2"  # Hardcoded to deploy in us-west-2 as requested
    )
)

app.synth()
```

## Lambda Function Examples

### `lambda/get_user/index.py`

```python
import os
import json
import boto3
from decimal import Decimal

# Custom JSON encoder for Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['USERS_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    # Get user_id from path parameters
    user_id = event['pathParameters']['user_id']
    
    try:
        # Get user from DynamoDB
        response = table.get_item(Key={'user_id': user_id})
        
        # Return user if found
        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps(response['Item'], cls=DecimalEncoder)
            }
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'User not found'})
            }
    except Exception as e:
        print(f"Error getting user: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### `lambda/create_user/index.py`

```python
import os
import json
import boto3
import uuid
from datetime import datetime

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['USERS_TABLE']
table = dynamodb.Table(table_name)
env = os.environ['ENVIRONMENT']

def handler(event, context):
    try:
        # Parse request body
        body = json.loads(event['body'])
        
        # Generate user_id if not provided
        if 'user_id' not in body:
            body['user_id'] = str(uuid.uuid4())
            
        # Add metadata
        body['created_at'] = datetime.utcnow().isoformat()
        body['environment'] = env
        
        # Save user to DynamoDB
        table.put_item(Item=body)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'User created successfully',
                'user_id': body['user_id']
            })
        }
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## Deployment Instructions

### Prerequisites

1. AWS CLI configured
2. Python 3.9+ installed
3. AWS CDK installed: `npm install -g aws-cdk`
4. Required Python packages: `pip install -r requirements.txt`

### Requirements.txt

```
aws-cdk-lib>=2.0.0
constructs>=10.0.0
boto3>=1.20.0
```

### Deployment Commands

1. Bootstrap your AWS environment (if not already done):
   ```bash
   cdk bootstrap aws://<account-id>/us-west-2
   ```

2. Deploy to development environment:
   ```bash
   cdk deploy --context env=dev
   ```

3. Deploy to production environment:
   ```bash
   cdk deploy --context env=prod
   ```

## Key Features of this Implementation

1. **Environment-aware naming**: All resources include the environment (dev/prod) in their names
2. **Region-specific**: Deploys everything to us-west-2 as requested
3. **Lambda versioning**: All functions have versioning enabled for rollbacks
4. **Minimal IAM permissions**: Each function only has access to the resources it needs
5. **DynamoDB auto-scaling**: Configured for both read and write operations
6. **S3 encryption**: Server-side encryption with KMS
7. **CloudWatch logging**: Dedicated log groups for each Lambda function
8. **API Gateway logging**: INFO-level logging at the stage level

This implementation follows AWS best practices for serverless applications and creates a fully configurable infrastructure that can be deployed to both development and production environments.