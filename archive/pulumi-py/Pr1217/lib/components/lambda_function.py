from dataclasses import dataclass
from typing import Optional
import os
import pulumi
import pulumi_aws as aws

@dataclass
class LambdaConfig:
  role_arn: pulumi.Input[str]
  handler: str = "handler.lambda_handler"
  runtime: str = "python3.11"
  timeout: int = 10
  memory_size: int = 128


class LambdaFunction(pulumi.ComponentResource):
  """
  Component for creating and deploying AWS Lambda function.
  """

  def __init__(self, name: str, config: LambdaConfig, opts: pulumi.ResourceOptions = None):
    super().__init__('custom:aws:LambdaFunction', name, {}, opts)

    self.function_name = name

    # Create deployment package
    self.s3_invoke_permission: Optional[aws.lambda_.Permission] = None

    # Locate lambda source directory
    pulumi_cwd = os.getcwd()
    lambda_src_dir = os.path.join(pulumi_cwd, "lib", "lambda_code")

    if not os.path.exists(lambda_src_dir):
      raise FileNotFoundError(f"Lambda source directory not found: {lambda_src_dir}")

    # Create Lambda function
    self.function = aws.lambda_.Function(
      f"{name}-function",
      role=config.role_arn,
      code=pulumi.AssetArchive({
        ".": pulumi.FileArchive(lambda_src_dir)
      }),
      handler=config.handler,
      runtime=config.runtime,
      timeout=config.timeout,
      memory_size=config.memory_size,
      description="Lambda function triggered by S3 events",
      tags={
        "Name": f"{name}-function",
        "Component": "Lambda"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Register outputs
    self.register_outputs({
      'function_arn': self.function.arn,
      'function_name': self.function.name
    })

  def add_s3_trigger(self, bucket_arn: pulumi.Input[str]):
    """Add S3 trigger to the Lambda function."""

    # Create Lambda permission for S3 to invoke the function
    self.s3_invoke_permission = aws.lambda_.Permission(
      f"{self.function_name}-s3-invoke-permission",
      action="lambda:InvokeFunction",
      function=self.function.name,
      principal="s3.amazonaws.com",
      source_arn=bucket_arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    return self.s3_invoke_permission
