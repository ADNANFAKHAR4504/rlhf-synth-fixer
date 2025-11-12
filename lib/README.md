# Secure Data Processing Infrastructure - CDKTF Python

This infrastructure implements a PCI-DSS Level 1 compliant secure data processing environment using CDKTF with Python.

## Architecture Overview

The infrastructure is organized into six modular components:

1. **Networking Module** (`networking.py`): VPC, private subnets, Network Firewall, VPC Flow Logs
2. **Security Module** (`security.py`): KMS keys, IAM roles and policies
3. **Data Storage Module** (`data_storage.py`): S3 buckets with encryption, versioning, and policies
4. **Compute Module** (`compute.py`): Lambda functions with VPC configuration
5. **Monitoring Module** (`monitoring.py`): CloudWatch Logs, metric filters, alarms, SNS
6. **Compliance Module** (`compliance.py`): AWS Config rules, EventBridge

## Key Security Features

- **Network Isolation**: Private subnets only, no internet gateways
- **Defense in Depth**: AWS Network Firewall inspects all egress traffic
- **Encryption**: KMS customer-managed keys for all data at rest
- **Access Control**: Least-privilege IAM policies with explicit deny statements
- **Monitoring**: Real-time CloudWatch alarms for security events
- **Compliance**: AWS Config rules for continuous compliance monitoring
- **Audit Logging**: VPC Flow Logs, CloudWatch Logs with 90-day retention

## Prerequisites

- Python 3.11+
- Pipenv
- Terraform 1.5+
- AWS CLI configured
- CDKTF CLI (`npm install -g cdktf-cli`)

## Environment Variables

Required environment variables:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="ap-southeast-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
export REPOSITORY="secure-infrastructure"
export COMMIT_AUTHOR="security-team"
```

## Deployment

1. Install dependencies:
```bash
pipenv install
```

2. Generate Terraform configuration:
```bash
cdktf synth
```

3. Deploy infrastructure:
```bash
cdktf deploy
```

4. Destroy infrastructure (when needed):
```bash
cdktf destroy
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example: `secure-vpc-dev`, `data-bucket-prod`

## Outputs

The stack outputs critical resource identifiers:

- `vpc_id`: VPC identifier
- `private_subnet_ids`: List of private subnet IDs
- `data_bucket_name`: S3 bucket for data storage
- `lambda_function_arn`: Lambda function ARN
- `kms_key_arns`: KMS key ARNs for different services
- `security_alerts_topic_arn`: SNS topic for security alerts
- `config_recorder_name`: AWS Config recorder name

## Compliance

This infrastructure implements the following PCI-DSS Level 1 controls:

- Requirement 1: Network security controls (Network Firewall, security groups)
- Requirement 2: Secure configurations (least-privilege IAM)
- Requirement 3: Data protection (KMS encryption)
- Requirement 4: Encryption in transit (TLS 1.2+)
- Requirement 8: Access control (IAM roles)
- Requirement 10: Logging and monitoring (CloudWatch, Config)

## Testing

Outputs are available in `cfn-outputs/flat-outputs.json` for integration testing.

## Support

For issues or questions, contact the security team.
