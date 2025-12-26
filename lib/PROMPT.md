I need a fully serverless backend for a mobile app that will manage user profiles. Please design this as an AWS CloudFormation template. The stack should include:

    •	API Gateway REST API as the entry point
    •	Lambda functions using Python 3.9 to handle CRUD operations for user profiles
    •	DynamoDB as the data store, with auto-scaling enabled for cost efficiency
    •	IAM roles and policies to enforce secure access between components
    •	CloudWatch for logging, monitoring, and usage metrics
    •	AWS Systems Manager Parameter Store to keep configuration values

The flow should work like this: API Gateway receives requests and triggers Lambda functions, which read/write to DynamoDB. Lambda should have IAM permissions to access DynamoDB and Systems Manager. CloudWatch logs capture all Lambda execution logs and API Gateway access logs.

The solution should focus on security, low cost, and fast deployment. Please provide a single, well-structured CloudFormation YAML file.
