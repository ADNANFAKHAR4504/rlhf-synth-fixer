# Payment Processing VPC Infrastructure

Secure VPC infrastructure for PCI DSS compliant payment processing using AWS CDK with TypeScript.

## Architecture Overview

This infrastructure creates:
- VPC with CIDR 10.0.0.0/16
- 3 public subnets across 3 availability zones
- 3 private subnets across 3 availability zones
- NAT gateways for private subnet internet access
- Custom Network ACLs for traffic control
- VPC Flow Logs with CloudWatch integration
- S3 VPC Endpoint for cost-optimized S3 access

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Sufficient IAM permissions for VPC, EC2, CloudWatch, and S3 services

## Installation

```bash
npm install
```

## Configuration

Set the environment suffix for resource naming:

```bash
export CDK_CONTEXT_environmentSuffix=prod
```

Or pass it during deployment:

```bash
cdk deploy -c environmentSuffix=prod
```

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

Synthesize CloudFormation template:

```bash
npm run synth
```

Preview changes:

```bash
npm run diff
```

Deploy to AWS:

```bash
npm run deploy
```

Deploy with custom environment suffix:

```bash
cdk deploy -c environmentSuffix=prod
```

## Stack Outputs

After deployment, the following values are exported:

- **VpcId**: VPC identifier
- **PublicSubnet1-3Id**: Public subnet identifiers
- **PrivateSubnet1-3Id**: Private subnet identifiers
- **S3EndpointId**: S3 VPC endpoint identifier
- **FlowLogsLogGroup**: CloudWatch log group for VPC Flow Logs

## Network Configuration

### Public Subnets
- CIDR blocks: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Internet Gateway attached
- NAT Gateways deployed

### Private Subnets
- CIDR blocks: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- No direct internet access
- Outbound traffic via NAT Gateways
- S3 access via VPC Endpoint

### Network ACL Rules
- HTTPS (port 443): Allowed
- MySQL (port 3306): Allowed
- Redis (port 6379): Allowed
- Ephemeral ports (1024-65535): Allowed for return traffic
- All other traffic: Explicitly denied

## Security Features

- VPC Flow Logs capture all traffic for audit purposes
- 7-day log retention for compliance requirements
- Network ACLs enforce least-privilege access
- Private subnets isolated from direct internet access
- S3 VPC Endpoint avoids internet gateway routing

## Cost Optimization

- NAT Gateways deployed per AZ (high availability vs cost tradeoff)
- S3 VPC Endpoint eliminates data transfer charges for S3 access
- CloudWatch Logs with 7-day retention (adjustable based on requirements)

## Cleanup

To destroy all resources:

```bash
npm run destroy
```

Or with environment suffix:

```bash
cdk destroy -c environmentSuffix=prod
```

## Compliance

This infrastructure supports PCI DSS compliance requirements:
- Network segmentation (public/private subnets)
- Traffic logging and monitoring
- Restricted network access controls
- Secure configuration management (Infrastructure as Code)

## Support

For issues or questions, refer to the AWS CDK documentation:
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/)
- [VPC Best Practices](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-best-practices.html)
