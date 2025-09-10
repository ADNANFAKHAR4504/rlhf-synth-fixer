Hey there! We need to set up a serverless backend using AWS services, and the goal is to define everything using AWS CDK with Python (main.py - single stack). The infrastructure should include Lambda functions for compute, an API Gateway to expose HTTP endpoints, and DynamoDB as the database layer. All of this should be deployed in the `us-west-2` region.

The Lambda functions need to interact with the DynamoDB tables, so make sure they have the right permissions. Also, the API Gateway should be secured with a custom domain and usage plans to enforce rate limiting. For security, let's stick to the principle of least privilege when setting up IAM roles.

We also want to ensure high availability, so the resources should be deployed within a VPC that spans at least two availability zones. Logging is important too—both the Lambda functions and API Gateway requests should log to CloudWatch. For the Lambda functions, set a memory limit of 512MB and enable CloudWatch alarms to monitor errors.

The DynamoDB tables should have auto-scaling enabled, with a minimum read and write capacity of 5 units each. Lastly, we’ll use an S3 bucket to store any static assets needed by the Lambda functions.

The output should be a Python-based AWS CDK stack that can be deployed without errors. It should create all the resources while adhering to these constraints. Let me know if you need any additional details!