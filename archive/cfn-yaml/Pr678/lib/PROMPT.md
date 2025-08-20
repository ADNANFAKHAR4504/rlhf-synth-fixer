Claude Sonnet-Optimized Prompt Template
Prompt Format: Uses structured instruction + constraints + evaluation format

System Instruction (Implicit via formatting):

You are an expert in AWS infrastructure as code (IaC). You will write production-grade AWS CloudFormation YAML templates following best practices for security, naming, permissions, and modularity.

Prompt
Task:
Design a complete, production-ready AWS CloudFormation template in YAML format that defines a secure and scalable serverless application architecture. The architecture should include:

API Gateway (HTTP) that acts as the public-facing interface to accept and route HTTP requests.

An AWS Lambda function written in Python or Node.js, triggered by API Gateway upon incoming HTTP requests.

A DynamoDB table that stores application data, with the Lambda function granted read and write access.

IAM roles that follow the principle of least privilege, allowing:

API Gateway to invoke the Lambda function.

Lambda to perform GetItem, PutItem, UpdateItem, and DeleteItem operations on the DynamoDB table only.

Constraints:

Use logical names that clearly reflect each resources function (e.g., AppLambdaFunction, AppDynamoTable, ApiGatewayRole).

The Lambda function must be deployed using AWS::Serverless::Function or equivalent if using SAM transform.

Use AWS-managed policies only if absolutely necessary. Custom policies should tightly scope actions and resources.

Define necessary outputs (e.g., API endpoint, Lambda ARN, DynamoDB Table name).

The stack must be deployable in the us-east-1 region.

Follow YAML syntax strictly for CloudFormation (version 2010-09-09).

Use CloudFormations intrinsic functions like !Ref, !Sub, and !GetAtt appropriately.

Evaluation:

The CloudFormation template must pass cfn-lint.

The template should deploy successfully in an actual AWS environment (us-east-1).

API endpoint should be functional and allow CRUD operations using the Lambda-DynamoDB backend.

IAM roles should grant minimum privileges for the required operationsnothing more.