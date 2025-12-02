# Multi-Tier VPC Architecture for Payment Processing Platform

## Overview

This Terraform configuration deploys a production-grade, PCI DSS compliant multi-tier VPC architecture for a payment processing application. The infrastructure provides network segmentation and isolation between different application tiers.

## Architecture

### Network Topology

- **VPC**: 10.0.0.0/16 in us-east-1
- **Public Subnets** (3 AZs): 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  - For Application Load Balancers
  - Internet-facing with Internet Gateway
- **Private Subnets** (3 AZs): 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
  - For application servers
  - Internet access via NAT Gateways
- **Database Subnets** (3 AZs): 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
  - For RDS instances
  - No internet routing (isolated)

### High Availability

- Resources deployed across 3 availability zones
- 2 NAT Gateways for redundancy (AZ-1 and AZ-2)
- Separate route tables for each private subnet

### Security Features

#### Security Groups (Stateful)
- **Web Tier SG**: Allows HTTP (80) and HTTPS (443) from internet
- **App Tier SG**: Allows port 8080 from web tier only
- **Database Tier SG**: Allows port 5432 from app tier only

#### Network ACLs (Stateless)
- **Public Subnets**: Allow HTTP/HTTPS inbound, all outbound
- **Private Subnets**: Allow port 8080 inbound, port 5432 outbound to database
- **Database Subnets**: Allow port 5432 from VPC only

#### Monitoring
- VPC Flow Logs enabled for all traffic
- Logs sent to CloudWatch Logs
- 7-day retention for security analysis

## Prerequisites

- Terraform 1.5 or later
- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, EC2, CloudWatch, and S3 services

## File Structure

```
lib/
├── main.tf           # VPC, subnets, routing, security groups, NACLs, flow logs
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── provider.tf       # Provider configuration
└── README.md         # This file
```

## Usage

### 1. Initialize Terraform

```bash
cd lib/
terraform init
```

### 2. Review Configuration

```bash
terraform plan
```

### 3. Deploy Infrastructure

```bash
terraform apply
```

### 4. Verify Outputs

```bash
terraform output
```

## Variables

### Required Variables

No required variables - all have defaults.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | us-east-1 |
| `environment_suffix` | Environment suffix for resource naming | dev |
| `vpc_cidr` | VPC CIDR block | 10.0.0.0/16 |
| `public_subnet_cidrs` | Public subnet CIDR blocks | ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"] |
| `private_subnet_cidrs` | Private subnet CIDR blocks | ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"] |
| `database_subnet_cidrs` | Database subnet CIDR blocks | ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"] |

### Example Variable Override

```bash
terraform apply \
  -var="environment_suffix=prod" \
  -var="aws_region=us-east-1"
```

Or create a `terraform.tfvars` file:

```hcl
environment_suffix = "prod"
aws_region        = "us-east-1"
```

## Outputs

### Key Outputs

- `vpc_id`: VPC identifier
- `subnet_ids_by_tier`: Subnets grouped by tier (public, private, database)
- `nat_gateway_public_ips`: Elastic IPs for NAT Gateways
- `security_group_ids_by_tier`: Security groups by tier

### Using Outputs in Other Modules

```hcl
module "vpc" {
  source = "./lib"

  environment_suffix = "prod"
}

# Reference outputs
resource "aws_instance" "app" {
  subnet_id              = module.vpc.private_subnet_ids[0]
  vpc_security_group_ids = [module.vpc.app_security_group_id]
  # ...
}
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{identifier}-{environment_suffix}`

Examples:
- VPC: `vpc-prod`
- Public Subnet 1: `public-subnet-1-prod`
- NAT Gateway 1: `nat-gateway-1-prod`
- Web Security Group: `web-sg-prod-{random}`

## Cost Considerations

### Ongoing Costs

1. **NAT Gateways** (2 instances)
   - ~$0.045/hour per NAT Gateway
   - ~$65/month total
   - Plus data processing charges

2. **VPC Flow Logs**
   - CloudWatch Logs storage
   - Minimal cost (~$0.50/GB ingested)

3. **Elastic IPs** (2 for NAT Gateways)
   - No charge when attached to running NAT Gateway

### Cost Optimization Tips

- Consider single NAT Gateway for dev/test environments
- Adjust Flow Logs retention period (default: 7 days)
- Use VPC endpoints for AWS services to reduce NAT Gateway data transfer costs

## Security Best Practices

1. **Network Segmentation**: Each tier isolated with dedicated subnets
2. **Least Privilege**: Security groups allow only required traffic
3. **Defense in Depth**: Both security groups and NACLs implemented
4. **No Direct Database Access**: Database subnets have no internet routing
5. **Monitoring**: VPC Flow Logs capture all network traffic

## PCI DSS Compliance Considerations

This architecture supports PCI DSS compliance requirements:

- **Requirement 1**: Firewall configuration (security groups, NACLs)
- **Requirement 1.3.4**: Network segmentation between tiers
- **Requirement 10**: VPC Flow Logs for audit trails
- **Requirement 2.2.1**: Only one primary function per server (subnet isolation)

## Troubleshooting

### Common Issues

1. **NAT Gateway timeout during creation**
   - Wait for Internet Gateway to be fully attached
   - Solution already handled via `depends_on`

2. **Insufficient IP addresses**
   - /24 subnets provide 251 usable IPs each
   - Adjust subnet CIDRs if more IPs needed

3. **Flow Logs not appearing**
   - Check IAM role permissions
   - Verify CloudWatch Log Group exists
   - Allow 10-15 minutes for initial logs

### Validation Commands

```bash
# Verify VPC
aws ec2 describe-vpcs --vpc-ids $(terraform output -raw vpc_id)

# Check NAT Gateway status
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=$(terraform output -raw vpc_id)"

# View Flow Logs
aws logs tail /aws/vpc/flowlogs-{environment_suffix} --follow
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: Ensure no resources (EC2, RDS, etc.) are running in the VPC before destroying.

## Additional Resources

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [PCI DSS Network Segmentation](https://www.pcisecuritystandards.org/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Support

For issues or questions:
1. Check Terraform plan output for errors
2. Review AWS CloudWatch Logs
3. Verify IAM permissions
4. Consult AWS VPC documentation
