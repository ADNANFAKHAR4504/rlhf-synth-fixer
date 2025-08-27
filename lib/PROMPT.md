I'm working on a serverless project for my company and need help setting up the infrastructure using AWS CDK with Java. We're building an event-driven system that processes files uploaded to S3, and I'm struggling with getting all the components to work together properly.

Here's what I'm trying to accomplish: I need a Lambda function that gets triggered whenever someone uploads a file to our S3 bucket. The Lambda function should be written in Python since that's what our team is most comfortable with, and I'd like to use the newer Python 3.13 runtime that AWS released recently - I heard it has some nice performance improvements.

The Lambda function needs to do two main things. First, it should write log messages to CloudWatch Logs so we can monitor what's happening. Second, it should publish a message to an SNS topic to notify other parts of our system about the file upload.

I'm also concerned about reliability. What happens if the Lambda function fails for some reason? I want to make sure we don't lose any events, so I need to set up a dead-letter queue using SQS to capture any failures. This way we can retry processing later or at least investigate what went wrong.

For the S3 bucket, we need it to be secure with server-side encryption using AES-256. We also need versioning enabled because sometimes people accidentally overwrite files, and we want to be able to recover previous versions.

The tricky part for me is getting all the IAM permissions right. The Lambda function needs to read from the S3 bucket, write to CloudWatch Logs, publish to the SNS topic, and send messages to the dead-letter queue when things go wrong. I always struggle with the principle of least privilege - I want to give just enough permissions but not too much.

Everything needs to be deployed in the us-west-2 region, and we tag all our resources with Environment=Production for cost tracking purposes. Our deployment process creates stack names with a "Prod" suffix, so the main stack should be called TapStackProd.

Can you help me create a complete CDK Java implementation that handles all of this? I need the code to be well-structured with proper imports and comments, and I want to make sure I can test that everything works correctly by having outputs for the key resource identifiers like the Lambda function ARN, S3 bucket name, SNS topic ARN, and SQS queue URL.

I'm hoping to get this working soon because we have a demo next week, and this is a critical piece of our architecture. Any help would be really appreciated!