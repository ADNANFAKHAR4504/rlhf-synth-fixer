# Payment Processing Migration Infrastructure

This Pulumi TypeScript program implements a complete production-grade migration infrastructure for moving an on-premises payment processing system to AWS.

## Architecture Overview

The infrastructure consists of five main stacks:

1. **Network Stack**: VPC with 3 public and 3 private subnets across 3 availability zones
2. **Database Stack**: RDS Aurora PostgreSQL cluster (1 writer + 2 readers) with encryption at rest
3. **Compute Stack**: ECS Fargate service with ALB, running 3+ tasks across multiple AZs
4. **Migration Stack**: AWS DMS replication instance with CDC enabled, and Lambda validation function
5. **Monitoring Stack**: CloudWatch alarms for DMS lag, ECS health, and RDS metrics

## Prerequisites

- Pulumi CLI 3.x or higher
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- TypeScript 4.x or higher

## Environment Variables

Set the following environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
export AWS_REGION="us-east-1"
export REPOSITORY="your-repo"
export TEAM="your-team"
```

## Installation

```bash
npm install
```

## Deployment

```bash
# Initialize Pulumi stack
pulumi stack init dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

## Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC ID
- `albDnsName`: Application Load Balancer DNS name
- `rdsClusterEndpoint`: RDS Aurora cluster writer endpoint
- `rdsReaderEndpoint`: RDS Aurora cluster reader endpoint
- `dmsReplicationTaskArn`: DMS replication task ARN
- `validationLambdaArn`: Lambda validation function ARN
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name

## Infrastructure Components

### VPC and Networking

- VPC CIDR: 10.0.0.0/16
- Public Subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Private Subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- 3 NAT Gateways (one per AZ)
- Internet Gateway

### RDS Aurora PostgreSQL

- Engine: Aurora PostgreSQL 13.7
- Instances: 1 writer + 2 readers
- Instance Class: db.t3.medium
- Storage: Encrypted at rest with KMS
- Backups: 7-day retention, point-in-time recovery enabled
- Security: VPC security groups with restricted access

### ECS Fargate

- Cluster: Container Insights enabled
- Service: 3 tasks across 3 availability zones
- Task Definition: 512 CPU, 1024 MB memory
- Launch Type: Fargate
- Networking: Private subnets with ALB in public subnets

### Application Load Balancer

- Type: Application
- Scheme: Internet-facing
- Health Checks: /health endpoint, 30s interval
- Target Group: IP target type on port 8080

### AWS DMS

- Replication Instance: dms.t3.medium
- Migration Type: Full load + CDC (Change Data Capture)
- Source: On-premises PostgreSQL
- Target: Aurora PostgreSQL
- Table Mappings: All tables in public schema

### Lambda Validation

- Runtime: Node.js 18.x
- Memory: 512 MB
- Timeout: 300 seconds
- VPC: Enabled with access to RDS
- Function: Compares record counts between source and target databases

### CloudWatch Monitoring

- DMS replication lag alarm (threshold: 60 seconds)
- ECS healthy task count alarm (threshold: < 3 tasks)
- RDS CPU utilization alarm (threshold: 80%)
- RDS freeable memory alarm (threshold: < 1 GB)
- ECS CPU utilization alarm (threshold: 80%)

## Security

- All resources deployed in private subnets (except ALB)
- Security groups follow principle of least privilege
- Database credentials should be stored in AWS Secrets Manager (currently hardcoded for demo)
- RDS encryption at rest with KMS
- VPC flow logs enabled for network monitoring

## Tagging

All resources are tagged with:
- Environment: prod-migration
- CostCenter: finance
- MigrationPhase: active
- ManagedBy: pulumi

## Cleanup

To destroy all infrastructure:

```bash
pulumi destroy
```

## Notes

- Database passwords are currently hardcoded and should be replaced with Secrets Manager references
- Source database endpoint is parameterized and needs to be configured
- ECS task definition uses nginx image as placeholder - replace with actual Java application image
- All resources are configured for destroyability (no retention policies)
