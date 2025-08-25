# Secure Infrastructure Stack with AWS CDK Python

I'll build a reusable, secure infrastructure stack deployed in the AWS `us-west-2` region using AWS CDK with Python, implementing encrypted environment variables and security best practices.

## Solution Architecture

The solution consists of:
1. **AWS Lambda Function** - Serverless compute with encrypted environment variables
2. **AWS KMS Key** - Customer-managed key for environment variable encryption
3. **IAM Role** - Least-privilege execution role for Lambda
4. **Resource Tagging** - Consistent tagging across all resources
5. **Nested Stack Architecture** - Modular and reusable design

## Implementation

### Core Infrastructure Stack

**File: `lib/metadata_stack.py`**
```python
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
```

### Main Stack Orchestrator

**File: `lib/tap_stack.py`**
```python
from typing import Optional

import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct

from .metadata_stack import SecureInfrastructureStack


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
      **kwargs,
  ):
    super().__init__(scope, construct_id, **kwargs)

    # Determine environment suffix
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context("environmentSuffix") or "dev"

    # Nested stack class to instantiate SecureInfrastructureStack
    class NestedSecureInfrastructureStack(NestedStack):
      def __init__(self,
                   nested_scope: Construct,
                   nested_id: str,
                   nested_props=None, **nested_kwargs):
        super().__init__(nested_scope, nested_id, **nested_kwargs)
        self.metadata_stack = SecureInfrastructureStack(
            self,
            "SecureInfrastructureStack",
            env=nested_props.env if nested_props else None,
        )

    # Instantiate the nested stack
    NestedSecureInfrastructureStack(
        self,
        f"SecureInfrastructureStack{environment_suffix}",
        nested_props=props,
    )
```

### Application Entry Point

**File: `tap.py`**
```python
#!/usr/bin/env python3
import os

import aws_cdk as cdk
from aws_cdk import Tags

from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"DemoStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-west-2'
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

### Lambda Function Code

**File: `lib/lambda/lambda_handler.py`**
```python
def handler(event, context):
    import os
    secret_key = os.environ['SECRET_KEY']
    print("Lambda function executed successfully with encrypted environment variables")
```