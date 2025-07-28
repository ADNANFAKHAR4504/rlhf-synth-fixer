"""Monitoring Stack for TapStack Architecture

This module defines the monitoring stack responsible for creating 
CloudWatch alarms for Lambda and API Gateway monitoring.
"""

from typing import Optional

from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_lambda as _lambda
from constructs import Construct


class MonitoringStackProps:
  """Properties for Monitoring Stack"""
  
  def __init__(self, lambda_function: _lambda.Function, http_api: apigw.HttpApi, 
                 environment_suffix: Optional[str] = None):
    self.lambda_function = lambda_function
    self.http_api = http_api
    self.environment_suffix = environment_suffix


class MonitoringStack(Construct):
  """Monitoring Stack for CloudWatch alarms"""
  
  def __init__(self, scope: Construct, construct_id: str, props: MonitoringStackProps):
    super().__init__(scope, construct_id)
    
    # Basic CloudWatch Alarms for Lambda function failures and throttling
    self.lambda_error_alarm = cloudwatch.Alarm(
      self,
      "LambdaErrorAlarm",
      metric=props.lambda_function.metric_errors(),
      threshold=1,
      evaluation_periods=2,
      comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarm_description="Alarm for Lambda function errors"
    )
    
    self.lambda_throttle_alarm = cloudwatch.Alarm(
      self,
      "LambdaThrottleAlarm",
      metric=props.lambda_function.metric_throttles(),
      threshold=1,
      evaluation_periods=2,
      comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarm_description="Alarm for Lambda function throttling"
    )
    
    # High latency alarm for API Gateway
    self.api_latency_alarm = cloudwatch.Alarm(
      self,
      "ApiLatencyAlarm",
      metric=cloudwatch.Metric(
        namespace="AWS/ApiGatewayV2",
        metric_name="IntegrationLatency",
        dimensions_map={"ApiId": props.http_api.api_id}
      ),
      threshold=5000,  # 5 seconds
      evaluation_periods=2,
      comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarm_description="Alarm for high API Gateway latency"
    )
