## Infrastructure Overview

The CloudFormation template successfully implements a production-ready serverless architecture in **AWS us-west-2** region with the following components:

---

## Architecture Components

### AWS Lambda Function

- Node.js 22.x runtime
- 128MB memory, 30-second timeout
- Integrated with DynamoDB via IAM role
- Environment variable for table name reference

### Amazon API Gateway

- REST API with regional endpoint
- `GET` method on `/data` resource path
- CORS enabled for all origins
- CloudWatch logging enabled
- Proper error handling (500 responses)

### Amazon DynamoDB

- Table with string partition key `id`
- 5 RCU and 5 WCU provisioned capacity
- Server-side encryption using AWS KMS

### Amazon S3

- Dedicated log bucket with account/region suffix
- Server-side encryption (SSE-S3)
- Versioning enabled for log preservation

### Security & Monitoring

- Encryption enabled on all supported resources
- CloudWatch logging for both Lambda and API Gateway
- Least privilege IAM roles
- Resource tagging with `Environment:Production`

---

## Template Structure

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "Production-ready serverless application with Lambda, API Gateway, DynamoDB, and S3 logging"
Parameters: # Configurable input parameters
Resources: # All AWS resources definitions
Outputs: # Exported values for cross-stack references
```
