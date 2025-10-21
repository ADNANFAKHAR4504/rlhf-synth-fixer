**Project:** AWS CDK (Python) – Serverless File Upload API

## High-level architecture

Help write an AWS CDK application in **Python (single-stack main.py)** that deploys a secure, scalable, and fully serverless file upload API. The system should consist of an **API Gateway** endpoint, an **AWS Lambda** backend, an **S3 bucket** for file storage, and a **DynamoDB** table for metadata management.

The **API Gateway (REST API)** should expose a single **POST** endpoint `/upload` that triggers a **Lambda function**. The Lambda will handle file uploads and metadata storage. It should run under a least-privilege **IAM role**, granting it access to log events to **CloudWatch**, read/write to **S3**, and perform CRUD operations on **DynamoDB**.

The **S3 bucket** will store uploaded files with **versioning**, **SSE-S3 or KMS encryption**, and **block all public access** enabled. Bucket policies should restrict access so that only the Lambda function can interact with it.

The **DynamoDB table** should be designed with a **primary key (`productId`)** and **sort key (`productName`)**, storing product details such as `productId`, `productName`, and `price`. The table must be encrypted at rest using **AWS KMS**.

The **API Gateway** should enforce a **rate limit of 1000 requests per second**, accepting only **POST** requests with **JSON payloads**. The **Lambda function** should automatically scale based on request load, and securely reference environment variables for the **S3 bucket name** and **DynamoDB table name**.

Enable detailed **CloudWatch logging** for both API Gateway and Lambda, capturing invocation metrics, errors, and latency data. Finally, configure the **CloudFormation stack outputs** to include the **API Gateway URL** and **Lambda function ARN** for reference.

## Functional requirements

1. **API Gateway**
   - REST API with one POST endpoint (`/upload`).
   - Enforce rate limiting (1000 RPS) and request validation for JSON payloads.
   - Enable CloudWatch logging and metrics for API usage.

2. **Lambda Function**
   - Written in Python 3.9, triggered by API Gateway.
   - Handles file upload and metadata persistence.
   - Environment variables store S3 bucket name and DynamoDB table name.
   - IAM role grants minimal permissions (S3, DynamoDB, CloudWatch).
   - Auto-scales based on traffic.

3. **S3 Bucket**
   - Versioning and server-side encryption (SSE-S3 or KMS).
   - Block all public access.
   - Access restricted to the Lambda role via bucket policy.

4. **DynamoDB Table**
   - Primary key: `productId`; Sort key: `productName`.
   - Attributes: `productId`, `productName`, `price`.
   - Encrypted at rest using AWS KMS.

5. **Monitoring and Logging**
   - CloudWatch logs for API Gateway and Lambda enabled.
   - Include metrics for requests, errors, and latency.

6. **Outputs**
   - CloudFormation stack outputs:
     - API Gateway endpoint URL
     - Lambda function ARN

## Acceptance criteria

- CDK `synth` and `deploy` complete without errors.
- Upload API successfully accepts JSON POST requests and processes files.
- S3 bucket enforces encryption, versioning, and access restrictions.
- DynamoDB stores product data with proper encryption and schema.
- API Gateway throttling verified at 1000 RPS.
- CloudWatch displays logs for API and Lambda.
- Stack outputs show valid API Gateway URL and Lambda ARN.
