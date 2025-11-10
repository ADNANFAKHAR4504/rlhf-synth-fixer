# VPC Infrastructure with Multi-Tier Architecture

This Pulumi Python project deploys a production-ready VPC infrastructure with PCI-DSS compliant network segmentation for a fintech payment processing platform.

## Architecture Overview

The infrastructure creates a three-tier network architecture:

- **Public Tier**: Three subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for NAT Gateways and load balancers
- **Private Application Tier**: Three subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) for application workloads
- **Database Tier**: Three subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24) with no internet access

## AWS Resources Created

1. **VPC** (10.0.0.0/16) with DNS support
2. **9 Subnets** across 3 availability zones (ap-southeast-1a, 1b, 1c)
3. **Internet Gateway** for public internet access
4. **3 NAT Gateways** with Elastic IPs (one per AZ)
5. **Route Tables** for each tier with appropriate routing
6. **Network ACLs** with explicit security rules:
   - HTTPS (443) allowed from internet
   - SSH (22) allowed from VPC range
   - PostgreSQL (5432) allowed between app and database tiers
7. **VPC Flow Logs** stored in S3 with 90-day retention
8. **S3 Bucket** with encryption and lifecycle policy
9. **Transit Gateway** with VPC attachment for hybrid connectivity

## Security Features

- PCI-DSS compliant network segmentation
- Network ACLs with explicit deny-all and allow-specific rules
- Database tier isolated from internet
- Encrypted S3 bucket for Flow Logs
- Multi-AZ deployment for high availability
- Proper IAM roles with least privilege

## Deployment

### Prerequisites

- Python 3.7 or later
- Pulumi CLI installed
- AWS credentials configured
- AWS region set to ap-southeast-1

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Configure Pulumi
pulumi login

# Set AWS region
pulumi config set aws:region ap-southeast-1

# Set environment suffix (optional, defaults to 'dev')
pulumi config set env prod
# OR set via environment variable
export ENVIRONMENT_SUFFIX=prod
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

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private application subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `flow_logs_bucket_name`: S3 bucket name for Flow Logs
- `transit_gateway_id`: Transit Gateway identifier
- `transit_gateway_attachment_id`: Transit Gateway VPC attachment ID
- `availability_zones`: List of availability zones used

### Destroy

```bash
# Destroy all resources
pulumi destroy
```

## Testing

Run unit tests:

```bash
pytest tests/unit/
```

Run integration tests (requires AWS credentials):

```bash
pytest tests/integration/
```

## Cost Optimization

This infrastructure uses:
- NAT Gateways: Consider AWS PrivateLink or VPC endpoints to reduce NAT Gateway data transfer costs
- Multi-AZ deployment: Provides high availability but increases costs
- S3 lifecycle policy: Automatically deletes logs after 90 days to manage storage costs

## Compliance

This infrastructure meets PCI-DSS requirements for:
- Network segmentation (separate tiers for web, app, database)
- Encryption at rest (S3 bucket encryption)
- Logging and monitoring (VPC Flow Logs)
- Access control (Network ACLs and routing restrictions)

## Hybrid Connectivity

The Transit Gateway enables connectivity to on-premises networks:
1. Attach on-premises network via VPN or Direct Connect to Transit Gateway
2. Configure routing tables to allow traffic between VPC and on-premises
3. Update Network ACLs to allow required traffic

## Troubleshooting

- **NAT Gateway creation fails**: Ensure public subnets have Internet Gateway route
- **Flow Logs not appearing**: Check IAM role permissions for S3 access
- **Transit Gateway attachment timeout**: Verify subnet IDs are valid and in different AZs
