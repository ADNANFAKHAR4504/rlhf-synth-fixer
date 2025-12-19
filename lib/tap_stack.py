"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
"""

from typing import Optional
from aws_cdk import (
  Stack,
  StackProps,
  Duration,
  RemovalPolicy,
  aws_s3 as s3,
  aws_lambda as _lambda,
  aws_lambda_event_sources as lambda_events,
  aws_dynamodb as dynamodb,
  aws_sns as sns,
  aws_iam as iam,
  aws_apigateway as apigw,
  aws_logs as logs,
)
from constructs import Construct


class TapStackProps(StackProps):
  """TapStackProps defines the properties for the TapStack CDK stack."""

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
  """Represents the main CDK stack for the Tap project."""

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    props: Optional[TapStackProps] = None,
    **kwargs
  ):
    super().__init__(scope, construct_id, **kwargs)

    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    tags = {"env": environment_suffix}

    # 1. S3 Bucket with AES-256 encryption and tagging
    bucket = s3.Bucket(
      self,
      "TapBucket",
      bucket_name=f"tap-bucket-{environment_suffix}",
      encryption=s3.BucketEncryption.S3_MANAGED,
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True
    )
    for k, v in tags.items():
      bucket.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # 2. DynamoDB Table for metadata
    table = dynamodb.Table(
      self,
      "TapObjectMetadataTable",
      table_name=f"tap-object-metadata-{environment_suffix}",
      partition_key=dynamodb.Attribute(
        name="objectKey",
        type=dynamodb.AttributeType.STRING
      ),
      sort_key=dynamodb.Attribute(
        name="uploadTime",
        type=dynamodb.AttributeType.STRING
      ),
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
    )
    for k, v in tags.items():
      table.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # 3. SNS Topic for notifications
    topic = sns.Topic(
      self,
      "TapNotificationTopic",
      topic_name=f"tap-notification-{environment_suffix}"
    )
    for k, v in tags.items():
      topic.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # 4. Lambda Execution Role (least privilege, LocalStack-compatible)
    lambda_role = iam.Role(
      self,
      "TapLambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="Lambda execution role for TapStack",
    )
    # Inline policy instead of AWS managed policy for LocalStack compatibility
    lambda_role.add_to_policy(iam.PolicyStatement(
      actions=[
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      resources=["*"]
    ))
    lambda_role.add_to_policy(iam.PolicyStatement(
      actions=["s3:GetObject", "s3:ListBucket"],
      resources=[bucket.bucket_arn, f"{bucket.bucket_arn}/*"]
    ))
    lambda_role.add_to_policy(iam.PolicyStatement(
      actions=["dynamodb:PutItem", "dynamodb:UpdateItem"],
      resources=[table.table_arn]
    ))
    lambda_role.add_to_policy(iam.PolicyStatement(
      actions=["sns:Publish"],
      resources=[topic.topic_arn]
    ))

    # 5. Lambda Function
    LAMBDA_TIMEOUT = 30
    LOG_RETENTION_DAYS = logs.RetentionDays.ONE_WEEK

    lambda_fn = _lambda.Function(
      self,
      "TapObjectProcessor",
      function_name=f"tap-object-processor-{environment_suffix}",
      runtime=_lambda.Runtime.PYTHON_3_12,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline(
        """
import os
import json
import boto3
def lambda_handler(event, context):
  import logging
  logger = logging.getLogger()
  logger.setLevel(logging.INFO)
  try:
    s3_client = boto3.client('s3')
    ddb = boto3.resource('dynamodb')
    sns = boto3.client('sns')
    table_name = os.environ['DDB_TABLE']
    topic_arn = os.environ['SNS_TOPIC']
    table = ddb.Table(table_name)
    if 'Records' in event and event['Records'][0]['eventSource'] == 'aws:s3':
      record = event['Records'][0]
      bucket = record['s3']['bucket']['name']
      key = record['s3']['object']['key']
      size = record['s3']['object'].get('size', 0)
      timestamp = record['eventTime']
      table.put_item(Item={
        'objectKey': key,
        'uploadTime': timestamp,
        'bucket': bucket,
        'size': size
      })
      sns.publish(
        TopicArn=topic_arn,
        Message=f"New object {key} uploaded to {bucket} at {timestamp}."
      )
      return {'statusCode': 200, 'body': 'S3 event processed'}
    elif 'httpMethod' in event:
      return {
        'statusCode': 200,
        'body': json.dumps({'message': 'API Gateway trigger successful'})
      }
    else:
      return {'statusCode': 400, 'body': 'Unknown event'}
  except Exception as e:
    logger.error(f"Error processing event: {e}")
    return {'statusCode': 500, 'body': str(e)}
        """
      ),
      role=lambda_role,
      timeout=Duration.seconds(LAMBDA_TIMEOUT),
      environment={
        "DDB_TABLE": table.table_name,
        "SNS_TOPIC": topic.topic_arn,
        "TIMEOUT": str(LAMBDA_TIMEOUT)
      },
      log_retention=LOG_RETENTION_DAYS
    )
    for k, v in tags.items():
      lambda_fn.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # S3 event source for Lambda
    lambda_fn.add_event_source(lambda_events.S3EventSource(
      bucket,
      events=[s3.EventType.OBJECT_CREATED]
    ))

    # 6. API Gateway REST API to trigger Lambda
    api = apigw.LambdaRestApi(
      self,
      "TapApiGateway",
      handler=lambda_fn,
      proxy=True,
      rest_api_name=f"tap-api-{environment_suffix}",
      deploy_options=apigw.StageOptions(stage_name=environment_suffix)
    )
    for k, v in tags.items():
      api.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # Outputs (optional, for integration/testing)
    self.bucket = bucket
    self.table = table
    self.topic = topic
    self.lambda_fn = lambda_fn
    self.api = api
