# VPC Infrastructure Deployment Guide

## Overview

This Pulumi Python infrastructure creates a production-ready VPC for payment processing with PCI DSS compliance features.

## Prerequisites

- Python 3.7 or higher
- Pulumi CLI installed
- AWS credentials configured
- AWS CLI installed (optional, for verification)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Configure Pulumi stack (if not already configured):
```bash
pulumi stack init dev
```

3. Set AWS region:
```bash
pulumi config set aws:region us-east-1
```

4. Set environment suffix (optional):
```bash
pulumi config set environmentSuffix prod
```

## Deployment

Deploy the infrastructure:
```bash
pulumi up
```

Review the preview and select "yes" to proceed.

## Infrastructure Components

The deployment creates:

- 1 VPC (10.0.0.0/16)
- 1 Internet Gateway
- 3 Public Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- 3 Private Subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- 3 Elastic IPs
- 3 NAT Gateways
- 4 Route Tables (1 public, 3 private)
- 1 Security Group (HTTPS only)
- 1 IAM Role for VPC Flow Logs
- 1 CloudWatch Log Group
- 1 VPC Flow Log

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `internet_gateway_id`: Internet Gateway ID
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `security_group_id`: Security group ID
- `flow_log_id`: VPC Flow Log ID

View outputs:
```bash
pulumi stack output
```

## Verification

Verify the deployment:

```bash
# Get VPC ID
pulumi stack output vpc_id

# Verify VPC
aws ec2 describe-vpcs --vpc-ids $(pulumi stack output vpc_id)

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$(pulumi stack output vpc_id)"

# Verify NAT Gateways
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$(pulumi stack output vpc_id)"
```

## Cleanup

To destroy the infrastructure:
```bash
pulumi destroy
```

Review the resources to be deleted and confirm.

## Cost Considerations

- NAT Gateways: ~$0.045/hour per NAT Gateway ($97/month for 3 NAT Gateways)
- Data transfer through NAT Gateways: $0.045/GB
- VPC Flow Logs storage: CloudWatch Logs pricing
- Elastic IPs: Free when attached to running NAT Gateways

## Security Features

- HTTPS-only inbound traffic on security group
- VPC Flow Logs enabled with 5-minute intervals
- Network segmentation between public and private subnets
- All resources tagged for compliance tracking

## Compliance

This infrastructure supports PCI DSS requirements:
- Network segmentation (separate public/private subnets)
- Logging enabled (VPC Flow Logs)
- Proper tagging (Environment, Project)
- High availability (multi-AZ deployment)
