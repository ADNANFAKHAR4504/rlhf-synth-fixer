```python
from typing import Optional

import aws_cdk as cdk
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_lambda as _lambda
from aws_cdk.aws_lambda_event_sources import S3EventSource
from aws_cdk.aws_iam import PolicyStatement
from constructs import Construct


class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
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
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    project_name = "tap"

    def resource_name(resource: str) -> str:
      return f"{project_name}-{environment_suffix}-{resource}"

    # S3 Bucket
    self.bucket = s3.Bucket(
      self,
      "AppBucket",
      bucket_name=resource_name("bucket"),
      versioned=False,
      removal_policy=cdk.RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      public_read_access=False
    )

    # DynamoDB Table
    self.table = dynamodb.Table(
      self,
      "AppTable",
      table_name=resource_name("table"),
      partition_key=dynamodb.Attribute(
        name="id",
        type=dynamodb.AttributeType.STRING
      ),
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
      removal_policy=cdk.RemovalPolicy.DESTROY
    )

    # Lambda Function
    self.lambda_fn = _lambda.Function(
      self,
      "AppLambda",
      function_name=resource_name("lambda"),
      runtime=_lambda.Runtime.PYTHON_3_11,
      handler="index.handler",
      code=_lambda.Code.from_inline(
        "def handler(event, context):\n"
        "  print('Event:', event)\n"
        "  return {'statusCode': 200, 'body': 'Hello from Lambda'}"
      ),
      environment={
        "TABLE_NAME": self.table.table_name,
        "BUCKET_NAME": self.bucket.bucket_name
      }
    )

    # Grant Permissions
    self.table.grant_read_write_data(self.lambda_fn)
    self.bucket.grant_read_write(self.lambda_fn)

    # Trigger Lambda on S3 upload
    self.lambda_fn.add_event_source(
      S3EventSource(
        self.bucket,
        events=[s3.EventType.OBJECT_CREATED]
      )
    )

    # Add scoped CloudWatch log permissions
    log_group_arn = (
      f"arn:aws:logs:{self.region}:{self.account}:"
      f"log-group:/aws/lambda/{self.lambda_fn.function_name}:*"
    )

    self.lambda_fn.add_to_role_policy(
      PolicyStatement(
        actions=[
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        resources=[log_group_arn]
      )
    )

```