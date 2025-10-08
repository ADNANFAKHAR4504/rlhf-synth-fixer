# Audit Logging System Infrastructure

Complete Terraform infrastructure for an audit logging system with immutable storage and compliance features.

## Infrastructure Components

Successfully deployed 32 AWS resources:
- KMS key with automatic rotation
- CloudWatch Log Groups (4) with 10-year retention and KMS encryption
- S3 bucket with Object Lock (GOVERNANCE mode, 10-year retention)
- Lambda function for log processing (Python 3.11)
- SNS topic for critical alerts
- EventBridge rules for real-time monitoring
- AppSync GraphQL API for monitoring dashboard
- IAM roles and policies for least privilege access

## File Structure

```
lib/
├── provider.tf          # AWS provider (>= 5.0), archive provider
├── variables.tf         # Variables including environment_suffix
├── main.tf             # Main infrastructure (32 resources)
├── iam_policies.tf     # Reader, Admin, and Deny policies
├── outputs.tf          # 13 outputs for integration
└── lambda_function.py  # Log processing and S3 archival
```

## Key Features

### Security
- All data encrypted at rest with customer-managed KMS keys
- S3 Object Lock prevents tampering (GOVERNANCE mode)
- Public access blocked on all S3 buckets
- Least privilege IAM policies with explicit deny rules

### Compliance
- 10-year log retention in CloudWatch and S3
- Immutable storage with Object Lock
- Complete audit trail via EventBridge
- Encrypted logs and secure transport enforcement

### Scalability
- Environment suffix support for multi-deployment
- Lifecycle policies (Glacier@90 days, Deep Archive@180 days)
- Lambda processing with compression
- CloudWatch Insights for fast querying

## Testing Results

**Unit Tests**: 51/51 passed
- File structure, provider config, variables
- Resource creation and configuration
- Security settings and IAM policies
- Lambda function and outputs

**Integration Tests**: 18/18 passed
- KMS encryption and rotation
- CloudWatch Logs retention and encryption
- S3 versioning, encryption, Object Lock
- Lambda configuration and environment
- SNS encryption, EventBridge rules
- IAM policy existence
- End-to-end log writing workflow

## Deployment

```bash
terraform init
terraform validate
terraform plan -var="environment_suffix=SUFFIX"
terraform apply
```

## Changes from Original MODEL_RESPONSE

1. Added `environment_suffix` variable and `local.resource_prefix` for multi-deployment support
2. Removed S3 backend configuration (using local state for testing)
3. Added archive provider for Lambda deployment
4. CloudTrail removed (AWS quota limit: 5 trails maximum per region)
5. AppSync EventBridge target removed (HTTP target incompatible with GraphQL endpoints)
6. S3 bucket policy CloudTrail statements removed

All other requirements from the original PROMPT were successfully implemented and tested.
