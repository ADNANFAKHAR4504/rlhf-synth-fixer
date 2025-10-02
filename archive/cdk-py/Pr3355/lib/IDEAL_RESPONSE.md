```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
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

    This stack creates a complete serverless application with:
    - DynamoDB table for data persistence
    - Lambda function for API handling
    - API Gateway with CORS support
    - CloudWatch monitoring and alarms
    - SNS topic for alerts
    - Proper IAM roles with least privilege

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
        dynamodb_table: The DynamoDB table resource
        lambda_function: The Lambda function resource
        api: The API Gateway resource
        alert_topic: The SNS topic for alerts
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Configuration parameters
        self.project_name = "tap-serverless"
        self.owner = "devops-team"
        
        # Common naming prefix
        self.name_prefix = f"{self.project_name}-{self.environment_suffix}"

        # Create all resources
        self._create_sns_topic()
        self._create_dynamodb_table()
        self._create_lambda_role()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_cloudwatch_alarms()
        self._create_cloudwatch_dashboard()
        self._apply_tags()
        self._create_outputs()

    def _create_sns_topic(self) -> None:
        """Create SNS topic for alerts"""
        self.alert_topic = sns.Topic(
            self,
            f"{self.name_prefix}-alerts",
            topic_name=f"{self.name_prefix}-lambda-alerts",
            display_name=f"Alerts for {self.project_name} Lambda errors"
        )

    def _create_dynamodb_table(self) -> None:
        """Create DynamoDB table with proper configuration"""
        self.dynamodb_table = dynamodb.Table(
            self,
            f"{self.name_prefix}-table",
            table_name=f"{self.name_prefix}-items-table",
            partition_key=dynamodb.Attribute(
                name="itemId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,  # Minimum 5 as requested
            write_capacity=5, # Minimum 5 as requested
            # Fix the deprecated point_in_time_recovery
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Encryption at rest
            removal_policy=RemovalPolicy.RETAIN,  # Retain table on stack deletion
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,  # Enable streams
        )

    def _create_lambda_role(self) -> None:
        """Create IAM role for Lambda with least privilege"""
        self.lambda_role = iam.Role(
            self,
            f"{self.name_prefix}-lambda-role",
            role_name=f"{self.name_prefix}-lambda-execution-role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for {self.project_name} Lambda function with least privilege",
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

    def _create_lambda_function(self) -> None:
        """Create Lambda function with proper configuration"""
        self.lambda_function = lambda_.Function(
            self,
            f"{self.name_prefix}-function",
            function_name=f"{self.name_prefix}-api-handler",
            runtime=lambda_.Runtime.PYTHON_3_9,  # Fixed: Use supported runtime
            handler="index.handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": self.environment_suffix,
                "PROJECT_NAME": self.project_name,
                # Remove this line: "AWS_REGION": "us-east-1"  # This is reserved!
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            log_retention=logs.RetentionDays.TWO_WEEKS,
            description=f"API handler for {self.project_name}",
        )

    def _create_api_gateway(self) -> None:
        """Create API Gateway with CORS and multiple stages"""
        self.api = apigw.RestApi(
            self,
            f"{self.name_prefix}-api",
            rest_api_name=f"{self.name_prefix}-api",
            description=f"REST API for {self.project_name}",
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
                    "environment": self.environment_suffix,
                    "lambdaAlias": "live"
                }
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=["*"],  # Allow all origins as requested
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

        # Create API Gateway resources and methods
        self._create_api_resources()
        self._create_production_stage()

    def _create_api_resources(self) -> None:
        """Create API Gateway resources and methods"""
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

        # Add methods to /items
        for method in ["GET", "POST"]:
            items_resource.add_method(
                method,
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
        
        # Add methods to /items/{id}
        for method in ["GET", "PUT", "DELETE"]:
            item_resource.add_method(
                method,
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

    def _create_production_stage(self) -> None:
        """Create production stage with different configuration"""
        prod_deployment = apigw.Deployment(
            self,
            f"{self.name_prefix}-prod-deployment",
            api=self.api,
            description="Production deployment"
        )

        self.prod_stage = apigw.Stage(
            self,
            f"{self.name_prefix}-prod-stage",
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

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for monitoring"""
        # Lambda Error Rate Alarm (> 5% as requested)
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
            f"{self.name_prefix}-lambda-error-alarm",
            alarm_name=f"{self.name_prefix}-lambda-error-rate-high",
            alarm_description=f"Alert when Lambda error rate exceeds 5% for {self.project_name}",
            metric=error_rate,
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        
        # Add SNS action to alarm
        self.error_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

        # Lambda Duration Alarm
        self.duration_alarm = cloudwatch.Alarm(
            self,
            f"{self.name_prefix}-lambda-duration-alarm",
            alarm_name=f"{self.name_prefix}-lambda-duration-high",
            alarm_description=f"Alert when Lambda duration exceeds 10 seconds for {self.project_name}",
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
            f"{self.name_prefix}-lambda-concurrent-alarm",
            alarm_name=f"{self.name_prefix}-lambda-concurrent-high",
            alarm_description=f"Alert when Lambda concurrent executions exceed 100 for {self.project_name}",
            metric=self.lambda_function.metric("ConcurrentExecutions",
                period=Duration.minutes(1),
                statistic="Maximum"
            ),
            threshold=100,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        self.concurrent_alarm.add_alarm_action(cw_actions.SnsAction(self.alert_topic))

    def _create_cloudwatch_dashboard(self) -> None:
        """Create CloudWatch dashboard for monitoring"""
        self.dashboard = cloudwatch.Dashboard(
            self,
            f"{self.name_prefix}-dashboard",
            dashboard_name=f"{self.name_prefix}-monitoring",
            default_interval=Duration.hours(1)
        )

        # Get the default stage for metrics
        default_stage = self.api.deployment_stage

        self.dashboard.add_widgets(
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
                right=[
                    # Use stage-specific metrics instead of API-level metrics
                    default_stage.metric_client_error(),
                    default_stage.metric_server_error()
                ],
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

    def _apply_tags(self) -> None:
        """Apply tags to all resources as requested"""
        Tags.of(self).add("Project", self.project_name)
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("Owner", self.owner)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")

    def _create_outputs(self) -> None:
        """Create stack outputs for easy access"""
        stack_region = self.region
        CfnOutput(
            self,
            "ApiGatewayUrlDev",
            value=f"https://{self.api.rest_api_id}.execute-api.{stack_region}.amazonaws.com/dev",
            description="API Gateway URL (Development Stage)"
        )

        CfnOutput(
            self,
            "ApiGatewayUrlProd",
            value=f"https://{self.api.rest_api_id}.execute-api.{stack_region}.amazonaws.com/prod",
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
            value=f"https://console.aws.amazon.com/cloudwatch/home?region={stack_region}#dashboards:name={self.name_prefix}-monitoring",
            description="CloudWatch Dashboard URL"
        )

    def _get_lambda_code(self) -> str:
        """
        Returns the inline Lambda function code for handling API requests
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


```