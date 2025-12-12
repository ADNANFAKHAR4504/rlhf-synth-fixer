# Pr7732 - Zero-Trust Network Access Infrastructure (Pulumi + Python)

## Overview

This project implements a **Zero-Trust Network Access Infrastructure** for Financial Services using Pulumi and Python. It deploys to LocalStack for local testing.

## Architecture

### AWS Services Used:
- **VPC**: Private network with no internet gateway (zero-trust)
- **EC2**: 3 private subnets across different availability zones
- **S3**: Encrypted bucket with versioning and lifecycle policies
- **DynamoDB**: Table for state management
- **Lambda**: Serverless functions with encrypted environment variables
- **API Gateway**: REST API with IAM authorization
- **IAM**: Roles and policies with least-privilege access
- **KMS**: Customer-managed keys with rotation enabled
- **CloudWatch Logs**: 90-day retention for audit trails
- **AWS Config**: Compliance monitoring and recording
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB
- **Network ACLs**: Restrictive ingress/egress rules

## Project Structure

```
localstack-pulumi-Pr7732/
├── tap.py                          # Pulumi entry point
├── Pulumi.yaml                     # Pulumi project configuration
├── requirements.txt                # Python dependencies
├── lib/
│   └── tap_stack.py               # Main stack implementation
├── tests/
│   ├── integration/
│   │   └── test_tap_stack.py     # Integration tests
│   └── unit/
│       └── test_tap_stack.py     # Unit tests
├── scripts/
│   ├── localstack-pulumi-deploy.sh    # Deploy to LocalStack
│   ├── localstack-pulumi-test.sh      # Run integration tests
│   └── localstack-pulumi-cleanup.sh   # Clean up resources
└── cfn-outputs/
    └── pulumi-outputs.json        # Deployment outputs (generated)
```

## Prerequisites

- LocalStack running on `http://localhost:4566`
- Python 3.8+
- Pulumi CLI installed

## Usage

### 1. Deploy Infrastructure

```bash
bash scripts/localstack-pulumi-deploy.sh
```

This will:
- Create a Python virtual environment
- Install dependencies
- Initialize Pulumi stack
- Deploy all infrastructure to LocalStack
- Export outputs to `cfn-outputs/pulumi-outputs.json`

### 2. Run Integration Tests

```bash
bash scripts/localstack-pulumi-test.sh
```

This will:
- Verify all resources are deployed correctly
- Test security configurations
- Validate zero-trust architecture
- Output results to `int-test-output.md`

### 3. Clean Up Resources

```bash
bash scripts/localstack-pulumi-cleanup.sh
```

This will:
- Destroy all Pulumi-managed resources
- Remove the Pulumi stack
- Clean up output files

## Environment Variables

You can customize the deployment with these environment variables:

- `ENVIRONMENT_SUFFIX`: Environment name (default: `dev`)
- `AWS_REGION`: AWS region (default: `us-east-1`)
- `REPOSITORY`: Repository name
- `COMMIT_AUTHOR`: Author name
- `PR_NUMBER`: PR number
- `TEAM`: Team name

Example:
```bash
export ENVIRONMENT_SUFFIX=staging
export AWS_REGION=us-west-2
bash scripts/localstack-pulumi-deploy.sh
```

## Metadata

- **Platform**: Pulumi
- **Language**: Python
- **Complexity**: Expert
- **Subtask**: Zero-Trust Network Access Infrastructure
- **Training Quality**: 9/10
- **PR ID**: 7732

## Notes

- This infrastructure implements zero-trust principles with no internet gateway
- All data is encrypted at rest using KMS
- API Gateway requires IAM authorization
- Network ACLs provide additional security layer
- AWS Config monitors compliance continuously
- CloudWatch Logs retain all audit trails for 90 days

