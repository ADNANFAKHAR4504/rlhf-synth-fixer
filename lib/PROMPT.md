I want to build a serverless application on AWS using the CDK in Python (main.py - single stack) that sets up a complete stack including a Lambda function, an API Gateway, and a DynamoDB table. The Lambda function should be written in Python and handle full CRUD operations against the DynamoDB table. Everything — the Lambda, the API Gateway, the database, and all IAM permissions — should be provisioned automatically through the CDK stack.

Make sure the Lambda has permission to interact directly with DynamoDB and that it uses environment variables for configuration, like table name or environment type. The CDK stack should include parameters that make it easy to switch between environments, so I can deploy it in different setups without changing the code. Logs for the Lambda should go to CloudWatch, and there should be proper error handling and retry logic built into the function so that failures are visible and recoverable.

The API Gateway should expose the Lambda through standard HTTP routes for create, read, update, and delete operations, and CORS needs to be configured so web clients can access it easily. 

The DynamoDB table should come pre-populated with a small set of sample data when the stack is created, just enough to test the API quickly. I’d also like a simple test suite included to validate that the Lambda and API integration work as expected after deployment.

Finally, follow AWS best practices in your design — apply least-privilege IAM roles, ensure good observability through CloudWatch, and keep the structure clean and extensible. The output should be a working AWS CDK Python project that deploys this full architecture end to end 
