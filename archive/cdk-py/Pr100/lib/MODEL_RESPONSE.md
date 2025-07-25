To build a reusable AWS infrastructure stack using AWS CDK with Python, follow the steps below. This example includes a single Lambda function, but you can easily extend it to include more functions.

First, ensure you have the AWS CDK installed and initialized in your project. If not, you can set it up using:

npm install -g aws-cdk
cdk init app --language python
Here's the implementation of the serverless_demo stack:

from aws_cdk import (
    aws_lambda as _lambda,
    aws_iam as _iam,
    core
)

class ServerlessDemoStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Define the Lambda execution role
        lambda_role = _iam.Role(self, "LambdaExecutionRole",
            assumed_by=_iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                _iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Define the Lambda function with a timeout and prefixed name
        lambda_function = _lambda.Function(self, "ServerlessDemoFunction",
            runtime=_lambda.Runtime.PYTHON_3_8,
            handler="lambda_handler.handler",
            code=_lambda.Code.from_asset("lambda"),
            timeout=core.Duration.seconds(15),  # Set timeout to 15 seconds
            function_name="serverless_demo_function",
            role=lambda_role,
            environment={
                "LOG_LEVEL": "INFO"
            }
        )

        # Tag the Lambda function for identification
        core.Tags.of(lambda_function).add("Project", "serverless_demo")

app = core.App()
ServerlessDemoStack(app, "ServerlessDemoStack", env={'region': 'us-east-1'})  # Region can be parameterized

app.synth()
Directory Structure
serverless_demo/
├── app.py
├── serverless_demo/
│   ├── __init__.py
│   └── serverless_demo_stack.py
├── lambda/
│   ├── __init__.py
│   └── lambda_handler.py
├── cdk.json
├── requirements.txt
└── setup.py
Lambda Handler (lambda/lambda_handler.py)
def handler(event, context):
    print("Hello from ServerlessDemo Lambda!")
    return {
        'statusCode': 200,
        'body': 'Hello from ServerlessDemo Lambda!'
    }
requirements.txt
aws-cdk.core
aws-cdk.aws-lambda
aws-cdk.aws-iam
setup.py
from setuptools import setup, find_packages

setup(
    name="serverless_demo",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "aws-cdk.core",
        "aws-cdk.aws-lambda",
        "aws-cdk.aws-iam",
    ],
    python_requires=">=3.6",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: JavaScript",
        "Programming Language :: Python :: 3 :: Only",
        "Topic :: Software Development :: Code Generators",
        "Topic :: Utilities",
        "Typing :: Typed",
    ],
)
Deployment
To deploy the stack, use the following commands:

# Install dependencies
pip install -r requirements.txt

# Bootstrap your CDK environment (if you haven't already)
cdk bootstrap

# Deploy the stack
cdk deploy
This implementation follows AWS CDK best practices and ensures that the infrastructure is modular, parameterizable, and ready to deploy to any AWS region. The Lambda function is configured with an explicit timeout and tagged appropriately for identification. The IAM role for the Lambda function includes the basic execution role policy. You can customize the role and policies as needed for your specific use case.