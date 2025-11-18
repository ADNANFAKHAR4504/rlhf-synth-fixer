# VPC Infrastructure for Digital Banking Platform

This project implements a production-ready VPC infrastructure with strict network segmentation for a digital banking platform using CDKTF with Python.

## Architecture Overview

The infrastructure creates a three-tier network architecture:

- **VPC**: 10.50.0.0/16 CIDR block in us-east-1 region
- **Public Subnets** (3): 10.50.0.0/24, 10.50.1.0/24, 10.50.2.0/24
- **Private Subnets** (3): 10.50.10.0/24, 10.50.11.0/24, 10.50.12.0/24
- **Database Subnets** (3): 10.50.20.0/24, 10.50.21.0/24, 10.50.22.0/24

### Key Components

1. **Internet Gateway**: Provides internet access for public subnets
2. **NAT Gateway**: Single NAT Gateway for cost optimization (reduces cost by 66% from 3 to 1)
3. **Route Tables**: Separate route tables for public, private, and database subnets
4. **Network ACLs**: Deny-by-default policy with explicit allow rules for HTTPS, SSH, and ephemeral ports
5. **Security Groups**: Three-tier security groups for ALB, ECS, and RDS
6. **VPC Flow Logs**: Stored in S3 with 7-day Glacier transition
7. **VPC Endpoints**: S3 (Gateway) and ECR (Interface) endpoints to reduce NAT costs

## Prerequisites

- Python 3.8 or higher
- Node.js 14+ (required by CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed (`npm install -g cdktf-cli`)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF providers:
```bash
cdktf get
```

## Deployment

### Set Environment Suffix

The environment suffix is used to ensure unique resource names:

```bash
export ENVIRONMENT_SUFFIX="prod-abc123"
```

### Deploy Infrastructure

1. Synthesize the Terraform configuration:
```bash
cdktf synth
```

2. Deploy the infrastructure:
```bash
cdktf deploy
```

3. Confirm the deployment when prompted.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_public_ip`: NAT Gateway public IP address
- `alb_security_group_id`: ALB security group ID
- `ecs_security_group_id`: ECS security group ID
- `rds_security_group_id`: RDS security group ID
- `s3_endpoint_id`: S3 VPC Endpoint ID
- `ecr_api_endpoint_id`: ECR API VPC Endpoint ID
- `ecr_dkr_endpoint_id`: ECR DKR VPC Endpoint ID
- `flow_logs_bucket_name`: VPC Flow Logs S3 bucket name

## Resource Naming

All resources include the environment suffix in their names following the pattern:
- `banking-{resource-type}-{environment-suffix}`

Example: `banking-vpc-prod-abc123`

## Cost Optimization

This implementation includes several cost optimizations:

1. **Single NAT Gateway**: Reduces cost from $96/month (3 NAT Gateways) to $32/month
2. **VPC Endpoints**: S3 Gateway endpoint is free; ECR Interface endpoints reduce NAT Gateway data transfer costs
3. **Glacier Transition**: Flow logs transition to Glacier after 7 days, reducing storage costs by up to 95%

## Security Features

1. **Network Segmentation**: Three-tier architecture with isolated subnets
2. **Network ACLs**: Deny-by-default policy with explicit allow rules
3. **Security Groups**: Least privilege access between tiers
4. **Flow Logs**: All VPC traffic logged to S3 for audit and monitoring
5. **Encryption**: S3 bucket configured with encryption at rest
6. **Private Endpoints**: ECR endpoints enable private container image pulls

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

Confirm the destruction when prompted. All resources are configured to be destroyable without manual intervention.

## Testing

The infrastructure can be validated using:

1. **Terraform Validate**:
```bash
cd cdktf.out/stacks/tap
terraform validate
```

2. **Terraform Plan**:
```bash
cdktf diff
```

3. **AWS CLI Verification**:
```bash
# Verify VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=banking-vpc-*"

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"

# Verify NAT Gateway
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>"
```

## Compliance

This infrastructure meets PCI-DSS requirements for network segmentation:

- Separate subnets for different workload tiers
- Network ACLs and security groups enforce traffic control
- Flow logs provide audit trail for all network traffic
- Private subnets prevent direct internet access to sensitive workloads

## Troubleshooting

### Common Issues

1. **NAT Gateway not ready**: Wait 2-3 minutes after creation before testing private subnet connectivity
2. **VPC Endpoint connection failures**: Ensure security groups allow traffic from subnet CIDR blocks
3. **Flow Logs not appearing**: S3 bucket permissions may need adjustment; check CloudWatch Logs for errors

### Debug Commands

```bash
# Check CDKTF version
cdktf --version

# View synthesized Terraform
cdktf synth

# Enable detailed logging
export CDKTF_LOG_LEVEL=debug
cdktf deploy
```

## Support

For issues or questions:
- Review the CDKTF documentation: https://developer.hashicorp.com/terraform/cdktf
- Check AWS VPC documentation: https://docs.aws.amazon.com/vpc/
- Review security group rules and NACL configurations in the code
