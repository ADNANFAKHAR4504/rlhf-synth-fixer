# AWS VPC Infrastructure for Payment Processing

Production-grade AWS VPC infrastructure with strict network isolation for payment processing systems, built with Terraform.

## Architecture

This infrastructure implements a three-tier network architecture across three availability zones:

- **Public Tier**: Load balancers and bastion hosts (10.0.1-3.0/24)
- **Private Tier**: Application servers (10.0.11-13.0/24)
- **Database Tier**: Database instances with no internet access (10.0.21-23.0/24)

## Features

- VPC with 10.0.0.0/16 CIDR supporting 4000+ hosts
- 9 subnets across 3 availability zones
- High availability NAT Gateways in each public subnet
- Network ACLs enforcing tier-specific port restrictions
- VPC Flow Logs with 30-day retention in CloudWatch
- Comprehensive tagging for compliance and cost tracking

## Prerequisites

- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- AWS provider 5.x

## Deployment

1. Initialize Terraform:
```bash
terraform init
```

2. Review the plan:
```bash
terraform plan -var="environment_suffix=production"
```

3. Apply the configuration:
```bash
terraform apply -var="environment_suffix=production"
```

## Variables

- `aws_region`: AWS region for deployment (default: us-east-1)
- `environment_suffix`: Environment suffix for resource naming (default: dev)
- `repository`: Repository name for tagging
- `commit_author`: Commit author for tagging
- `pr_number`: PR number for tagging
- `team`: Team name for tagging

## Outputs

The module exports the following outputs:

- VPC ID and CIDR block
- Subnet IDs for all tiers
- NAT Gateway IDs and Elastic IPs
- Route table IDs
- Network ACL IDs
- Flow Logs configuration

## Network Design

### Public Subnets
- CIDR: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Internet access via Internet Gateway
- Allowed inbound: HTTP (80), HTTPS (443)

### Private Subnets
- CIDR: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Internet access via NAT Gateways (one per AZ)
- Allowed inbound: Application ports (8080-8090)

### Database Subnets
- CIDR: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- No internet access
- Allowed inbound: PostgreSQL (5432) from private subnets only

## Security

- Network ACLs implement explicit deny-by-default rules
- Database tier completely isolated from internet
- VPC Flow Logs capture all network traffic for audit
- All resources tagged with Environment=Production and Project=PaymentGateway

## Compliance

This infrastructure is designed to support PCI DSS compliance requirements:
- Network segmentation between tiers
- Audit logging via VPC Flow Logs
- No direct internet access to database tier
- High availability across multiple zones

## Cost Considerations

Major cost drivers:
- NAT Gateways: ~$0.045/hour per gateway (~$97/month × 3)
- Data transfer through NAT Gateways: $0.045/GB
- VPC Flow Logs storage: Based on CloudWatch Logs pricing

## Cleanup

To destroy all resources:
```bash
terraform destroy -var="environment_suffix=production"
```

All resources are fully destroyable with no retention policies.
