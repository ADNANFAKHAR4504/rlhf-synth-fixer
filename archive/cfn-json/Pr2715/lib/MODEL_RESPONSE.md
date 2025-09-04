# Infrastructure Overview

The CloudFormation template provisions a secure, serverless infrastructure that integrates **AWS Lambda**, **Amazon S3**, and **Amazon API Gateway** with strict security and operational best practices. The design is portable across AWS regions and supports flexible resource naming via parameters.

---

## Architecture Components

### AWS Lambda Functions

#### **ProcessDataLambda**

- Python 3.9 runtime
- 128MB memory, 30-second timeout
- Environment variables for bucket and environment references
- Triggered by both API Gateway and S3 bucket events
- IAM role grants only read access (`s3:GetObject`, `s3:GetObjectVersion`)

#### **S3NotificationFunction (Custom Resource)**

- Configures S3 bucket event notifications to trigger the Lambda function
- Ensures proper creation, update, and deletion of bucket event configurations

---

### Amazon S3

#### **AppDataBucket**

- Stores application data with **SSE-S3 encryption (AES256)**
- Versioning enabled for object history
- Public access fully blocked via `PublicAccessBlockConfiguration`

---

### Amazon API Gateway

#### **REST API (`data-api-${EnvironmentName}`)**

- Regional endpoint for high availability
- Resource path `/process` with `POST` and `OPTIONS` methods
- Integrated with Lambda using `AWS::Lambda::Permission`
- CORS enabled for cross-domain access

#### **Usage Plan**

- Throttling: **25 requests/sec** with **50 burst limit**
- Quota: **10,000 requests/month**
- API Key required for requests (`ApiGatewayApiKey`)
- Tied to specific deployment stage via `UsagePlanKey`

---

### IAM Roles & Policies

#### **LambdaExecutionRole**

- Trusts `lambda.amazonaws.com`
- Uses AWS-managed policy `AWSLambdaBasicExecutionRole`
- Inline policy grants minimal S3 read-only access

#### **S3NotificationRole**

- Manages bucket notification configuration
- Grants minimal permissions for:
  - `s3:PutBucketNotification`
  - `lambda:AddPermission`
  - `lambda:RemovePermission`

---

### Security & Monitoring

- **Encryption** → S3 data encrypted at rest (AES256)
- **Permissions** → Cross-service permissions scoped with least privilege
- **CORS** → Proper preflight (`OPTIONS`) method implemented
- **Operational Best Practices** →
  - API Gateway quotas & throttling to prevent abuse
  - Versioning for S3 bucket to support recovery

---

## Template Structure

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure serverless infrastructure with Lambda, S3, and API Gateway",
  "Parameters": { ... },
  "Resources": { ... },
  "Outputs": { ... }
}
```
