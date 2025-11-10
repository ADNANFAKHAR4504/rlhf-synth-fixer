# Three-Tier VPC Architecture for Payment Processing

This Pulumi Python infrastructure code creates a comprehensive three-tier VPC architecture for a payment processing platform with proper network segmentation and security controls.

## Architecture Overview

### Network Tiers

1. **Public Tier** (3 subnets across 3 AZs)
   - CIDR: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Contains: Internet Gateway, NAT Gateways
   - Purpose: Load balancers and public-facing resources

2. **Private Tier** (3 subnets across 3 AZs)
   - CIDR: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Contains: Application servers
   - Internet access: Through NAT Gateways (outbound only)

3. **Database Tier** (3 subnets across 3 AZs)
   - CIDR: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Contains: Database resources
   - No internet routing (completely isolated)

### Security Groups

- **Web Tier SG**: Allows HTTPS (port 443) from internet
- **App Tier SG**: Allows port 8080 from web tier only
- **Database Tier SG**: Allows PostgreSQL (port 5432) from app tier only

### High Availability

- Resources span 3 availability zones in us-east-1
- Each private subnet has its own NAT Gateway for redundancy
- Proper subnet sizing (/24 = 256 IPs, 251 usable)

### Monitoring

- VPC Flow Logs enabled and sent to S3 bucket
- All traffic (accepted, rejected, and all) is logged
- Logs stored in dedicated S3 bucket with proper ACLs

## Deployment

### Prerequisites

- Python 3.9 or higher
- Pulumi CLI 3.x or higher
- AWS credentials configured
- boto3 installed

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Configure AWS region (if not already configured)
pulumi config set aws:region us-east-1

# Set environment suffix (optional, defaults to 'dev')
export ENVIRONMENT_SUFFIX=dev
```

### Deploy

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Outputs

The stack exports the following outputs:

- `vpc_id`: The VPC ID
- `vpc_cidr`: The VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `web_security_group_id`: Web tier security group ID
- `app_security_group_id`: App tier security group ID
- `database_security_group_id`: Database tier security group ID
- `nat_gateway_ids`: List of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket`: S3 bucket name for VPC flow logs

## Testing

```bash
# Run Pulumi refresh to verify state
pulumi refresh

# Export outputs to JSON
pulumi stack output --json > outputs.json
```

## Cleanup

```bash
# Destroy all resources
pulumi destroy
```

## Compliance

This infrastructure meets PCI DSS requirements:

- Network segmentation between tiers
- Explicit security group rules with least privilege
- VPC flow logs for security monitoring
- No direct internet access for database tier
- High availability across multiple AZs

## Cost Optimization

- NAT Gateways are the most expensive resources (~$0.045/hour each + data transfer)
- Consider using a single NAT Gateway for dev environments
- VPC Flow Logs to S3 is cost-effective for log storage
- All resources use standard AWS pricing (no reserved instances required)
