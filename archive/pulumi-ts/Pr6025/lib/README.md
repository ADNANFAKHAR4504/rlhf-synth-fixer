# Multi-Environment VPC Infrastructure

This Pulumi TypeScript project creates a multi-environment VPC infrastructure for a payment processing platform with PCI-DSS compliance features.

## Architecture

The infrastructure consists of three isolated VPC environments:
- **Dev**: 10.0.0.0/16
- **Staging**: 10.1.0.0/16
- **Production**: 10.2.0.0/16

Each VPC includes:
- 3 public subnets across availability zones
- 3 private subnets across availability zones
- Internet Gateway for public subnet connectivity
- NAT Gateways (one per AZ) for private subnet outbound traffic
- Web tier security group (HTTPS from anywhere)
- App tier security group (traffic from web tier only)
- VPC Flow Logs with CloudWatch Logs (7-day retention)

## Prerequisites

- Node.js 16+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- TypeScript 4.x

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set region us-east-1
```

## Deployment

```bash
npm install
pulumi up
```

## Outputs

The stack exports:
- VPC IDs for dev, staging, and production
- Public subnet IDs
- Private subnet IDs
- Security group IDs

## Cleanup

```bash
pulumi destroy
```
