```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional, Dict, Any
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
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


class TapStack(Stack):
    """
    A comprehensive serverless stack with API Gateway, Lambda, and DynamoDB.
    Based on the requirements from PROMPT.md to create a full serverless workflow.
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
        self.stage = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Environment configuration
        self.env_config = self._get_environment_config(self.stage)

        # ==========================================
        # Create DynamoDB table
        # ==========================================
        
        self.table = self._create_dynamodb_table()

        # ==========================================
        # Create Lambda functions with specific IAM roles
        # Note: Removed Lambda Layer as it requires actual assets
        # ==========================================
        
        self.get_function = self._create_get_lambda()
        self.post_function = self._create_post_lambda()
        self.delete_function = self._create_delete_lambda()
        self.list_function = self._create_list_lambda()

        # ==========================================
        # Create API Gateway with logging
        # ==========================================
        
        self.api = self._create_api_gateway()

        # ==========================================
        # Configure API Gateway integrations
        # ==========================================
        
        self._configure_api_integrations()

        # ==========================================
        # Create CloudWatch Alarms
        # ==========================================
        
        self._create_cloudwatch_alarms()

        # ==========================================
        # Stack Outputs
        # ==========================================
        
        self._create_outputs()

    def _get_environment_config(self, stage: str) -> Dict[str, Any]:
        """Get environment-specific configuration"""
        configs = {
            "dev": {
                "table_read_capacity": 5,
                "table_write_capacity": 5,
                "lambda_memory": 128,
                "lambda_timeout": 10,
                "log_retention_days": 7,
                "alarm_threshold_errors": 5,
                "alarm_threshold_duration": 3000
            },
            "test": {
                "table_read_capacity": 10,
                "table_write_capacity": 10,
                "lambda_memory": 256,
                "lambda_timeout": 15,
                "log_retention_days": 14,
                "alarm_threshold_errors": 3,
                "alarm_threshold_duration": 5000
            },
            "prod": {
                "table_read_capacity": 20,
                "table_write_capacity": 20,
                "lambda_memory": 512,
                "lambda_timeout": 30,
                "log_retention_days": 30,
                "alarm_threshold_errors": 1,
                "alarm_threshold_duration": 10000
            }
        }
        return configs.get(stage, configs["dev"])

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table"""
        return dynamodb.Table(
            self, f"ItemsTable-{self.stage}",
            table_name=f"serverless-items-{self.stage}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=self.env_config["table_read_capacity"],
            write_capacity=self.env_config["table_write_capacity"],
            point_in_time_recovery=True if self.stage == "prod" else False,
            removal_policy=RemovalPolicy.RETAIN if self.stage == "prod" else RemovalPolicy.DESTROY,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

    def _create_base_lambda_role(self, function_name: str) -> iam.Role:
        """Create base IAM role for Lambda with X-Ray permissions"""
        return iam.Role(
            self, f"{function_name}Role-{self.stage}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

    def _create_get_lambda(self) -> lambda_.Function:
        """Create Lambda function for GET operations"""
        role = self._create_base_lambda_role("GetItem")
        
        # Add specific permissions for GET
        role.add_to_policy(iam.PolicyStatement(
            actions=["dynamodb:GetItem", "dynamodb:Query"],
            resources=[self.table.table_arn, f"{self.table.table_arn}/index/*"]
        ))

        get_lambda_code = """
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])

def handler(event, context):
    try:
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        item_id = event['pathParameters']['id']
        
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Item not found'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(response['Item'], default=str)
        }
    except Exception as e:
        print(f"Error getting item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }
"""
        
        return lambda_.Function(
            self, f"GetItemFunction-{self.stage}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(get_lambda_code),
            role=role,
            memory_size=self.env_config["lambda_memory"],
            timeout=Duration.seconds(self.env_config["lambda_timeout"]),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": self.table.table_name,
                "STAGE": self.stage,
                "REGION": "us-west-2"
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_post_lambda(self) -> lambda_.Function:
        """Create Lambda function for POST operations"""
        role = self._create_base_lambda_role("PostItem")
        
        # Add specific permissions for POST
        role.add_to_policy(iam.PolicyStatement(
            actions=["dynamodb:PutItem", "dynamodb:UpdateItem"],
            resources=[self.table.table_arn]
        ))

        post_lambda_code = """
import json
import os
import uuid
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])

def handler(event, context):
    try:
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        body = json.loads(event['body']) if event.get('body') else {}
        
        item = {
            'id': str(uuid.uuid4()),
            'created_at': datetime.utcnow().isoformat(),
            'stage': os.environ['STAGE'],
            **body
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(item, default=str)
        }
    except Exception as e:
        print(f"Error creating item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }
"""
        
        return lambda_.Function(
            self, f"PostItemFunction-{self.stage}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(post_lambda_code),
            role=role,
            memory_size=self.env_config["lambda_memory"],
            timeout=Duration.seconds(self.env_config["lambda_timeout"]),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": self.table.table_name,
                "STAGE": self.stage,
                "REGION": "us-west-2"
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_delete_lambda(self) -> lambda_.Function:
        """Create Lambda function for DELETE operations"""
        role = self._create_base_lambda_role("DeleteItem")
        
        # Add specific permissions for DELETE
        role.add_to_policy(iam.PolicyStatement(
            actions=["dynamodb:DeleteItem"],
            resources=[self.table.table_arn]
        ))

        delete_lambda_code = """
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])

def handler(event, context):
    try:
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        item_id = event['pathParameters']['id']
        
        table.delete_item(Key={'id': item_id})
        
        return {
            'statusCode': 204,
            'headers': {'Content-Type': 'application/json'},
            'body': ''
        }
    except Exception as e:
        print(f"Error deleting item: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }
"""
        
        return lambda_.Function(
            self, f"DeleteItemFunction-{self.stage}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(delete_lambda_code),
            role=role,
            memory_size=self.env_config["lambda_memory"],
            timeout=Duration.seconds(self.env_config["lambda_timeout"]),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": self.table.table_name,
                "STAGE": self.stage,
                "REGION": "us-west-2"
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_list_lambda(self) -> lambda_.Function:
        """Create Lambda function for LIST operations"""
        role = self._create_base_lambda_role("ListItems")
        
        # Add specific permissions for LIST
        role.add_to_policy(iam.PolicyStatement(
            actions=["dynamodb:Scan", "dynamodb:Query"],
            resources=[self.table.table_arn, f"{self.table.table_arn}/index/*"]
        ))

        list_lambda_code = """
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])

def handler(event, context):
    try:
        table_name = os.environ['TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        response = table.scan(Limit=100)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'items': response.get('Items', []),
                'count': len(response.get('Items', []))
            }, default=str)
        }
    except Exception as e:
        print(f"Error listing items: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': 'Internal server error'})
        }
"""
        
        return lambda_.Function(
            self, f"ListItemsFunction-{self.stage}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(list_lambda_code),
            role=role,
            memory_size=self.env_config["lambda_memory"],
            timeout=Duration.seconds(self.env_config["lambda_timeout"]),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": self.table.table_name,
                "STAGE": self.stage,
                "REGION": "us-west-2"
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

    def _create_api_gateway(self) -> apigw.RestApi:
        """Create API Gateway with logging and X-Ray tracing"""
        log_group = logs.LogGroup(
            self, f"ApiGatewayLogs-{self.stage}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.RETAIN if self.stage == "prod" else RemovalPolicy.DESTROY
        )
        
        return apigw.RestApi(
            self, f"ServerlessApi-{self.stage}",
            rest_api_name=f"serverless-api-{self.stage}",
            description=f"Serverless API for {self.stage} environment",
            deploy_options=apigw.StageOptions(
                stage_name=self.stage,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True if self.stage != "prod" else False,
                metrics_enabled=True,
                tracing_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

    def _configure_api_integrations(self) -> None:
        """Configure API Gateway integrations with Lambda functions"""
        
        # Items resource
        items = self.api.root.add_resource("items")
        
        # GET /items - List all items
        items.add_method(
            "GET",
            apigw.LambdaIntegration(
                self.list_function,
                request_templates={"application/json": '{ "statusCode": "200" }'}
            )
        )
        
        # POST /items - Create new item
        items.add_method(
            "POST",
            apigw.LambdaIntegration(self.post_function)
        )
        
        # Single item resource
        item = items.add_resource("{id}")
        
        # GET /items/{id} - Get specific item
        item.add_method(
            "GET",
            apigw.LambdaIntegration(self.get_function)
        )
        
        # DELETE /items/{id} - Delete specific item
        item.add_method(
            "DELETE",
            apigw.LambdaIntegration(self.delete_function)
        )

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for Lambda functions"""
        functions = [
            ("GetItem", self.get_function),
            ("PostItem", self.post_function),
            ("DeleteItem", self.delete_function),
            ("ListItems", self.list_function)
        ]
        
        for name, func in functions:
            # Error rate alarm
            cloudwatch.Alarm(
                self, f"{name}ErrorAlarm-{self.stage}",
                metric=func.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5)
                ),
                threshold=self.env_config["alarm_threshold_errors"],
                evaluation_periods=1,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
                alarm_description=f"Alarm for {name} function errors in {self.stage}"
            )
            
            # Duration alarm
            cloudwatch.Alarm(
                self, f"{name}DurationAlarm-{self.stage}",
                metric=func.metric_duration(
                    statistic="Average",
                    period=Duration.minutes(5)
                ),
                threshold=self.env_config["alarm_threshold_duration"],
                evaluation_periods=2,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
                alarm_description=f"Alarm for {name} function duration in {self.stage}"
            )

    def _create_outputs(self) -> None:
        """Create stack outputs"""
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description=f"API Gateway endpoint URL for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.table.table_name,
            description=f"DynamoDB table name for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "DynamoDBTableArn",
            value=self.table.table_arn,
            description=f"DynamoDB table ARN for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "GetLambdaArn",
            value=self.get_function.function_arn,
            description=f"Get Lambda function ARN for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "PostLambdaArn",
            value=self.post_function.function_arn,
            description=f"Post Lambda function ARN for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "DeleteLambdaArn",
            value=self.delete_function.function_arn,
            description=f"Delete Lambda function ARN for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "ListLambdaArn",
            value=self.list_function.function_arn,
            description=f"List Lambda function ARN for {self.stage} environment"
        )
        
        CfnOutput(
            self,
            "Stage",
            value=self.stage,
            description="Deployment stage"
        )


```