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
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags,
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

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.
    Note:
        - Do NOT create AWS resources directly in this stack.
        - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
            stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        self.environment_suffix = props.environment_suffix or "dev"

        # Apply tags to all resources
        Tags.of(self).add("Environment", self.environment_suffix)

        # Create resources
        self._create_dynamodb_table()
        self._create_iam_role()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_log_group()
        self._create_outputs()

    def _create_dynamodb_table(self):
        """Create DynamoDB table with provisioned throughput"""
        self.dynamodb_table = dynamodb.Table(
            self, "DataTable",
            table_name=f"serverless-data-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test environments
            point_in_time_recovery=True
        )

    def _create_iam_role(self):
        """Create IAM role for Lambda with necessary permissions"""
        self.lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add DynamoDB permissions
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )

        # Add CloudWatch Logs permissions
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

    def _create_lambda_function(self):
        """Create Lambda function with inline code"""
        lambda_code = """
import os
import json
import boto3
from botocore.exceptions import ClientError

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("DYNAMODB_TABLE_NAME")
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        http_method = event["httpMethod"]
        if http_method == "GET":
            return get_items(event)
        elif http_method == "POST":
            return create_item(event)
        else:
            return {
                "statusCode": 405,
                "body": json.dumps({"message": "Method Not Allowed"})
            }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": str(e)})
        }

def get_items(event):
    try:
        response = table.scan()
        return {
            "statusCode": 200,
            "body": json.dumps(response.get("Items", []))
        }
    except ClientError as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": e.response['Error']['Message']})
        }

def create_item(event):
    try:
        body = json.loads(event["body"])
        item = {
            "id": body["id"],
            "data": body["data"]
        }
        table.put_item(Item=item)
        return {
            "statusCode": 201,
            "body": json.dumps({"message": "Item created successfully"})
        }
    except ClientError as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"message": e.response['Error']['Message']})
        }
    except KeyError:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid request body"})
        }
"""
        self.lambda_function = _lambda.Function(
            self, "DataProcessorFunction",
            function_name=f"serverless-infra-data-process-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            code=_lambda.Code.from_inline(lambda_code),
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": self.environment_suffix
            },
            description="Lambda function for processing and storing data in DynamoDB"
        )

    def _create_api_gateway(self):
        """Create API Gateway with CORS support"""
        self.api_gateway = apigateway.RestApi(
            self, "DataProcessorApi",
            rest_api_name=f"serverless-data-api-{self.environment_suffix}",
            description="API Gateway for serverless data processing application",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
            proxy=True
        )

        # Create API Gateway resources and methods
        data_resource = self.api_gateway.root.add_resource("data")
        data_resource.add_method("POST", lambda_integration)
        data_resource.add_method("GET", lambda_integration)

    def _create_log_group(self):
        """Create CloudWatch Log Group for Lambda function"""
        self.log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/serverless-data-processor-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="ARN of the Lambda function",
            export_name=f"LambdaFunctionArn-{self.stack_name}"
        )

        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="URL of the API Gateway",
            export_name=f"ApiGatewayUrl-{self.stack_name}"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table",
            export_name=f"DynamoDBTableName-{self.stack_name}"
        )
        
        CfnOutput(
            self, "LogGroupName",
            value=self.log_group.log_group_name,
            description="Name of the CloudWatch Log Group",
            export_name=f"LogGroupName-{self.stack_name}"
        )
        
        CfnOutput(
            self, "IamRoleName",
            value=self.lambda_role.role_name,
            description="Name of the IAM Role for Lambda",
            export_name=f"IamRoleName-{self.stack_name}"
        )
        
        CfnOutput(
            self, "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix for the deployment",
            export_name=f"EnvironmentSuffix-{self.stack_name}"
        )
        


```