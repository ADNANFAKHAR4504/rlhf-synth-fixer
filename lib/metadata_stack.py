from aws_cdk import (
  Stack,
  Duration,
  RemovalPolicy,
  Tags,
  aws_lambda as _lambda,
  aws_kms as kms,
  aws_iam as iam,
)
from constructs import Construct


class SecureInfrastructureStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    # Define the KMS Key for encrypting environment variables
    encryption_key = kms.Key(
      self,
      "LambdaEnvVarsEncryptionKey",
      description="KMS key for encrypting Lambda environment variables",
      enable_key_rotation=True,
      removal_policy=RemovalPolicy.DESTROY,
    )

    # Define the Lambda function
    lambda_function = _lambda.Function(
      self,
      "SecureLambdaFunction",
      runtime=_lambda.Runtime.PYTHON_3_8,
      handler="lambda_function.handler",
      code=_lambda.Code.from_asset("lib/lambda"),
      environment={
        "SECRET_KEY": "my-secret-value"
      },
      environment_encryption=encryption_key,
      timeout=Duration.seconds(10),
    )

    # IAM policy for logging
    lambda_function.add_to_role_policy(
      iam.PolicyStatement(
        actions=[
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources=["arn:aws:logs:*:*:*"],
      )
    )

    # Apply tags
    Tags.of(self).add("Environment", "Production")
    Tags.of(self).add("Team", "DevOps")
