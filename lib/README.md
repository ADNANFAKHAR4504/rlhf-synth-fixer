# Multi-Environment Payment Processing Infrastructure

This Pulumi TypeScript project deploys identical payment processing infrastructure across three environments (dev, staging, prod) with controlled variations using stack configurations.

## Architecture

The infrastructure consists of:

- VPC: Custom VPC with public/private subnets across 3 availability zones
- ECS Fargate: Containerized payment processors with auto-scaling
- RDS Aurora PostgreSQL: Multi-AZ database clusters with environment-specific instance sizes
- Application Load Balancer: Path-based routing with health checks
- Route53: Private hosted zones for service discovery
- ECR: Shared container registry across all environments
- Secrets Manager: Secure credential storage
- CloudWatch: Monitoring and auto-scaling policies

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- TypeScript 5.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Installation

```bash
npm install
```

## Configuration

Each environment has its own stack configuration file:

- Pulumi.dev.yaml - Development (eu-west-1)
- Pulumi.staging.yaml - Staging (us-west-2)
- Pulumi.prod.yaml - Production (us-east-1)

### Environment-Specific Settings

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| Region | eu-west-1 | us-west-2 | us-east-1 |
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| DB Instance | db.t3.medium | db.r5.large | db.r5.xlarge |
| CPU Threshold | 50% | 70% | 70% |

## Deployment

### Deploy Development Environment

```bash
pulumi stack select dev
pulumi up
```

### Deploy Staging Environment

```bash
pulumi stack select staging
pulumi up
```

### Deploy Production Environment

```bash
pulumi stack select prod
pulumi up
```

## Resource Naming Convention

All resources follow the pattern: {env}-{service}-{resource}

Examples:
- dev-payment-vpc
- prod-payment-db-cluster
- staging-payment-alb

## Components

### VpcComponent

Creates VPC infrastructure with:
- Public subnets for ALB
- Private subnets for ECS and RDS
- Internet Gateway
- Route tables

### EcsComponent

Deploys ECS Fargate service with:
- Task definitions
- Auto-scaling policies
- CloudWatch logs
- Security groups

### DatabaseComponent

Creates RDS Aurora PostgreSQL cluster with:
- Multi-AZ deployment
- Automated backups
- Performance Insights
- Secrets Manager integration

### AlbComponent

Configures Application Load Balancer with:
- Path-based routing
- Health checks
- Security groups
- Target groups

### Route53Component

Sets up private hosted zones for:
- Service discovery
- Internal DNS resolution

### EcrComponent

Manages ECR repository with:
- Lifecycle policies
- Image scanning
- Cross-environment sharing

## Testing

```bash
npm test
```

## Comparison Report

After deployment, a comparison report is generated showing configuration differences between environments:

```bash
cat comparison-report-dev.json
cat comparison-report-staging.json
cat comparison-report-prod.json
```

## Cleanup

```bash
pulumi stack select dev
pulumi destroy

pulumi stack select staging
pulumi destroy

pulumi stack select prod
pulumi destroy
```

## Security Considerations

- Database credentials are randomly generated and stored in AWS Secrets Manager
- All resources use security groups with least-privilege access
- Private subnets isolate ECS tasks and databases
- No public access to databases
- ECR image scanning enabled

## Cost Optimization

- No NAT Gateways (using VPC endpoints where needed)
- Development environment uses smaller instance types
- Auto-scaling adjusts capacity based on demand
- ECR lifecycle policies limit image retention

## Troubleshooting

### CIDR Overlap Error

If you encounter CIDR overlap errors, verify that each environment uses unique CIDR blocks:
- Dev: 10.0.0.0/16
- Staging: 10.1.0.0/16
- Prod: 10.2.0.0/16

### ECR Repository Access

The ECR repository is created in the dev environment and shared across staging and prod using stack references.

### Database Connection

Database credentials are stored in Secrets Manager. ECS tasks automatically retrieve credentials using the execution role.

## Support

For issues or questions, please refer to the Pulumi documentation or AWS documentation.
