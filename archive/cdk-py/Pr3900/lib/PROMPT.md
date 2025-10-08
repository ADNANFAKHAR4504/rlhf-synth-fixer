You’re working on designing a complete serverless application on AWS, but this time you’ll be building it using the AWS CDK in Python (main.py - single stack)

At the heart of your setup is a **Lambda function** that handles all backend execution. This function needs to be deployed with **automatic versioning**, have its **environment variables encrypted** with **KMS**, and securely reference secrets from **AWS Secrets Manager** for sensitive values.

The Lambda function will be exposed through an **API Gateway**, which should have **CORS enabled**, proper **request validation**, and even a **custom domain name configuration** for clean, production-level endpoints. The API should integrate directly with Lambda and export the **endpoint URL** through CDK outputs so it can be easily referenced later.

For persistence, use a **DynamoDB table** to handle data storage, configured with specific read and write capacity units. You’ll also need to set up an **S3 bucket** to store deployment artifacts—make sure it’s private and properly tagged according to company standards.

IAM roles are another key piece — you should define minimal, tightly scoped permissions that allow the Lambda function and API Gateway to do their jobs securely. Everything should follow the **least privilege principle**.

Make sure the stack includes **CloudWatch logging** for both Lambda and API Gateway, and **auto-scaling** for the Lambda function based on usage metrics. To make it more robust, include **retries with exponential backoff** in case of transient Lambda execution failures.

Your CDK app should use **environment-specific parameters**, making it easy to deploy across multiple AWS accounts or environments without rewriting code. Add sensible tagging across all resources for easy cost tracking and governance, and enforce **stack policies** to prevent accidental resource deletions.

When you’re done, your final CDK stack should represent all of this in a clean, maintainable Python structure that can synthesize into CloudFormation and deploy without errors. It should follow AWS best practices for security, observability, and maintainability — basically, a fully production-grade serverless setup defined entirely in Python CDK code.