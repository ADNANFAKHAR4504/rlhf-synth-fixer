# Build a Serverless API with CloudFormation

I need help building a serverless web API that can handle variable traffic loads. The main components should be an API Gateway that connects to a Lambda function, with a DynamoDB table for data storage.

Here's what I'm trying to accomplish:

I want to create a REST API that can handle multiple types of requests like GET, POST, PUT, and DELETE. The Lambda function needs to be able to read from and write to a DynamoDB table. Since I don't know how much traffic this will get, I'd prefer using DynamoDB's on-demand billing so I don't have to guess at capacity.

For security, I need the Lambda to get sensitive config through environment variables rather than hardcoding anything. The function should only have the minimum permissions it needs to work with DynamoDB.

I'd like to set up proper logging through CloudWatch so I can troubleshoot issues when they come up. Also, I want to use API Gateway stage variables so I can easily switch between dev and production configurations.

The API needs to support CORS since I'll be calling it from a web browser. For reliability, I want the setup to work even if one availability zone has problems.

I'd like to store API Gateway access logs in an S3 bucket for auditing. And I want to use Lambda versioning so I can safely roll out updates without breaking production.

Since this is a serverless application, I think AWS SAM would make the CloudFormation template easier to write and maintain. I'd also like X-Ray tracing enabled so I can see how requests flow through the system and identify any performance bottlenecks.

This should all be deployed to us-west-2, and I prefer using a naming pattern like projectName-environment-resourceType to keep things organized.

Could you create a CloudFormation YAML template called 'serverless-infrastructure.yml' that sets up this architecture? I'm specifically looking for:
- Lambda function with Node.js or Python runtime
- API Gateway REST API with CORS support
- DynamoDB table with on-demand capacity
- Proper IAM roles and policies
- CloudWatch logging
- API Gateway stage variables
- S3 bucket for access logs
- Lambda versioning and aliases
- X-Ray integration
- Everything configured using AWS SAM