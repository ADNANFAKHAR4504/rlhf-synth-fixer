Prompt for CDK (TypeScript, Project Structure: bin/tap.ts, lib/tapstack.ts, test/)

You are an AWS CDK (TypeScript) generator.
My project structure is:

tap-infrastructure/
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   └── ...


I want you to generate TypeScript AWS CDK code inside this structure that creates the following secure and scalable architecture:

Amazon S3 Bucket

Server-side encryption using KMS CMK (Customer Managed Key).

Bucket versioning enabled.

Resource policy restricting access only to specific IAM roles & users.

IAM Role

Permissions:

Read/write access to the S3 bucket.

Write access to CloudWatch Logs.

This role will be assumed by a Lambda function.

AWS Lambda Function

Triggered by S3 object uploads.

Logs all activities to CloudWatch Logs.

Runs inside a VPC.

Environment variables are fetched securely from SSM Parameter Store.

Resource policy so that only specific principals can invoke it.

VPC

At least two subnets in different Availability Zones.

AWS Systems Manager Parameter Store

Store sensitive environment variables for the Lambda function (e.g., DB credentials, API keys).

Amazon CloudFront Distribution

Uses the S3 bucket as the origin.

Custom domain with SSL certificate provisioned from AWS Certificate Manager (ACM).

Security Best Practices

All IAM policies scoped to least privilege.

Resource-level permissions for Lambda invoke and S3 bucket access.

Outputs should include ARNs of resources (S3 bucket, Lambda function, IAM role, CloudFront distribution, KMS key) for auditing.

Requirements for Output:

Implement everything in CDK TypeScript following the project structure.

Place stack definition in lib/tapstack.ts.

bin/tap.ts should instantiate the stack.

Add basic CDK unit tests under test/.

Use constructs cleanly with comments explaining resources.

Ensure synthesis (cdk synth) produces a valid CloudFormation template.

Final stack must align with AWS best practices for security, scalability, and auditing.