You are an AWS CloudFormation expert.

Create a production-ready CloudFormation YAML template that provisions a serverless API stack.

I need two Lambda functions that handle different HTTP methods. The first Lambda should respond to GET requests and the second to POST requests. Both functions need to connect to a shared DynamoDB table where they can read and write request data.

Set up an API Gateway REST API that routes incoming HTTP requests to the appropriate Lambda function using proxy integration. When a client hits the /requests endpoint with a GET, the API Gateway should invoke the first Lambda. When they POST to the same endpoint, it should invoke the second Lambda.

For the DynamoDB table, use on-demand billing mode since traffic will be variable. The Lambdas need permission to perform PutItem, GetItem, UpdateItem, and Query operations on this table.

Create an IAM execution role for the Lambda functions with least privilege permissions - just what they need for CloudWatch Logs and DynamoDB access.

Use CloudFormation parameters so I can customize the environment suffix for different deployments like dev, staging, or prod. Also let me specify the Lambda runtime and table name through parameters.

Make sure all resource names include the environment suffix so I can deploy multiple stacks to the same account without naming conflicts. Use Sub, Ref, and other intrinsic functions for dynamic naming.

The template should output the API endpoint URL, both Lambda function ARNs, the DynamoDB table name and ARN, and the IAM role name.
