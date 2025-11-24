# Multi-Environment Trading Platform Infrastructure

This Pulumi TypeScript project implements a comprehensive multi-environment infrastructure for a trading platform with consistent deployment patterns across dev, staging, and production environments.

## Architecture Overview

The infrastructure includes:

- VPC: Custom VPC with public and private subnets across multiple availability zones
- ECS Fargate: Container orchestration with environment-specific task counts
- RDS Aurora: MySQL-compatible database with Aurora Serverless v2 support
- Application Load Balancer: HTTP/HTTPS load balancing with SSL support
- S3: Encrypted storage with lifecycle policies
- CloudWatch: Monitoring dashboards and alarms
- IAM: Least-privilege roles and policies

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Project Structure

```
.
├── index.ts                      # Main entry point
├── lib/
│   ├── config.ts                 # Configuration management
│   ├── drift-detection.ts        # Drift detection utilities
│   └── components/
│       ├── vpc.ts                # VPC component
│       ├── security-groups.ts    # Security groups component
│       ├── rds.ts                # RDS Aurora component
│       ├── ecs.ts                # ECS Fargate component
│       ├── alb.ts                # Application Load Balancer component
│       ├── s3.ts                 # S3 bucket component
│       └── cloudwatch.ts         # CloudWatch monitoring component
├── Pulumi.dev.yaml               # Dev environment config
├── Pulumi.staging.yaml           # Staging environment config
└── Pulumi.prod.yaml              # Production environment config
```

## Environment-Specific Configurations

### Dev Environment
- ECS Task Count: 1
- ECS Resources: 256 CPU, 512 MB Memory
- RDS Instance: db.t3.medium
- Auto Scaling: Disabled
- Backup Retention: 7 days

### Staging Environment
- ECS Task Count: 2
- ECS Resources: 512 CPU, 1024 MB Memory
- RDS Instance: db.r5.large
- Auto Scaling: Enabled
- Backup Retention: 14 days

### Production Environment
- ECS Task Count: 4
- ECS Resources: 1024 CPU, 2048 MB Memory
- RDS Instance: db.r5.xlarge
- Auto Scaling: Enabled
- Backup Retention: 30 days

## Deployment Instructions

### Deploy Dev Environment

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

## Cross-Stack References

To reference resources from another stack:

```typescript
import * as pulumi from "@pulumi/pulumi";

const devStack = new pulumi.StackReference("organization/trading-platform/dev");
const devVpcId = await devStack.getOutputValue("vpcId");
```

## Drift Detection

Run drift detection to compare configurations:

```typescript
import { DriftDetector } from "./lib/drift-detection";

const detector = new DriftDetector({
  environments: ["dev", "staging", "prod"],
  organizationName: "your-org",
});

const report = await detector.detectDrift();
const comparison = detector.generateComparisonReport(report);
console.log(comparison);
```

## Resource Naming Convention

All resources follow the naming pattern: {resource-type}-{environmentSuffix}

Example:
- vpc-dev
- ecs-cluster-staging
- aurora-cluster-prod

## Security Features

- All S3 buckets encrypted at rest with AES256
- RDS clusters use encryption at rest
- Security groups follow least-privilege principles
- IAM roles use environment-specific trust policies
- All public access to S3 buckets blocked

## Monitoring

CloudWatch dashboards provide unified views of:
- ECS CPU and memory utilization
- RDS cluster performance metrics
- ALB request counts and response times
- Custom alarms for high CPU utilization

## Cost Optimization

- Aurora Serverless v2 scaling for cost efficiency
- S3 lifecycle policies to transition to IA storage
- Auto-scaling for staging and production environments
- Minimal NAT Gateway usage

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured as destroyable with no retention policies for easy cleanup.

## Troubleshooting

### Common Issues

1. Stack already exists: Use pulumi stack select <name> to switch to existing stack
2. AWS credentials: Ensure AWS credentials are configured with aws configure
3. Pulumi organization: Update organization name in drift detection configuration

## Support

For issues or questions, contact the platform team.
