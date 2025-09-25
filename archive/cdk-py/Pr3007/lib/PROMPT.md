Hey there! We need to design and implement a serverless application architecture using AWS CDK with Python (main.py - single stack). The architecture should include AWS Lambda, API Gateway, and DynamoDB, and it needs to meet some specific requirements.

First, we’ll create a REST API using API Gateway to trigger Lambda functions. The Lambda functions should be written in Python 3.8, with a timeout of 15 seconds. One of the Lambda functions will handle API requests, while another will be triggered by DynamoDB Streams whenever data in the table is modified. The DynamoDB table should have a primary partition key named `id` (of type string), and we’ll enable DynamoDB Streams for the table.

For security, we’ll use AWS KMS to encrypt sensitive environment variables in the Lambda functions. The environment variables should include `STAGE`, which will be set to `EnvironmentSuffix`. We also need to ensure that all necessary IAM roles and policies are in place to securely execute the Lambda functions.

The API Gateway should have caching enabled with a minimum TTL of 30 seconds, and it must support CORS for requests from `https://example.com`. Additionally, we’ll set up CloudWatch alarms to monitor Lambda function errors and API Gateway 4XX/5XX errors. All API requests should be logged to CloudWatch, with logs dynamically created per function.

Finally, the entire stack should be deployable in the `us-west-2` region, and the CloudFormation stack should support rollback in case of deployment failure.
