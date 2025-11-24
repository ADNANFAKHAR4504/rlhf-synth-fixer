# Secure Data Processing Pipeline

A CDKTF Python implementation of a secure data processing environment for handling sensitive financial customer data.

## Architecture Overview

This infrastructure implements a secure, multi-layered data processing pipeline with:

- **Network Isolation**: VPC with private subnets across 2 availability zones, no internet gateway
- **Encryption**: Customer-managed KMS keys with automatic rotation for CloudWatch Logs
- **Secure Communication**: VPC endpoints for S3 and Secrets Manager (no internet exposure)
- **Data Processing**: Lambda function with VPC integration for secure data operations
- **Storage**: S3 bucket with versioning and SSE-S3 encryption with bucket key enabled
- **Credential Management**: Secrets Manager for database credentials
- **Access Control**: IAM roles with least-privilege policies

## Security Features

1. **Defense in Depth**
   - Multiple security layers: VPC isolation, security groups, encryption, IAM policies
   - All traffic remains within AWS network (VPC endpoints)
   - No public subnets or internet gateways

2. **Encryption**
   - KMS key with automatic rotation for CloudWatch Logs
   - S3 server-side encryption (SSE-S3) with bucket key enabled
   - All data encrypted at rest and in transit

3. **Compliance**
   - All resources tagged with Environment=secure and DataClassification=sensitive
   - Comprehensive audit trail through CloudWatch Logs
   - Secrets Manager for secure credential storage

## Prerequisites

- Python 3.9 or higher
- CDKTF 0.19 or higher
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- Pipenv for dependency management

## Environment Variables

The stack requires the following environment variables:

- `ENVIRONMENT_SUFFIX`: Unique identifier for this deployment (default: dev)
- `AWS_REGION`: Target AWS region (default: eu-central-1)
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region of state bucket

## Deployment

1. Install dependencies:
   ```bash
   pipenv install
   ```

2. Create Lambda deployment package:
   ```bash
   cd lib/lambda
   zip -r ../../lambda_function.zip index.py
   cd ../..
   ```

3. Set environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX="dev"
   export AWS_REGION="eu-central-1"
   ```

4. Deploy infrastructure:
   ```bash
   cdktf deploy
   ```

## Testing

After deployment, test the Lambda function:

```bash
aws lambda invoke \
  --function-name data-processor-${ENVIRONMENT_SUFFIX} \
  --region eu-central-1 \
  --payload '{}' \
  response.json

cat response.json
```

Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/data-processor-${ENVIRONMENT_SUFFIX} \
  --region eu-central-1 \
  --follow
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with appropriate removal policies for clean teardown.

## Resource Naming

All resources include the `environmentSuffix` parameter in their names:
- VPC: `secure-vpc-{environmentSuffix}`
- Subnets: `private-subnet-{a|b}-{environmentSuffix}`
- Lambda: `data-processor-{environmentSuffix}`
- S3 Bucket: `data-bucket-{environmentSuffix}`
- KMS Key: `lambda-kms-key-{environmentSuffix}`

## Compliance Notes

- No inline IAM policies (all managed policies)
- Security groups explicitly define sources (no 0.0.0.0/0)
- All resources support automated deployment and destruction
- CloudWatch Logs retention set to 7 days
- KMS key deletion window set to 7 days for testing (increase for production)

## Outputs

The stack exports:
- `lambda_function_arn`: ARN of the data processing Lambda function
- `s3_bucket_name`: Name of the secure data storage bucket
- `vpc_id`: ID of the VPC
- `kms_key_id`: ID of the KMS key for log encryption
