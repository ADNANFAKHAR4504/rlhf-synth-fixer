
Hey there! I need your help setting up a serverless infrastructure on AWS using AWS CDK with Python(main.py single-stack). Here's the deal: I want to deploy a Lambda function that gets triggered by an API Gateway REST API. The Lambda function should be able to write data into an S3 bucket, and the bucket needs to have versioning enabled to keep track of changes.

Everything should be set up in the `us-west-2` region, and I want to make sure all resources are tagged properly for cost tracking. The Lambda function should use environment variables to configure its runtime behavior, and logging should be enabled for both the API Gateway and the Lambda function so we can monitor what's happening.

For permissions, the Lambda function should have an IAM role that allows it to write to the S3 bucket, and I want to make sure we're following AWS best practices for naming and security. Also, it would be great if we could use some dynamic values with CloudFormation intrinsic functions to make the setup more flexible.

Can you create the CDK code for this? It should include everything I mentioned and be ready to deploy. Thanks!