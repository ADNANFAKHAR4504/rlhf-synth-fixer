## Serverless Application Requirements

Create a CloudFormation template in YAML for a serverless application using AWS Lambda and API Gateway.

### Core Requirements

Use AWS SAM to define Lambda functions and API Gateway integration. The Lambda functions need environment variables and proper IAM permissions to access DynamoDB.

Set up API Gateway with these routes:
- POST `/user` → CreateUserFunction Lambda  
- GET `/user/{id}` → GetUserFunction Lambda

### Infrastructure Details

Deploy to us-east-1 region with environment-specific configurations. Include monitoring and logging for all components. Tag all resources with 'Project:ServerlessApp' and implement versioning support for rollbacks and CodePipeline deployment.

The template must validate successfully as a CloudFormation YAML file.
