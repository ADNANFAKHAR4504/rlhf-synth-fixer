# Highly Available VPC Infrastructure for Payment Processing Platform

This CloudFormation template deploys a production-ready VPC infrastructure for a payment processing platform with high availability across 3 availability zones.

## Architecture Overview

The infrastructure includes:
- VPC with 10.0.0.0/16 CIDR block with DNS support
- 3 public subnets across 3 availability zones
- 6 private subnets (2 per AZ) for application tiers
- 3 NAT Gateways for high availability
- Internet Gateway for public subnet connectivity
- Security groups for bastion hosts, ALB, and application servers
- Network ACLs for additional network security
- VPC Flow Logs with CloudWatch Logs and KMS encryption

## Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, EC2, CloudWatch Logs, KMS, and IAM resources
- CloudFormation permissions

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| EnvironmentSuffix | Unique suffix for resource names (3-10 chars) | Required |
| VpcCidr | CIDR block for VPC | 10.0.0.0/16 |
| BastionAllowedIP | IP address allowed to SSH to bastion (CIDR notation) | Required |
| Environment | Environment tag (development/staging/production) | production |
| Owner | Owner tag for resources | platform-team |
| CostCenter | Cost center tag for resources | payment-processing |

## Deployment

### Deploy the stack:

```bash
aws cloudformation create-stack \
  --stack-name vpc-payment-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-01 \
    ParameterKey=BastionAllowedIP,ParameterValue=203.0.113.0/32 \
    ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor deployment:

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-payment-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-payment-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Network Architecture

### Subnets

**Public Subnets** (Internet-facing):
- 10.0.1.0/24 - us-east-1a
- 10.0.2.0/24 - us-east-1b
- 10.0.3.0/24 - us-east-1c

**Private Subnets** (Application tiers):
- 10.0.11.0/24 - us-east-1a (App Tier 1)
- 10.0.12.0/24 - us-east-1a (App Tier 2)
- 10.0.13.0/24 - us-east-1b (App Tier 1)
- 10.0.14.0/24 - us-east-1b (App Tier 2)
- 10.0.15.0/24 - us-east-1c (App Tier 1)
- 10.0.16.0/24 - us-east-1c (App Tier 2)

### Security Groups

1. **Bastion Security Group**: Allows SSH (port 22) from specified IP address
2. **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from internet
3. **Application Security Group**: Allows HTTP/HTTPS from ALB only, SSH from bastion

### Network ACLs

- **Public NACL**: Allows HTTP, HTTPS, SSH (from allowed IP), and ephemeral ports
- **Private NACL**: Allows HTTP, HTTPS, SSH from VPC CIDR, and ephemeral ports

### VPC Flow Logs

- Traffic type: ALL
- Destination: CloudWatch Logs
- Retention: 30 days
- Encryption: KMS encryption enabled

## Security Features

- Network segmentation with public/private subnets
- Least-privilege security group rules
- Network ACLs for additional defense-in-depth
- VPC Flow Logs for traffic monitoring
- KMS encryption for log data
- No 0.0.0.0/0 inbound rules in security groups (except ALB public-facing)
- SSH access restricted to specific IP address

## Compliance

This infrastructure is designed to support PCI-DSS requirements:
- Network segmentation between tiers
- Comprehensive logging with VPC Flow Logs
- Encryption of sensitive data (logs)
- Restricted access controls

## Stack Outputs

The stack exports the following outputs for cross-stack references:
- VPCId
- VPCCidr
- All subnet IDs (3 public, 6 private)
- All security group IDs (bastion, ALB, application)
- Flow Logs log group name
- KMS key ARN for encryption

## Clean Up

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name vpc-payment-prod \
  --region us-east-1
```

Note: All resources are configured to be deletable (no retention policies), allowing clean teardown for CI/CD pipelines.

## Cost Optimization

The following resources incur costs:
- 3 NAT Gateways (approximately $0.045/hour each = $97/month total)
- 3 Elastic IPs (free when attached to running instances)
- VPC Flow Logs storage in CloudWatch Logs
- KMS key (first 20,000 requests/month free)

Consider the following optimizations:
- Reduce NAT Gateways to 1 for non-production environments
- Add VPC Endpoints for S3 and DynamoDB to reduce NAT Gateway data transfer costs
- Adjust Flow Logs retention period based on compliance requirements

## Troubleshooting

### Stack creation fails with "No AZs available"
- Verify that us-east-1 region has at least 3 availability zones
- Check service quotas for VPC and EC2 resources

### Unable to SSH to bastion
- Verify BastionAllowedIP parameter matches your current IP address
- Check security group rules and NACL rules
- Ensure bastion instance is in public subnet with public IP

### Application cannot reach internet
- Verify NAT Gateway is deployed and running
- Check route table associations for private subnets
- Verify private route tables have 0.0.0.0/0 route to NAT Gateway

## Support

For issues or questions, contact the platform team.
