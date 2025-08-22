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
  App,
  Stack,
  Environment,
  Duration,
  RemovalPolicy,
  Tags,
  aws_apigateway as apigateway,
  aws_lambda as _lambda,
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
  aws_iam as iam,
  aws_logs as logs,
  aws_secretsmanager as secretsmanager,
  aws_ec2 as ec2,
  aws_cloudtrail as cloudtrail,
  aws_s3_notifications as s3n,
  aws_kms as kms,
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

  This stack provisions all core resources for the TAP platform, including VPC, S3, DynamoDB,
  SNS, Lambda, API Gateway, KMS, Secrets Manager, and CloudTrail with security best practices.
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

    # Company standard tags
    company_tags = {
      "Environment": environment_suffix,
      "Team": "platform-engineering",
      "CostCenter": "engineering-ops",
      "Project": "tap",
      "Owner": "solution-architect",
      "Compliance": "required"
    }

    # Apply tags to all resources in this stack
    for key, value in company_tags.items():
      Tags.of(self).add(key, value)

    # Create VPC for network isolation
    self.vpc = self._create_vpc()
    
    # Create KMS key for encryption
    self.kms_key = self._create_kms_key()
    
    # Create secrets for secure credential management
    self.secrets = self._create_secrets()
    
    # Create S3 buckets with security configurations
    self.s3_bucket, self.access_logs_bucket = self._create_s3_buckets(environment_suffix)
    
    # Create DynamoDB table with encryption
    self.dynamodb_table = self._create_dynamodb_table(environment_suffix)
    
    # Create SNS topic
    self.sns_topic = self._create_sns_topic(environment_suffix)
    
    # Create Lambda functions with least privilege roles
    self.lambda_functions = self._create_lambda_functions(environment_suffix)
    
    # Create API Gateway with logging
    self.api_gateway = self._create_api_gateway(environment_suffix)
    
    # Enable comprehensive logging
    self._enable_logging()

    # Create stack outputs
    self._create_outputs()

  def _create_vpc(self) -> ec2.Vpc:
    """Create VPC with security configurations"""
    vpc = ec2.Vpc(
      self, "TapVpc",
      max_azs=2,
      nat_gateways=1,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      subnet_configuration=[
        ec2.SubnetConfiguration(
          name="Public",
          subnet_type=ec2.SubnetType.PUBLIC,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name="Private",
          subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidr_mask=24
        ),
        ec2.SubnetConfiguration(
          name="Isolated",
          subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
          cidr_mask=24
        )
      ]
    )
    
    # Enable VPC Flow Logs
    flow_log_role = iam.Role(
      self, "FlowLogRole",
      assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
      inline_policies={
        "FlowLogDeliveryRolePolicy": iam.PolicyDocument(
          statements=[
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
              ],
              resources=["*"]
            )
          ]
        )
      }
    )
    
    flow_log_group = logs.LogGroup(
      self, "VPCFlowLogGroup",
      retention=logs.RetentionDays.ONE_MONTH,
      removal_policy=RemovalPolicy.DESTROY
    )
    
    ec2.FlowLog(
      self, "VPCFlowLog",
      resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
      destination=ec2.FlowLogDestination.to_cloud_watch_logs(flow_log_group, flow_log_role)
    )
    
    return vpc

  def _create_kms_key(self) -> kms.Key:
    """Create KMS key for encryption"""
    return kms.Key(
      self, "TapKmsKey",
      description="KMS key for TAP microservice encryption",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY
    )

  def _create_secrets(self) -> dict:
    """Create secrets for secure credential management"""
    secrets = {}
    
    # Database credentials secret
    secrets['db_credentials'] = secretsmanager.Secret(
      self, "DatabaseCredentials",
      description="Database credentials for TAP microservice",
      generate_secret_string=secretsmanager.SecretStringGenerator(
        secret_string_template='{"username": "admin"}',
        generate_string_key="password",
        exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
        password_length=32
      ),
      encryption_key=self.kms_key
    )
    
    # API keys secret
    secrets['api_keys'] = secretsmanager.Secret(
      self, "APIKeys",
      description="API keys for external services",
      generate_secret_string=secretsmanager.SecretStringGenerator(
        secret_string_template='{"third_party_api": "placeholder"}',
        generate_string_key="api_key",
        password_length=64
      ),
      encryption_key=self.kms_key
    )
    
    return secrets

  def _create_s3_buckets(self, environment_suffix: str) -> tuple:
    """Create S3 buckets with security configurations"""
    # S3 access logs bucket - remove explicit naming to auto-generate
    access_logs_bucket = s3.Bucket(
      self, "S3AccessLogsBucket",
      encryption=s3.BucketEncryption.S3_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="DeleteOldAccessLogs",
          expiration=Duration.days(90)
        )
      ]
    )
    
    # Main application bucket - remove explicit naming to auto-generate
    bucket = s3.Bucket(
      self, "TapBucket",
      encryption=s3.BucketEncryption.KMS,
      encryption_key=self.kms_key,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      server_access_logs_bucket=access_logs_bucket,
      server_access_logs_prefix="access-logs/",
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="TransitionToIA",
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
      ]
    )
    
    return bucket, access_logs_bucket

  def _create_dynamodb_table(self, environment_suffix: str) -> dynamodb.Table:
    """Create DynamoDB table with encryption and backup"""
    table = dynamodb.Table(
      self, "TapTable",
      table_name=f"tap-object-metadata-{environment_suffix}-{self.region}",  # Add region
      partition_key=dynamodb.Attribute(
        name="objectKey",
        type=dynamodb.AttributeType.STRING
      ),
      sort_key=dynamodb.Attribute(
        name="uploadTime",
        type=dynamodb.AttributeType.STRING
      ),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryption_key=self.kms_key,
      removal_policy=RemovalPolicy.DESTROY,
      stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    )
    
    return table

  def _create_sns_topic(self, environment_suffix: str) -> sns.Topic:
    """Create SNS topic with KMS encryption"""
    topic = sns.Topic(
      self, "TapNotificationTopic",
      topic_name=f"tap-notification-{environment_suffix}-{self.region}",  # Add region
      master_key=self.kms_key
    )
    
    return topic

  def _create_lambda_functions(self, environment_suffix: str) -> dict:
    """Create Lambda functions with least privilege IAM roles"""
    functions = {}
    
    # Data processor Lambda function
    data_processor_role = iam.Role(
      self, "DataProcessorRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
      ],
      inline_policies={
        "DataProcessorPolicy": iam.PolicyDocument(
          statements=[
            # DynamoDB permissions (least privilege)
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
              ],
              resources=[self.dynamodb_table.table_arn]
            ),
            # S3 permissions (least privilege)
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "s3:GetObject",
                "s3:PutObject"
              ],
              resources=[f"{self.s3_bucket.bucket_arn}/*"]
            ),
            # SNS permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "sns:Publish"
              ],
              resources=[self.sns_topic.topic_arn]
            ),
            # Secrets Manager permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "secretsmanager:GetSecretValue"
              ],
              resources=[
                self.secrets['db_credentials'].secret_arn,
                self.secrets['api_keys'].secret_arn
              ]
            ),
            # KMS permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              resources=[self.kms_key.key_arn]
            )
          ]
        )
      }
    )
    
    functions['data_processor'] = _lambda.Function(
      self, "DataProcessorFunction",
      function_name=f"tap-object-processor-{environment_suffix}-{self.region}",  # Add region
      runtime=_lambda.Runtime.PYTHON_3_11,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline("""
import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
  try:
    # Get environment variables
    db_secret_arn = os.environ['DB_SECRET_ARN']
    api_secret_arn = os.environ['API_SECRET_ARN']
    ddb_table_name = os.environ['DDB_TABLE']
    sns_topic_arn = os.environ['SNS_TOPIC']
    s3_bucket = os.environ['S3_BUCKET']
    
    # Initialize AWS clients
    secrets_client = boto3.client('secretsmanager')
    dynamodb = boto3.resource('dynamodb')
    sns_client = boto3.client('sns')
    
    # Get secrets
    try:
      db_secret = secrets_client.get_secret_value(SecretId=db_secret_arn)
      api_secret = secrets_client.get_secret_value(SecretId=api_secret_arn)
      logger.info("Successfully retrieved secrets")
    except Exception as e:
      logger.error(f"Error retrieving secrets: {str(e)}")
      raise
    
    # Process the event
    table = dynamodb.Table(ddb_table_name)
    
    # Handle S3 event or API Gateway event
    if 'Records' in event:
      # S3 event
      for record in event['Records']:
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        
        # Store metadata in DynamoDB
        table.put_item(
          Item={
            'objectKey': object_key,
            'uploadTime': datetime.utcnow().isoformat(),
            'bucketName': bucket_name,
            'eventType': 'S3_OBJECT_CREATED'
          }
        )
        
        # Send SNS notification
        sns_client.publish(
          TopicArn=sns_topic_arn,
          Message=json.dumps({
            'objectKey': object_key,
            'bucketName': bucket_name,
            'eventType': 'S3_OBJECT_CREATED'
          }),
          Subject='TAP Object Created'
        )
        
        logger.info(f"Processed S3 object: {object_key}")
    else:
      # API Gateway event
      logger.info(f"Processing API request: {json.dumps(event)}")
    
    response = {
      'statusCode': 200,
      'body': json.dumps({
        'message': 'Data processed successfully',
        'timestamp': datetime.utcnow().isoformat()
      })
    }
    
    logger.info("Data processing completed successfully")
    return response
    
  except Exception as e:
    logger.error(f"Error processing data: {str(e)}")
    return {
      'statusCode': 500,
      'body': json.dumps({'error': str(e)})
    }
      """),
      role=data_processor_role,
      environment={
        'DB_SECRET_ARN': self.secrets['db_credentials'].secret_arn,
        'API_SECRET_ARN': self.secrets['api_keys'].secret_arn,
        'DDB_TABLE': self.dynamodb_table.table_name,
        'SNS_TOPIC': self.sns_topic.topic_arn,
        'S3_BUCKET': self.s3_bucket.bucket_name,
        'KMS_KEY_ID': self.kms_key.key_id,
        'TIMEOUT': '30'
      },
      timeout=Duration.seconds(30),
      memory_size=256,
      vpc=self.vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      log_retention=logs.RetentionDays.ONE_MONTH
    )
    
    # API handler Lambda function
    api_handler_role = iam.Role(
      self, "APIHandlerRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
      ],
      inline_policies={
        "APIHandlerPolicy": iam.PolicyDocument(
          statements=[
            # Lambda invoke permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=["lambda:InvokeFunction"],
              resources=[functions['data_processor'].function_arn]
            ),
            # DynamoDB read permissions
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "dynamodb:GetItem",
                "dynamodb:Query"
              ],
              resources=[self.dynamodb_table.table_arn]
            )
          ]
        )
      }
    )
    
    functions['api_handler'] = _lambda.Function(
      self, "APIHandlerFunction",
      function_name=f"tap-api-handler-{environment_suffix}-{self.region}",  # Add region
      runtime=_lambda.Runtime.PYTHON_3_11,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline("""
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
  try:
    logger.info(f"API request received: {json.dumps(event)}")
    
    # Extract request details
    http_method = event.get('httpMethod', '')
    path = event.get('path', '')
    
    # Route based on method and path
    if http_method == 'GET' and path == '/health':
      return {
        'statusCode': 200,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'status': 'healthy', 'service': 'tap-microservice'})
      }
    elif http_method == 'POST' and path == '/process':
      # Invoke data processor function
      lambda_client = boto3.client('lambda')
      response = lambda_client.invoke(
        FunctionName=os.environ['DATA_PROCESSOR_FUNCTION'],
        InvocationType='RequestResponse',
        Payload=json.dumps(event.get('body', {}))
      )
      
      return {
        'statusCode': 200,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Processing initiated'})
      }
    else:
      return {
        'statusCode': 404,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'})
      }
      
  except Exception as e:
    logger.error(f"API handler error: {str(e)}")
    return {
      'statusCode': 500,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      'body': json.dumps({'error': 'Internal server error'})
    }
      """),
      role=api_handler_role,
      environment={
        'DATA_PROCESSOR_FUNCTION': functions['data_processor'].function_name,
        'DDB_TABLE': self.dynamodb_table.table_name
      },
      timeout=Duration.seconds(30),
      memory_size=256,
      vpc=self.vpc,
      vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
      log_retention=logs.RetentionDays.ONE_MONTH
    )
    
    # S3 Event Notification to Lambda
    self.s3_bucket.add_event_notification(
      s3.EventType.OBJECT_CREATED,
      s3n.LambdaDestination(functions['data_processor'])
    )
    
    return functions

  def _create_api_gateway(self, environment_suffix: str) -> apigateway.RestApi:
    """Create API Gateway with logging and security configurations"""
    # CloudWatch log group for API Gateway
    api_log_group = logs.LogGroup(
      self, "APIGatewayLogGroup",
      log_group_name=f"/aws/apigateway/tap-{environment_suffix}",
      retention=logs.RetentionDays.ONE_MONTH,
      removal_policy=RemovalPolicy.DESTROY
    )
    
    # API Gateway
    api = apigateway.RestApi(
      self, "TapApi",
      rest_api_name=f"tap-api-{environment_suffix}",
      description="TAP microservice API with comprehensive logging",
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
          user=True
        )
      ),
      default_cors_preflight_options=apigateway.CorsOptions(
        allow_origins=apigateway.Cors.ALL_ORIGINS,
        allow_methods=apigateway.Cors.ALL_METHODS,
        allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
      )
    )
    
    # Lambda integration
    lambda_integration = apigateway.LambdaIntegration(
      self.lambda_functions['api_handler'],
      proxy=True
    )
    
    # API resources and methods
    health_resource = api.root.add_resource("health")
    health_resource.add_method(
      "GET", 
      lambda_integration,
      method_responses=[
        apigateway.MethodResponse(
          status_code="200",
          response_parameters={
            "method.response.header.Access-Control-Allow-Origin": True
          }
        )
      ]
    )
    
    process_resource = api.root.add_resource("process")
    process_resource.add_method(
      "POST", 
      lambda_integration,
      method_responses=[
        apigateway.MethodResponse(
          status_code="200",
          response_parameters={
            "method.response.header.Access-Control-Allow-Origin": True
          }
        )
      ]
    )
    
    # API Key and Usage Plan for rate limiting
    api_key = api.add_api_key(
      "TapAPIKey",
      api_key_name=f"tap-api-key-{environment_suffix}"
    )
    
    usage_plan = api.add_usage_plan(
      "TapUsagePlan",
      name=f"tap-usage-plan-{environment_suffix}",
      throttle=apigateway.ThrottleSettings(
        rate_limit=1000,
        burst_limit=2000
      ),
      quota=apigateway.QuotaSettings(
        limit=10000,
        period=apigateway.Period.DAY
      )
    )
    
    usage_plan.add_api_key(api_key)
    usage_plan.add_api_stage(stage=api.deployment_stage)
    
    return api

  def _enable_logging(self):
    """Enable comprehensive logging and auditing"""
    # CloudTrail for API auditing - remove explicit naming to auto-generate
    cloudtrail_bucket = s3.Bucket(
      self, "CloudTrailBucket",
      # Remove bucket_name to auto-generate unique name
      encryption=s3.BucketEncryption.S3_MANAGED,
      block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
      versioned=True,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      lifecycle_rules=[
        s3.LifecycleRule(
          id="DeleteOldCloudTrailLogs",
          expiration=Duration.days(365)
        )
      ]
    )
    
    # Add bucket policy for CloudTrail
    cloudtrail_bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AWSCloudTrailAclCheck",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:GetBucketAcl"],
        resources=[cloudtrail_bucket.bucket_arn],
        conditions={
          "StringEquals": {
            "aws:SourceArn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/tap-microservice-trail"
          }
        }
      )
    )
    
    cloudtrail_bucket.add_to_resource_policy(
      iam.PolicyStatement(
        sid="AWSCloudTrailWrite",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=["s3:PutObject"],
        resources=[f"{cloudtrail_bucket.bucket_arn}/*"],
        conditions={
          "StringEquals": {
            "s3:x-amz-acl": "bucket-owner-full-control",
            "aws:SourceArn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/tap-microservice-trail"
          }
        }
      )
    )
    
    # Add KMS key policy for CloudTrail
    self.kms_key.add_to_resource_policy(
      iam.PolicyStatement(
        sid="Enable CloudTrail Encryption",
        effect=iam.Effect.ALLOW,
        principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
        actions=[
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:ReEncrypt*",
          "kms:Decrypt"
        ],
        resources=["*"],
        conditions={
          "StringEquals": {
            "aws:SourceArn": f"arn:aws:cloudtrail:{self.region}:{self.account}:trail/tap-microservice-trail"
          }
        }
      )
    )
    
    cloudtrail.Trail(
      self, "TapTrail",
      trail_name="tap-microservice-trail",
      bucket=cloudtrail_bucket,
      include_global_service_events=True,
      is_multi_region_trail=True,
      enable_file_validation=True,
      encryption_key=self.kms_key
    )

  def _create_outputs(self):
    """Create CloudFormation outputs"""
    cdk.CfnOutput(self, "S3BucketOutput", value=self.s3_bucket.bucket_name)
    cdk.CfnOutput(self, "DDBTableOutput", value=self.dynamodb_table.table_name)
    cdk.CfnOutput(self, "SNSTopicOutput", value=self.sns_topic.topic_arn)
    cdk.CfnOutput(self, "LambdaFunctionOutput", value=self.lambda_functions['data_processor'].function_name)
    cdk.CfnOutput(self, "ApiGatewayOutput", value=self.api_gateway.url)
    cdk.CfnOutput(self, "VpcIdOutput", value=self.vpc.vpc_id)
    cdk.CfnOutput(self, "PublicSubnetIdsOutput", 
                  value=",".join([subnet.subnet_id for subnet in self.vpc.public_subnets]))
    cdk.CfnOutput(self, "PrivateSubnetIdsOutput", 
                  value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]))
```