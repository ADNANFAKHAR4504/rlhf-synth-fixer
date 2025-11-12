# Secure Data Processing Infrastructure

This CDKTF Python project creates a PCI-DSS compliant secure data processing infrastructure on AWS.

## Architecture

- **Networking**: Private VPC across 3 AZs with AWS Network Firewall
- **Security**: KMS encryption, IAM least-privilege roles, security groups
- **Monitoring**: CloudWatch Logs, metric filters, alarms, AWS Config
- **Data Processing**: S3 buckets with encryption and Lambda functions

## Prerequisites

- Python 3.9+
- Node.js 18+
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS credentials configured

## Installation

```bash
pip install -r requirements.txt
cdktf get
```

## Deployment

```bash
export ENVIRONMENT_SUFFIX="prod-xyz"
cdktf deploy
```

## Testing

```bash
pytest tests/
```

## Compliance

This infrastructure meets PCI-DSS Level 1 requirements:
- Encryption at rest and in transit
- Network isolation (private subnets only)
- Least-privilege IAM roles
- Comprehensive logging and monitoring
- Automatic credential rotation
