# Payment Processing Platform VPC Infrastructure

This infrastructure creates a production-ready VPC for a payment processing platform with PCI DSS compliance considerations.

## Architecture

### Network Layout

- **VPC CIDR**: 10.0.0.0/16
- **Region**: us-east-1
- **Availability Zones**: 3 (us-east-1a, us-east-1b, us-east-1c)

### Subnets

**Public Subnets** (3x /24):
- 10.0.1.0/24 (AZ-a) - Load Balancers
- 10.0.2.0/24 (AZ-b) - Load Balancers
- 10.0.3.0/24 (AZ-c) - Load Balancers

**Application Tier Private Subnets** (3x /23):
- 10.0.16.0/23 (AZ-a) - Application Servers
- 10.0.18.0/23 (AZ-b) - Application Servers
- 10.0.20.0/23 (AZ-c) - Application Servers

**Database Tier Private Subnets** (3x /23):
- 10.0.32.0/23 (AZ-a) - Databases
- 10.0.34.0/23 (AZ-b) - Databases
- 10.0.36.0/23 (AZ-c) - Databases

### Components

1. **VPC**: Custom VPC with DNS support enabled
2. **Internet Gateway**: For public subnet internet access
3. **NAT Instances**: t3.micro instances in each public subnet for private subnet outbound connectivity
4. **Route Tables**: Separate route tables for public and private subnets
5. **Network ACLs**: Custom ACLs allowing only HTTPS (443), SSH (22) from specific IP, and ephemeral ports
6. **Security Groups**: Three-tier security groups (Web, App, DB) with least-privilege rules
7. **Transit Gateway**: For multi-region connectivity readiness
8. **VPC Flow Logs**: Enabled with S3 storage and 90-day retention
9. **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB

## Security Features

- **Network Segmentation**: Strict separation between public, application, and database tiers
- **Least Privilege**: Security groups follow least-privilege principle
- **Encryption**: S3 bucket encryption for flow logs
- **Flow Logs**: All VPC traffic logged for compliance and auditing
- **Private Connectivity**: VPC endpoints to avoid internet routing for AWS services
- **NAT Instances**: Cost-effective outbound internet access with source/destination check disabled

## PCI DSS Compliance Considerations

- Network segmentation between tiers
- Flow logs for network traffic monitoring
- Restricted ingress rules (no 0.0.0.0/0 for SSH)
- Encryption at rest for flow logs
- Consistent tagging for resource tracking

## Resource Naming

All resources follow the naming convention: `payment-{resource-type}-{environmentSuffix}`

## Tags

All resources are tagged with:
- **Name**: Resource identifier
- **Environment**: Environment suffix
- **Project**: PaymentProcessing
- **CostCenter**: FinTech

## Deployment

```bash
# Install dependencies
npm install

# Configure environment
export ENVIRONMENT_SUFFIX="your-env-suffix"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy
```

## Outputs

The infrastructure exports the following outputs for use by other stacks:
- VPC ID
- Public Subnet IDs
- Application Subnet IDs
- Database Subnet IDs
- Security Group IDs
- Transit Gateway ID
- VPC Endpoint IDs

## Cost Considerations

- **NAT Instances**: Using t3.micro instances instead of NAT Gateways (~$0.01/hr vs ~$0.045/hr)
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB are free
- **Transit Gateway**: Charges apply for attachments and data transfer

## Maintenance

- NAT instances use Amazon Linux 2023 with automatic security updates
- Flow logs automatically expire after 90 days
- Review security group rules quarterly for compliance
