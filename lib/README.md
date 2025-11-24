# VPC Foundation Infrastructure

Production-grade VPC foundation for payment processing platform built with CDKTF Python.

## Architecture

This infrastructure creates:

- **VPC**: 10.0.0.0/16 CIDR with DNS hostnames and resolution enabled
- **Public Subnets**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
- **Private Subnets**: 3 subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across 3 AZs
- **Internet Gateway**: For public subnet internet access
- **NAT Gateways**: 3 NAT Gateways (one per AZ) with Elastic IPs
- **Route Tables**: Separate route tables for public and private subnets
- **Security Groups**:
  - web-sg: Ports 80/443 from 0.0.0.0/0
  - app-sg: Port 8080 from web-sg only
  - db-sg: Port 5432 from app-sg only
- **VPC Flow Logs**: Flow logs to CloudWatch with 7-day retention
- **IAM Role**: For VPC Flow Logs to write to CloudWatch

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform 1.5 or higher

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Initialize CDKTF (if not already done):
```bash
cdktf get
```

## Deployment

1. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX="prod"
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy infrastructure:
```bash
cdktf deploy
```

4. Confirm deployment when prompted.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `web_sg_id`: Web security group ID
- `app_sg_id`: Application security group ID
- `db_sg_id`: Database security group ID
- `nat_gateway_ids`: List of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway ID

## Testing

Run infrastructure validation:
```bash
cdktf diff
```

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Confirm destruction when prompted. All resources are configured to be fully destroyable.

## Security Considerations

- Security groups follow least-privilege principle
- Private subnets have no direct internet access (NAT only)
- VPC Flow Logs enabled for compliance and auditing
- All resources tagged with mandatory tags

## Cost Optimization

- NAT Gateways are the primary cost drivers (~$0.045/hour per gateway)
- Consider using a single NAT Gateway for non-production environments
- CloudWatch Log retention set to 7 days to minimize storage costs

## Compliance

This infrastructure supports PCI DSS compliance requirements:
- Network segmentation between tiers
- Flow logs for audit trails
- Least-privilege security group rules
- Multi-AZ redundancy

## Support

For issues or questions, contact the DevOps team.
