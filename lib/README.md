# Financial Services VPC Infrastructure - CDKTF Python

This project deploys a production-ready VPC infrastructure for a financial services digital banking platform using CDKTF with Python.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with CIDR 10.0.0.0/16 in eu-west-1 region
- **Subnets**: 6 subnets across 3 availability zones (1 public + 1 private per AZ)
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: 3 NAT Gateways (one per AZ) for high availability
- **Route Tables**: Separate route tables for public and private subnets
- **VPC Flow Logs**: All network traffic logged to S3 with 30-day Glacier transition
- **Network ACLs**: Custom deny-all baseline for enhanced security
- **S3 Bucket**: Versioned bucket for flow logs storage

### Subnet Layout

| Subnet Type | AZ | CIDR Block | Purpose |
|-------------|-----|------------|---------|
| Public 1 | eu-west-1a | 10.0.0.0/24 | Load balancers, bastion hosts |
| Public 2 | eu-west-1b | 10.0.1.0/24 | Load balancers, bastion hosts |
| Public 3 | eu-west-1c | 10.0.2.0/24 | Load balancers, bastion hosts |
| Private 1 | eu-west-1a | 10.0.10.0/24 | Application tier |
| Private 2 | eu-west-1b | 10.0.11.0/24 | Application tier |
| Private 3 | eu-west-1c | 10.0.12.0/24 | Application tier |

## Prerequisites

- Python 3.8 or higher
- Node.js 16+ (required by CDKTF)
- Terraform 1.5 or higher
- AWS CLI configured with appropriate credentials
- CDKTF CLI installed: `npm install -g cdktf-cli`

## AWS Permissions Required

The AWS credentials must have permissions for:

- VPC and subnet management
- Internet Gateway and NAT Gateway creation
- Route table management
- Elastic IP allocation
- S3 bucket creation and configuration
- VPC Flow Logs configuration
- Network ACL management

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Initialize CDKTF providers:

```bash
cdktf get
```

## Configuration

The infrastructure is configured with:

- **Region**: eu-west-1 (Ireland)
- **Environment Suffix**: "prod" (can be customized)
- **VPC CIDR**: 10.0.0.0/16
- **Availability Zones**: eu-west-1a, eu-west-1b, eu-west-1c

To use a different environment suffix, modify the `VpcStack` instantiation in `main.py`:

```python
VpcStack(app, "financial-vpc", environment_suffix="staging")
```

## Deployment

1. Synthesize the Terraform configuration:

```bash
cdktf synth
```

This generates Terraform JSON configuration in the `cdktf.out` directory.

2. Deploy the infrastructure:

```bash
cdktf deploy
```

You will be prompted to approve the changes before deployment proceeds.

3. View outputs after deployment:

```bash
cdktf output
```

## Outputs

The stack provides the following outputs:

- **vpc_id**: The VPC identifier
- **public_subnet_ids**: Array of public subnet IDs
- **private_subnet_ids**: Array of private subnet IDs
- **nat_gateway_ips**: Array of NAT Gateway public IP addresses
- **flow_logs_bucket**: S3 bucket name containing VPC Flow Logs

## Testing

### Manual Verification

1. Verify VPC creation:

```bash
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-prod" --region eu-west-1
```

2. Check subnet distribution:

```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>" --region eu-west-1
```

3. Verify NAT Gateways are running:

```bash
aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>" --region eu-west-1
```

4. Check VPC Flow Logs:

```bash
aws ec2 describe-flow-logs --filter "Name=resource-id,Values=<vpc-id>" --region eu-west-1
```

5. Verify S3 bucket and lifecycle policy:

```bash
aws s3api get-bucket-versioning --bucket vpc-flow-logs-prod-financial-vpc
aws s3api get-bucket-lifecycle-configuration --bucket vpc-flow-logs-prod-financial-vpc
```

### Connectivity Testing

1. Launch an EC2 instance in a private subnet
2. Verify it can reach the internet through the NAT Gateway:

```bash
# From the instance
curl -I https://www.google.com
```

3. Verify flow logs are being generated in S3

## Security Considerations

- **Network ACLs**: Default deny-all baseline implemented. Modify `NetworkAcl` configuration to add specific allow rules based on your application requirements.
- **Flow Logs**: All network traffic is logged for audit and compliance purposes.
- **Private Subnets**: Application tier resources have no direct internet access; all outbound traffic routes through NAT Gateways.
- **S3 Bucket**: Public access is blocked on the flow logs bucket.

## Cost Optimization

The infrastructure includes several cost considerations:

- **NAT Gateways**: Most expensive component (~$0.045/hour per gateway + data transfer). Consider using a single NAT Gateway in non-production environments.
- **S3 Glacier Transition**: Flow logs automatically transition to Glacier after 30 days to reduce storage costs.
- **Elastic IPs**: Charged when not associated with a running instance (handled by NAT Gateway association).

## Cleanup

To destroy all infrastructure:

```bash
cdktf destroy
```

Confirm the destruction when prompted. All resources including the S3 bucket will be removed (force_destroy is enabled).

## Troubleshooting

### Provider Download Issues

If CDKTF fails to download providers, manually initialize:

```bash
cdktf get
```

### Terraform State Conflicts

If multiple team members are deploying, consider using remote state:

```python
# Add to VpcStack.__init__
from cdktf import S3Backend

S3Backend(self,
    bucket="your-terraform-state-bucket",
    key="financial-vpc/terraform.tfstate",
    region="eu-west-1"
)
```

### NAT Gateway Creation Timeout

NAT Gateways can take several minutes to provision. If deployment times out, increase the timeout or retry.

## Compliance and Audit

- **VPC Flow Logs**: Retained in S3 with versioning for audit trail
- **Tagging**: All resources tagged with Environment=Production and Project=DigitalBanking
- **Network Isolation**: Private subnets have no direct internet access
- **Immutable Infrastructure**: All resources can be destroyed and recreated

## Future Enhancements

- Add VPC endpoints for S3 and other AWS services to reduce NAT Gateway costs
- Implement Transit Gateway for multi-VPC connectivity
- Add AWS Config rules for continuous compliance monitoring
- Implement additional Network ACL rules based on application requirements
- Add CloudWatch alarms for NAT Gateway metrics
- Implement VPC peering or PrivateLink for cross-VPC communication

## Support

For issues or questions:

1. Review AWS VPC documentation
2. Check CDKTF Python provider documentation
3. Review Terraform AWS provider documentation
4. Consult with the infrastructure team

## License

Internal use only - Financial Services Digital Banking Platform
