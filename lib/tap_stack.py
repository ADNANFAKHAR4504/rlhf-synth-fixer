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

    # Grant permissions to DynamoDB table
    self.table.grant_read_write_data(self.lambda_fn)

    # Grant permissions to S3 bucket
    # Note: Using `grant_read_write` is better than a manual policy for common actions
    self.bucket.grant_read_write(self.lambda_fn)

    # Add S3 trigger. This automatically adds the necessary permissions
    # for the S3 service to invoke the Lambda function.
    self.lambda_fn.add_event_source(
        S3EventSource(
            self.bucket,
            events=[s3.EventType.OBJECT_CREATED]
        )
    )

    # The scoped CloudWatch log permissions are not necessary because
    # the Lambda execution role automatically gets these permissions.
    # The default Lambda IAM role policy already includes permissions for
    # creating log groups, streams, and putting events.

    # ----------------------------
    # Outputs (Exports)
    # ----------------------------

    cdk.CfnOutput(
        self,
        "S3BucketName",
        value=self.bucket.bucket_name,
        export_name=f"{resource_name('bucket')}-name"
    )

    cdk.CfnOutput(
        self,
        "DynamoDBTableName",
        value=self.table.table_name,
        export_name=f"{resource_name('table')}-name"
    )

    cdk.CfnOutput(
        self,
        "LambdaFunctionName",
        value=self.lambda_fn.function_name,
        export_name=f"{resource_name('lambda')}-name"
    )

    cdk.CfnOutput(
        self,
        "LambdaRoleArn",
        value=self.lambda_fn.role.role_arn if self.lambda_fn.role else "N/A",
        export_name=f"{resource_name('lambda')}-role-arn"
    )
