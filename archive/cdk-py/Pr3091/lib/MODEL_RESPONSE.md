### Reasoning Trace
---

Alright, I'm being asked to provide a complete AWS CDK implementation in Python for a serverless infrastructure. Let me break down the requirements:

1. **Region**: us-west-2
2. **Serverless Components**:
   - Two Lambda functions for backend processing
   - API Gateway to expose these functions on different endpoints
   - DynamoDB table for user information with primary key and secondary index
   - Environment variables for Lambda to DynamoDB connection
   - X-Ray tracing enabled
3. **Monitoring**:
   - CloudWatch alarms for Lambda error rates > 5% in a 5-minute window
   - Logging to S3 bucket with versioning and AES256 encryption
4. **Security**:
   - VPC endpoints for S3 and DynamoDB
   - Least privilege IAM roles
   - CORS enabled for API Gateway
5. **Outputs**:
   - CloudFormation outputs for API endpoint URLs

Let me create a comprehensive Python AWS CDK implementation in a single stack.

First, I need to determine the right imports for the CDK components:

```python
from aws_cdk import (
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ec2 as ec2,
    aws_logs as logs,
    core
)
```

Now, let's define the stack:

```python
class ServerlessInfrastructureStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
```

Now, let's implement each component:

1. **VPC and VPC Endpoints**:
   - Create a VPC
   - Set up VPC endpoints for S3 and DynamoDB

2. **S3 Bucket for Logs**:
   - Versioning enabled
   - AES256 encryption required

3. **DynamoDB Table**:
   - Define primary key and secondary index

4. **Lambda Functions**:
   - Create two Lambda functions
   - Set up environment variables
   - Enable X-Ray tracing

5. **API Gateway**:
   - Create API Gateway
   - Define endpoints
   - Enable CORS

6. **CloudWatch Alarms**:
   - Set up alarms for Lambda error rates

7. **IAM Roles**:
   - Define least privilege roles

Let me now implement the full solution:

```python
from aws_cdk import (
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ec2 as ec2,
    aws_logs as logs,
    core,
    aws_logs_destinations as logs_destinations,
    Duration,
    RemovalPolicy,
    Stack,
    CfnOutput
)
from constructs import Construct

class ServerlessInfrastructureStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC
        vpc = ec2.Vpc(
            self, "ServerlessVPC",
            max_azs=2,  # Use 2 Availability Zones
            nat_gateways=1  # Add a NAT gateway for internet access from private subnets
        )

        # 2. Create VPC endpoints for S3 and DynamoDB
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self, "S3VpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self, "DynamoDBVpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )

        # 3. Create S3 bucket for logs with versioning and encryption
        logs_bucket = s3.Bucket(
            self, "LogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN
        )

        # 4. Create SNS topic for CloudWatch alarms
        alarm_topic = sns.Topic(
            self, "LambdaErrorAlarmTopic",
            display_name="Lambda Error Alarms"
        )

        # 5. Create DynamoDB table with primary key and secondary index
        users_table = dynamodb.Table(
            self, "UsersTable",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Add secondary index
        users_table.add_global_secondary_index(
            index_name="emailIndex",
            partition_key=dynamodb.Attribute(
                name="email",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # 6. Create Lambda functions with X-Ray tracing
        # Lambda execution role with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # Grant permissions to write to S3 logs bucket
        logs_bucket.grant_write(lambda_role)

        # Grant permissions to read/write to DynamoDB table
        users_table.grant_read_write_data(lambda_role)

        # Common Lambda configuration
        lambda_common_config = {
            "runtime": lambda_.Runtime.PYTHON_3_9,
            "vpc": vpc,
            "role": lambda_role,
            "tracing": lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            "environment": {
                "DYNAMODB_TABLE_NAME": users_table.table_name,
                "LOGS_BUCKET_NAME": logs_bucket.bucket_name
            }
        }

        # First Lambda function
        lambda_function1 = lambda_.Function(
            self, "ProcessUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Processing user event: %s', json.dumps(event))
    
    try:
        # Get data from event
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Store in DynamoDB
        response = table.put_item(
            Item={
                'userId': user_id,
                'email': body.get('email'),
                'name': body.get('name'),
                'createdAt': str(datetime.datetime.now())
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'User processed successfully'})
        }
    except Exception as e:
        logger.error('Error processing user: %s', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # Second Lambda function
        lambda_function2 = lambda_.Function(
            self, "GetUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Get user event: %s', json.dumps(event))
    
    try:
        # Get user ID from path parameter
        user_id = event.get('pathParameters', {}).get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Get from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id
            }
        )
        
        # Check if item exists
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps(response['Item'])
        }
    except Exception as e:
        logger.error('Error getting user: %s', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 7. Create CloudWatch alarms for Lambda error rates
        for idx, func in enumerate([lambda_function1, lambda_function2], 1):
            # Create alarm for error rate > 5% in 5-minute window
            error_alarm = cloudwatch.Alarm(
                self, f"LambdaErrorAlarm{idx}",
                metric=func.metric_errors().with_statistic("sum").with_period(Duration.minutes(5)),
                threshold=5,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluation_periods=1,
                alarm_description=f"Alarm if the error rate of {func.function_name} is greater than 5% in 5 minutes"
            )
            
            # Add action to SNS topic
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # 8. Create API Gateway with CORS enabled
        api = apigw.RestApi(
            self, "ServerlessApi",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            )
        )

        # 9. Add Lambda integrations to API Gateway
        # First Lambda - Process User
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigw.LambdaIntegration(
                lambda_function1,
                proxy=True
            )
        )

        # Second Lambda - Get User
        user_resource = users_resource.add_resource("{userId}")
        user_resource.add_method(
            "GET",
            apigw.LambdaIntegration(
                lambda_function2,
                proxy=True
            )
        )

        # 10. CloudFormation outputs
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "ProcessUserEndpoint",
            value=f"{api.url}users",
            description="Process User API endpoint"
        )
        
        CfnOutput(
            self, "GetUserEndpoint",
            value=f"{api.url}users/{{userId}}",
            description="Get User API endpoint"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=users_table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self, "LogsBucketName",
            value=logs_bucket.bucket_name,
            description="S3 bucket for logs"
        )
```

Wait, there's an issue with the import statement. Let me fix the AWS CDK imports to match the latest CDK version:

```python
from aws_cdk import (
    Duration,
    Stack,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ec2 as ec2,
    aws_logs as logs
)
from constructs import Construct
```

Now, for the main application entry point (app.py):

```python
#!/usr/bin/env python3
from aws_cdk import App, Environment
from serverless_infrastructure.serverless_infrastructure_stack import ServerlessInfrastructureStack

app = App()

ServerlessInfrastructureStack(
    app, "ServerlessInfrastructureStack",
    env=Environment(
        region="us-west-2"
    )
)

app.synth()
```

I realized that the Lambda code inline has a missing import for datetime. Let me fix the Lambda function code:

```python
# First Lambda function
lambda_function1 = lambda_.Function(
    self, "ProcessUserFunction",
    handler="index.handler",
    code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Processing user event: %s', json.dumps(event))
    
    try:
        # Get data from event
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Store in DynamoDB
        response = table.put_item(
            Item={
                'userId': user_id,
                'email': body.get('email'),
                'name': body.get('name'),
                'createdAt': str(datetime.datetime.now())
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'User processed successfully'})
        }
    except Exception as e:
        logger.error('Error processing user: %s', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
    timeout=Duration.seconds(30),
    **lambda_common_config
)
```

I think I also need to modify how I'm calculating the error rate alarm. Since we want to trigger if error rate is over 5% (not just 5 errors), I'll need to create a custom metric:

```python
# 7. Create CloudWatch alarms for Lambda error rates
for idx, func in enumerate([lambda_function1, lambda_function2], 1):
    # Get invocations and errors metrics
    invocations_metric = func.metric_invocations().with_statistic("sum").with_period(Duration.minutes(5))
    errors_metric = func.metric_errors().with_statistic("sum").with_period(Duration.minutes(5))
    
    # Create a custom metric for error rate (errors / invocations * 100)
    error_rate_metric = cloudwatch.MathExpression(
        expression="(errors / invocations) * 100",
        using_metrics={
            "errors": errors_metric,
            "invocations": invocations_metric
        },
        label=f"{func.function_name} Error Rate (%)"
    )
    
    # Create alarm for error rate > 5% in 5-minute window
    error_alarm = cloudwatch.Alarm(
        self, f"LambdaErrorAlarm{idx}",
        metric=error_rate_metric,
        threshold=5,
        comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluation_periods=1,
        alarm_description=f"Alarm if the error rate of {func.function_name} is greater than 5% in 5 minutes"
    )
    
    # Add action to SNS topic
    error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))
```

Let me put everything together into a complete solution:

Now for the final main.py:

```python
#!/usr/bin/env python3
from aws_cdk import (
    Duration,
    Stack,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ec2 as ec2,
    aws_logs as logs,
    App,
    Environment
)
from constructs import Construct

class ServerlessInfrastructureStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC
        vpc = ec2.Vpc(
            self, "ServerlessVPC",
            max_azs=2,  # Use 2 Availability Zones
            nat_gateways=1  # Add a NAT gateway for internet access from private subnets
        )

        # 2. Create VPC endpoints for S3 and DynamoDB
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self, "S3VpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self, "DynamoDBVpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )

        # 3. Create S3 bucket for logs with versioning and encryption
        logs_bucket = s3.Bucket(
            self, "LogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.RETAIN
        )

        # 4. Create SNS topic for CloudWatch alarms
        alarm_topic = sns.Topic(
            self, "LambdaErrorAlarmTopic",
            display_name="Lambda Error Alarms"
        )

        # 5. Create DynamoDB table with primary key and secondary index
        users_table = dynamodb.Table(
            self, "UsersTable",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Add secondary index
        users_table.add_global_secondary_index(
            index_name="emailIndex",
            partition_key=dynamodb.Attribute(
                name="email",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # 6. Create Lambda functions with X-Ray tracing
        # Lambda execution role with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # Grant permissions to write to S3 logs bucket
        logs_bucket.grant_write(lambda_role)

        # Grant permissions to read/write to DynamoDB table
        users_table.grant_read_write_data(lambda_role)

        # Common Lambda configuration
        lambda_common_config = {
            "runtime": lambda_.Runtime.PYTHON_3_9,
            "vpc": vpc,
            "role": lambda_role,
            "tracing": lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            "environment": {
                "DYNAMODB_TABLE_NAME": users_table.table_name,
                "LOGS_BUCKET_NAME": logs_bucket.bucket_name
            }
        }

        # First Lambda function
        lambda_function1 = lambda_.Function(
            self, "ProcessUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Processing user event: %s', json.dumps(event))
    
    try:
        # Get data from event
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Store in DynamoDB
        response = table.put_item(
            Item={
                'userId': user_id,
                'email': body.get('email'),
                'name': body.get('name'),
                'createdAt': str(datetime.datetime.now())
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'User processed successfully'})
        }
    except Exception as e:
        logger.error('Error processing user: %s', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # Second Lambda function
        lambda_function2 = lambda_.Function(
            self, "GetUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Get user event: %s', json.dumps(event))
    
    try:
        # Get user ID from path parameter
        user_id = event.get('pathParameters', {}).get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Get from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id
            }
        )
        
        # Check if item exists
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps(response['Item'])
        }
    except Exception as e:
        logger.error('Error getting user: %s', str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 7. Create CloudWatch alarms for Lambda error rates
        for idx, func in enumerate([lambda_function1, lambda_function2], 1):
            # Get invocations and errors metrics
            invocations_metric = func.metric_invocations().with_statistic("sum").with_period(Duration.minutes(5))
            errors_metric = func.metric_errors().with_statistic("sum").with_period(Duration.minutes(5))
            
            # Create a custom metric for error rate (errors / invocations * 100)
            error_rate_metric = cloudwatch.MathExpression(
                expression="(errors / invocations) * 100",
                using_metrics={
                    "errors": errors_metric,
                    "invocations": invocations_metric
                },
                label=f"{func.function_name} Error Rate (%)"
            )
            
            # Create alarm for error rate > 5% in 5-minute window
            error_alarm = cloudwatch.Alarm(
                self, f"LambdaErrorAlarm{idx}",
                metric=error_rate_metric,
                threshold=5,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluation_periods=1,
                alarm_description=f"Alarm if the error rate of {func.function_name} is greater than 5% in 5 minutes"
            )
            
            # Add action to SNS topic
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # 8. Create API Gateway with CORS enabled
        api = apigw.RestApi(
            self, "ServerlessApi",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            )
        )

        # 9. Add Lambda integrations to API Gateway
        # First Lambda - Process User
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigw.LambdaIntegration(
                lambda_function1,
                proxy=True
            )
        )

        # Second Lambda - Get User
        user_resource = users_resource.add_resource("{userId}")
        user_resource.add_method(
            "GET",
            apigw.LambdaIntegration(
                lambda_function2,
                proxy=True
            )
        )

        # 10. CloudFormation outputs
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "ProcessUserEndpoint",
            value=f"{api.url}users",
            description="Process User API endpoint"
        )
        
        CfnOutput(
            self, "GetUserEndpoint",
            value=f"{api.url}users/{{userId}}",
            description="Get User API endpoint"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=users_table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self, "LogsBucketName",
            value=logs_bucket.bucket_name,
            description="S3 bucket for logs"
        )


# Main App
app = App()
ServerlessInfrastructureStack(
    app, "ServerlessInfrastructureStack",
    env=Environment(
        region="us-west-2"
    )
)
app.synth()
```

This is the complete CDK implementation in Python for the requested serverless infrastructure. It follows all the requirements:

1. Two Lambda functions for backend processing
2. API Gateway with CORS enabled to expose the functions
3. DynamoDB table with primary key and secondary index
4. X-Ray tracing enabled for performance monitoring
5. CloudWatch alarms for Lambda error rates
6. Encrypted S3 bucket with versioning for logs
7. VPC endpoints for S3 and DynamoDB for security
8. Least privilege IAM roles
9. CloudFormation outputs for the API endpoints

The stack is designed to be deployed in the us-west-2 region and should work out of the box.
### Answer 
---

# Secure Serverless Infrastructure with AWS CDK (Python)

Below is a complete AWS CDK implementation in Python for your secure serverless application infrastructure in us-west-2. This solution follows best practices for security, monitoring, and least privilege.

## main.py

```python
#!/usr/bin/env python3
from aws_cdk import (
    Duration,
    Stack,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_ec2 as ec2,
    aws_logs as logs,
    App,
    Environment
)
from constructs import Construct

class ServerlessInfrastructureStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # 1. Create a VPC for secure networking
        vpc = ec2.Vpc(
            self, "ServerlessVPC",
            max_azs=2,
            nat_gateways=1
        )

        # 2. Create VPC endpoints for S3 and DynamoDB to keep traffic inside VPC
        s3_endpoint = ec2.GatewayVpcEndpoint(
            self, "S3VpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        dynamodb_endpoint = ec2.GatewayVpcEndpoint(
            self, "DynamoDBVpcEndpoint",
            vpc=vpc,
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )

        # 3. Create S3 bucket for logs with versioning and AES256 encryption
        logs_bucket = s3.Bucket(
            self, "LogsBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
        )

        # 4. Create SNS topic for CloudWatch alarms
        alarm_topic = sns.Topic(
            self, "LambdaErrorAlarmTopic",
            display_name="Lambda Error Alarms"
        )

        # 5. Create DynamoDB table with primary key and secondary index
        users_table = dynamodb.Table(
            self, "UsersTable",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Add secondary index for email lookups
        users_table.add_global_secondary_index(
            index_name="emailIndex",
            partition_key=dynamodb.Attribute(
                name="email",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )

        # 6. Create Lambda execution role with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # Grant specific permissions to resources
        logs_bucket.grant_write(lambda_role)
        users_table.grant_read_write_data(lambda_role)

        # 7. Common Lambda configuration
        lambda_common_config = {
            "runtime": lambda_.Runtime.PYTHON_3_9,
            "vpc": vpc,
            "role": lambda_role,
            "tracing": lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            "environment": {
                "DYNAMODB_TABLE_NAME": users_table.table_name,
                "LOGS_BUCKET_NAME": logs_bucket.bucket_name
            }
        }

        # 8. First Lambda function - Process User
        lambda_function1 = lambda_.Function(
            self, "ProcessUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Processing user event: %s', json.dumps(event))
    
    try:
        # Get data from event
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Store in DynamoDB
        response = table.put_item(
            Item={
                'userId': user_id,
                'email': body.get('email'),
                'name': body.get('name'),
                'createdAt': str(datetime.datetime.now())
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'User processed successfully'})
        }
    except Exception as e:
        logger.error('Error processing user: %s', str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 9. Second Lambda function - Get User
        lambda_function2 = lambda_.Function(
            self, "GetUserFunction",
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Initialize logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Apply X-Ray SDK patches
patch_all()

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE_NAME'])

def handler(event, context):
    logger.info('Get user event: %s', json.dumps(event))
    
    try:
        # Get user ID from path parameter
        user_id = event.get('pathParameters', {}).get('userId')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'userId is required'})
            }
        
        # Get from DynamoDB
        response = table.get_item(
            Key={
                'userId': user_id
            }
        )
        
        # Check if item exists
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'User not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Item'])
        }
    except Exception as e:
        logger.error('Error getting user: %s', str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
"""),
            timeout=Duration.seconds(30),
            **lambda_common_config
        )

        # 10. Create CloudWatch alarms for Lambda error rates > 5% in 5-minute window
        for idx, func in enumerate([lambda_function1, lambda_function2], 1):
            # Get invocations and errors metrics
            invocations_metric = func.metric_invocations().with_statistic("sum").with_period(Duration.minutes(5))
            errors_metric = func.metric_errors().with_statistic("sum").with_period(Duration.minutes(5))
            
            # Create a custom metric for error rate (errors / invocations * 100)
            error_rate_metric = cloudwatch.MathExpression(
                expression="(errors / invocations) * 100",
                using_metrics={
                    "errors": errors_metric,
                    "invocations": invocations_metric
                },
                label=f"{func.function_name} Error Rate (%)"
            )
            
            # Create alarm for error rate > 5% in 5-minute window
            error_alarm = cloudwatch.Alarm(
                self, f"LambdaErrorAlarm{idx}",
                metric=error_rate_metric,
                threshold=5,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                evaluation_periods=1,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
                alarm_description=f"Alarm if the error rate of {func.function_name} is greater than 5% in 5 minutes"
            )
            
            # Add action to SNS topic
            error_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # 11. Create API Gateway with CORS enabled
        api = apigw.RestApi(
            self, "ServerlessApi",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "Authorization"]
            )
        )

        # 12. Add Lambda integrations to API Gateway
        # First Lambda - Process User
        users_resource = api.root.add_resource("users")
        users_resource.add_method(
            "POST",
            apigw.LambdaIntegration(
                lambda_function1,
                proxy=True
            )
        )

        # Second Lambda - Get User
        user_resource = users_resource.add_resource("{userId}")
        user_resource.add_method(
            "GET",
            apigw.LambdaIntegration(
                lambda_function2,
                proxy=True
            )
        )

        # 13. CloudFormation outputs
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "ProcessUserEndpoint",
            value=f"{api.url}users",
            description="Process User API endpoint"
        )
        
        CfnOutput(
            self, "GetUserEndpoint",
            value=f"{api.url}users/{{userId}}",
            description="Get User API endpoint"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=users_table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self, "LogsBucketName",
            value=logs_bucket.bucket_name,
            description="S3 bucket for logs"
        )


# Main App - Entry point
app = App()
ServerlessInfrastructureStack(
    app, "ServerlessInfrastructureStack",
    env=Environment(
        region="us-west-2"
    )
)
app.synth()
```

## Architecture Overview

The solution implements:

1. **Secure Networking**
   - VPC with 2 availability zones
   - VPC endpoints for S3 and DynamoDB to keep traffic internal

2. **Data Storage**
   - DynamoDB table for user information with `userId` as primary key
   - Secondary index on `email` field for email-based queries
   - S3 bucket with versioning and AES256 encryption for logs

3. **Compute**
   - Two Lambda functions within the VPC
   - X-Ray tracing enabled for performance monitoring
   - Environment variables for configuration

4. **API Layer**
   - API Gateway with CORS enabled
   - Two endpoints: POST /users and GET /users/{userId}

5. **Security**
   - Least privilege IAM roles
   - Encrypted data at rest
   - VPC-based network isolation
   - CORS for controlled web access

6. **Monitoring**
   - CloudWatch alarms for Lambda error rates
   - SNS topic for notifications
   - X-Ray tracing for request visibility

## Deployment Instructions

1. Ensure you have AWS CDK installed:
   ```
   npm install -g aws-cdk
   ```

2. Install required Python dependencies:
   ```
   pip install aws-cdk-lib constructs
   ```

3. Deploy the stack:
   ```
   cdk deploy
   ```

4. Once deployed, the API Gateway endpoints will be available in the CloudFormation outputs.

The stack is designed to be deployed in the us-west-2 region and will create all necessary resources with proper security configurations.