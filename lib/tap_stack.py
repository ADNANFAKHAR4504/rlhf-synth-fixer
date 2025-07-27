"""tap_stack.py
This module defines the TapStack class and resource-specific stacks, which create
a secure, auditable AWS cloud environment with S3, DynamoDB, Lambda, and CloudTrail resources.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import Duration, NestedStack, RemovalPolicy
from aws_cdk import aws_cloudtrail as cloudtrail
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_s3_notifications as s3n
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


class ResourceStackProps:
  """
  ResourceStackProps defines the properties for resource-specific stacks.

  Args:
      environment_suffix (str): The environment suffix for resource naming.

  Attributes:
      environment_suffix (str): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: str):
    self.environment_suffix = environment_suffix


class CloudTrailStack(NestedStack):
  """
  CloudTrailStack creates CloudTrail resources for audit logging.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (ResourceStackProps): Properties for configuring the stack.

  Attributes:
      trail (cloudtrail.Trail): The CloudTrail for audit logging.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str,
          props: ResourceStackProps
  ):
    super().__init__(scope, construct_id)

    env_suffix = props.environment_suffix

    # Create S3 bucket for CloudTrail logs
    cloudtrail_bucket = s3.Bucket(
        self, f"CloudTrailBucket{env_suffix}",
        bucket_name=f"proj-cloudtrail-{env_suffix}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create CloudTrail
    self.trail = cloudtrail.Trail(
        self, f"CloudTrail{env_suffix}",
        trail_name=f"proj-trail-{env_suffix}",
        bucket=cloudtrail_bucket,
        is_multi_region_trail=True,
        enable_file_validation=True,
        include_global_service_events=True
    )


class DynamoDBStack(Construct):
  """
  DynamoDBStack creates DynamoDB table with required configurations.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (ResourceStackProps): Properties for configuring the stack.

  Attributes:
      table (dynamodb.Table): The DynamoDB table.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str,
          props: ResourceStackProps
  ):
    super().__init__(scope, construct_id)

    env_suffix = props.environment_suffix

    self.table = dynamodb.Table(
        self, f"DynamoDBTable{env_suffix}",
        table_name=f"proj-table-{env_suffix}",
        partition_key=dynamodb.Attribute(
            name="pk",
            type=dynamodb.AttributeType.STRING
        ),
        sort_key=dynamodb.Attribute(
            name="sk",
            type=dynamodb.AttributeType.STRING
        ),
        encryption=dynamodb.TableEncryption.AWS_MANAGED,
        point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
            point_in_time_recovery_enabled=True
        ),
        contributor_insights_enabled=True,
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        removal_policy=RemovalPolicy.DESTROY
    )


class NestedDynamoDBStack(NestedStack):
  """
  NestedDynamoDBStack creates a nested stack containing DynamoDB resources.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (ResourceStackProps): Properties for configuring the stack.

  Attributes:
      table (dynamodb.Table): The DynamoDB table from the nested stack.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str,
          props: ResourceStackProps
  ):
    super().__init__(scope, construct_id)

    # Use the original DynamoDBStack logic here
    self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
    self.table = self.ddb_stack.table


class S3Stack(NestedStack):
  """
  S3Stack creates S3 bucket with versioning and access logging.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (ResourceStackProps): Properties for configuring the stack.

  Attributes:
      bucket (s3.Bucket): The main S3 bucket.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str,
          props: ResourceStackProps
  ):
    super().__init__(scope, construct_id)

    env_suffix = props.environment_suffix

    # Create access logging bucket first
    access_log_bucket = s3.Bucket(
        self, f"S3AccessLogBucket{env_suffix}",
        bucket_name=f"proj-access-logs-{env_suffix}",
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create main S3 bucket
    self.bucket = s3.Bucket(
        self, f"S3Bucket{env_suffix}",
        bucket_name=f"proj-bucket-{env_suffix}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        server_access_logs_bucket=access_log_bucket,
        server_access_logs_prefix="access-logs/",
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )


class LambdaStack(NestedStack):
  """
  LambdaStack creates Lambda function with least privilege IAM role.

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (ResourceStackProps): Properties for configuring the stack.
      dynamodb_table_arn (str): ARN of the DynamoDB table for IAM permissions.
      dynamodb_table_name (str): Name of the DynamoDB table for environment variable.

  Attributes:
      function (_lambda.Function): The Lambda function.
      role (iam.Role): The Lambda execution role.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str,
          props: ResourceStackProps,
          *,
          dynamodb_table_arn: str,
          dynamodb_table_name: str
  ):
    super().__init__(scope, construct_id)

    env_suffix = props.environment_suffix

    # Create IAM role for Lambda with least privilege
    lambda_role = iam.Role(
        self, f"LambdaRole{env_suffix}",
        role_name=f"proj-lambda-role-{env_suffix}",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ]
    )

    # Add specific permissions for DynamoDB (S3 permissions added later)
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            resources=[dynamodb_table_arn]
        )
    )

    # Create Lambda function
    self.function = _lambda.Function(
        self, f"LambdaFunction{env_suffix}",
        function_name=f"proj-lambda-{env_suffix}",
        runtime=_lambda.Runtime.PYTHON_3_12,
        handler="lambda_handler.lambda_handler",
        code=_lambda.Code.from_asset("lib/lambda"),
        role=lambda_role,
        timeout=Duration.minutes(5),
        environment={
            "TABLE_NAME": dynamodb_table_name,
            "BUCKET_NAME": "placeholder"
        }
    )

    # Store the role for later modification
    self.role = lambda_role


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for secure, auditable cloud infrastructure.

  This stack orchestrates the creation of separate resource stacks:
  - CloudTrail stack for audit logging
  - DynamoDB nested stack with encryption, point-in-time recovery, and insights
  - S3 stack with versioning, Lambda triggers, and access logging
  - Lambda stack with S3-triggered function and least privilege IAM role

  Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the
          stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
      environment_suffix (str): The environment suffix used for resource naming.
      s3_bucket (s3.Bucket): The main S3 bucket for the application.
      dynamodb_table (dynamodb.Table): The main DynamoDB table.
      lambda_function (_lambda.Function): The S3-triggered Lambda function.
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
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Store environment suffix for reference
    self.environment_suffix = environment_suffix

    # All resources are now created directly in the main stack

    # Create CloudTrail resources directly in main stack
    # Create S3 bucket for CloudTrail logs
    cloudtrail_bucket = s3.Bucket(
        self, f"CloudTrailBucket{environment_suffix}",
        bucket_name=f"proj-cloudtrail-{environment_suffix}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create CloudTrail
    cloudtrail.Trail(
        self, f"CloudTrail{environment_suffix}",
        trail_name=f"proj-trail-{environment_suffix}",
        bucket=cloudtrail_bucket,
        is_multi_region_trail=True,
        enable_file_validation=True,
        include_global_service_events=True
    )

    # Create DynamoDB resources directly in main stack
    self.dynamodb_table = dynamodb.Table(
        self, f"DynamoDBTable{environment_suffix}",
        table_name=f"proj-table-{environment_suffix}",
        partition_key=dynamodb.Attribute(
            name="pk",
            type=dynamodb.AttributeType.STRING
        ),
        sort_key=dynamodb.Attribute(
            name="sk",
            type=dynamodb.AttributeType.STRING
        ),
        encryption=dynamodb.TableEncryption.AWS_MANAGED,
        point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
            point_in_time_recovery_enabled=True
        ),
        contributor_insights_enabled=True,
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        removal_policy=RemovalPolicy.DESTROY
    )

    # Create S3 resources directly in main stack
    # Create access logging bucket first
    access_log_bucket = s3.Bucket(
        self, f"S3AccessLogBucket{environment_suffix}",
        bucket_name=f"proj-access-logs-{environment_suffix}",
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create main S3 bucket
    self.s3_bucket = s3.Bucket(
        self, f"S3Bucket{environment_suffix}",
        bucket_name=f"proj-bucket-{environment_suffix}",
        versioned=True,
        encryption=s3.BucketEncryption.S3_MANAGED,
        public_read_access=False,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        server_access_logs_bucket=access_log_bucket,
        server_access_logs_prefix="access-logs/",
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True
    )

    # Create Lambda resources directly in main stack
    # Create IAM role for Lambda with least privilege
    lambda_role = iam.Role(
        self, f"LambdaRole{environment_suffix}",
        role_name=f"proj-lambda-role-{environment_suffix}",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ]
    )

    # Add specific permissions for DynamoDB
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            resources=[self.dynamodb_table.table_arn]
        )
    )

    # Add S3 permissions to Lambda role
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            resources=[f"{self.s3_bucket.bucket_arn}/*"]
        )
    )

    # Create Lambda function
    self.lambda_function = _lambda.Function(
        self, f"LambdaFunction{environment_suffix}",
        function_name=f"proj-lambda-{environment_suffix}",
        runtime=_lambda.Runtime.PYTHON_3_12,
        handler="lambda_handler.lambda_handler",
        code=_lambda.Code.from_asset("lib/lambda"),
        role=lambda_role,
        timeout=Duration.minutes(5),
        environment={
            "TABLE_NAME": self.dynamodb_table.table_name,
            "BUCKET_NAME": self.s3_bucket.bucket_name
        }
    )

    # Set up S3 trigger for Lambda
    self.s3_bucket.add_event_notification(
        s3.EventType.OBJECT_CREATED,
        s3n.LambdaDestination(self.lambda_function)
    )

    # Create outputs for integration tests
    self._create_outputs(environment_suffix)

  def _create_outputs(self, env_suffix: str):
    """Create stack outputs for integration tests."""
    # S3 Bucket outputs
    cdk.CfnOutput(
        self, "S3BucketName",
        value=self.s3_bucket.bucket_name,
        description="Name of the main S3 bucket",
        export_name=f"TapStack{env_suffix}-S3BucketName"
    )

    cdk.CfnOutput(
        self, "S3BucketArn",
        value=self.s3_bucket.bucket_arn,
        description="ARN of the main S3 bucket",
        export_name=f"TapStack{env_suffix}-S3BucketArn"
    )

    # DynamoDB Table outputs
    cdk.CfnOutput(
        self, "DynamoDBTableName",
        value=self.dynamodb_table.table_name,
        description="Name of the DynamoDB table",
        export_name=f"TapStack{env_suffix}-DynamoDBTableName"
    )

    cdk.CfnOutput(
        self, "DynamoDBTableArn",
        value=self.dynamodb_table.table_arn,
        description="ARN of the DynamoDB table",
        export_name=f"TapStack{env_suffix}-DynamoDBTableArn"
    )

    # Lambda Function outputs
    cdk.CfnOutput(
        self, "LambdaFunctionName",
        value=self.lambda_function.function_name,
        description="Name of the Lambda function",
        export_name=f"TapStack{env_suffix}-LambdaFunctionName"
    )

    cdk.CfnOutput(
        self, "LambdaFunctionArn",
        value=self.lambda_function.function_arn,
        description="ARN of the Lambda function",
        export_name=f"TapStack{env_suffix}-LambdaFunctionArn"
    )

    # IAM Role outputs
    cdk.CfnOutput(
        self, "LambdaRoleArn",
        value=self.lambda_function.role.role_arn,
        description="ARN of the Lambda execution role",
        export_name=f"TapStack{env_suffix}-LambdaRoleArn"
    )
