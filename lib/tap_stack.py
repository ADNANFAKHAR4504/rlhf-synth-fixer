"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
payment processing infrastructure optimization.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

# Import payment processing optimization stacks
from .vpc_stack import VpcStack, VpcStackProps
from .dynamodb_stack import DynamoDBStack, DynamoDBStackProps
from .lambda_stack import LambdaStack, LambdaStackProps
from .api_gateway_stack import ApiGatewayStack, ApiGatewayStackProps
from .s3_stack import S3Stack, S3StackProps
from .ecs_stack import EcsStack, EcsStackProps
from .monitoring_stack import MonitoringStack, MonitoringStackProps
from .cost_report_stack import CostReportStack, CostReportStackProps


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

    # Determine environment name
    environment = environment_suffix

    # Create VPC Stack (Requirement 7: NAT Instance for dev)
    class NestedVpcStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.vpc_stack = VpcStack(self, "Resource", props=props)
        self.vpc = self.vpc_stack.vpc

    vpc_props = VpcStackProps(
        environment_suffix=environment_suffix,
        environment=environment
    )

    vpc_stack = NestedVpcStack(
        self,
        f"VpcStack{environment_suffix}",
        props=vpc_props
    )

    # Create DynamoDB Stack (Requirement 2: On-demand billing)
    class NestedDynamoDBStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
        self.transactions_table = self.ddb_stack.transactions_table
        self.users_table = self.ddb_stack.users_table
        self.payment_methods_table = self.ddb_stack.payment_methods_table

    ddb_props = DynamoDBStackProps(
        environment_suffix=environment_suffix,
        environment=environment
    )

    dynamodb_stack = NestedDynamoDBStack(
        self,
        f"DynamoDBStack{environment_suffix}",
        props=ddb_props
    )

    # Create Lambda Stack (Requirements 1, 3, 4, 6)
    class NestedLambdaStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.lambda_stack = LambdaStack(self, "Resource", props=props)
        self.payment_processor = self.lambda_stack.payment_processor
        self.transaction_validator = self.lambda_stack.transaction_validator
        self.fraud_detector = self.lambda_stack.fraud_detector

    lambda_props = LambdaStackProps(
        environment_suffix=environment_suffix,
        environment=environment,
        vpc=vpc_stack.vpc
    )

    lambda_stack = NestedLambdaStack(
        self,
        f"LambdaStack{environment_suffix}",
        props=lambda_props
    )

    # Create API Gateway Stack (Requirement 3: Consolidated API)
    class NestedApiGatewayStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.api_stack = ApiGatewayStack(self, "Resource", props=props)
        self.api = self.api_stack.api

    api_props = ApiGatewayStackProps(
        environment_suffix=environment_suffix,
        environment=environment,
        payment_processor=lambda_stack.payment_processor,
        transaction_validator=lambda_stack.transaction_validator,
        fraud_detector=lambda_stack.fraud_detector
    )

    api_stack = NestedApiGatewayStack(
        self,
        f"ApiGatewayStack{environment_suffix}",
        props=api_props
    )

    # Create S3 Stack (Requirement 5: Glacier lifecycle)
    class NestedS3Stack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.s3_stack = S3Stack(self, "Resource", props=props)
        self.logs_bucket = self.s3_stack.logs_bucket

    s3_props = S3StackProps(
        environment_suffix=environment_suffix,
        environment=environment
    )

    s3_stack = NestedS3Stack(
        self,
        f"S3Stack{environment_suffix}",
        props=s3_props
    )

    # Create ECS Stack (Requirement 8: Auto-scaling)
    class NestedEcsStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.ecs_stack = EcsStack(self, "Resource", props=props)
        self.cluster = self.ecs_stack.cluster

    ecs_props = EcsStackProps(
        environment_suffix=environment_suffix,
        environment=environment,
        vpc=vpc_stack.vpc
    )

    ecs_stack = NestedEcsStack(
        self,
        f"EcsStack{environment_suffix}",
        props=ecs_props
    )

    # Create Monitoring Stack (Requirement 9: Cost dashboards)
    class NestedMonitoringStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.monitoring_stack = MonitoringStack(self, "Resource", props=props)

    monitoring_props = MonitoringStackProps(
        environment_suffix=environment_suffix,
        environment=environment,
        payment_processor=lambda_stack.payment_processor,
        transaction_validator=lambda_stack.transaction_validator,
        fraud_detector=lambda_stack.fraud_detector,
        transactions_table=dynamodb_stack.transactions_table,
        users_table=dynamodb_stack.users_table,
        api=api_stack.api,
        ecs_cluster=ecs_stack.cluster,
        ecs_service_name=f"{environment}-payment-service"
    )

    monitoring_stack = NestedMonitoringStack(
        self,
        f"MonitoringStack{environment_suffix}",
        props=monitoring_props
    )

    # Create Cost Report Stack (Requirement 10: Cost comparison)
    class NestedCostReportStack(NestedStack):
      def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        self.cost_stack = CostReportStack(self, "Resource", props=props)

    cost_props = CostReportStackProps(
        environment_suffix=environment_suffix,
        environment=environment
    )

    cost_report_stack = NestedCostReportStack(
        self,
        f"CostReportStack{environment_suffix}",
        props=cost_props
    )

    # Make key resources available as properties
    self.vpc = vpc_stack.vpc
    self.transactions_table = dynamodb_stack.transactions_table
    self.api = api_stack.api
