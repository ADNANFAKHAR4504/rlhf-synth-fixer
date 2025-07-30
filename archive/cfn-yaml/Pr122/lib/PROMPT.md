Model prompt below
```
You are an expert AWS Cloud Solutions Architect specializing in serverless infrastructure and Infrastructure as Code (IaC). Your task is to generate a complete AWS CloudFormation template in YAML format. This template will provision all the necessary resources for a simple, serverless greeting API intended for deployment in the us-west-2 region.

Requirements
The CloudFormation template must define the following resources and configurations:

Amazon API Gateway:

An AWS::ApiGateway::RestApi resource to define the API.

An integration with the Lambda function using a GET method.

A deployment resource (AWS::ApiGateway::Deployment) and a stage (AWS::ApiGateway::Stage) to make the API callable.

AWS Lambda Function:

An AWS::Lambda::Function resource using the Python 3.12 runtime.

The function's handler code must be included inline within the YAML template.

The code must read a greeting from an environment variable named GREETING_MESSAGE and return it in a JSON response like {"message": "Your greeting here"}.

Set the GREETING_MESSAGE environment variable to "Hello from a serverless API!".

IAM & Permissions:

An AWS::IAM::Role that the Lambda function will assume (Execution Role).

The role's policy must grant the minimum required permissions for the function to write logs to Amazon CloudWatch Logs.

An AWS::Lambda::Permission resource to explicitly allow API Gateway to invoke the Lambda function.

Logging & Outputs:

An AWS::Logs::LogGroup resource to store the logs for the Lambda function.

An Outputs section in the template that exports the final API Gateway Invoke URL for easy access.

Output Format
Provide only the complete, deployable CloudFormation YAML code in a single block. Do not include any explanations, comments, or conversational text before or after the code.
```