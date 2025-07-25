You are an expert AWS infrastructure engineer using the AWS CDK with Python.

Build a reusable AWS infrastructure stack named serverless_demo that can be deployed to any AWS region.
This stack must include one or more AWS Lambda functions, each with the following configuration requirements:
Set an explicit timeout for each Lambda function to prevent unnecessarily long-running executions and reduce cost.
Ensure that all function names and resources are prefixed or tagged with "serverless_demo" for clear identification and separation from other infrastructure.
Design the stack to be modular, parameterizable, and follow AWS CDK best practices.

Use only Python as the CDK language. Avoid hardcoding region-specific values.

In your implementation:
  Include all required IAM roles or permissions the Lambda function may need.
  Ensure the resources are organized and logically grouped within the CDK app structure.
  Provide the full Python CDK code, and make sure the solution is ready to deploy using cdk deploy.