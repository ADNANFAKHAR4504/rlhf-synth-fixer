# Serverless Data Processing Stack

A comprehensive CDKTF implementation for serverless data processing using AWS services.

## Architecture

- **S3 Bucket**: Data processing bucket with KMS encryption and secure policies
- **Lambda Function**: Node.js 18.x function for data processing triggered by S3 events
- **KMS Key**: Customer-managed key for S3 encryption with automatic rotation
- **IAM Roles**: Least privilege access for Lambda execution
- **S3 Notifications**: Automatic triggering of Lambda on object uploads

## Key Features

✅ **Security Best Practices**
- KMS encryption for S3 with key rotation
- S3 bucket policy enforcing HTTPS and encrypted uploads
- Public access blocked on S3 bucket
- IAM roles with least privilege principle

✅ **Event-Driven Processing**
- S3 bucket notifications trigger Lambda on object creation
- Filter for specific prefixes (`input/`) and suffixes (`.json`)
- Lambda permission for S3 invocation

✅ **Infrastructure as Code**
- TypeScript implementation using CDKTF
- Configurable via constructor props (environment, region, tags)
- Comprehensive outputs for integration

## Resources Created

| Resource Type | Resource Name | Description |
|---------------|---------------|-------------|
| S3 Bucket | `{projectPrefix}-data-processing-{accountId}` | Main data processing bucket |
| Lambda Function | `{projectPrefix}-data-processor` | Data processing function |
| KMS Key | `{projectPrefix} S3 encryption key` | Customer managed encryption key |
| KMS Alias | `alias/{projectPrefix}-s3-encryption` | Key alias for easier reference |
| IAM Role | `{projectPrefix}-lambda-execution-role` | Lambda execution role |
| IAM Policy | `{projectPrefix}-lambda-s3-kms-policy` | Custom policy for S3 and KMS access |

## Configuration

The stack accepts optional props:

```typescript
interface TapStackProps {
  environmentSuffix?: string;    // Default: 'dev'
  stateBucket?: string;         // For Terraform state
  stateBucketRegion?: string;   // State bucket region
  awsRegion?: string;           // Default: 'us-east-1'
  defaultTags?: { tags: Record<string, string> };
}
```

## Outputs

- `bucket-name`: S3 bucket name for data processing
- `lambda-function-name`: Lambda function name
- `kms-key-id`: KMS key ID for encryption
- `lambda-role-arn`: Lambda execution role ARN