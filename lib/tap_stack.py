"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import textwrap
from aws_cdk import (
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_iam as iam,
    RemovalPolicy,
    Duration
)
import aws_cdk as cdk
from constructs import Construct

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


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

    cdk.Tags.of(self).add("CostCenter", "ProjectX")
    cdk.Tags.of(self).add("Environment", "preprod")
    cdk.Tags.of(self).add("Author", "soumya.misra")
    cdk.Tags.of(self).add("Repository", "tap-infra")

    # Get environment suffix from props, context, or use 'dev' as default
    _environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Environment and naming configuration
    self.env_name = "preprod"
    self.project_name = "tap"
    
    # Create infrastructure components
    self.s3_bucket = self._create_s3_bucket()
    self.dynamodb_table = self._create_dynamodb_table()
    self.lambda_role = self._create_lambda_role()
    self.lambda_function = self._create_lambda_function()

    # Add CDK outputs for deployment validation
    cdk.CfnOutput(
      self,
      "S3BucketName",
      value=self.s3_bucket.bucket_name,
      description="S3 bucket for static files and backups",
      export_name=f"{self.project_name}-{self.env_name}-bucket-name"
    )

    cdk.CfnOutput(
      self,
      "DynamoDBTableName",
      value=self.dynamodb_table.table_name,
      description="DynamoDB table for application data",
      export_name=f"{self.project_name}-{self.env_name}-table-name"
    )

    cdk.CfnOutput(
      self,
      "LambdaFunctionName",
      value=self.lambda_function.function_name,
      description="Lambda function for backend processing",
      export_name=f"{self.project_name}-{self.env_name}-lambda-name"
    )

  def _create_s3_bucket(self) -> s3.Bucket:
    """
    Create S3 bucket for static files and backups
    Follows naming convention: project-env-resource
    """
    bucket_name = f"{self.project_name}-{self.env_name}-storage"
    
    bucket = s3.Bucket(
      self,
      "TapS3Bucket",
      bucket_name=bucket_name,
      # Enable versioning for data protection
      versioned=True,
      # Configure lifecycle for cost optimization
      lifecycle_rules=[
        s3.LifecycleRule(
          id="cost-optimization",
          enabled=True,
          # Move to IA after 30 days
          transitions=[
            s3.Transition(
              storage_class=s3.StorageClass.INFREQUENT_ACCESS,
              transition_after=Duration.days(30)
            ),
            s3.Transition(
              storage_class=s3.StorageClass.GLACIER,
              transition_after=Duration.days(90)
            )
          ]
        )
      ],
      # Enable server-side encryption
      encryption=s3.BucketEncryption.S3_MANAGED,
      # Block public access for security
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      # Retain bucket for preprod (change for prod)
      removal_policy=RemovalPolicy.DESTROY
    )
    
    return bucket

  def _create_dynamodb_table(self) -> dynamodb.Table:
    """
    Create DynamoDB table with on-demand billing for cost efficiency
    """
    table_name = f"{self.project_name}-{self.env_name}-table"
    
    table = dynamodb.Table(
      self,
      "TapDynamoTable",
      table_name=table_name,
      # Partition key as specified
      partition_key=dynamodb.Attribute(
          name="id",
          type=dynamodb.AttributeType.STRING
      ),
      # On-demand billing for cost efficiency
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
      # Enable point-in-time recovery
      point_in_time_recovery=True,
      # Server-side encryption
      encryption=dynamodb.TableEncryption.AWS_MANAGED,
      # Retain table for preprod
      removal_policy=RemovalPolicy.DESTROY
    )
    
    return table

  def _create_lambda_role(self) -> iam.Role:
    """
    Create IAM role with least-privilege access for Lambda function
    """
    role = iam.Role(
      self,
      "TapLambdaRole",
      role_name=f"{self.project_name}-{self.env_name}-lambda-role",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="IAM role for TAP Lambda function with least-privilege access",
      managed_policies=[
        # Basic Lambda execution permissions
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ]
    )

    # Grant specific S3 permissions
    role.add_to_policy(
      iam.PolicyStatement(
        effect=iam.Effect.ALLOW,
        actions=[
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        resources=[
          self.s3_bucket.bucket_arn,
          f"{self.s3_bucket.bucket_arn}/*"
        ]
      )
    )

    # Grant specific DynamoDB permissions
    role.add_to_policy(
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

    return role

  def _create_lambda_function(self) -> lambda_.Function:
    """
    Create Lambda function with access to S3 and DynamoDB
    """
    function_name = f"{self.project_name}-{self.env_name}-handler"

    # Inline Lambda code using dedent
    lambda_code = textwrap.dedent("""
      import json
      import boto3
      import os
      from datetime import datetime

      def lambda_handler(event, context):
        '''
        Demo Lambda handler that interacts with S3 and DynamoDB
        '''

        # Initialize AWS clients
        s3_client = boto3.client('s3')
        dynamodb = boto3.resource('dynamodb')

        # Get environment variables
        bucket_name = os.environ['S3_BUCKET_NAME']
        table_name = os.environ['DYNAMODB_TABLE_NAME']
        table = dynamodb.Table(table_name)

        try:
          # Example: Store request info in DynamoDB
          item_id = context.aws_request_id
          timestamp = datetime.utcnow().isoformat()

          # Put item in DynamoDB
          table.put_item(
            Item={
              'id': item_id,
              'timestamp': timestamp,
              'event_data': json.dumps(event),
              'status': 'processed'
            }
          )

          # Example: List objects in S3 bucket
          s3_response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
          object_count = s3_response.get('KeyCount', 0)

          response = {
            'statusCode': 200,
            'body': json.dumps({
              'message': 'Successfully processed request',
              'request_id': item_id,
              'timestamp': timestamp,
              's3_object_count': object_count,
              'dynamodb_status': 'success'
            })
          }

        except Exception as e:
          print(f"Error: {str(e)}")
          response = {
            'statusCode': 500,
            'body': json.dumps({
              'message': 'Error processing request',
              'error': str(e)
            })
          }

        return response
  """)

    function = lambda_.Function(
      self,
      "TapLambdaFunction",
      function_name=function_name,
      runtime=lambda_.Runtime.PYTHON_3_12,
      handler="index.lambda_handler",
      code=lambda_.Code.from_inline(lambda_code),
      role=self.lambda_role,
      description="TAP backend handler with S3 and DynamoDB access",
      timeout=Duration.seconds(30),
      memory_size=256,
      environment={
        "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
        "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
        "ENVIRONMENT": self.env_name
      }
    )

    return function

  @property
  def bucket_name(self) -> str:
    """Get S3 bucket name"""
    return self.s3_bucket.bucket_name

  @property
  def table_name(self) -> str:
    """Get DynamoDB table name"""
    return self.dynamodb_table.table_name

  @property
  def function_name(self) -> str:
    """Get Lambda function name"""
    return self.lambda_function.function_name
