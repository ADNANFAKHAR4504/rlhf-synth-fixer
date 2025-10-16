I want to set up a fully serverless backend on AWS using the AWS CDK in Python (main.py - single stack). The goal is to define the entire infrastructure as code — Lambda functions, API Gateway, and DynamoDB 

The core of this system will be a few Lambda functions written in Python that handle basic CRUD operations on a DynamoDB table. These functions should be exposed through an API Gateway REST API, where each HTTP endpoint maps to the corresponding Lambda operation. For example, one endpoint might create items, another might retrieve them, and so on.

The DynamoDB table should have defined read and write capacities, and the design should make it easy to add more endpoints or functions in the future if the application expands. Make sure all functions use environment variables for configurations — things like table names, region, or any other setting that might vary by environment.

IAM roles need to be tightly scoped — give each Lambda only the permissions it absolutely needs to perform its job, nothing more. And since this is a production-grade setup, proper logging and monitoring are essential. Every Lambda should send logs to CloudWatch, and the infrastructure should be easy to observe and debug when issues occur.

The whole solution should be built as a CDK stack in Python — no manual configuration. When deployed, it should spin up the DynamoDB table, the Lambda functions, and the API Gateway endpoints automatically, fully wired together. Each function should include some basic error handling, ensuring that failures are logged clearly in CloudWatch.

