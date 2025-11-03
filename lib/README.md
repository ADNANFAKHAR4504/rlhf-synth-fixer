# Payment Processing VPC Infrastructure

This directory contains the CDKTF (CDK for Terraform) TypeScript implementation for a secure, highly available AWS VPC infrastructure designed for payment processing applications.

## Overview

This infrastructure creates a production-ready VPC with:
- 3 availability zones for high availability
- Public and private subnets in each AZ
- NAT Gateways for outbound connectivity from private subnets
- VPC Flow Logs with CloudWatch monitoring
- EC2 instances with Session Manager access (no SSH)
- VPC endpoints for S3 and DynamoDB
- Strict security group controls

## File Structure

```
lib/
├── tap-stack.ts          # Main TerraformStack orchestration
├── vpc-stack.ts          # VPC infrastructure construct (563 lines)
├── PROMPT.md             # Original requirements specification
├── IDEAL_RESPONSE.md     # Comprehensive architecture documentation
├── MODEL_RESPONSE.md     # LLM generation metadata
└── README.md             # This file
```

## Architecture

### Network Layout

- VPC CIDR: 10.0.0.0/16
- Region: ca-central-1
- Availability Zones: ca-central-1a, ca-central-1b, ca-central-1d

**Public Subnets** (with Internet Gateway access):
- 10.0.0.0/24 (AZ a)
- 10.0.2.0/24 (AZ b)
- 10.0.4.0/24 (AZ d)

**Private Subnets** (with NAT Gateway access):
- 10.0.1.0/24 (AZ a)
- 10.0.3.0/24 (AZ b)
- 10.0.5.0/24 (AZ d)

### Security Features

1. **No SSH Access**: EC2 instances have no SSH keys; access via Session Manager only
2. **Least Privilege Security Groups**: No 0.0.0.0/0 inbound rules
3. **IMDSv2 Enforced**: Instance metadata service v2 prevents SSRF attacks
4. **VPC Flow Logs**: All traffic (accepted and rejected) logged to CloudWatch
5. **Private Subnets**: Application instances have no public IPs
6. **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB reduce internet exposure

## Key Components

### VpcStack (vpc-stack.ts)

Main infrastructure construct that creates:

1. **VPC** with DNS resolution and hostnames enabled
2. **Internet Gateway** for public subnet internet access
3. **3 Public Subnets** with auto-assigned public IPs
4. **3 Private Subnets** for application workloads
5. **3 NAT Gateways** (one per AZ) with Elastic IPs
6. **Route Tables** with explicit subnet associations
7. **Security Groups**:
   - Web tier: Ports 80, 443 from VPC CIDR
   - App tier: Port 8080 from web tier only
8. **VPC Flow Logs** with 1-minute intervals to CloudWatch
9. **VPC Endpoints** for S3 and DynamoDB (Gateway type)
10. **3 EC2 Instances** (t3.micro, Amazon Linux 2023) in private subnets
11. **IAM Roles** for Session Manager and VPC Flow Logs
12. **CloudWatch Dashboard** for flow log visualization

### TapStack (tap-stack.ts)

Main Terraform stack that:
- Configures AWS provider for ca-central-1
- Sets up S3 backend for state management
- Instantiates VpcStack with environment configuration
- Applies default tags (Environment, Repository, CommitAuthor)

## Compliance with Constraints

All 10 specified constraints are implemented:

1. ✅ CDKTF with TypeScript (no other languages)
2. ✅ Amazon Linux 2023 AMI (DataAwsAmi with al2023 filter)
3. ✅ Instance type t3.micro for cost optimization
4. ✅ No SSH keys or key pairs configured
5. ✅ VPC Flow Logs capture ALL traffic (accepted + rejected)
6. ✅ Explicit route table associations for all subnets
7. ✅ Security groups follow least privilege (no 0.0.0.0/0 inbound)
8. ✅ All resources in single CDK stack
9. ✅ L2 CDKTF constructs used throughout
10. ✅ NAT Gateways have Elastic IPs

## Resource Naming Convention

All resources include `environmentSuffix` for multi-environment support:

- VPC: `payment-vpc-{environmentSuffix}`
- Subnets: `payment-public-subnet-1-{environmentSuffix}`
- NAT Gateways: `payment-nat-gateway-1-{environmentSuffix}`
- Security Groups: `payment-web-sg-{environmentSuffix}`
- EC2 Instances: `payment-app-instance-1-{environmentSuffix}`

## Stack Outputs

The stack exports these outputs for integration and testing:

| Output Name | Description |
|------------|-------------|
| vpc-id | VPC identifier |
| public-subnet-ids | Array of 3 public subnet IDs |
| private-subnet-ids | Array of 3 private subnet IDs |
| web-security-group-id | Web tier security group ID |
| app-security-group-id | App tier security group ID |
| nat-gateway-ids | Array of 3 NAT Gateway IDs |
| instance-ids | Array of 3 EC2 instance IDs |
| s3-endpoint-id | S3 VPC endpoint ID |
| dynamodb-endpoint-id | DynamoDB VPC endpoint ID |
| flow-log-group-name | CloudWatch log group name |

## Deployment

### Prerequisites

- Node.js 18+
- Terraform CLI
- AWS CLI configured
- Environment variables:
  - `AWS_REGION=ca-central-1`
  - `ENVIRONMENT_SUFFIX=<your-env>`
  - `TERRAFORM_STATE_BUCKET=<bucket-name>`

### Commands

```bash
# Install dependencies
npm install

# Generate Terraform providers
npm run get

# Synthesize Terraform configuration
npm run synth

# Deploy infrastructure
npm run deploy

# Destroy infrastructure
npm run destroy
```

### Access EC2 Instances

```bash
# Connect via Session Manager (no SSH needed)
aws ssm start-session \
  --target <instance-id> \
  --region ca-central-1
```

### View VPC Flow Logs

```bash
# Tail flow logs in real-time
aws logs tail /aws/vpc/flowlogs-<env-suffix> \
  --follow \
  --region ca-central-1
```

## Testing

Integration tests are located in `test/tap-stack.int.test.ts` and validate:

- VPC configuration (CIDR, DNS settings, tags)
- Subnet configuration (count, CIDRs, AZ distribution)
- NAT Gateway setup (HA across AZs, EIP associations)
- Security group rules (least privilege enforcement)
- VPC endpoints (S3 and DynamoDB gateway endpoints)
- EC2 instances (AMI, instance type, Session Manager setup)
- VPC Flow Logs (CloudWatch integration, retention)
- Route tables (explicit associations, correct routing)

Run integration tests after deployment:

```bash
npm run test:int
```

## Cost Estimation

Monthly cost (approximate for ca-central-1):

| Resource | Quantity | Monthly Cost |
|----------|----------|--------------|
| NAT Gateways | 3 | ~$97 |
| EC2 t3.micro | 3 | ~$25 |
| Elastic IPs | 3 | $0 (attached) |
| VPC Flow Logs | - | ~$5-10 |
| Data Transfer | - | Variable |
| **Total** | - | **~$130** |

**Cost Optimization Tips**:
- For dev/test: Use 1 NAT Gateway instead of 3 (~$65/month savings)
- VPC endpoints save on data transfer costs
- t3.micro is already the most cost-effective option

## Security Best Practices Implemented

1. **Network Isolation**: Private subnets for applications, public only for load balancers
2. **No SSH**: Session Manager provides auditable, secure access
3. **Least Privilege**: Security groups restrict traffic to minimum required
4. **Monitoring**: VPC Flow Logs capture all traffic for security analysis
5. **IMDSv2**: Prevents SSRF and credential theft attacks
6. **Encryption**: Terraform state encrypted in S3
7. **Tagging**: All resources tagged for governance (Environment, Project)

## Troubleshooting

### Issue: EC2 instances can't reach internet

Check NAT Gateway status and routing:
```bash
aws ec2 describe-nat-gateways \
  --filter "Name=vpc-id,Values=<vpc-id>" \
  --region ca-central-1

aws ec2 describe-route-tables \
  --filter "Name=vpc-id,Values=<vpc-id>" \
  --region ca-central-1
```

### Issue: Can't connect via Session Manager

Verify instance profile and SSM agent:
```bash
aws ec2 describe-instances \
  --instance-ids <instance-id> \
  --query 'Reservations[0].Instances[0].IamInstanceProfile' \
  --region ca-central-1

aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=<instance-id>" \
  --region ca-central-1
```

### Issue: Flow logs not appearing

Check IAM role and log group:
```bash
aws ec2 describe-flow-logs \
  --filter "Name=resource-id,Values=<vpc-id>" \
  --region ca-central-1

aws logs describe-log-groups \
  --log-group-name-prefix "/aws/vpc/flowlogs" \
  --region ca-central-1
```

## Documentation

- **PROMPT.md**: Original task requirements and constraints
- **IDEAL_RESPONSE.md**: Detailed architecture documentation with rationale
- **CloudWatch Dashboard**: Auto-created dashboard for flow log visualization

## Future Enhancements

Potential improvements for production:

1. Add Application Load Balancer in public subnets
2. Implement Auto Scaling Groups for EC2 instances
3. Add RDS instances in separate database subnets
4. Configure AWS WAF for web application firewall
5. Set up CloudWatch alarms for NAT Gateway and instance metrics
6. Add AWS Network Firewall for advanced traffic filtering
7. Implement VPC peering or Transit Gateway for multi-VPC connectivity

## Support

For issues or questions about this infrastructure:

1. Review IDEAL_RESPONSE.md for detailed architecture explanations
2. Check integration tests for expected behavior
3. Review VPC Flow Logs in CloudWatch for traffic analysis
4. Consult AWS documentation for CDKTF and individual services

## License

This infrastructure code is generated for AWS cloud environment provisioning as part of the IAC automation framework.
