# Multi-Tier VPC Architecture for Payment Processing

This project implements a production-grade multi-tier VPC architecture for payment processing environments using CDKTF with Python.

## Architecture

### Network Design

- **VPC**: 10.0.0.0/16 CIDR block across 3 availability zones in eu-west-1
- **Public Tier**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - Direct internet access via Internet Gateway
  - Auto-assign public IPs enabled
  - Hosts NAT Gateways and public-facing resources
- **Private Application Tier**: 3 subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
  - Outbound internet via NAT Gateways
  - No public IPs
  - Application servers and services
- **Database Tier**: 3 subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
  - Completely isolated - no internet routing
  - Local VPC traffic only
  - Maximum security for sensitive data

### High Availability

- **3 NAT Gateways**: One per availability zone for fault tolerance
- **3 Availability Zones**: eu-west-1a, eu-west-1b, eu-west-1c
- **Redundant Routing**: Separate route tables per AZ for private subnets

### Monitoring & Compliance

- **VPC Flow Logs**: Captures ALL traffic (accepted and rejected)
- **S3 Storage**: Flow logs stored with 30-day lifecycle policy
- **Resource Tagging**: Environment=Production, Project=PaymentGateway

## Prerequisites

- Python 3.8+
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS credentials configured
- Terraform >= 1.0

## Deployment

### Install Dependencies

```bash
pipenv install
```

### Configure Environment

```bash
export ENVIRONMENT_SUFFIX="your-suffix"
export AWS_REGION="eu-west-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
```

### Deploy Infrastructure

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy to AWS
cdktf deploy
```

### Destroy Infrastructure

```bash
cdktf destroy
```

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private application subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway identifier
- `flow_log_bucket_name`: S3 bucket for VPC Flow Logs

## Resource Naming

All resources use the pattern: `{resource-type}-{environment-suffix}`

Example: `payment-vpc-prod123`, `payment-nat-1-prod123`

## Security Considerations

1. **Database Isolation**: Database subnets have NO internet routing
2. **Flow Logs**: All network traffic monitored and logged
3. **Encryption**: S3 flow log bucket uses server-side encryption
4. **Least Privilege**: IAM roles follow principle of least privilege
5. **Multi-AZ**: Resources distributed across 3 availability zones

## Cost Optimization

- **NAT Gateway**: ~$0.045/hour per NAT × 3 = ~$97/month
- **VPC Flow Logs**: Based on volume, S3 storage costs
- **S3 Lifecycle**: Automatic deletion after 30 days reduces storage costs

## Project Structure

```
lib/
├── tap_stack.py          # Main CDKTF stack
├── networking_stack.py   # VPC networking infrastructure
├── PROMPT.md             # Original requirements
├── MODEL_RESPONSE.md     # Implementation documentation
└── README.md             # This file
```

## Compliance

This infrastructure meets requirements for:

- PCI DSS: Network segmentation and monitoring
- Payment processing: Isolated database tier
- High availability: Multi-AZ deployment
- Audit trail: VPC Flow Logs to S3

## Maintenance

- **Flow Logs**: Automatically deleted after 30 days
- **NAT Gateways**: Monitor data transfer costs
- **Subnet Capacity**: Each /24 subnet provides 251 usable IPs

## Support

For issues or questions, refer to:
- CDKTF Documentation: https://developer.hashicorp.com/terraform/cdktf
- AWS VPC Guide: https://docs.aws.amazon.com/vpc/
