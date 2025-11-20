# Payment Processing VPC Infrastructure

Production-ready Terraform configuration for a PCI DSS-compliant VPC infrastructure supporting payment processing workloads with multi-AZ high availability.

## Architecture Overview

This infrastructure implements a three-tier network architecture:

- **Public Subnets (DMZ)**: Internet-facing resources (load balancers, bastion hosts)
- **Private Subnets (Application)**: Application servers with NAT Gateway access
- **Isolated Subnets (Data)**: Payment processing and databases with no internet access

## Features

- Multi-AZ deployment across 2 availability zones (configurable)
- Redundant NAT Gateways (one per AZ)
- Three-tier network segmentation (PCI DSS compliant)
- Security Groups with least privilege access
- Network ACLs for defense in depth
- VPC Flow Logs to CloudWatch for audit compliance
- All resources support environment suffix for multi-environment deployment

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- Sufficient AWS permissions to create VPC resources

## Quick Start

1. **Initialize Terraform**:
   ```bash
   cd lib
   terraform init
   ```

2. **Create terraform.tfvars**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Review the plan**:
   ```bash
   terraform plan
   ```

4. **Deploy the infrastructure**:
   ```bash
   terraform apply
   ```

## Required Variables

- `environment_suffix`: Environment suffix for resource naming (e.g., "dev", "staging", "prod")

## Optional Variables

- `vpc_cidr`: VPC CIDR block (default: "10.0.0.0/16")
- `az_count`: Number of availability zones (default: 2, minimum: 2)
- `aws_region`: AWS region (default: "us-east-1")
- `flow_log_retention_days`: VPC flow log retention (default: 30 days)
- `common_tags`: Common tags for all resources

## Outputs

The configuration provides comprehensive outputs including:
- VPC ID and CIDR
- Subnet IDs for all tiers
- Security Group IDs
- NAT Gateway IDs and public IPs
- Route table IDs
- VPC Flow Log details

## Network Segmentation

### Public Subnets (DMZ)
- CIDR: First N /20 subnets (where N = az_count)
- Route: Direct internet access via Internet Gateway
- Use cases: ALB, NLB, bastion hosts

### Private Subnets (Application)
- CIDR: Next N /20 subnets
- Route: Internet access via NAT Gateway (one per AZ)
- Use cases: Application servers, batch processing

### Isolated Subnets (Data)
- CIDR: Next N /20 subnets
- Route: No internet access (VPC-only routing)
- Use cases: Databases, payment processing, sensitive data

## Security

### Security Groups
- **Web SG**: Allows HTTP/HTTPS from internet, all outbound
- **App SG**: Allows traffic from Web SG on port 8080, all outbound
- **Data SG**: Allows MySQL/PostgreSQL from App SG, VPC-only outbound

### Network ACLs
- **Public NACL**: Allows all traffic (stateless firewall)
- **Private NACL**: Allows VPC traffic + ephemeral ports, all outbound
- **Isolated NACL**: Strict - VPC traffic only, explicit deny for internet

## PCI DSS Compliance

This infrastructure supports PCI DSS requirements:
- Network segmentation between tiers
- No direct internet access to cardholder data environment (isolated subnets)
- VPC Flow Logs for network monitoring and audit
- Security groups implementing least privilege
- Network ACLs providing additional protection

## Cost Considerations

Main cost drivers:
- NAT Gateways: ~$0.045/hour per gateway + data transfer
- VPC Flow Logs: CloudWatch Logs storage costs
- Elastic IPs: Free when attached to running resources

For development environments, consider reducing `az_count` to 2.

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

All resources are configured to be destroyed without retention policies.

## Troubleshooting

### NAT Gateway Issues
- Ensure Elastic IPs are available in your region
- Verify Internet Gateway is attached before NAT Gateway creation

### Subnet Exhaustion
- Default configuration uses /20 subnets (4,096 IPs per subnet)
- Adjust VPC CIDR or subnet sizing if more IPs needed

### Flow Log Issues
- Check IAM role has correct permissions
- Verify CloudWatch Logs quota in your region

## References

- [AWS VPC Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-best-practices.html)
- [PCI DSS Network Segmentation](https://www.pcisecuritystandards.org/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
