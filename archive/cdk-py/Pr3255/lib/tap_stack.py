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

# Import your stacks here
from .api_stack import ApiStack, ApiStackProps
from .lambda_stack import LambdaStack, LambdaStackProps
from .dynamodb_stack import DynamoDBStack, DynamoDBStackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps
from .ssm_stack import SSMStack, SSMStackProps


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
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )

        # Create DynamoDB stack
        class NestedDynamoDBStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
                self.table = self.ddb_stack.table

        db_props = DynamoDBStackProps(environment_suffix=environment_suffix)

        dynamodb_stack = NestedDynamoDBStack(
            self, f"DynamoDBStack{environment_suffix}", props=db_props
        )

        # Create Lambda stack
        class NestedLambdaStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.lambda_stack = LambdaStack(self, "Resource", props=props)
                self.function = self.lambda_stack.function

        lambda_props = LambdaStackProps(
            environment_suffix=environment_suffix, table=dynamodb_stack.table
        )

        lambda_stack = NestedLambdaStack(
            self, f"LambdaStack{environment_suffix}", props=lambda_props
        )

        # Create API Gateway stack
        class NestedApiStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.api_stack = ApiStack(self, "Resource", props=props)
                self.api = self.api_stack.api

        api_props = ApiStackProps(
            environment_suffix=environment_suffix,
            handler_function=lambda_stack.function,
        )

        api_stack = NestedApiStack(
            self, f"ApiStack{environment_suffix}", props=api_props
        )

        # Create Monitoring stack
        class NestedMonitoringStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.monitoring_stack = MonitoringStack(self, "Resource", props=props)

        monitoring_props = MonitoringStackProps(
            environment_suffix=environment_suffix,
            api=api_stack.api,
            lambda_function=lambda_stack.function,
            table=dynamodb_stack.table,
        )

        monitoring_stack = NestedMonitoringStack(
            self, f"MonitoringStack{environment_suffix}", props=monitoring_props
        )

        # Create SSM Parameter Store stack
        class NestedSSMStack(NestedStack):
            def __init__(self, scope, construct_id, props=None, **kwargs):
                super().__init__(scope, construct_id, **kwargs)
                self.ssm_stack = SSMStack(self, "Resource", props=props)

        ssm_props = SSMStackProps(
            environment_suffix=environment_suffix,
            table_arn=dynamodb_stack.table.table_arn,
            function_arn=lambda_stack.function.function_arn,
            api_id=api_stack.api.rest_api_id,
        )

        ssm_stack = NestedSSMStack(
            self, f"SSMStack{environment_suffix}", props=ssm_props
        )
