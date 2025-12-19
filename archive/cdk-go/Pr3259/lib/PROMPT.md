# AWS CDK Go Serverless Application

Create a serverless application using AWS CDK with Go. The application should be a simple REST API that handles
requests and interacts with a database.

Here are the specific requirements:

The application must use AWS Lambda with a Python runtime to handle the API logic. 
A DynamoDB table with on-demand capacity mode should be the backend database.
API Gateway should be used to create a public HTTP endpoint that triggers the Lambda function.
The API Gateway needs a CORS configuration to allow requests from all origins.
The Lambda function should have the necessary permissions to write logs to CloudWatch Logs and interact with the
DynamoDB table.
The entire deployment should be region-independent and work in any AWS region without changes.
The Go CDK code should be clean, modular, and follow AWS best practices.

The final output should be the complete Go code for the AWS CDK stack. The code should be well-commented to explain the
different components and their relationships.

Before deployment, I will run cdk synth to generate the CloudFormation template and then use cdk deploy to
provision the resources. I also want to make sure the code is formatted with gofmt and passes all basic linting
checks.
