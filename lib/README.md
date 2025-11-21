# VPC Infrastructure for Financial Services Trading Platform

Production-ready three-tier VPC infrastructure built with Pulumi and Python for a financial services trading platform requiring PCI DSS compliance.

## Architecture

### Network Design

The infrastructure creates a fully isolated three-tier network architecture:

- **Public Tier** (3 subnets): 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  - Direct internet access via Internet Gateway
  - Hosts load balancers and NAT gateways
  - Network ACLs restrict inbound to ports 80 and 443

- **Private Tier** (3 subnets): 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
  - Internet access via NAT gateways (one per AZ)
  - Hosts application servers
  - No direct internet exposure

- **Isolated Tier** (3 subnets): 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
  - No internet connectivity whatsoever
  - Hosts RDS databases and sensitive data
  - Local VPC routes only

### Key Features

1. **High Availability**
   - Distributed across 3 availability zones in us-east-1
   - Dedicated NAT gateway per AZ for redundancy
   - No single points of failure

2. **Security and Compliance**
   - Network ACLs provide additional security layer for public subnets
   - Complete network segmentation between tiers
   - VPC Flow Logs capture all network traffic
   - Encrypted S3 bucket for flow log storage (AES-256)

3. **Monitoring**
   - VPC Flow Logs enabled for all traffic
   - S3 bucket versioning for audit trail
   - Lifecycle policy transitions logs to Glacier after 30 days

4. **Cost Optimization**
   - One NAT gateway per AZ (not per subnet)
   - S3 Glacier transition reduces long-term storage costs
   - All resources are destroyable for development testing

## Resources Created

### Networking
- 1 VPC (10.0.0.0/16 CIDR)
- 1 Internet Gateway
- 3 NAT Gateways (one per AZ)
- 9 Subnets (3 public, 3 private, 3 isolated)
- 7 Route Tables (1 public, 3 private, 3 isolated)
- 1 Network ACL for public subnets

### Storage and Monitoring
- 1 S3 bucket for VPC Flow Logs
- VPC Flow Logs resource
- Bucket versioning enabled
- Lifecycle policy (30-day Glacier transition)

### IAM
- 1 IAM role for VPC Flow Logs
- 1 IAM policy for S3 access

### IP Addressing
- 3 Elastic IPs for NAT gateways

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed (version 3.x or later)
- Python 3.8 or later
- pulumi-aws provider

## Deployment

### Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

### Deploy Infrastructure

```bash
# Preview changes
pulumi preview

# Deploy
pulumi up

# View outputs
pulumi stack output
```

### Outputs

The stack exports:
- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block (10.0.0.0/16)
- `public_subnet_ids`: Array of 3 public subnet IDs
- `private_subnet_ids`: Array of 3 private subnet IDs
- `isolated_subnet_ids`: Array of 3 isolated subnet IDs
- `nat_gateway_ids`: Array of 3 NAT gateway IDs
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket_name`: S3 bucket name for flow logs
- `flow_logs_bucket_arn`: S3 bucket ARN

## Resource Naming

All resources include the `environment_suffix` for uniqueness:
- VPC: `vpc-{environment_suffix}`
- Subnets: `public-subnet-{1-3}-{environment_suffix}`, etc.
- NAT Gateways: `nat-gateway-{1-3}-{environment_suffix}`
- S3 Bucket: `vpc-flow-logs-{environment_suffix}`

## Tagging Strategy

All resources are tagged with:
- `Environment`: production
- `Project`: trading-platform
- Additional provider-level tags (Repository, Author, PRNumber, Team)

## Routing Details

### Public Subnets
- Route to Internet Gateway (0.0.0.0/0 → IGW)
- Local VPC routes (10.0.0.0/16 → local)

### Private Subnets
- Route to NAT Gateway in same AZ (0.0.0.0/0 → NAT)
- Local VPC routes (10.0.0.0/16 → local)

### Isolated Subnets
- Local VPC routes only (10.0.0.0/16 → local)
- No internet routes

## Network ACLs

Public subnet Network ACL rules:
- Inbound: Allow ports 80, 443 from 0.0.0.0/0
- Inbound: Allow ephemeral ports 1024-65535 (return traffic)
- Inbound: Deny all other traffic
- Outbound: Allow all traffic

## Security Considerations

1. **Network Segmentation**: Clear boundaries between public, private, and isolated tiers
2. **Defense in Depth**: Network ACLs + Security Groups (to be added at instance level)
3. **No Direct Database Access**: Isolated tier has no internet connectivity
4. **Audit Trail**: VPC Flow Logs capture all network activity
5. **Encryption**: S3 bucket uses AES-256 encryption for flow logs

## PCI DSS Compliance

This architecture supports PCI DSS requirements:
- Network segmentation (Requirement 1.3)
- Secure network architecture (Requirement 1.2)
- Access logging and monitoring (Requirement 10)
- Encryption of data at rest (Requirement 3.4)

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured with `force_destroy=True` and have no retention policies, allowing complete cleanup.

## File Structure

```
lib/
├── __init__.py          # Package initialization
├── tap_stack.py         # Main VPC infrastructure stack
├── PROMPT.md            # Original requirements
├── MODEL_RESPONSE.md    # Implementation details
└── README.md            # This file

tap.py                   # Pulumi entry point
Pulumi.yaml             # Pulumi configuration
```

## Extending the Infrastructure

To add resources to this VPC:

1. Import the TapStack in your code
2. Reference the subnet IDs from stack outputs
3. Use appropriate subnet tier for your resource:
   - Load balancers → public subnets
   - Application servers → private subnets
   - Databases → isolated subnets

Example:

```python
from lib.tap_stack import TapStack

# Access subnet IDs from stack
public_subnets = stack.public_subnets
private_subnets = stack.private_subnets
isolated_subnets = stack.isolated_subnets
```

## Support

For issues or questions about this infrastructure, refer to:
- PROMPT.md: Original requirements
- MODEL_RESPONSE.md: Detailed implementation notes
