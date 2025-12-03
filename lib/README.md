# Multi-Environment Infrastructure with CDKTF

This CDKTF TypeScript application deploys identical infrastructure across development, staging, and production environments with environment-specific configurations.

## Architecture

### Components

- **VPC**: Isolated VPCs per environment with consistent subnet layouts
- **RDS Aurora**: PostgreSQL clusters with environment-specific sizing
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: Traffic distribution with SSL support
- **S3**: Static asset storage with lifecycle policies
- **CloudWatch**: Dashboards and alarms for monitoring

### Environments

1. **Development** (10.1.0.0/16)
   - Account: 123456789012
   - Instance: db.t3.medium
   - Tasks: 1 (256 CPU, 512 MB)

2. **Staging** (10.2.0.0/16)
   - Account: 234567890123
   - Instance: db.r5.large
   - Tasks: 2 (512 CPU, 1024 MB)
   - Replication from production

3. **Production** (10.3.0.0/16)
   - Account: 345678901234
   - Instance: db.r5.xlarge
   - Tasks: 3 (1024 CPU, 2048 MB)
   - SSL certificates

## Prerequisites

- Node.js 18+
- TypeScript 5.x
- CDKTF CLI
- AWS CLI configured with cross-account access
- Terraform

## Installation

\`\`\`bash
npm install
\`\`\`

## Deployment

### Deploy to Development

\`\`\`bash
export ENVIRONMENT_SUFFIX=dev
cdktf deploy
\`\`\`

### Deploy to Staging

\`\`\`bash
export ENVIRONMENT_SUFFIX=staging
cdktf deploy
\`\`\`

### Deploy to Production

\`\`\`bash
export ENVIRONMENT_SUFFIX=prod
cdktf deploy
\`\`\`

## Validation

The infrastructure includes synthesis-time validation:

- CIDR block pattern validation
- Account ID validation
- Capacity configuration validation
- Environment-specific configuration validation

## Monitoring

Each environment has:

- CloudWatch Dashboard with ECS, ALB, and RDS metrics
- CPU and memory utilization alarms
- Response time and health check alarms
- Database connection alarms

## Cross-Environment Replication

Production database is replicated to staging using Aurora read replicas for testing purposes.

## Tagging Strategy

All resources are tagged with:
- Environment
- CostCenter
- DeploymentTimestamp
- ManagedBy
- Application

## Outputs

Each deployment generates:
- VPC ID
- ALB DNS name
- Aurora cluster endpoint
- ECS cluster name
- S3 bucket name
- Deployment manifest (JSON)

## Destroying Infrastructure

\`\`\`bash
export ENVIRONMENT_SUFFIX=dev
cdktf destroy
\`\`\`

## Configuration Management

Environment-specific values are stored in:
- CDKTF context (non-sensitive)
- SSM Parameter Store (sensitive values)

Hierarchical parameter paths:
- /aurora/{env}/master-password
- /aurora/{env}/cluster-endpoint

## Deployment Manifest

After each deployment, a JSON manifest is generated containing:
- Environment name
- Deployment timestamp
- Complete resource inventory
- Resource properties and ARNs
- Applied tags
