# Zero-Trust Data Processing Pipeline

This CDK application implements a zero-trust security architecture for data processing with end-to-end encryption.

## Architecture

- **VPC**: Private subnets only, no internet gateway
- **Lambda**: Runs in isolated private subnets
- **KMS**: Customer-managed keys with 90-day automatic rotation
- **S3**: Encrypted buckets with versioning and MFA delete
- **VPC Endpoints**: S3, Lambda, KMS, Secrets Manager, CloudWatch Logs
- **Security Groups**: HTTPS-only traffic
- **CloudWatch Logs**: Encrypted with 90-day retention
- **IAM**: Explicit deny for non-encrypted operations

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Deploy with environment suffix
cdk deploy -c environmentSuffix=dev

# Deploy to specific environment
cdk deploy -c environmentSuffix=prod
```

## Security Features

1. **Network Isolation**: Lambda functions have no internet access
2. **Encryption at Rest**: All data encrypted with customer-managed KMS keys
3. **Key Rotation**: Automatic 90-day rotation for all KMS keys
4. **Least Privilege**: IAM roles with explicit deny statements
5. **Compliance Tagging**: All resources tagged for tracking
6. **Audit Logging**: 90-day CloudWatch Logs retention

## Testing

```bash
# Run unit tests
python -m pytest tests/
```

## Cleanup

```bash
# Destroy stack
cdk destroy -c environmentSuffix=dev
```
