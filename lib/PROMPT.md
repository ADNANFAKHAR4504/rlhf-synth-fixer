I need a serverless backend for my mobile app to manage user profiles. Can you create a CloudFormation template that sets this up?

Here's what I need:

API Gateway should act as the entry point and connect to Lambda functions for handling user operations - create, read, update, delete, and list users. These Lambda functions need to be written in Python 3.9 and should connect to DynamoDB for storing the user data.

The DynamoDB table should have auto-scaling enabled to keep costs down. I also need IAM roles configured so Lambda can securely access DynamoDB and write logs to CloudWatch.

For monitoring, hook up CloudWatch Logs to capture function outputs and track API usage. Also, store configuration values in Systems Manager Parameter Store so the Lambda functions can reference things like table names.

The whole setup should be secure, cost-efficient, and quick to deploy. Just give me a single CloudFormation YAML file that I can deploy directly.
