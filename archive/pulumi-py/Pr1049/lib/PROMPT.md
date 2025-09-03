---
## Serverless File Processing Application on AWS
---

### Objective

As a skilled cloud solutions architect, your task is to build a **serverless application** using **Pulumi and Python** that automatically processes files uploaded to an S3 bucket by triggering an AWS Lambda function. The implementation must be robust, secure, and easily configurable with multiple processing modes.

---

### Core Architectural Components

The Pulumi program must provision and configure the following essential AWS services:

- **Amazon S3 Bucket**: A dedicated bucket for receiving file uploads with dynamic naming to prevent conflicts, which will act as the event source.
- **AWS Lambda Function**: A Python-based serverless function responsible for processing the uploaded files with configurable processing modes.
- **AWS Identity and Access Management (IAM)**: Necessary roles and policies to grant the Lambda function the precise permissions required for execution, S3 interactions, and logging.
- **AWS CloudWatch Logs**: To capture and store all execution and error logs from the Lambda function with appropriate retention policies.
- **S3 Public Access Block**: Security configuration to prevent any public access to the bucket.

---

### Technical Specifications & Constraints

- **Deployment Technology**: The entire infrastructure must be defined using **Pulumi's Python SDK**.
- **Cloud Provider**: All resources must be deployed on **AWS**.
- **Target AWS Region**: The infrastructure must be geographically hosted in the **`us-west-2` (Oregon)** region.
- **Dynamic Resource Naming**: All resources must use unique naming with timestamps to prevent deployment conflicts:
  - S3 bucket: `file-processing-bucket-{environment}-{timestamp}`
  - Lambda function: `file-processor-lambda-{environment}-{timestamp}`
  - IAM resources: `file-processor-lambda-role-{environment}-{timestamp}`
  - CloudWatch log group: `/aws/lambda/file-processor-lambda-{environment}-{timestamp}`
- **Lambda Trigger**: The Lambda function **must be triggered by object creation events** (`s3:ObjectCreated:*`) within the file processing bucket.
- **IAM Security**:
  - The Lambda's IAM role must adhere to the **principle of least privilege**, allowing it to:
    - Read from, write to, and delete objects in the file processing bucket (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`)
    - List bucket contents (`s3:ListBucket`)
    - Create log groups and write log events to CloudWatch Logs (`logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`)
- **Lambda Configuration**:
  - **Runtime**: Python 3.9
  - **Memory**: 256MB
  - **Timeout**: 60 seconds
  - **Environment Variables**: 
    - `PROCESSING_MODE`: Controls processing behavior (`default`, `copy`, `metadata`)
    - `OUTPUT_PREFIX`: Prefix for processed files (default: `processed/`)
  - The Lambda function's code **must include comprehensive logging** to track all incoming request events and any errors encountered during processing.
- **CloudWatch Logs**: 14-day retention policy for cost optimization.
- **S3 Security**: Public access must be completely blocked using `BucketPublicAccessBlock`.
- **Component Resource Structure**: Must be implemented as a proper Pulumi `ComponentResource` with `TapStackArgs` class for configuration.

---

### Lambda Function Processing Requirements

The Lambda function must support multiple processing modes:

1. **Default Mode** (`PROCESSING_MODE=default`):
   - Log file information (name, size, last modified)
   - No file manipulation, just processing confirmation

2. **Copy Mode** (`PROCESSING_MODE=copy`):
   - Copy uploaded files to a processed folder using the `OUTPUT_PREFIX`
   - Maintain original file structure and metadata

3. **Metadata Mode** (`PROCESSING_MODE=metadata`):
   - Generate JSON metadata files containing:
     - Original file name and path
     - File size and last modified timestamp
     - Processing timestamp and request ID
   - Store metadata files in the `OUTPUT_PREFIX` directory

The Lambda function must:
- Use proper error handling and logging for each processing mode
- Extract S3 event data including bucket name and object key
- Handle URL decoding of object keys
- Use boto3 S3 client for all S3 operations
- Return structured JSON responses with processing results

---

### Expected Output

You will deliver a complete and runnable **Pulumi Python script** that successfully deploys the described infrastructure. The solution must include:

1. **Pulumi Infrastructure Code**: Defines the S3 bucket with dynamic naming, Lambda function, IAM roles/policies with least privilege, CloudWatch Log Group with retention, and S3 public access block.
2. **Lambda Function Code**: A comprehensive Python handler that supports all three processing modes with proper error handling and logging.
3. **Component Resource Structure**: Proper `TapStack` ComponentResource class with `TapStackArgs` for configuration management.
4. **Resource Dependencies**: Explicit `depends_on` relationships to ensure proper deployment order.
5. **Exports**: Export bucket name, Lambda function name, ARN, and log group name for reference.

```python
# Your complete Pulumi Python script will be provided here.
# It should be ready to deploy using `pulumi up` after setting up the stack.
# The implementation should match the TapStack ComponentResource pattern
# with proper resource dependencies and error handling.
```
