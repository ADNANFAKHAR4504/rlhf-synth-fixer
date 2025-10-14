I want you to build a complete serverless web application using the AWS CDK in Python (main.py - single stack), and I’d like the whole setup to be production-ready but still simple enough to follow. The core of the system should rely on AWS Lambda for all backend logic, which will be exposed through Amazon API Gateway as HTTP endpoints. I want to handle basic web requests this way — so when users hit an endpoint, it triggers the Lambda function that processes the request and interacts with the database.

For data storage, use DynamoDB as the main backend database. Configure the table to have both read and write capacity units that make sense for a development setup, but also enable automatic scaling so that it can handle variable traffic loads without manual adjustments.

All logs from the Lambda functions should go into CloudWatch Logs, and you can wire them up so it’s easy to monitor and troubleshoot. The application should also have an S3 bucket where we’ll store static content like HTML, images, or configuration files. Make sure the bucket is secured but still functional for serving application assets.

The final output should be a single Python CDK stack that defines this entire serverless setup and can deploy cleanly without requiring manual tweaks after deployment.

