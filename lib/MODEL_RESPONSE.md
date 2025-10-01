### Reasoning Trace
---

The user wants a Python CDK stack that creates a serverless application with:
1. Lambda function (Python runtime)
2. API Gateway with CORS enabled
3. DynamoDB table with specific configuration
4. CloudWatch monitoring and alarms
5. Proper IAM permissions (least privilege)
6. Environment variables for Lambda
7. Stage variables for API Gateway
8. Tags on all resources
9. Everything in us-east-1
10. Single stack in main.py

Let me create a comprehensive CDK stack that includes all these requirements.
### Answer 
---

I'll create a comprehensive Python CDK stack that implements all your requirements for a serverless application with proper security, monitoring, and best practices.

```python
# main.py

import json
import os
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
)
from constructs import Construct


class ServerlessApiStack(Stack):
    """
    A complete serverless stack with API Gateway, Lambda, DynamoDB, and monitoring.
    Implements all best practices including least privilege IAM, CORS, versioning, and alerting.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        # Force us-east-1 region
        kwargs['env'] = kwargs.get('env', {})
        kwargs['env']['region'] = 'us-east-1'
        
        super().__init__(scope, construct_id, **kwargs)

        # Configuration parameters
        project_name = "serverless-api"
        environment = "dev"
        owner = "devops-team"
        
        # Common naming prefix
        name_prefix = f"{project_name}-{environment}"

        # ==========================================
        # DynamoDB Table
        # ==========================================
        self.dynamodb_table = dynamodb.Table(
            self,
            f"{name_prefix}-table",
            table_name=f"{name_prefix}-items-table",
            partition_key=dynamodb.Attribute(
                name="itemId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            point_in_time_recovery=True,  # Best practice: enable PITR
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Encryption at rest
            removal_policy=RemovalPolicy.RETAIN,  # Retain table on stack deletion
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,  # Enable streams for future use
        )

        # ==========================================
        # SNS Topic for Alerts
        # ==========================================
        self.alert_topic = sns.Topic(
            self,
            f"{name_prefix}-alerts",
            topic_name=f"{name_prefix}-lambda-alerts",
            display_name=f"Alerts for {project_name} Lambda errors"
        )

        # ==========================================
        # Custom IAM Role for Lambda (Least Privilege)
        # ==========================================
        self.lambda_role = iam.Role(
            self,
            f"{name_prefix}-lambda-role",
            role_name=f"{name_prefix}-lambda-execution-role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for {project_name} Lambda function with least privilege",
            managed_policies=[
                # Only basic Lambda execution permissions
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add specific DynamoDB permissions (least privilege)
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )

        # ==========================================
        # Lambda Function
        # ==========================================
        self.lambda_function = lambda_.Function(
            self,
            f"{name_prefix}-function",
            function_name=f"{name_prefix}-api-handler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": environment,
                "PROJECT_NAME": project_name,
                "AWS_REGION": "us-east-1"
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            log_retention=logs.RetentionDays.TWO_WEEKS,
            description=f"API handler for {project_name}",
        )

        # ==========================================
        # API Gateway with CORS
        # ==========================================
        self.api = apigw.RestApi(
            self,
            f"{name_prefix}-api",
            rest_api_name=f"{name_prefix}-api",
            description=f"REST API for {project_name}",
            endpoint_types=[apigw.EndpointType.REGIONAL],
            cloud_watch_role=True,  # Enable CloudWatch logging
            deploy_options=apigw.StageOptions(
                stage_name="dev",
                description="Development stage",
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,  # Log full request/response data
                tracing_enabled=True,  # Enable X-Ray tracing
                metrics_enabled=True,
                throttling_rate_limit=1000,  # Requests per second
                throttling_burst_limit=2000,
                variables={
                    "environment": environment,
                    "lambdaAlias": "live"
                }
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=["*"],  # Allow all origins
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token"
                ],
                allow_credentials=False,
                max_age=Duration.seconds(300)
            )
        )

        # ==========================================
        # API Gateway Resources and Methods
        # ==========================================
        
        # Create /items resource
        items_resource = self.api.root.add_resource("items")
        
        # Lambda integration
        lambda_integration = apigw.LambdaIntegration(
            self.lambda_function,
            proxy=True,  # Use Lambda proxy integration
            integration_responses=[
                apigw.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )

        # Add GET method
        items_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Add POST method
        items_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Add specific item resource /items/{id}
        item_resource = items_resource.add_resource("{id}")
        
        # Add GET method for specific item
        item_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Add PUT method for specific item
        item_resource.add_method(
            "PUT",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Add DELETE method for specific item
        item_resource.add_method(
            "DELETE",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # ==========================================
        # Production Stage
        # ==========================================
        prod_deployment = apigw.Deployment(
            self,
            f"{name_prefix}-prod-deployment",
            api=self.api,
            description="Production deployment"
        )

        prod_stage = apigw.Stage(
            self,
            f"{name_prefix}-prod-stage",
            deployment=prod_deployment,
            stage_name="prod",
            description="Production stage",
            logging_level=apigw.MethodLoggingLevel.ERROR,  # Only log errors in prod
            data_trace_enabled=False,  # Don't log full data in prod
            tracing_enabled=True,
            metrics_enabled=True,
            throttling_rate_limit=5000,
            throttling_burst_limit=10000,
            variables={
                "environment": "production",
                "lambdaAlias": "live"
            }
        )

        # ==========================================
        # CloudWatch Alarms
        # ==========================================
        
        # Lambda Error Rate Alarm (> 5%)
        error_metric = self.lambda_function.metric_errors(
            period=Duration.minutes(5),
            statistic="Sum"
        )
        
        invocation_metric = self.lambda_function.metric_invocations(
            period=Duration.minutes(5),
            statistic="Sum"
        )
        
        # Calculate error rate using math expression
        error_rate = cloudwatch.MathExpression(
            expression="(errors / invocations) * 100",
            using_metrics={
                "errors": error_metric,
                "invocations": invocation_metric
            },
            label="Error Rate (%)",
            period=Duration.minutes(5)
        )

        self.error_alarm = cloudwatch.Alarm(
            self,
            f"{name_prefix}-lambda-error-alarm",
            alarm_name=f"{name_prefix}-lambda-error-rate-high",
            alarm_description=f"Alert when Lambda error rate exceeds 5% for {project_name}",
            metric=error_rate,
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to alarm
        self.error_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

        # Lambda Duration Alarm (> 10 seconds)
        self.duration_alarm = cloudwatch.Alarm(
            self,
            f"{name_prefix}-lambda-duration-alarm",
            alarm_name=f"{name_prefix}-lambda-duration-high",
            alarm_description=f"Alert when Lambda duration exceeds 10 seconds for {project_name}",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=10000,  # 10 seconds in milliseconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        self.duration_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

        # Lambda Concurrent Executions Alarm
        self.concurrent_alarm = cloudwatch.Alarm(
            self,
            f"{name_prefix}-lambda-concurrent-alarm",
            alarm_name=f"{name_prefix}-lambda-concurrent-high",
            alarm_description=f"Alert when Lambda concurrent executions exceed 100 for {project_name}",
            metric=self.lambda_function.metric("ConcurrentExecutions",
                period=Duration.minutes(1),
                statistic="Maximum"
            ),
            threshold=100,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        self.concurrent_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

        # ==========================================
        # CloudWatch Dashboard (Optional but useful)
        # ==========================================
        dashboard = cloudwatch.Dashboard(
            self,
            f"{name_prefix}-dashboard",
            dashboard_name=f"{name_prefix}-monitoring",
            default_interval=Duration.hours(1)
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[self.lambda_function.metric_invocations()],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Lambda Errors and Duration",
                left=[self.lambda_function.metric_errors()],
                right=[self.lambda_function.metric_duration()],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="API Gateway Requests",
                left=[self.api.metric_count()],
                right=[self.api.metric_4xx(), self.api.metric_5xx()],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="DynamoDB Consumed Capacity",
                left=[
                    self.dynamodb_table.metric_consumed_read_capacity_units(),
                    self.dynamodb_table.metric_consumed_write_capacity_units()
                ],
                width=12
            )
        )

        # ==========================================
        # Apply Tags to All Resources
        # ==========================================
        Tags.of(self).add("Project", project_name)
        Tags.of(self).add("Environment", environment)
        Tags.of(self).add("Owner", owner)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")

        # ==========================================
        # Stack Outputs
        # ==========================================
        CfnOutput(
            self,
            "ApiGatewayUrlDev",
            value=f"https://{self.api.rest_api_id}.execute-api.us-east-1.amazonaws.com/dev",
            description="API Gateway URL (Development Stage)"
        )

        CfnOutput(
            self,
            "ApiGatewayUrlProd",
            value=f"https://{self.api.rest_api_id}.execute-api.us-east-1.amazonaws.com/prod",
            description="API Gateway URL (Production Stage)"
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda Function ARN"
        )

        CfnOutput(
            self,
            "SNSTopicArn",
            value=self.alert_topic.topic_arn,
            description="SNS Topic ARN for Alerts"
        )

        CfnOutput(
            self,
            "CloudWatchDashboard",
            value=f"https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name={name_prefix}-monitoring",
            description="CloudWatch Dashboard URL"
        )

    def _get_lambda_code(self) -> str:
        """
        Returns the inline Lambda function code.
        In production, you'd typically load this from a file or package.
        """
        return """
import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

# Custom JSON encoder for DynamoDB Decimal types
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def handler(event, context):
    \"\"\"
    Main Lambda handler for API requests
    \"\"\"
    print(f"Event: {json.dumps(event)}")
    
    # CORS headers
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    
    try:
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters', {})
        
        # Route requests based on method and path
        if path == '/items':
            if http_method == 'GET':
                return handle_list_items(headers)
            elif http_method == 'POST':
                return handle_create_item(event, headers)
        elif path.startswith('/items/') and path_parameters:
            item_id = path_parameters.get('id')
            if http_method == 'GET':
                return handle_get_item(item_id, headers)
            elif http_method == 'PUT':
                return handle_update_item(item_id, event, headers)
            elif http_method == 'DELETE':
                return handle_delete_item(item_id, headers)
        
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Resource not found'})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }

def handle_list_items(headers):
    \"\"\"List all items from DynamoDB\"\"\"
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'items': items,
                'count': len(items)
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Error listing items: {str(e)}")
        raise

def handle_create_item(event, headers):
    \"\"\"Create a new item in DynamoDB\"\"\"
    try:
        body = json.loads(event.get('body', '{}'))
        
        if not body:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        item_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        item = {
            'itemId': item_id,
            'createdAt': timestamp,
            'updatedAt': timestamp,
            **body
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'message': 'Item created successfully',
                'item': item
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Error creating item: {str(e)}")
        raise

def handle_get_item(item_id, headers):
    \"\"\"Get a specific item from DynamoDB\"\"\"
    try:
        response = table.get_item(Key={'itemId': item_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Item not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(response['Item'], cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Error getting item: {str(e)}")
        raise

def handle_update_item(item_id, event, headers):
    \"\"\"Update an existing item in DynamoDB\"\"\"
    try:
        body = json.loads(event.get('body', '{}'))
        
        if not body:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Request body is required'})
            }
        
        # Check if item exists
        response = table.get_item(Key={'itemId': item_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Item not found'})
            }
        
        # Update item
        body['updatedAt'] = datetime.utcnow().isoformat()
        
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        for key, value in body.items():
            update_expression += f"#{key} = :{key}, "
            expression_attribute_values[f":{key}"] = value
            expression_attribute_names[f"#{key}"] = key
        
        update_expression = update_expression.rstrip(', ')
        
        response = table.update_item(
            Key={'itemId': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues='ALL_NEW'
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': 'Item updated successfully',
                'item': response['Attributes']
            }, cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Error updating item: {str(e)}")
        raise

def handle_delete_item(item_id, headers):
    \"\"\"Delete an item from DynamoDB\"\"\"
    try:
        # Check if item exists
        response = table.get_item(Key={'itemId': item_id})
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Item not found'})
            }
        
        table.delete_item(Key={'itemId': item_id})
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Item deleted successfully'})
        }
    except Exception as e:
        print(f"Error deleting item: {str(e)}")
        raise
"""


def main():
    """
    Main entry point for the CDK application
    """
    app = App()
    
    # Create the serverless stack
    ServerlessApiStack(
        app,
        "ServerlessApiStack",
        description="A complete serverless API with Lambda, DynamoDB, and monitoring",
        stack_name="serverless-api-stack"
    )
    
    app.synth()


if __name__ == "__main__":
    main()
```

## Key Features Implemented:

### ✅ **Core Requirements:**
- **Lambda Function**: Python 3.11 runtime with comprehensive CRUD operations
- **API Gateway**: RESTful API with CORS enabled from any origin
- **DynamoDB Table**: `itemId` as partition key, 5 R/W capacity units, retained on deletion
- **Environment Variables**: Configurable Lambda environment
- **IAM Role**: Least privilege - only necessary DynamoDB permissions

### ✅ **Monitoring & Observability:**
- **CloudWatch Logs**: Automatic log groups with 2-week retention
- **API Gateway Logging**: Full request/response logging in dev, errors only in prod
- **Error Rate Alarm**: Triggers when Lambda error rate exceeds 5%
- **Additional Alarms**: Duration and concurrent execution monitoring
- **CloudWatch Dashboard**: Visual monitoring of all metrics
- **X-Ray Tracing**: Enabled for distributed tracing

### ✅ **API Features:**
- **Version-Controlled Stages**: Separate `dev` and `prod` stages
- **Stage Variables**: Environment-specific configuration
- **Rate Limiting**: Different throttling for dev/prod
- **CORS Configuration**: Properly configured preflight responses
- **Multiple HTTP Methods**: GET, POST, PUT, DELETE with proper routing

### ✅ **Best Practices:**
- **Security**: Encryption at rest, PITR for DynamoDB
- **Tagging**: All resources tagged with project, environment, owner
- **Infrastructure as Code**: Single stack, easy to deploy
- **Error Handling**: Comprehensive error responses with proper status codes
- **Resource Naming**: Consistent naming convention

## Deployment Instructions:

1. **Install dependencies:**
```bash
pip install aws-cdk-lib constructs
```

2. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

3. **Deploy the stack:**
```bash
cdk deploy --require-approval never
```

4. **Test the API:**
```bash
# Create an item
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "description": "This is a test"}'

# List all items
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/items

# Get specific item
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/items/ITEM-ID

# Update an item
curl -X PUT https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/items/ITEM-ID \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Item"}'

# Delete an item
curl -X DELETE https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/items/ITEM-ID
```

5. **Subscribe to alerts:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT:serverless-api-dev-lambda-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

6. **View monitoring dashboard:**
   - Check the CloudWatch Dashboard URL in the stack outputs

The stack is production-ready with comprehensive error handling, monitoring, and security controls. All resources follow AWS best practices and are properly tagged for cost tracking and management!