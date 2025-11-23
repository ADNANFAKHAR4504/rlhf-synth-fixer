# Zero-Trust Security Framework

This infrastructure implements a comprehensive zero-trust security framework for payment processing workloads using Pulumi and TypeScript.

## Architecture Overview

The infrastructure consists of four main stacks:

1. **Network Stack**: Isolated VPC with private subnets, VPC endpoints, and network controls
2. **Security Stack**: KMS encryption, Secrets Manager with rotation, IAM ABAC roles
3. **Monitoring Stack**: VPC Flow Logs, CloudWatch Logs, metric filters, and alarms
4. **Access Stack**: SSM Session Manager for secure bastion-less access

## Key Security Features

- **Isolated Network**: VPC with private subnets only, no internet gateway
- **Zero-Trust Architecture**: All traffic flows through AWS PrivateLink endpoints
- **Encryption**: Customer-managed KMS keys for all data at rest and in transit
- **ABAC**: IAM roles using session tags for Environment, DataClassification, and CostCenter
- **Secrets Rotation**: Automatic 30-day rotation of database credentials
- **Audit Logging**: VPC Flow Logs and CloudWatch Logs with 90-day retention
- **Secure Access**: SSM Session Manager eliminates SSH key management

## Deployment

### Prerequisites

- Node.js 18+ and npm installed
- Pulumi CLI installed
- AWS credentials configured
- Environment variable `ENVIRONMENT_SUFFIX` set (e.g., 'dev', 'prod')

### Install Dependencies
