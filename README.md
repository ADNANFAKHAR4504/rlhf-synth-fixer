# Payment Processing VPC Infrastructure

Production-ready VPC infrastructure for payment processing with PCI-DSS compliance features.

## Architecture Overview

This infrastructure creates a highly available, multi-AZ VPC with:

- **VPC**: 10.0.0.0/16 CIDR block with DNS enabled
- **Public Subnets**: 3 subnets across AZs (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Private Subnets**: 3 subnets across AZs (10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23)
- **NAT Gateways**: One per AZ for high availability
- **Network ACLs**: Restrictive rules allowing only HTTP/HTTPS/SSH
- **VPC Flow Logs**: All traffic logged to encrypted S3 with 30-day retention

## Prerequisites

- Python 3.8 or higher
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Installation

1. Clone the repository and navigate to the project directory

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

1. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

2. Configure AWS region and environment suffix:
```bash
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev
```

## Deployment

Deploy the infrastructure:
```bash
pulumi up
```

Review the changes and confirm to proceed.

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `vpc_cidr`: VPC CIDR block
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `availability_zones`: List of availability zones used
- `nat_gateway_ids`: List of NAT Gateway IDs
- `nat_gateway_public_ips`: Public IPs of NAT Gateways
- `internet_gateway_id`: Internet Gateway ID
- `flow_logs_bucket`: S3 bucket for VPC Flow Logs

View outputs:
```bash
pulumi stack output
```

## Testing

Run unit tests:
```bash
pytest test/unit/ -v --cov=. --cov-report=html
```

Run integration tests (requires deployed infrastructure):
```bash
pytest test/integration/ -v
```

## Cost Optimization Notes

- **NAT Gateways**: Most expensive component (~$0.045/hour per gateway = ~$97/month for 3 gateways)
- **VPC Flow Logs**: Storage costs depend on traffic volume
- **Elastic IPs**: Free when associated with running instances

## Security Considerations

- Network segmentation between public and private tiers
- Network ACLs restrict inbound traffic to essential ports
- VPC Flow Logs enabled for audit and compliance
- S3 bucket encryption enabled with AES256
- Public access blocked on S3 bucket

## PCI-DSS Compliance Features

- Network segmentation for payment data isolation
- Comprehensive logging with VPC Flow Logs
- Encrypted storage for logs
- High availability across multiple AZs

## Cleanup

Destroy all resources:
```bash
pulumi destroy
```
