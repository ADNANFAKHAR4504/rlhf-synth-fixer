"""Nested Stacks for TapStack Architecture

This module defines nested stack wrappers for each resource type as per the user's requirements.
The main TapStack will instantiate these nested stacks instead of creating resources directly.
"""

from aws_cdk import NestedStack
from constructs import Construct

from lib.stacks.api_gateway_stack import ApiGatewayStack, ApiGatewayStackProps
from lib.stacks.dynamodb_stack import DynamoDBStack, DynamoDBStackProps
from lib.stacks.lambda_stack import LambdaStack, LambdaStackProps
from lib.stacks.monitoring_stack import MonitoringStack, MonitoringStackProps
from lib.stacks.s3_cloudfront_stack import S3CloudFrontStack, S3CloudFrontStackProps


class NestedDynamoDBStack(NestedStack):
  """Nested DynamoDB Stack wrapper"""
  
  def __init__(self, scope: Construct, construct_id: str, 
               props: DynamoDBStackProps = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Use the original DynamoDBStack logic here
    self.ddb_stack = DynamoDBStack(
      self, "Resource", props=props or DynamoDBStackProps()
    )
    self.table = self.ddb_stack.table
    self.dynamodb_kms_key = self.ddb_stack.dynamodb_kms_key


class NestedS3CloudFrontStack(NestedStack):
  """Nested S3 and CloudFront Stack wrapper"""
  
  def __init__(self, scope: Construct, construct_id: str, 
               props: S3CloudFrontStackProps = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Use the original S3CloudFrontStack logic here
    self.s3_cloudfront_stack = S3CloudFrontStack(
      self, "Resource", props=props or S3CloudFrontStackProps()
    )
    self.bucket = self.s3_cloudfront_stack.bucket
    self.s3_kms_key = self.s3_cloudfront_stack.s3_kms_key
    self.distribution = self.s3_cloudfront_stack.distribution
    self.origin_access_identity = self.s3_cloudfront_stack.origin_access_identity


class NestedLambdaStack(NestedStack):
  """Nested Lambda Stack wrapper"""
  
  def __init__(self, scope: Construct, construct_id: str, props: LambdaStackProps, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Use the original LambdaStack logic here
    self.lambda_stack = LambdaStack(self, "Resource", props=props)
    self.lambda_function = self.lambda_stack.lambda_function


class NestedApiGatewayStack(NestedStack):
  """Nested API Gateway Stack wrapper"""
  
  def __init__(self, scope: Construct, construct_id: str, props: ApiGatewayStackProps, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Use the original ApiGatewayStack logic here
    self.api_stack = ApiGatewayStack(self, "Resource", props=props)
    self.http_api = self.api_stack.http_api




class NestedMonitoringStack(NestedStack):
  """Nested Monitoring Stack wrapper"""
  
  def __init__(self, scope: Construct, construct_id: str, props: MonitoringStackProps, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Use the original MonitoringStack logic here
    self.monitoring_stack = MonitoringStack(self, "Resource", props=props)
    self.lambda_error_alarm = self.monitoring_stack.lambda_error_alarm
    self.lambda_throttle_alarm = self.monitoring_stack.lambda_throttle_alarm
    self.api_latency_alarm = self.monitoring_stack.api_latency_alarm
