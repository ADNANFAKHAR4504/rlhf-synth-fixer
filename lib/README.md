# Production VPC Infrastructure for Payment Processing

This CDK Python application creates a production-grade VPC infrastructure for a fintech payment processing platform with PCI DSS compliance requirements.

## Architecture

### Network Design

- **VPC CIDR**: 10.50.0.0/16
- **Availability Zones**: 3 (us-east-1a, us-east-1b, us-east-1c)
- **Public Subnets**: 10.50.1.0/24, 10.50.2.0/24, 10.50.3.0/24
- **Private Subnets**: 10.50.11.0/24, 10.50.12.0/24, 10.50.13.0/24

### Key Components

1. **VPC**: Custom CIDR 10.50.0.0/16 with DNS support enabled
2. **Internet Gateway**: Provides internet access for public subnets
3. **NAT Instances**: 3x t3.micro EC2 instances (cost-optimized alternative to NAT Gateways)
4. **Network ACLs**: Custom ACLs with explicit allow rules for public and private tiers
5. **Route Tables**: Dedicated route table per subnet (6 total)
6. **VPC Flow Logs**: 60-second interval logging to CloudWatch Logs
7. **VPC Endpoints**: S3 and DynamoDB gateway endpoints for private subnet access
8. **Security Groups**: Least-privilege security groups (no 0.0.0.0/0 usage)

### Security Features

- Network segmentation between public and private tiers
- Custom Network ACLs with explicit rules only
- NAT instances with source/destination check disabled
- VPC Flow Logs capturing all traffic
- Private subnet access to AWS services via VPC endpoints
- Mandatory resource tagging (Environment, Team, CostCenter)

## Prerequisites

- Python 3.9 or higher
- AWS CDK 2.x
- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, EC2, CloudWatch Logs, and IAM operations

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Or using Pipenv
pipenv install
```

## Deployment

### Basic Deployment

```bash
# Deploy with default environment suffix
cdk deploy
```

### Custom Environment Suffix

```bash
# Deploy with custom suffix for PR environments
cdk deploy -c environmentSuffix=pr123
```

### Specify AWS Account and Region

```bash
# Deploy to specific account/region
cdk deploy -c account=123456789012 -c region=us-east-1
```

## Configuration

### Environment Suffix

The `environmentSuffix` parameter is used for all resource names to support multiple environments:

```bash
cdk deploy -c environmentSuffix=staging
```

This creates resources like:
- `payment-vpc-staging`
- `nat-instance-1-staging`
- `public-subnet-1-staging`

### Resource Tags

All resources are automatically tagged with:
- **Environment**: production
- **Team**: platform
- **CostCenter**: engineering

## Testing

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/

# Run specific test file
pytest tests/unit/test_vpc_stack.py
```

## Cost Optimization

This infrastructure uses **NAT instances** (t3.micro) instead of managed NAT Gateways, providing significant cost savings:

- **NAT Gateway**: ~$32/month per AZ = $96/month for 3 AZs
- **NAT Instance (t3.micro)**: ~$7.50/month per AZ = $22.50/month for 3 AZs
- **Savings**: ~$73.50/month (~76% cost reduction)

Trade-offs:
- Manual management and monitoring required
- Lower throughput compared to NAT Gateways (suitable for non-critical workloads)
- No automatic high availability (consider ASG for production)

## Outputs

After deployment, the stack outputs:

- **VpcId**: The VPC identifier
- **VpcCidr**: The VPC CIDR block (10.50.0.0/16)

## Compliance

This infrastructure supports PCI DSS compliance requirements:

- Network segmentation with isolated private subnets
- Custom Network ACLs with explicit rules
- VPC Flow Logs for security monitoring
- Least-privilege security groups
- Encrypted logging to CloudWatch

## Cleanup

```bash
# Destroy all resources
cdk destroy

# Destroy specific environment
cdk destroy -c environmentSuffix=pr123
```

**Note**: All resources are configured with `DESTROY` removal policy for easy cleanup.

## Troubleshooting

### NAT Instance Connectivity Issues

If private subnets cannot reach the internet:

1. Verify NAT instance is running
2. Check source/destination check is disabled
3. Verify route tables point to NAT instance
4. Check security group rules allow traffic from private subnets

### VPC Flow Logs Not Appearing

1. Check IAM role permissions for Flow Logs
2. Verify CloudWatch Log Group exists
3. Check 60-second aggregation interval in configuration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VPC (10.50.0.0/16)                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Internet Gateway                        │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                    │
│  ┌────────────────────┴────────────────────────────────┐  │
│  │           Public Subnets (3 AZs)                    │  │
│  │  10.50.1.0/24 | 10.50.2.0/24 | 10.50.3.0/24        │  │
│  │    NAT-1      |    NAT-2      |    NAT-3            │  │
│  └────────┬────────────┬─────────────┬─────────────────┘  │
│           │            │             │                     │
│  ┌────────┴────────────┴─────────────┴─────────────────┐  │
│  │          Private Subnets (3 AZs)                    │  │
│  │  10.50.11.0/24 | 10.50.12.0/24 | 10.50.13.0/24     │  │
│  │                                                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │   VPC Endpoints (S3, DynamoDB)               │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  VPC Flow Logs → CloudWatch Logs                           │
└─────────────────────────────────────────────────────────────┘
```

## Additional Resources

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS CDK Python Reference](https://docs.aws.amazon.com/cdk/api/v2/python/)
- [PCI DSS Compliance Guide](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
