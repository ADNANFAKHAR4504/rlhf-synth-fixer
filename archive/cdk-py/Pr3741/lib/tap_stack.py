"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional


import os
import json
import random
import string
import aws_cdk as cdk
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_kms as kms,
    aws_codedeploy as codedeploy,
)
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

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Generate random ID for unique naming
    random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    # Define common tags
    common_tags = {
        "Project": "ServerlessInfra",
        "Owner": "DevTeam",
        "Environment": "Production"
    }

    # ==================== KMS Key for Encryption ====================
    kms_key = kms.Key(
        self, "ServerlessKMSKey",
        description="KMS key for encrypting sensitive Lambda environment variables",
        enable_key_rotation=True,
        removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
    )
    
    # ==================== S3 Buckets ====================
    # Storage bucket with encryption and versioning
    storage_bucket = s3.Bucket(
        self, "StorageBucket",
        bucket_name=f"cf-serverless-{random_id}",
        encryption=s3.BucketEncryption.KMS,
        encryption_key=kms_key,
        versioned=True,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        enforce_ssl=True,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="DeleteOldVersions",
                noncurrent_version_expiration=Duration.days(30),
                abort_incomplete_multipart_upload_after=Duration.days(7)
            )
        ],
        removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
        auto_delete_objects=True,  # Remove for production
    )

    # Logging bucket
    logging_bucket = s3.Bucket(
        self, "LoggingBucket",
        bucket_name=f"cf-serverless-logs-{random_id}",
        encryption=s3.BucketEncryption.S3_MANAGED,
        block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        object_ownership=s3.ObjectOwnership.OBJECT_WRITER,  
        enforce_ssl=True,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="DeleteOldLogs",
                expiration=Duration.days(90)
            )
        ],
        removal_policy=RemovalPolicy.DESTROY,
        auto_delete_objects=True,
    )

    # ==================== DynamoDB Table ====================
    dynamodb_table = dynamodb.Table(
        self, "ServerlessTable",
        partition_key=dynamodb.Attribute(
            name="id",
            type=dynamodb.AttributeType.STRING
        ),
        sort_key=dynamodb.Attribute(
            name="timestamp",
            type=dynamodb.AttributeType.NUMBER
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption=dynamodb.TableEncryption.AWS_MANAGED,
        removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN for production
        stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    )

    # Add Global Secondary Index for queries
    dynamodb_table.add_global_secondary_index(
        index_name="StatusIndex",
        partition_key=dynamodb.Attribute(
            name="status",
            type=dynamodb.AttributeType.STRING
        ),
        projection_type=dynamodb.ProjectionType.ALL,
    )

    # ==================== SNS Topic ====================
    sns_topic = sns.Topic(
        self, "ServerlessNotifications",
        display_name="Serverless Application Notifications",
        master_key=kms_key,
    )

    # Add email subscription (replace with actual email)
    email_subscription = subscriptions.EmailSubscription("devteam@example.com")
    sns_topic.add_subscription(email_subscription)


    # ==================== Lambda Execution Role (Least Privilege) ====================
    lambda_role = iam.Role(
        self, "LambdaExecutionRole",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        description="Execution role for serverless Lambda functions",
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AWSLambdaBasicExecutionRole"
            )
        ],
    )

    # Add specific DynamoDB permissions (no wildcards)
    lambda_role.add_to_policy(
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
            resources=[
                dynamodb_table.table_arn,
                f"{dynamodb_table.table_arn}/index/*"
            ],
        )
    )

    # Add specific S3 permissions
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources=[f"{storage_bucket.bucket_arn}/*"],
        )
    )

    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["s3:ListBucket"],
            resources=[storage_bucket.bucket_arn],
        )
    )

    # Add SNS publish permissions
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["sns:Publish"],
            resources=[sns_topic.topic_arn],
        )
    )

    # Add KMS permissions for decryption
    lambda_role.add_to_policy(
        iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=["kms:Decrypt"],
            resources=[kms_key.key_arn],
        )
    )

    # ==================== Lambda Functions ====================
    # API Handler Lambda
    api_lambda = lambda_.Function(
        self, "ApiHandler",
        runtime=lambda_.Runtime.PYTHON_3_11,  # Latest Python runtime
        code=lambda_.Code.from_inline(self._get_lambda_code()),
        handler="index.handler",
        timeout=Duration.seconds(30),
        memory_size=512,
        role=lambda_role,
        environment={
            "DYNAMODB_TABLE": dynamodb_table.table_name,
            "S3_BUCKET": storage_bucket.bucket_name,
            "SNS_TOPIC_ARN": sns_topic.topic_arn,
        },
        environment_encryption=kms_key,
        tracing=lambda_.Tracing.ACTIVE,
        retry_attempts=2,
        description="Main API handler for serverless application",
    )

    # Create Lambda Alias for traffic shifting
    api_lambda_alias = lambda_.Alias(
        self, "ApiHandlerAlias",
        alias_name="live",
        version=api_lambda.current_version,
    )

    # Configure CodeDeploy for blue/green deployments
    deployment_config = codedeploy.LambdaDeploymentConfig(
        self, "CanaryDeploymentConfig",
        traffic_routing=codedeploy.TrafficRouting.time_based_canary(
            interval=Duration.minutes(5),
            percentage=10
        )
    )

    deployment_group = codedeploy.LambdaDeploymentGroup(
        self, "ApiDeploymentGroup",
        alias=api_lambda_alias,
        deployment_config=deployment_config,
        alarms=[],  # Add CloudWatch alarms for automatic rollback
    )

    # ==================== API Gateway ====================
    # CloudWatch Log Group for API Gateway
    api_log_group = logs.LogGroup(
        self, "ApiGatewayLogs",
        retention=logs.RetentionDays.THREE_MONTHS,
        removal_policy=RemovalPolicy.DESTROY,
    )

    # REST API with logging
    api = apigateway.RestApi(
        self, "ServerlessApi",
        rest_api_name="ServerlessInfraAPI",
        description="Serverless Infrastructure API",
        deploy_options=apigateway.StageOptions(
            stage_name="prod",
            logging_level=apigateway.MethodLoggingLevel.INFO,
            data_trace_enabled=True,
            metrics_enabled=True,
            access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
            access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                caller=True,
                http_method=True,
                ip=True,
                protocol=True,
                request_time=True,
                resource_path=True,
                response_length=True,
                status=True,
                user=True,
            ),
            throttling_burst_limit=1000,
            throttling_rate_limit=500,
        ),
        endpoint_configuration=apigateway.EndpointConfiguration(
            types=[apigateway.EndpointType.EDGE]
        ),
        default_cors_preflight_options=apigateway.CorsOptions(
            allow_origins=apigateway.Cors.ALL_ORIGINS,
            allow_methods=apigateway.Cors.ALL_METHODS,
            allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            max_age=Duration.hours(1),
        ),
    )

    # Lambda integration
    lambda_integration = apigateway.LambdaIntegration(
        api_lambda_alias,
        request_templates={"application/json": '{ "statusCode": "200" }'},
        integration_responses=[
            apigateway.IntegrationResponse(
                status_code="200",
                response_templates={
                    "application/json": "$input.json('$')"
                },
                response_parameters={
                    "method.response.header.Access-Control-Allow-Origin": "'*'"
                }
            )
        ],
    )

    # Add API methods
    items_resource = api.root.add_resource("items")
    items_resource.add_method(
        "GET",
        lambda_integration,
        method_responses=[
            apigateway.MethodResponse(
                status_code="200",
                response_parameters={
                    "method.response.header.Access-Control-Allow-Origin": True
                }
            )
        ],
        api_key_required=False,
    )
    
    items_resource.add_method(
        "POST",
        lambda_integration,
        method_responses=[
            apigateway.MethodResponse(
                status_code="200",
                response_parameters={
                    "method.response.header.Access-Control-Allow-Origin": True
                }
            )
        ],
    )

    single_item_resource = items_resource.add_resource("{id}")
    single_item_resource.add_method(
        "GET",
        lambda_integration,
        method_responses=[
            apigateway.MethodResponse(
                status_code="200",
                response_parameters={
                    "method.response.header.Access-Control-Allow-Origin": True
                }
            )
        ],
    )

    # ==================== CloudFront Distribution ====================
    # Origin Access Identity for CloudFront
    cf_oai = cloudfront.OriginAccessIdentity(
        self, "CloudFrontOAI",
        comment="OAI for Serverless API CloudFront distribution"
    )

    # CloudFront distribution for API caching
    distribution = cloudfront.Distribution(
        self, "ApiDistribution",
        default_behavior=cloudfront.BehaviorOptions(
            origin=origins.RestApiOrigin(api),
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
            cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER,
            response_headers_policy=cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        ),
        domain_names=[],  # Add custom domain names if needed
        certificate=None,  # Add ACM certificate for custom domains
        geo_restriction=cloudfront.GeoRestriction.allowlist("US", "CA", "GB", "DE", "JP"),
        price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        enabled=True,
        http_version=cloudfront.HttpVersion.HTTP2,
        enable_logging=True,
        log_bucket=logging_bucket,
        log_file_prefix="cloudfront/",
        comment="CloudFront distribution for Serverless API",
    )

    # ==================== Apply Tags to All Resources ====================
    for key, value in common_tags.items():
        Tags.of(self).add(key, value)

    # ==================== Outputs ====================
    CfnOutput(
        self, "ApiEndpoint",
        value=api.url,
        description="API Gateway endpoint URL",
    )

    CfnOutput(
        self, "CloudFrontDomain",
        value=distribution.distribution_domain_name,
        description="CloudFront distribution domain",
    )

    CfnOutput(
        self, "DynamoDBTableName",
        value=dynamodb_table.table_name,
        description="DynamoDB table name",
    )

    CfnOutput(
        self, "DynamoDBTableArn",
        value=dynamodb_table.table_arn,
        description="DynamoDB table ARN",
    )

    CfnOutput(
        self, "StorageBucketName",
        value=storage_bucket.bucket_name,
        description="S3 storage bucket name",
    )

    CfnOutput(
        self, "StorageBucketArn",
        value=storage_bucket.bucket_arn,
        description="S3 storage bucket ARN",
    )

    CfnOutput(
        self, "LoggingBucketName",
        value=logging_bucket.bucket_name,
        description="S3 logging bucket name",
    )

    CfnOutput(
        self, "LoggingBucketArn",
        value=logging_bucket.bucket_arn,
        description="S3 logging bucket ARN",
    )

    CfnOutput(
        self, "SNSTopicArn",
        value=sns_topic.topic_arn,
        description="SNS topic ARN for notifications",
    )

    CfnOutput(
        self, "LambdaFunctionName",
        value=api_lambda.function_name,
        description="Lambda function name",
    )

    CfnOutput(
        self, "LambdaFunctionArn",
        value=api_lambda.function_arn,
        description="Lambda function ARN",
    )


    CfnOutput(
        self, "ApiGatewayLogGroupName",
        value=api_log_group.log_group_name,
        description="CloudWatch log group name for API Gateway",
    )

    CfnOutput(
        self, "KMSKeyArn",
        value=kms_key.key_arn,
        description="KMS key ARN for encryption",
    )

    CfnOutput(
        self, "DeploymentGroupName",
        value=deployment_group.deployment_group_name,
        description="CodeDeploy deployment group name",
    )

    CfnOutput(
        self, "CloudFrontDistributionId",
        value=distribution.distribution_id,
        description="CloudFront distribution ID",
    )

    CfnOutput(
        self, "CloudFrontDistributionArn",
        value=distribution.distribution_arn,
        description="CloudFront distribution ARN",
    )

  def _get_lambda_code(self) -> str:
      """Returns the Lambda function code"""
      return '''
import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
  def default(self, obj):
      if isinstance(obj, Decimal):
          return float(obj)
      return super(DecimalEncoder, self).default(obj)

def handler(event, context):
  """Main Lambda handler"""
  try:
      http_method = event.get('httpMethod', 'GET')
      path = event.get('path', '/')
      path_parameters = event.get('pathParameters', {})
      body = event.get('body', '{}')
      
      if http_method == 'GET':
          if path_parameters and 'id' in path_parameters:
              return get_item(path_parameters['id'])
          else:
              return list_items()
      elif http_method == 'POST':
          return create_item(json.loads(body))
      elif http_method == 'PUT':
          if path_parameters and 'id' in path_parameters:
              return update_item(path_parameters['id'], json.loads(body))
      elif http_method == 'DELETE':
          if path_parameters and 'id' in path_parameters:
              return delete_item(path_parameters['id'])
      
      return {
          'statusCode': 400,
          'headers': get_cors_headers(),
          'body': json.dumps({'message': 'Invalid request'})
      }
      
  except Exception as e:
      print(f"Error: {str(e)}")
      # Send SNS notification for errors
      send_notification(f"Error in Lambda function: {str(e)}")
      return {
          'statusCode': 500,
          'headers': get_cors_headers(),
          'body': json.dumps({'message': 'Internal server error'})
      }

def get_cors_headers():
  """Returns CORS headers"""
  return {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  }

def list_items():
  """List all items from DynamoDB"""
  response = table.scan()
  return {
      'statusCode': 200,
      'headers': get_cors_headers(),
      'body': json.dumps(response['Items'], cls=DecimalEncoder)
  }

def get_item(item_id):
  """Get a specific item from DynamoDB"""
  response = table.query(
      KeyConditionExpression='id = :id',
      ExpressionAttributeValues={':id': item_id}
  )
  
  if response['Items']:
      return {
          'statusCode': 200,
          'headers': get_cors_headers(),
          'body': json.dumps(response['Items'][0], cls=DecimalEncoder)
      }
  else:
      return {
          'statusCode': 404,
          'headers': get_cors_headers(),
          'body': json.dumps({'message': 'Item not found'})
      }

def create_item(data):
  """Create a new item in DynamoDB"""
  item_id = str(uuid.uuid4())
  timestamp = int(datetime.now().timestamp())
  
  item = {
      'id': item_id,
      'timestamp': timestamp,
      'status': 'active',
      **data
  }
  
  table.put_item(Item=item)
  
  # Store metadata in S3
  s3.put_object(
      Bucket=BUCKET_NAME,
      Key=f"items/{item_id}/metadata.json",
      Body=json.dumps(item, cls=DecimalEncoder),
      ContentType='application/json'
  )
  
  # Send SNS notification
  send_notification(f"New item created: {item_id}")
  
  return {
      'statusCode': 201,
      'headers': get_cors_headers(),
      'body': json.dumps(item, cls=DecimalEncoder)
  }

def update_item(item_id, data):
  """Update an existing item in DynamoDB"""
  # Implementation for update
  return {
      'statusCode': 200,
      'headers': get_cors_headers(),
      'body': json.dumps({'message': f'Item {item_id} updated'})
  }

def delete_item(item_id):
  """Delete an item from DynamoDB"""
  # Implementation for delete
  return {
      'statusCode': 200,
      'headers': get_cors_headers(),
      'body': json.dumps({'message': f'Item {item_id} deleted'})
  }

def send_notification(message):
  """Send SNS notification"""
  try:
      sns.publish(
          TopicArn=SNS_TOPIC_ARN,
          Message=message,
          Subject='Serverless Application Notification'
      )
  except Exception as e:
      print(f"Failed to send SNS notification: {str(e)}")
'''



