## Prompt

You are an AWS Cloud Engineer specializing in secure, serverless architectures. Your task is to implement the following requirements using AWS CDK in **TypeScript**, following modern AWS and TypeScript best practices.

## Instructions

* **Requirements Analysis:**
Carefully review the problem statement and constraints to ensure all security, automation, and output requirements are met.
* **AWS CDK Implementation:**

* Use AWS CDK (TypeScript) to define the stack.
* Use the following file structure:

* `bin/tap.ts`: CDK app entry point.
* `lib/tap-stack.ts`: CDK stack definition containing all AWS resources.
* `cdk.json`: CDK project configuration.
* Your stack must include:

1. A Lambda function that handles HTTP requests via API Gateway (REST API or HTTP API).
2. An S3 bucket encrypted with AWS KMS, for data processed by the Lambda function.
3. IAM roles with **minimal permissions** for Lambda to run, write to CloudWatch Logs, and interact with the S3 bucket.
4. Lambda must log all requests and responses to CloudWatch Logs.
5. All resources must be created in the `us-east-1` region.
6. CloudFormation stack outputs for the API Gateway URL, Lambda function ARN, and S3 bucket name.
* **Security:**

* Adhere to AWS security best practices, including least-privilege IAM, secure resource policies, and KMS encryption for S3.
* **Output:**

* The stack must be functional and all outputs easily retrievable from the deployed stack.
* Code should be clean, modular, and deployable via `cdk deploy`.

## Summary

Deliver an AWS CDK (TypeScript) project that:

* Provisions a Lambda function, triggered via API Gateway.
* Logs all invocations and responses to CloudWatch.
* Creates a KMS-encrypted S3 bucket for Lambda data.
* Attaches minimal IAM roles to Lambda.
* Deploys all resources in `us-east-1`.
* Provides CloudFormation outputs for:

* API Gateway URL
* Lambda function ARN
* S3 bucket name
* Uses the following three files: `bin/tap.ts`, `lib/tap-stack.ts`, `cdk.json`.

## Output Format

* Output the **complete contents** for the following files:

1. `bin/tap.ts`
2. `lib/tap-stack.ts`
3. `cdk.json`
* **Do not** include explanations, comments, or extra text**only the code** for each file.
