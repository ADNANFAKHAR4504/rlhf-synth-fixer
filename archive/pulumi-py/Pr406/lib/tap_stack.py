import json
import pulumi
import pulumi_aws as aws
from pulumi import Output


class TapStackArgs:
  """Arguments for TapStack configuration."""
  def __init__(self, environment_suffix: str = 'dev'):
    self.environment_suffix = environment_suffix


class TapStack(pulumi.ComponentResource):
  """
  TapStack that creates serverless S3 to Lambda trigger infrastructure.
  """

  def __init__(self, name: str, args: TapStackArgs, opts: pulumi.ResourceOptions = None):
    super().__init__('tap:index:TapStack', name, {}, opts)

    self.bucket = self._create_s3_bucket()
    self.lambda_role = self._create_lambda_role()
    self.lambda_policy = self._create_lambda_policy(self.bucket.arn)

    aws.iam.RolePolicyAttachment(
      "lambda-policy-attachment",
      role=self.lambda_role.name,
      policy_arn=self.lambda_policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.lambda_function = self._create_lambda_function(self.lambda_role.arn)
    self._setup_s3_lambda_trigger(self.bucket, self.lambda_function)

    self.bucket_arn = self.bucket.arn
    self.bucket_name = self.bucket.id
    self.lambda_function_arn = self.lambda_function.arn
    self.lambda_function_name = self.lambda_function.name
    self.lambda_role_arn = self.lambda_role.arn

    self.register_outputs({
      'bucket_arn': self.bucket_arn,
      'bucket_name': self.bucket_name,
      'lambda_function_arn': self.lambda_function_arn,
      'lambda_function_name': self.lambda_function_name,
      'lambda_role_arn': self.lambda_role_arn,
      'test_command': self.bucket.id.apply(
        lambda name: f"aws s3 cp test-file.txt s3://{name}/ --region us-east-1"
      )
    })

  def _create_lambda_role(self) -> aws.iam.Role:
    lambda_assume_role_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          }
        }
      ]
    }

    lambda_role = aws.iam.Role(
      "lambda-execution-role",
      assume_role_policy=json.dumps(lambda_assume_role_policy),
      description="IAM role for S3-triggered Lambda function",
      tags={
        "Environment": "production",
        "Project": "serverless-s3-lambda",
        "ManagedBy": "Pulumi"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    return lambda_role

  def _create_lambda_policy(self, bucket_arn: Output[str]) -> aws.iam.Policy:
    lambda_policy_document = bucket_arn.apply(
      lambda arn: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            "Resource": f"{arn}/*"
          }
        ]
      })
    )

    lambda_policy = aws.iam.Policy(
      "lambda-s3-policy",
      policy=lambda_policy_document,
      description="Policy for Lambda function to access S3 and CloudWatch Logs",
      tags={
        "Environment": "production",
        "Project": "serverless-s3-lambda",
        "ManagedBy": "Pulumi"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    return lambda_policy

  def _create_s3_bucket(self) -> aws.s3.Bucket:
    bucket = aws.s3.Bucket(
      "serverless-trigger-bucket",
      tags={
        "Environment": "production",
        "Project": "serverless-s3-lambda",
        "Purpose": "Lambda trigger source",
        "ManagedBy": "Pulumi"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    aws.s3.BucketVersioning(
      "bucket-versioning",
      bucket=bucket.id,
      versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    aws.s3.BucketServerSideEncryptionConfiguration(
      "bucket-encryption",
      bucket=bucket.id,
      rules=[
        aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
          )
        )
      ],
      opts=pulumi.ResourceOptions(parent=self)
    )

    aws.s3.BucketPublicAccessBlock(
      "bucket-public-access-block",
      bucket=bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    return bucket

  def _create_lambda_function(self, role_arn: Output[str]) -> aws.lambda_.Function:
    lambda_function = aws.lambda_.Function(
      "s3-processor-lambda",
      runtime="python3.11",
      code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lib/lambda_code")
      }),
      handler="main.lambda_handler",
      role=role_arn,
      timeout=300,
      memory_size=256,
      description="Lambda function to process S3 events",
      environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
          "LOG_LEVEL": "INFO",
          "ENVIRONMENT": "production"
        }
      ),
      tags={
        "Environment": "production",
        "Project": "serverless-s3-lambda",
        "ManagedBy": "Pulumi"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    return lambda_function

  def _setup_s3_lambda_trigger(self, bucket: aws.s3.Bucket, lambda_function: aws.lambda_.Function) -> None:
    # Create Lambda permission first with proper source ARN format
    lambda_permission = aws.lambda_.Permission(
      "s3-invoke-lambda-permission",
      action="lambda:InvokeFunction",
      function=lambda_function.name,
      principal="s3.amazonaws.com",
      source_arn=bucket.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Create S3 notification with explicit dependency on Lambda permission
    # and proper configuration for AWS validation
    aws.s3.BucketNotification(
      "s3-lambda-notification",
      bucket=bucket.id,
      lambda_functions=[
        aws.s3.BucketNotificationLambdaFunctionArgs(
          lambda_function_arn=lambda_function.arn,
          events=["s3:ObjectCreated:*"]
        )
      ],
      opts=pulumi.ResourceOptions(depends_on=[lambda_permission], parent=self)
    )
