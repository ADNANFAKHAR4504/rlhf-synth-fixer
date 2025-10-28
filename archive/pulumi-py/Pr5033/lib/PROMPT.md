Hey, can you create a modular Pulumi Python solution to build a serverless infrastructure with the following features?

- An S3 bucket with server-side encryption using AWS managed keys for storing files.
- An AWS Lambda function that processes these files upon upload, equipped with error handling that retries up to 2 times and times out after 3 minutes.
- An SNS topic that sends notifications based on Lambda execution results.
- An API Gateway configured to trigger the Lambda function through a RESTful API endpoint.

Make sure your Pulumi Python code:

- Deploys everything in the us-east-1 region.
- Tags all resources with 'Environment: Production'.
- Implements IAM roles with the least privilege so Lambda can access the S3 bucket securely.
- Uses CloudWatch to monitor Lambda and SNS, setting alarms if error rates exceed 5%.
- Includes stack policies to prevent accidental deletion of critical resources.
- Uses AWS Free Tier resources wherever possible.
- Is modular and well-structured for maintainability and easy updates.
- Handles deployment timings efficiently to keep stack creation and updates under 15 minutes.

If you'd like, I can share Pulumi Python examples for IAM policies, monitoring, and setting up event triggers.
