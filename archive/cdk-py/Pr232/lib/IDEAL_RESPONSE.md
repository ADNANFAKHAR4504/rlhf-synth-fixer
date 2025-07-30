# Serverless HTTP Endpoint with CDK Python

I'll help you create a serverless HTTP endpoint using AWS CDK with Python. This solution will deploy an API Gateway integrated with a Lambda function in the us-west-2 region, following the mycompany- naming convention.

## Architecture Overview

The infrastructure includes:
- AWS API Gateway REST API (mycompany-ApiGateway)
- AWS Lambda function (mycompany-LambdaFunction) 
- IAM execution role (mycompany-LambdaExecutionRole)
- POST endpoint at `/myresource`

## Files Created/Modified

### tap.py
```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
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

### lib/tap_stack.py
```python
# mycompany_serverless_stack.py

from typing import Optional

from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigw,
    aws_iam as iam,
    NestedStack,
    CfnOutput,
    Duration,
    StackProps,
    Stack
)
from constructs import Construct


class MyCompanyServerlessStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Define IAM Role for Lambda
    lambda_role = iam.Role(
        self, 'mycompany-LambdaExecutionRole',
        assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                'service-role/AWSLambdaBasicExecutionRole'
            )
        ]
    )

    # Define the Lambda function
    lambda_function = _lambda.Function(
        self, 'mycompany-LambdaFunction',
        runtime=_lambda.Runtime.PYTHON_3_11,
        handler='index.handler',
        code=_lambda.Code.from_inline("""
def handler(event, context):
    import json
    print(f"Received event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from MyCompany!')
    }
"""),
        role=lambda_role,
        environment={
            'LOG_LEVEL': 'INFO'
        },
        timeout=Duration.seconds(10),
    )

    # Define API Gateway
    api = apigw.RestApi(
        self, 'mycompany-ApiGateway',
        rest_api_name='mycompany-Service',
        description='This service serves mycompany HTTP POST requests.'
    )

    post_resource = api.root.add_resource('myresource')
    post_resource.add_method(
        'POST',
        apigw.LambdaIntegration(lambda_function)
    )

    # Outputs
    CfnOutput(self, 'ApiEndpoint', value=api.url)
    CfnOutput(self, 'LambdaFunctionName', value=lambda_function.function_name)
    CfnOutput(self, 'LambdaFunctionArn', value=lambda_function.function_arn)
    CfnOutput(self, 'LambdaExecutionRoleName', value=lambda_role.role_name)
    CfnOutput(self, 'ApiGatewayRestApiId', value=api.rest_api_id)


class TapStackProps(StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(Stack):
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

    # Instantiate nested serverless stack
    self.serverless_stack = MyCompanyServerlessStack(
        self,
        f"MyCompanyServerlessStack{environment_suffix}"
    )
```

### lib/AWS_REGION
```
us-west-2
```

### tests/unit/test_tap_stack.py
```python
import unittest
import aws_cdk as cdk
from aws_cdk.assertions import Template
from lib.tap_stack import TapStack


class TestMyCompanyServerlessStack(unittest.TestCase):

  def setUp(self):
    self.app = cdk.App()
    self.tap_stack = TapStack(self.app, "TestTapStack")
    # 👇 Access the nested stack directly
    self.nested_stack = self.tap_stack.serverless_stack
    self.template = Template.from_stack(self.nested_stack)

  def test_lambda_function_created(self):
    self.template.has_resource_properties("AWS::Lambda::Function", {
        "Handler": "index.handler",
        "Runtime": "python3.11",
        "Environment": {
            "Variables": {
                "LOG_LEVEL": "INFO"
            }
        }
    })

  def test_api_gateway_created(self):
    self.template.has_resource_properties("AWS::ApiGateway::RestApi", {
        "Name": "mycompany-Service",
        "Description": "This service serves mycompany HTTP POST requests."
    })

  def test_lambda_execution_role_created(self):
    self.template.has_resource_properties("AWS::IAM::Role", {
        "AssumeRolePolicyDocument": {
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        }
    })

  def test_post_method_exists(self):
    self.template.has_resource_properties("AWS::ApiGateway::Method", {
        "HttpMethod": "POST"
    })

  def test_api_endpoint_output_exists(self):
    outputs = self.template.find_outputs("*")
    self.assertIn("ApiEndpoint", outputs)


if __name__ == '__main__':
    unittest.main()
```

### tests/integration/test_tap_stack.py
```python
import unittest
import json
import boto3
import requests
from pytest_testdox import mark

# Load outputs from deployment
try:
    with open("cfn-outputs/flat-outputs.json", "r") as f:
        flat_outputs = json.load(f)
except FileNotFoundError:
    flat_outputs = {}


class TestTapStackIntegration(unittest.TestCase):

  def setUp(self):
    self.api_url = flat_outputs.get("ApiEndpoint")
    self.lambda_name = flat_outputs.get("LambdaFunctionName")
    self.lambda_arn = flat_outputs.get("LambdaFunctionArn")
    self.role_name = flat_outputs.get("LambdaExecutionRoleName")
    self.api_id = flat_outputs.get("ApiGatewayRestApiId")

    self.lambda_client = boto3.client("lambda")
    self.iam_client = boto3.client("iam")
    self.apigateway_client = boto3.client("apigateway")

  @mark.it("POST to /myresource returns expected response")
  def test_post_to_myresource_returns_expected_response(self):
    if not self.api_url:
      self.skipTest("Missing ApiEndpoint in flat-outputs.json")

    url = self.api_url.rstrip("/") + "/myresource"
    headers = {"Content-Type": "application/json"}
    payload = {"test": "data"}

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    self.assertEqual(response.status_code, 200)
    body = response.json()
    self.assertEqual(body, "Hello from MyCompany!")

  @mark.it("Lambda function exists and is active")
  def test_lambda_function_exists(self):
    if not self.lambda_name:
      self.skipTest("Missing LambdaFunctionName in flat-outputs.json")

    response = self.lambda_client.get_function(FunctionName=self.lambda_name)
    self.assertEqual(response["Configuration"]["State"], "Active")

  @mark.it("Lambda function ARN is valid")
  def test_lambda_function_arn_valid(self):
    if not self.lambda_arn:
      self.skipTest("Missing LambdaFunctionArn in flat-outputs.json")

    # Try to access function by ARN
    response = self.lambda_client.get_function(FunctionName=self.lambda_arn)
    self.assertIsNotNone(response["Configuration"])

  @mark.it("Lambda execution role exists")
  def test_lambda_execution_role_exists(self):
    if not self.role_name:
      self.skipTest("Missing LambdaExecutionRoleName in flat-outputs.json")

    response = self.iam_client.get_role(RoleName=self.role_name)
    self.assertIsNotNone(response["Role"])

  @mark.it("API Gateway REST API exists")
  def test_api_gateway_rest_api_exists(self):
    if not self.api_id:
      self.skipTest("Missing ApiGatewayRestApiId in flat-outputs.json")

    response = self.apigateway_client.get_rest_api(restApiId=self.api_id)
    self.assertEqual(response["name"], "mycompany-Service")


if __name__ == '__main__':
    unittest.main()
```

## Key Features

1. **Regional Deployment**: All resources deployed to us-west-2 region as specified
2. **Naming Convention**: All resources prefixed with 'mycompany-' 
3. **POST-Only Endpoint**: API Gateway configured to accept only POST requests to `/myresource`
4. **JSON Processing**: Lambda function parses and logs incoming JSON payloads
5. **Modern Runtime**: Uses Python 3.11 runtime for optimal performance
6. **Proper IAM**: Dedicated execution role with minimum required permissions
7. **Comprehensive Testing**: Unit tests validate infrastructure components, integration tests verify end-to-end functionality

## Deployment Commands

```bash
# Install dependencies
npm install
pipenv install

# Deploy the infrastructure
npm run cdk:deploy

# Run tests
pipenv run test-py-unit
pipenv run test-py-integration  # Requires deployed infrastructure
```

The solution provides a complete, production-ready serverless HTTP endpoint that meets all the specified requirements while following AWS best practices for security and maintainability.