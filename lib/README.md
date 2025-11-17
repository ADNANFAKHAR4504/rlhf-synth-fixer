# Zero-Trust Security Configuration

This infrastructure implements a zero-trust security architecture for a data processing pipeline using Pulumi with TypeScript.

## Architecture Overview

The infrastructure creates a locked-down AWS environment with defense-in-depth security controls:

- **VPC**: Isolated network with 3 private subnets across availability zones (no internet gateway)
- **VPC Endpoints**: Gateway and Interface endpoints for S3, KMS, and CloudWatch Logs
- **KMS Encryption**: Customer-managed key with 90-day automatic rotation
- **IAM**: Least-privilege role for Lambda with explicit permissions
- **S3**: Encrypted bucket with versioning and public access blocked
- **Security Groups**: Restrictive rules allowing only HTTPS (port 443)
- **CloudWatch Logs**: Encrypted logging with 7-day retention

## Security Features

### Network Security
- No internet gateway - all AWS service communication through VPC endpoints
- Private subnets only
- Security groups with explicit HTTPS-only rules
- No 0.0.0.0/0 CIDR blocks

### Encryption
- All data encrypted at rest using customer-managed KMS key
- All data encrypted in transit (HTTPS/TLS)
- KMS key rotation every 90 days
- S3 bucket policies enforce encryption in transit

### Access Control
- IAM role follows least-privilege principle
- No wildcard actions in IAM policies
- KMS key policies explicitly grant Lambda cryptographic operations
- S3 bucket policies enforce secure transport

### Compliance
- Mandatory security tags on all resources (Environment, DataClassification, Owner)
- CloudWatch Logs retention for audit trail
- Versioning enabled on S3 buckets
- Block all public access to S3

## Deployment

### Prerequisites
- Pulumi CLI 3.x installed
- AWS CLI configured with appropriate credentials
- Node.js 18.x or later
- TypeScript

### Environment Variables
- `ENVIRONMENT_SUFFIX`: Environment identifier (default: 'dev')
- `AWS_REGION`: Target AWS region (default: 'us-east-1')

### Deploy
```bash
npm install
pulumi stack init <stack-name>
pulumi up
```

### Destroy
```bash
pulumi destroy
```

## Resource Naming

All resources follow the pattern: `{resource-type}-{environmentSuffix}`

Example with ENVIRONMENT_SUFFIX=dev:
- VPC: `zero-trust-vpc-dev`
- S3 Bucket: `data-bucket-dev`
- KMS Key: `data-encryption-key-dev`
- IAM Role: `lambda-execution-role-dev`

## Outputs

- `vpcId`: VPC identifier
- `bucketName`: S3 bucket name
- `kmsKeyId`: KMS key identifier
- `lambdaRoleArn`: Lambda execution role ARN

## Security Compliance

This infrastructure meets the following security requirements:
- Zero-trust architecture with defense-in-depth
- Encryption at rest and in transit
- Network isolation and segmentation
- Least-privilege access control
- Audit logging and monitoring
- No public internet exposure
