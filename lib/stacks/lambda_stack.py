"""Lambda Stack for TapStack Architecture

This module defines the Lambda stack responsible for creating 
the Lambda function for backend logic.
"""

from typing import Optional

from aws_cdk import Duration
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_logs as logs
from constructs import Construct


class LambdaStackProps:
  """Properties for Lambda Stack"""
  
  def __init__(self, table_name: str, environment_suffix: Optional[str] = None):
    self.table_name = table_name
    self.environment_suffix = environment_suffix


class LambdaStack(Construct):
  """Lambda Stack for backend handler"""
  
  def __init__(self, scope: Construct, construct_id: str, props: LambdaStackProps):
    super().__init__(scope, construct_id)
    
    # Lambda Function (Python 3.8) for backend logic
    self.lambda_function = _lambda.Function(
      self,
      "BackendHandler",
      runtime=_lambda.Runtime.PYTHON_3_8,
      handler="backend_handler.handler",
      code=_lambda.Code.from_asset(
        "lib/lambda",
        exclude=["__pycache__", "*.pyc"]
      ),
      environment={
        "TABLE_NAME": props.table_name,
        "LOG_LEVEL": "INFO"
      },
      log_retention=logs.RetentionDays.ONE_MONTH,
      timeout=Duration.seconds(30),
      memory_size=128
    )
