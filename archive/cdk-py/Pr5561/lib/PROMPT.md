I’m working on a project where I need to design a fully serverless architecture using AWS CDK in Python (main.py - single stack). The goal is to build an event-driven data processing system that’s efficient, secure, and production-ready.

Here’s the general idea:
Incoming data will be processed using AWS Lambda functions, so I want the Lambda setup to be modular, written in Python, and easy to maintain and test. These functions should be triggered through API Gateway HTTP requests, and the API itself needs to be protected with a Cognito User Pool for authentication.

For data storage, I’ll use DynamoDB, and I need to manage its read/write capacity explicitly — not just leave it on on-demand mode. I also want an S3 bucket where input data can be staged before processing, but that bucket should have tightly controlled policies so it’s not publicly accessible.

Monitoring and observability are important too — CloudWatch Logs should be enabled for every Lambda, and I’d like to include AWS X-Ray tracing to follow requests through the system end-to-end.

Finally, there should be environment-based configurations, so the same CDK app can be deployed cleanly to both development and production using different settings.

Can you write the AWS CDK (Python) implementation that sets up this full infrastructure — including the Lambda functions, API Gateway, DynamoDB, Cognito, S3, CloudWatch, X-Ray— following these requirements?