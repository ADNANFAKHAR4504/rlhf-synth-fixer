You’ve been asked to build a production-grade serverless setup on AWS,you’ll use the AWS CDK in Python to define and deploy the entire stack (main.py - single stack). The goal is to create a clean, maintainable, and scalable serverless environment that can easily be redeployed across environments while following AWS best practices for security and observability.

Your application’s backend should be powered entirely by **AWS Lambda**, with each function triggered through an **API Gateway** endpoint that serves as the main HTTP interface. These Lambda functions should be configured with appropriate environment variables, and all sensitive configurations need to be encrypted using **AWS KMS**. Make sure the Lambda deployment includes proper versioning and an automated update mechanism so you can roll out new versions seamlessly.

Data persistence will be handled by **DynamoDB**, which should have **auto-scaling** enabled for both read and write capacities. The table must be encrypted at rest using KMS and follow the least-privilege model for IAM permissions — meaning your Lambda functions should only have access to the resources they actually need.

All Lambda function code should be stored in an **S3 bucket** with versioning enabled. This bucket will act as the source for your Lambda deployments. Configure access policies so it remains private but still accessible to the services that need it.

You’ll also need to ensure that the application is observable and production-ready. Enable **CloudWatch logging** for both API Gateway and Lambda, and set up a **CloudWatch Metrics Dashboard** to monitor things like API latency, error rates, and Lambda invocation counts. Use clear, meaningful log group names and make sure Lambda errors are captured correctly for debugging and alerting.

Throughout your CDK code, make use of AWS intrinsic-like references (`Ref`, `GetAtt`, etc.) where applicable, and define **CloudFormation outputs** for key values such as the API Gateway endpoint URL or DynamoDB table name so they can be easily retrieved post-deployment. Explicitly manage resource dependencies in your constructs to make sure deployment order is clear and stable.

By the end, your Python CDK app should synthesize to a CloudFormation template that deploys cleanly, without manual intervention, and represents a secure, fully functional serverless backend with logging, scaling, and encryption all built in. Think of it as a real production setup — not a demo — that your DevOps team could deploy confidently and maintain long-term.
