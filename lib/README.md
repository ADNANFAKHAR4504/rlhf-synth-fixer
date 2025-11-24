# Zero-Trust Data Processing Pipeline

This AWS CDK Python application implements a comprehensive zero-trust security architecture for data processing with end-to-end encryption and network isolation.

## Architecture Overview

The pipeline includes:

- **VPC with Private Subnets**: Isolated network with no internet gateway
- **VPC Endpoints**: Interface endpoints for Lambda, KMS, Secrets Manager, CloudWatch Logs; Gateway endpoint for S3
- **Lambda Functions**: Data processing in private subnets with no internet access
- **S3 Buckets**: Encrypted storage with versioning and KMS encryption
- **KMS Keys**: Customer-managed keys with automatic 90-day rotation for S3, Logs, and Secrets
- **Secrets Manager**: Encrypted credential storage with automatic rotation capability
- **Security Groups**: Least-privilege HTTPS-only rules
- **CloudWatch Logs**: Encrypted logging with 90-day retention
- **IAM Policies**: Explicit deny statements for non-encrypted operations

## Security Features

### Encryption at Every Layer
- All data encrypted at rest using customer-managed KMS keys
- KMS keys automatically rotate every 90 days
- Separate KMS keys per service (S3, Logs, Secrets)
- Separate encryption contexts per environment

### Network Isolation
- Lambda functions in private subnets with no internet access
- All AWS service access through VPC endpoints
- Security groups restrict traffic to HTTPS only
- No NAT gateway or internet gateway in VPC

### Compliance Controls
- Comprehensive resource tagging (Environment, DataClassification, Owner)
- CloudWatch Logs with 90-day retention
- IAM policies with explicit deny for unencrypted operations
- S3 bucket versioning and MFA delete support

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- CDK 2.x installed (`npm install -g aws-cdk`)
- Python 3.9 or higher
- AWS account with sufficient permissions

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

Set the environment suffix for resource naming:

```bash
cdk deploy --context environmentSuffix=dev
```

### Deploy Stack

```bash
cdk synth
cdk deploy
```

### Destroy Stack

```bash
cdk destroy
```

## Environment Variables

The Lambda function requires the following environment variables (automatically configured):

- `SECRET_ARN`: ARN of the Secrets Manager secret
- `BUCKET_NAME`: Name of the S3 data bucket

## Testing

Invoke the Lambda function to test data processing:

```bash
aws lambda invoke \
  --function-name data-processing-dev \
  --payload '{}' \
  response.json

cat response.json
```

## Security Considerations

1. **KMS Key Rotation**: Keys automatically rotate every 90 days
2. **Network Isolation**: Lambda has no internet access; uses VPC endpoints only
3. **Encryption Validation**: IAM policies explicitly deny unencrypted operations
4. **Least Privilege**: Security groups allow only necessary HTTPS traffic
5. **Audit Logging**: All operations logged to encrypted CloudWatch Logs

## Cost Optimization

- Uses private subnets without NAT gateways (no NAT costs)
- VPC endpoints incur hourly charges and data processing fees
- Consider consolidating endpoints in shared services VPC for multi-account deployments

## Compliance

This implementation supports:

- SOC 2 compliance requirements
- Encryption at rest and in transit
- Comprehensive audit logging
- Network isolation and zero-trust principles
- Resource tagging for governance

## Troubleshooting

### Lambda Cannot Access S3

- Verify VPC endpoint security groups allow HTTPS from Lambda security group
- Check IAM role permissions include KMS key access
- Verify S3 gateway endpoint route table associations

### KMS Access Denied

- Ensure Lambda execution role has `kms:Decrypt` and `kms:Encrypt` permissions
- Check KMS key policy allows Lambda role access
- Verify VPC endpoint for KMS is accessible from Lambda subnet

### Secrets Manager Access Issues

- Confirm VPC endpoint for Secrets Manager exists and is accessible
- Verify Lambda execution role has `secretsmanager:GetSecretValue` permission
- Check security groups allow HTTPS traffic to Secrets Manager endpoint

## License

This is proprietary code for internal use only.
