Hey there! I need your help designing and implementing a serverless infrastructure using AWS CDK with Python(main.py- single stack). The goal is to automate the processing of files uploaded into an S3 bucket. Here's what I have in mind:

First, we need an S3 bucket that triggers a Lambda function whenever a new file is uploaded. The Lambda function should read the file, process it by appending a timestamp, and log the details to CloudWatch. For security, the Lambda function should have the necessary IAM role and policies to access the S3 bucket and write logs to CloudWatch.

The S3 bucket should have versioning enabled to protect against accidental overwrites, and we should also set up a lifecycle policy to move objects to Glacier after 30 days. Oh, and don’t forget to enable server-side encryption (AES-256) for the bucket.

For notifications, it would be great to configure an SNS topic that sends an email whenever the Lambda function successfully processes a file. Also, let’s make sure the Lambda function has a timeout of 10 seconds to avoid hanging executions. To handle errors, we should configure a Dead Letter Queue (DLQ) using SQS.

Everything should follow AWS best practices, like using the principle of least privilege for IAM roles, and all resources should be created in the `us-west-2` region. Also, let’s make sure we tag all the resources properly for easy auditing.

Finally, use CloudFormation intrinsic functions wherever necessary to handle dynamic values and references between resources. The output should be a fully functional AWS CDK Python implementation that meets all these requirements.
