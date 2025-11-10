# Financial Services VPC Infrastructure

Production-ready VPC infrastructure for financial services applications using CDKTF with TypeScript.

## Architecture Overview

This infrastructure creates a highly available, secure VPC across three availability zones in us-east-1:

- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) for internet-facing resources
- **Private Subnets**: 3 subnets (10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24) for internal services
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: One per AZ for private subnet outbound traffic
- **Network ACLs**: Explicitly deny SSH from internet, allow all other traffic
- **VPC Flow Logs**: All network traffic logged to encrypted S3 bucket
- **CloudWatch Alarms**: Monitor NAT Gateway traffic patterns

## Security Features

### Network Isolation
- Public/private subnet segregation
- Private subnets have no direct internet access
- All outbound traffic from private subnets goes through NAT Gateways

### Access Controls
- Network ACLs deny inbound SSH (port 22) from 0.0.0.0/0
- Explicit route table associations (no main route table dependency)

### Audit and Compliance
- VPC Flow Logs capture all network traffic
- Flow logs stored in S3 with AES256 encryption
- 90-day retention policy on flow logs
- CloudWatch alarms for anomalous NAT Gateway traffic

## Prerequisites

- Node.js 18+ and npm
- CDKTF CLI: `npm install -g cdktf-cli`
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="prod"
export AWS_REGION="us-east-1"
```

### 3. Synthesize Terraform Configuration

```bash
cdktf synth
```

### 4. Deploy Infrastructure

```bash
cdktf deploy
```

### 5. Verify Deployment

```bash
# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=financial-vpc-${ENVIRONMENT_SUFFIX}"

# Check Flow Logs
aws ec2 describe-flow-logs --filter "Name=resource-type,Values=VPC"

# Check CloudWatch Alarms
aws cloudwatch describe-alarms --alarm-name-prefix "nat-gateway"
```

## Outputs

After deployment, the stack provides the following outputs:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: Array of public subnet IDs
- `private_subnet_ids`: Array of private subnet IDs
- `nat_gateway_ids`: Array of NAT Gateway IDs
- `internet_gateway_id`: Internet Gateway identifier
- `flow_logs_bucket`: S3 bucket name for VPC Flow Logs

These outputs are available in `cfn-outputs/flat-outputs.json` for integration testing.

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

## Cost Considerations

Main cost drivers:
- **NAT Gateways**: ~$0.045/hour per gateway × 3 = ~$97/month
- **Data Transfer**: NAT Gateway data processing charges
- **S3 Storage**: Flow logs storage (minimal with 90-day lifecycle)

For development environments, consider using a single NAT Gateway or VPC endpoints to reduce costs.

## Compliance Notes

This infrastructure is designed for financial services compliance requirements:
- Network traffic logging meets audit requirements
- SSH access from internet is blocked at network level
- Encryption at rest for all stored data
- High availability across multiple AZs
- Clear network segregation between tiers

## Troubleshooting

### Issue: CloudWatch alarms not triggering
- Verify NAT Gateway metrics are being published
- Check alarm threshold (1GB over 5 minutes)
- Ensure alarm actions are enabled

### Issue: Flow logs not appearing in S3
- Verify S3 bucket policy allows VPC Flow Logs service
- Check Flow Log status in AWS Console
- Wait 10-15 minutes for initial logs to appear

### Issue: Private subnet instances can't reach internet
- Verify NAT Gateway is in healthy state
- Check private route table has route to NAT Gateway
- Verify security groups allow outbound traffic
