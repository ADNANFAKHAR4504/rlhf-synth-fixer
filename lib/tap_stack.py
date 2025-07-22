"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from aws_cdk import Stack
from aws_cdk import aws_ec2 as ec2
from aws_cdk import (
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_apigateway as apigateway,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch
    # core
)

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # VPC with two public subnets
        vpc = ec2.Vpc(self, "LambdaVPC", 
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="PublicSubnet", subnet_type=ec2.SubnetType.PUBLIC)
            ]
        )

        # DynamoDB Table
        table = dynamodb.Table(self, "ItemTable",
            partition_key=dynamodb.Attribute(name="itemId", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # Lambda Execution Role
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant permissions to DynamoDB and CloudWatch
        table.grant_write_data(lambda_role)
        lambda_role.add_to_policy(iam.PolicyStatement(
            actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            resources=["arn:aws:logs:*:*:*"]
        ))

        # Lambda Function
        lambda_function = _lambda.Function(self, "ItemFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            code=_lambda.Code.from_asset("lib/lambda"),  # Assuming code is in 'lambda' directory
            handler="index.handler",
            role=lambda_role,
            vpc=vpc,
            environment={
                "TABLE_NAME": table.table_name
            }
        )

        # # CloudWatch Alarm for Lambda Errors
        # cloudwatch.Alarm(self, "LambdaErrorsAlarm",
        #     metric=lambda_function.metric_errors(),
        #     threshold=1,
        #     evaluation_periods=1
        # )

        # # API Gateway
        # api = apigateway.RestApi(self, "ItemApi",
        #     rest_api_name="Item Service",
        #     default_cors_preflight_options=apigateway.CorsOptions(
        #         allow_origins=apigateway.Cors.ALL_ORIGINS,
        #         allow_methods=apigateway.Cors.ALL_METHODS
        #     )
        # )

        # integration = apigateway.LambdaIntegration(lambda_function)

        # items = api.root.add_resource("item")
        # items.add_method("GET", integration)

        # # Tagging all resources
        # core.Tags.of(self).add("Environment", "Production")

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

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create separate stacks for each resource type
    # Create the DynamoDB stack as a nested stack

    # ! DO not create resources directly in this stack.
    # ! Instead, instantiate separate stacks for each resource type.

    # class NestedDynamoDBStack(NestedStack):
    #   def __init__(self, scope, id, props=None, **kwargs):
    #     super().__init__(scope, id, **kwargs)
    #     # Use the original DynamoDBStack logic here
    #     self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
    #     self.table = self.ddb_stack.table

    db_props = ServerlessStack(
        self,"mystack_id",

    )

    # dynamodb_stack = NestedDynamoDBStack(
    #     self,
    #     f"DynamoDBStack{environment_suffix}",
    #     props=db_props
    # )

    # # Make the table available as a property of this stack
    # self.table = dynamodb_stack.table

