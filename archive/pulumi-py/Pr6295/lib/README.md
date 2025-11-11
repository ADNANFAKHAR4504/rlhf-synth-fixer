# VPC Infrastructure for Payment Processing Platform

Production-ready VPC infrastructure with PCI-DSS compliance for fintech payment processing applications.

## Overview

This Pulumi Python implementation creates a secure, multi-AZ VPC infrastructure with proper network segmentation, NAT Gateways for outbound connectivity, Network ACLs for traffic control, and VPC Flow Logs for security monitoring.

## Architecture

### Network Design
- **VPC CIDR**: 10.0.0.0/16
- **Availability Zones**: us-east-1a, us-east-1b, us-east-1c
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24

### Components

1. **VPC**
   - DNS hostnames enabled
   - DNS support enabled
   - CIDR: 10.0.0.0/16

2. **Subnets**
   - 3 public subnets (one per AZ) for load balancers
   - 3 private subnets (one per AZ) for application servers
   - Auto-assign public IP enabled for public subnets

3. **Internet Gateway**
   - Named format: `igw-{environment}-us-east-1`
   - Attached to VPC for public internet access

4. **NAT Gateways**
   - One NAT Gateway per availability zone (3 total)
   - Elastic IP for each NAT Gateway
   - Provides outbound internet for private subnets

5. **Route Tables**
   - 1 public route table (shared across public subnets)
   - 3 private route tables (one per AZ with respective NAT Gateway)
   - Explicit subnet associations

6. **Network ACLs**
   - Inbound: HTTP (80), HTTPS (443), Ephemeral ports (1024-65535)
   - Outbound: All traffic allowed
   - Applied to public subnets only

7. **VPC Flow Logs**
   - Captures ALL traffic (ACCEPT and REJECT)
   - Sends to CloudWatch Log Group
   - IAM role and policy for Flow Logs service
   - 7-day retention period

## File Structure

```
lib/
├── __init__.py
├── tap_stack.py           # Main infrastructure stack
├── PROMPT.md              # Human-readable requirements
├── IDEAL_RESPONSE.md      # Complete solution documentation
├── MODEL_RESPONSE.md      # Model-generated response
├── MODEL_FAILURES.md      # Common issues and corrections
├── AWS_REGION             # Target region (us-east-1)
└── README.md              # This file

tests/
└── unit/
    └── test_tap_stack.py  # Comprehensive unit tests
```

## Prerequisites

- Python 3.8 or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Required Python packages:
  ```bash
  pip install pulumi pulumi-aws
  ```

## Deployment

### 1. Configure Environment

```bash
# Set environment suffix (optional, defaults to 'dev')
export ENVIRONMENT_SUFFIX=dev

# Or use Pulumi config
pulumi config set env dev

# Configure AWS region
pulumi config set aws:region us-east-1
```

### 2. Preview Changes

```bash
pulumi preview
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

### 4. View Outputs

```bash
pulumi stack output vpc_id
pulumi stack output public_subnet_ids
pulumi stack output private_subnet_ids
pulumi stack output nat_gateway_ids
pulumi stack output internet_gateway_id
pulumi stack output flow_log_id
pulumi stack output flow_log_group_name
```

### 5. Destroy Infrastructure

```bash
pulumi destroy
```

## Testing

Run unit tests:

```bash
# Run all tests
python -m pytest tests/unit/test_tap_stack.py -v

# Or using unittest
python -m unittest tests.unit.test_tap_stack
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment_suffix}-{optional-details}`

Examples:
- VPC: `vpc-dev`
- Internet Gateway: `igw-dev-us-east-1`
- Public Subnet: `public-subnet-dev-us-east-1a`
- Private Subnet: `private-subnet-dev-us-east-1a`
- NAT Gateway: `nat-dev-us-east-1a`
- Route Table: `public-rt-dev` or `private-rt-dev-us-east-1a`

## Tagging Strategy

All resources include the following tags:
- **Name**: Resource-specific name with environment suffix
- **Environment**: Environment identifier (dev, staging, prod)
- **Tier**: Network tier (public, private)
- **Purpose**: Resource purpose description
- **Repository**: Source repository (from env var)
- **Author**: Commit author (from env var)

## Security Features

1. **Network Segmentation**
   - Public subnets isolated from private subnets
   - Private subnets have no direct internet access

2. **Network ACLs**
   - Restrict public subnet inbound to HTTP/HTTPS only
   - Explicit deny rules for all other traffic

3. **VPC Flow Logs**
   - All network traffic logged to CloudWatch
   - Retention for security analysis and compliance

4. **NAT Gateway per AZ**
   - Outbound traffic from private subnets controlled
   - No inbound connections to private resources

## Compliance

This infrastructure meets PCI-DSS requirements for:
- Network segmentation (Requirement 1.2)
- Firewall configuration (Requirement 1.3)
- Logging and monitoring (Requirement 10)
- Proper tagging for audit trails

## Cost Considerations

Monthly cost estimates (us-east-1):
- NAT Gateways: ~$97.20 (3 gateways × $32.40/mo)
- Data processing: Variable based on traffic
- CloudWatch Logs: Minimal (7-day retention)
- Other resources: Free tier eligible

To reduce costs:
- Use fewer NAT Gateways (single AZ)
- Reduce log retention period
- Use VPC endpoints for AWS services

## Troubleshooting

### Common Issues

1. **Deployment Fails with IAM Permission Error**
   - Ensure AWS credentials have sufficient permissions
   - Required permissions: ec2:*, logs:*, iam:*

2. **NAT Gateway Creation Times Out**
   - NAT Gateways take 2-5 minutes to create
   - Ensure Elastic IPs are available in region

3. **Flow Logs Not Appearing**
   - Wait 5-10 minutes after deployment
   - Check IAM role has correct permissions
   - Verify CloudWatch Log Group exists

### Validation

Verify deployment:

```bash
# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-dev"

# Check subnets
aws ec2 describe-subnets --filters "Name=tag:Environment,Values=dev"

# Check NAT Gateways
aws ec2 describe-nat-gateways --filter "Name=tag:Environment,Values=dev"

# Check Flow Logs
aws ec2 describe-flow-logs --filter "Name=tag:Environment,Values=dev"
```

## Outputs

The stack exports the following outputs:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway ID
- `flow_log_id`: VPC Flow Log ID
- `flow_log_group_name`: CloudWatch Log Group name

## Support

For issues or questions:
1. Check PROMPT.md for requirements
2. Review MODEL_FAILURES.md for common issues
3. Examine IDEAL_RESPONSE.md for complete solution

## License

This infrastructure code is generated for educational and development purposes.
