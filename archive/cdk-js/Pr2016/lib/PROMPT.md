Build a Serverless Notification Service with AWS CDK

Role: AWS CDK Developer working with JavaScript for serverless architectures.

Objective: Create a production-ready AWS CDK stack that deploys a serverless processing workflow in US East 1 region. All resources must follow least privilege security principles.

Scenario: Build a backend process that handles async tasks. When tasks complete, save results to secure storage and notify downstream systems. Must be reliable, scalable, and production-ready.

Infrastructure Requirements:

1. SNS Topic - receives completion notifications from Lambda function

2. S3 Bucket - private bucket for Lambda to store output files and task results

3. Lambda Function - Python runtime with placeholder handler code
   Environment variables needed: S3 bucket name and SNS Topic ARN

4. IAM Permissions - dedicated role for Lambda function using CDK grant methods:
   Use s3Bucket.grantWrite(lambdaFunction) for S3 write access
   Use snsTopic.grantPublish(lambdaFunction) for SNS publish access
   No wildcards - strict least privilege

5. Resource Tagging - apply to entire stack:
   Environment: production
   Department: IT

Output: Complete AWS CDK JavaScript project focused on code implementation
