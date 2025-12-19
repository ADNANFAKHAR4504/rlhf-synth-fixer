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
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_lambda_event_sources as event_sources,
    Duration,
    RemovalPolicy,
    CfnOutput,
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

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix
        self.environment_suffix = props.environment_suffix or "dev"

        # Create resources
        self._create_kms_key()
        self._create_dynamodb_table()
        self._create_iam_roles()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_cloudwatch_alarms()
        self._create_outputs()

    def _create_kms_key(self):
        """Create a KMS key for encrypting Lambda environment variables"""
        self.kms_key = kms.Key(
            self, "LambdaKMSKey",
            description="KMS key for Lambda environment variable encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_dynamodb_table(self):
        """Create DynamoDB table with streams enabled"""
        self.dynamodb_table = dynamodb.Table(
            self, "DataTable",
            table_name=f"serverless-data-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

    def _create_iam_roles(self):
        """Create IAM roles for Lambda functions"""
        # Role for API Lambda
        self.api_lambda_role = iam.Role(
            self, "ApiLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        self.api_lambda_role.add_to_policy(iam.PolicyStatement(
            actions=[
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            resources=[self.dynamodb_table.table_arn]
        ))
        self.kms_key.grant_decrypt(self.api_lambda_role)

        # Role for Stream Lambda
        self.stream_lambda_role = iam.Role(
            self, "StreamLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        self.stream_lambda_role.add_to_policy(iam.PolicyStatement(
            actions=[
                "dynamodb:DescribeStream",
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:ListStreams"
            ],
            resources=[self.dynamodb_table.table_stream_arn]
        ))
        self.kms_key.grant_decrypt(self.stream_lambda_role)

    def _create_lambda_functions(self):
        """Create Lambda functions with inline code"""
        # Inline code for API Lambda
        api_lambda_code = """
import os
import json
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("TABLE_NAME")
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        http_method = event["httpMethod"]
        if http_method == "GET":
            return get_items()
        elif http_method == "POST":
            return create_item(event)
        else:
            return {"statusCode": 405, "body": json.dumps({"message": "Method Not Allowed"})}
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"message": str(e)})}

def get_items():
    try:
        response = table.scan()
        return {"statusCode": 200, "body": json.dumps(response.get("Items", []))}
    except ClientError as e:
        return {"statusCode": 500, "body": json.dumps({"message": e.response['Error']['Message']})}

def create_item(event):
    try:
        body = json.loads(event["body"])
        item = {"id": body["id"], "data": body["data"]}
        table.put_item(Item=item)
        return {"statusCode": 201, "body": json.dumps({"message": "Item created successfully"})}
    except ClientError as e:
        return {"statusCode": 500, "body": json.dumps({"message": e.response['Error']['Message']})}
    except KeyError:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid request body"})}
"""

        # API Lambda
        self.api_lambda = _lambda.Function(
            self, "ApiHandler",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="index.handler",
            code=_lambda.Code.from_inline(api_lambda_code),
            timeout=Duration.seconds(15),
            role=self.api_lambda_role,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "STAGE": self.environment_suffix
            },
            environment_encryption=self.kms_key
        )

        # Inline code for Stream Lambda
        stream_lambda_code = """
def handler(event, context):
    print("Stream event:", event)
"""

        # Stream Lambda
        self.stream_lambda = _lambda.Function(
            self, "StreamHandler",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="index.handler",
            code=_lambda.Code.from_inline(stream_lambda_code),
            timeout=Duration.seconds(15),
            role=self.stream_lambda_role,
            environment={
                "STAGE": self.environment_suffix
            },
            environment_encryption=self.kms_key
        )
        self.stream_lambda.add_event_source(
            event_sources.DynamoEventSource(
                table=self.dynamodb_table,
                starting_position=_lambda.StartingPosition.TRIM_HORIZON,
                batch_size=10,
                max_batching_window=Duration.seconds(5)
            )
        )

    def _create_api_gateway(self):
        """Create API Gateway with CORS and caching"""
        self.api_gateway = apigateway.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"serverless-api-{self.environment_suffix}",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["https://example.com"],
                allow_methods=apigateway.Cors.ALL_METHODS
            ),
            deploy_options=apigateway.StageOptions(
                caching_enabled=True,
                cache_ttl=Duration.seconds(30)
            )
        )
        lambda_integration = apigateway.LambdaIntegration(self.api_lambda)
        items = self.api_gateway.root.add_resource("items")
        items.add_method("GET", lambda_integration)
        items.add_method("POST", lambda_integration)

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda and API Gateway"""
        cloudwatch.Alarm(
            self, "ApiLambdaErrorAlarm",
            metric=self.api_lambda.metric_errors(),
            threshold=1,
            evaluation_periods=2
        )
        cloudwatch.Alarm(
            self, "StreamLambdaErrorAlarm",
            metric=self.stream_lambda.metric_errors(),
            threshold=1,
            evaluation_periods=2
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(self, "ApiGatewayUrl", value=self.api_gateway.url)
        CfnOutput(self, "DynamoDBTableName", value=self.dynamodb_table.table_name)
        CfnOutput(self, "ApiLambdaArn", value=self.api_lambda.function_arn)
        CfnOutput(self, "StreamLambdaArn", value=self.stream_lambda.function_arn)
        CfnOutput(self, "KmsKeyId", value=self.kms_key.key_id)
        CfnOutput(self, "EnvironmentSuffix", value=self.environment_suffix)
        


```