To achieve a secure, highly available multi-region serverless deployment using AWS CDK (Python), follow the implementation below. This solution includes AWS Lambda, API Gateway, and IAM roles with best practices.

Step 1: Initialize CDK Project
cdk init app --language python
cd app
Step 2: Install Required Packages
pip install aws-cdk-lib aws-cdk.aws-lambda aws-cdk.aws-apigateway aws-cdk.aws-iam
Step 3: Define the CDK Stack
Create a file multi_region_stack.py in the app/multi_region_stack directory:

from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_iam as iam,
    Stack,
    CfnOutput,
    Environment
)
from constructs import Construct

class MultiRegionStack(Stack):

    def __init__(self, scope: Construct, id: str, region: str, **kwargs) -> None:
        super().__init__(scope, id, env=Environment(region=region), **kwargs)

        # Define Lambda Execution Role
        lambda_role = iam.Role(self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Define Lambda Function
        lambda_function = _lambda.Function(self, "MyLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role
        )

        # Define API Gateway
        api = apigateway.RestApi(self, "MyApiGateway",
            rest_api_name="MultiRegionService",
            description="API Gateway for multi-region Lambda deployment",
            deploy_options=apigateway.StageOptions(stage_name="prod")
        )

        integration = apigateway.LambdaIntegration(lambda_function)

        resource = api.root.add_resource("myresource")
        resource.add_method("GET", integration)

        # Output the API Endpoint
        CfnOutput(self, "ApiEndpoint", value=api.url)
Step 4: Define the CDK App
Modify app.py to deploy the stack in multiple regions:

#!/usr/bin/env python3

import aws_cdk as cdk
from multi_region_stack.multi_region_stack import MultiRegionStack

app = cdk.App()

regions = ["us-east-1", "us-west-2", "eu-west-1"]

for region in regions:
    MultiRegionStack(app, f"MultiRegionStack-{region}", region=region)

app.synth()
Step 5: Create Lambda Function Code
Create a directory lambda and add a file index.py:

def handler(event, context):
    return {
        "statusCode": 200,
        "body": "Hello from Lambda in region: " + context.invoked_function_arn.split(":")[3]
    }
Step 6: Deploy the Stack
cdk deploy --all
Explanation
Multi-Region Deployment: The CDK app iterates over a list of regions and deploys the stack in each.
Lambda Function: Each Lambda function is deployed with a basic execution role, adhering to the principle of least privilege.
API Gateway: A RESTful API is configured to route requests to the Lambda function.
IAM Roles: The Lambda function uses a managed policy for basic execution, ensuring it has only necessary permissions.
This solution is modular, reusable, and region-configurable, adhering to AWS best practices for high availability and security.