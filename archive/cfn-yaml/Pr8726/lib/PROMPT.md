## Serverless User API

I need a CloudFormation template that sets up a simple serverless API for managing users. Here's what I need:

### How the Services Connect

API Gateway should act as the entry point that receives HTTP requests and directly invokes Lambda functions. When a POST request comes to the /user endpoint, it should trigger CreateUserFunction which receives the user data and writes it to a DynamoDB table. Similarly, when a GET request hits /user with a user ID, it should invoke GetUserFunction which queries DynamoDB and returns the user data.

The Lambda functions need proper IAM permissions so they can actually write to and read from the DynamoDB Users table. CreateUserFunction needs dynamodb:PutItem access and GetUserFunction needs dynamodb:GetItem access. The Lambda execution role should trust the Lambda service.

### What I Need

Build this using AWS SAM with the following components:

- Two Lambda functions that handle user creation and retrieval
- An API Gateway with two routes: POST /user for creating users and GET /user/{id} for fetching user details
- A DynamoDB table called Users with on-demand billing
- Proper IAM roles and policies so Lambda can actually talk to DynamoDB
- CloudWatch logging so I can see what's happening when requests come through

### Deployment and Monitoring

Deploy everything to us-east-1. I want to be able to see API Gateway logs, Lambda execution logs, and DynamoDB activity in CloudWatch. Also need to tag all resources with Project:ServerlessApp for cost tracking and set up versioning so I can roll back if needed.

The template needs to validate as valid CloudFormation YAML.
