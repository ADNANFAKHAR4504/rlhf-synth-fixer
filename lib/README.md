# Multi-Environment Infrastructure with CDKTF TypeScript

This directory contains the CDKTF TypeScript implementation for multi-environment infrastructure deployment across dev, staging, and production AWS accounts.

## Task: l5i39y

**Platform**: CDKTF
**Language**: TypeScript
**Complexity**: Expert
**Region**: us-east-1

## Overview

This implementation provides infrastructure-as-code for deploying identical infrastructure patterns across three AWS accounts (dev, staging, prod) with environment-specific configurations.

## Key Features

- **Multi-Environment Support**: Separate stacks for dev, staging, and prod environments
- **Reusable Constructs**: Custom L3 constructs for VPC, Aurora, ECS, monitoring
- **Environment-Specific Configuration**: CIDR ranges (10.1/10.2/10.3), instance sizes, alarm thresholds
- **High Availability**: 3 AZ deployment with NAT gateways per AZ
- **Security**: Least-privilege IAM, encrypted storage, private subnets
- **Monitoring**: CloudWatch dashboards and environment-specific alarms

## Infrastructure Components

1. **VPC Construct** (`lib/vpc-construct.ts`)
   - Environment-specific CIDR blocks
   - 3 public and 3 private subnets across AZs
   - Internet Gateway and NAT Gateways

2. **Aurora Construct** (`lib/aurora-construct.ts`)
   - RDS Aurora PostgreSQL clusters
   - Environment-specific instance counts and sizes
   - SSM parameter store for credentials

3. **ECR Construct** (`lib/ecr-construct.ts`)
   - Container image repository
   - Lifecycle policies

4. **ECS Construct** (`lib/ecs-construct.ts`)
   - Fargate services with environment-specific task definitions
   - Application Load Balancer with health checks
   - IAM roles with least-privilege policies

5. **Monitoring Construct** (`lib/monitoring-construct.ts`)
   - CloudWatch dashboards aggregating metrics
   - Environment-specific CPU and memory alarms

6. **S3 Construct** (`lib/s3-construct.ts`)
   - Encrypted S3 buckets for static assets
   - Lifecycle policies (30d IA, 90d Glacier)

## File Structure

```
├── lib/
│   ├── PROMPT.md              # Original requirements
│   ├── MODEL_RESPONSE.md      # Generated implementation (for QA review)
│   ├── README.md              # This file
│   ├── vpc-construct.ts       # VPC infrastructure
│   ├── aurora-construct.ts    # RDS Aurora clusters
│   ├── ecr-construct.ts       # ECR repository
│   ├── ecs-construct.ts       # ECS Fargate services
│   ├── monitoring-construct.ts # CloudWatch monitoring
│   └── s3-construct.ts        # S3 buckets
├── main.ts                    # Entry point
├── cdktf.json                 # CDKTF configuration
└── package.json               # Dependencies
```

## Environment Configuration

### Dev Environment
- Account: 123456789012
- CIDR: 10.1.0.0/16
- RDS: 1x db.t3.medium
- ECS: 1 task, 256 CPU, 512 memory
- Alarms: 80% CPU/Memory threshold

### Staging Environment
- Account: 234567890123
- CIDR: 10.2.0.0/16
- RDS: 1x db.t3.large
- ECS: 2 tasks, 512 CPU, 1024 memory
- Alarms: 75% CPU/Memory threshold

### Production Environment
- Account: 345678901234
- CIDR: 10.3.0.0/16
- RDS: 2x db.r5.large
- ECS: 3 tasks, 1024 CPU, 2048 memory
- Alarms: 70% CPU/Memory threshold

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get Terraform providers:
   ```bash
   npm run get
   ```

3. Set environment suffix:
   ```bash
   export ENVIRONMENT_SUFFIX="your-unique-suffix"
   ```

4. Synthesize infrastructure:
   ```bash
   npm run synth
   ```

5. Deploy specific environment:
   ```bash
   cdktf deploy dev-stack
   cdktf deploy staging-stack
   cdktf deploy prod-stack
   ```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment}-{environmentSuffix}`

Example: `vpc-dev-abc123`, `aurora-prod-abc123`

## AWS Services Used

- VPC (Virtual Private Cloud)
- RDS Aurora PostgreSQL
- ECS Fargate
- Application Load Balancer (ALB)
- ECR (Elastic Container Registry)
- S3 (Simple Storage Service)
- CloudWatch (Monitoring and Alarms)
- IAM (Identity and Access Management)
- SSM Parameter Store (Secrets Management)

## Security Features

- All traffic routed through private subnets
- Least-privilege IAM policies
- S3 encryption at rest (AES256)
- RDS encryption at rest
- Public access blocked on S3 buckets
- Security groups with minimal ingress rules
- Secrets stored in SSM Parameter Store

## Monitoring and Observability

- CloudWatch dashboards per environment
- CPU and memory utilization alarms
- Aurora database metrics
- ALB performance metrics
- Environment-specific alarm thresholds

## Next Steps (for QA Trainer Agent)

This implementation is ready for Phase 3 (QA training):
1. Review MODEL_RESPONSE.md for issues
2. Create corrected IDEAL_RESPONSE.md
3. Document fixes in MODEL_FAILURES.md
4. Generate unit tests

## Notes

- All resources include environmentSuffix for uniqueness
- No retention policies - all resources are destroyable
- Three NAT Gateways per environment (one per AZ) for high availability
- Cross-account deployment uses IAM role assumption
