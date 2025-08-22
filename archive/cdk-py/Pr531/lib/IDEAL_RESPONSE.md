# TAP Stack - AWS CDK Infrastructure

## `tap_stack.py` - Complete CDK Implementation

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
  Stack,
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
  aws_ec2 as ec2,
  CfnOutput
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


class TapStack(Stack):
  """
  Serverless microservices infrastructure for TAP project.
  """

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

    # VPC for Lambda
    vpc = ec2.Vpc(
      self,
      "TapVpc",
      max_azs=2,
      nat_gateways=1
    )

    # S3 Bucket
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

    # DynamoDB Table
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

    # SNS Topic
    topic = sns.Topic(
      self,
      "TapNotificationTopic",
      topic_name=f"tap-notification-{environment_suffix}"
    )
    for k, v in tags.items():
      topic.node.default_child.add_property_override(
        "Tags", [{"Key": k, "Value": v}]
      )

    # Lambda Execution Role (least privilege + VPC permissions)
    lambda_role = iam.Role(
      self,
      "TapLambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="Lambda execution role for TapStack",
    )
    lambda_role.add_managed_policy(
      iam.ManagedPolicy.from_aws_managed_policy_name(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    )
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
    lambda_role.add_to_policy(iam.PolicyStatement(
      actions=[
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DeleteNetworkInterface"
      ],
      resources=["*"]
    ))

    # Lambda Function (Python 3.8, VPC, error handling, secrets placeholder)
    lambda_fn = _lambda.Function(
      self,
      "TapObjectProcessor",
      function_name=f"tap-object-processor-{environment_suffix}",
      runtime=_lambda.Runtime.PYTHON_3_11,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline(
        """
import os
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_secret(secret_name):
  client = boto3.client('secretsmanager')
  try:
    response = client.get_secret_value(SecretId=secret_name)
    return response.get('SecretString')
  except Exception as e:
    logger.error(f"Failed to retrieve secret {secret_name}: {e}")
    return None

def lambda_handler(event, context):
  try:
    s3_client = boto3.client('s3')
    ddb = boto3.resource('dynamodb')
    sns = boto3.client('sns')
    table_name = os.environ['DDB_TABLE']
    topic_arn = os.environ['SNS_TOPIC']
    table = ddb.Table(table_name)
    # Example: secret = get_secret('MyApiKey')
    if 'Records' in event and event['Records'][0]['eventSource'] == 'aws:s3':
      record = event['Records'][0]
      bucket = record['s3']['bucket']['name']
      key = record['s3']['object']['key']
      size = record['s3']['object'].get('size', 0)
      timestamp = record['eventTime']
      try:
        table.put_item(Item={
          'objectKey': key,
          'uploadTime': timestamp,
          'bucket': bucket,
          'size': size
        })
      except Exception as ddb_err:
        logger.error(f"DynamoDB error: {ddb_err}")
        return {'statusCode': 500, 'body': f"DynamoDB error: {ddb_err}"}
      try:
        sns.publish(
          TopicArn=topic_arn,
          Message=f"New object {key} uploaded to {bucket} at {timestamp}."
        )
      except Exception as sns_err:
        logger.error(f"SNS error: {sns_err}")
        return {'statusCode': 500, 'body': f"SNS error: {sns_err}"}
      logger.info(f"Processed S3 event for {key}")
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
      timeout=Duration.seconds(30),
      environment={
        "DDB_TABLE": table.table_name,
        "SNS_TOPIC": topic.topic_arn,
        "TIMEOUT": "30"
      },
      log_retention=logs.RetentionDays.ONE_WEEK,
      vpc=vpc
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

    # API Gateway REST API to trigger Lambda
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

    CfnOutput(self, "S3BucketOutput", value=bucket.bucket_name)
    CfnOutput(self, "DDBTableOutput", value=table.table_name)
    CfnOutput(self, "SNSTopicOutput", value=topic.topic_arn)
    CfnOutput(self, "LambdaFunctionOutput", value=lambda_fn.function_name)
    CfnOutput(self, "ApiGatewayOutput", value=api.url)
    CfnOutput(self, "VpcIdOutput", value=vpc.vpc_id)
    CfnOutput(self, "PublicSubnetIdsOutput", 
      value=",".join([subnet.subnet_id for subnet in vpc.public_subnets])
    )
    CfnOutput(self, "PrivateSubnetIdsOutput", 
      value=",".join([subnet.subnet_id for subnet in vpc.private_subnets])
    )


```