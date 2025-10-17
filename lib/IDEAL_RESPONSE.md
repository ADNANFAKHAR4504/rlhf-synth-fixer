# PCI-DSS Compliant Payment Processing Infrastructure - CDKTF TypeScript Implementation

This implementation provides a production-ready, PCI-DSS compliant payment processing infrastructure using CDKTF with TypeScript. The solution addresses all requirements for secure payment data handling, Multi-AZ high availability, automatic secret rotation, and proper network isolation.

## Architecture Overview

The infrastructure consists of:
- VPC with public and private subnets across 2 availability zones
- KMS customer-managed keys for encryption at rest
- RDS PostgreSQL Multi-AZ database in private subnets
- AWS Secrets Manager with 30-day automatic rotation
- ElastiCache Redis Multi-AZ cluster with encryption
- ECS Fargate cluster with Application Load Balancer
- Comprehensive security groups and IAM roles

## Implementation Files

### Main Stack (lib/tap-stack.ts)

This is the main orchestration file that brings together all constructs:

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { KmsConstruct } from './kms-construct';
import { RdsConstruct } from './rds-construct';
import { ElastiCacheConstruct } from './elasticache-construct';
import { EcsConstruct } from './ecs-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const networking = new NetworkingConstruct(this, 'networking', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
    });

    const kms = new KmsConstruct(this, 'kms', {
      environmentSuffix,
    });

    const rds = new RdsConstruct(this, 'rds', {
      environmentSuffix,
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      kmsKeyId: kms.rdsKey.arn,
      secretsManagerKmsKeyId: kms.secretsManagerKey.arn,
    });

    const elasticache = new ElastiCacheConstruct(this, 'elasticache', {
      environmentSuffix,
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      kmsKeyId: kms.elasticacheKey.arn,
    });

    const ecs = new EcsConstruct(this, 'ecs', {
      environmentSuffix,
      vpc: networking.vpc,
      publicSubnets: networking.publicSubnets,
      privateSubnets: networking.privateSubnets,
      dbSecretArn: rds.dbSecret.arn,
      cacheEndpoint: elasticache.replicationGroup.configurationEndpointAddress,
    });

    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS PostgreSQL endpoint',
    });

    new TerraformOutput(this, 'rds-secret-arn', {
      value: rds.dbSecret.arn,
      description: 'RDS credentials secret ARN',
    });

    new TerraformOutput(this, 'elasticache-endpoint', {
      value: elasticache.replicationGroup.configurationEndpointAddress,
      description: 'ElastiCache Redis configuration endpoint',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecs.cluster.name,
      description: 'ECS cluster name',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ecs.loadBalancer.dnsName,
      description: 'Application Load Balancer DNS name',
    });
  }
}
```

### Networking Construct (lib/networking-construct.ts)

Creates VPC with public/private subnets, NAT Gateway, and routing:

Key Features:
- VPC with 10.0.0.0/16 CIDR
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) with internet gateway
- 2 private subnets (10.0.11.0/24, 10.0.12.0/24) with NAT gateway
- Proper route tables and associations
- DNS support enabled

```typescript
// See lib/networking-construct.ts for full implementation (162 lines)
// Highlights:
// - Multi-AZ subnet distribution
// - Single NAT Gateway for cost optimization
// - Proper tagging with environmentSuffix
```

### KMS Construct (lib/kms-construct.ts)

Creates three KMS keys for different services with proper policies:

Key Features:
- RDS encryption key with automatic rotation
- Secrets Manager encryption key
- ElastiCache encryption key
- Service-specific IAM policies
- KMS aliases for easy reference

```typescript
// See lib/kms-construct.ts for full implementation (160 lines)
// Highlights:
// - Automatic key rotation enabled
// - Service-specific key policies
// - 7-day deletion window for safety
```

### RDS Construct (lib/rds-construct.ts)

Creates PostgreSQL database with comprehensive security features:

Key Features:
- Multi-AZ RDS PostgreSQL 14.7
- Storage encryption with KMS
- Private subnet deployment
- DB subnet group across AZs
- Security group with VPC-only access
- Secrets Manager integration
- Lambda-based secret rotation (30 days)
- CloudWatch logs enabled

```typescript
// See lib/rds-construct.ts for full implementation (220 lines)
// Highlights:
// - Multi-AZ enabled for high availability
// - No public access
// - Automatic backups enabled
// - Secret rotation with Lambda function
```

### ElastiCache Construct (lib/elasticache-construct.ts)

Creates Redis cluster with high availability and encryption:

Key Features:
- Multi-AZ Redis 7.0 replication group
- 2 cache nodes for redundancy
- Encryption at rest and in transit
- Automatic failover enabled
- Private subnet deployment
- Security group for Redis port 6379

```typescript
// See lib/elasticache-construct.ts for full implementation (101 lines)
// Highlights:
// - Multi-AZ with automatic failover
// - Both at-rest and in-transit encryption
// - Snapshot retention for backups
```

### ECS Construct (lib/ecs-construct.ts)

Creates ECS Fargate cluster with Application Load Balancer:

Key Features:
- ECS cluster with Container Insights enabled
- Fargate task definition (serverless)
- Task execution and task IAM roles
- Application Load Balancer in public subnets
- Target group with health checks
- CloudWatch log groups for container logs
- Security groups for ALB and ECS tasks
- ECS service with 2 tasks for HA

```typescript
// See lib/ecs-construct.ts for full implementation (322 lines)
// Highlights:
// - Fargate for serverless container execution
// - IAM roles with least privilege
// - Secrets passed via Secrets Manager
// - Container Insights for monitoring
```

## Security Features

### Encryption at Rest
- All RDS data encrypted with KMS customer-managed keys
- ElastiCache encrypted with KMS
- Secrets Manager secrets encrypted with KMS
- S3 state backend encrypted

### Encryption in Transit
- ElastiCache Redis uses TLS
- RDS connections encrypted
- ALB to ECS communication over secure network

### Network Isolation
- Database and cache in private subnets only
- No public IP addresses on database resources
- Security groups with least privilege rules
- NAT Gateway for outbound internet access from private subnets

### Secret Management
- Database credentials stored in Secrets Manager
- Automatic 30-day rotation configured
- Lambda function handles rotation
- KMS encryption for secrets

### IAM Least Privilege
- Separate roles for ECS task execution and application
- Specific permissions for Secrets Manager access
- Service-specific KMS key policies

## High Availability Features

### Multi-AZ Deployments
- RDS Multi-AZ: Automatic failover to standby
- ElastiCache Multi-AZ: Automatic failover enabled
- Subnets span across 2 availability zones
- ECS service deploys tasks across AZs

### Auto-Scaling and Redundancy
- ECS service with 2 tasks (can be scaled)
- ElastiCache with 2 cache nodes
- Application Load Balancer distributes traffic

### Backup and Recovery
- RDS automated backups (7-day retention)
- ElastiCache snapshots (5-day retention)
- Point-in-time recovery available

## PCI-DSS Compliance

This implementation addresses key PCI-DSS requirements:

1. **Protect Stored Cardholder Data**: KMS encryption for all data stores
2. **Encrypt Transmission**: TLS for Redis, encrypted RDS connections
3. **Restrict Access**: Private subnets, security groups, IAM policies
4. **Maintain Audit Logs**: CloudWatch logs for ECS, RDS, and ElastiCache
5. **Regular Testing**: Infrastructure as Code enables repeatable deployments
6. **Access Control**: IAM roles with least privilege principle

## Deployment

```bash
# Install dependencies
npm install

# Set environment variables
export ENVIRONMENT_SUFFIX="synth-<task-id>"
export AWS_REGION="us-west-2"

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Extract outputs
# Outputs will be available in cdktf.out/stacks/<stack-name>/
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

Tests verify:
- All resources are created
- Multi-AZ is enabled
- Encryption is configured
- Security groups are properly configured
- Resource naming includes environmentSuffix

### Integration Tests
```bash
npm run test:integration
```

Tests verify:
- VPC and subnets are accessible
- RDS is running and encrypted
- Secrets Manager rotation is configured
- ElastiCache cluster is operational
- ECS cluster and service are active
- ALB is routing traffic

## Cost Optimization

- Single NAT Gateway instead of per-AZ (saves ~$32/month)
- t3.micro instances for RDS and ElastiCache
- Fargate for ECS (pay only for running tasks)
- 7-day log retention to manage storage costs

## Monitoring and Observability

- Container Insights for ECS metrics
- CloudWatch logs for application output
- RDS Enhanced Monitoring available
- CloudWatch alarms can be added for key metrics

## Key Implementation Decisions

1. **CDKTF TypeScript**: Provides type safety and familiar syntax for TypeScript developers
2. **Construct Pattern**: Modular design allows independent testing and reuse
3. **Multi-AZ**: Prioritizes availability over cost for production workloads
4. **Fargate**: Serverless container execution reduces operational overhead
5. **Customer-Managed KMS Keys**: Required for PCI-DSS compliance and key rotation
6. **Lambda-Based Rotation**: Standard AWS pattern for Secrets Manager rotation
7. **Private Subnets**: Follows AWS best practices for database isolation
8. **Environment Suffix**: Enables parallel deployments and testing

## Future Enhancements

- Add CloudWatch alarms for critical metrics
- Implement AWS WAF for ALB protection
- Add X-Ray tracing for distributed tracing
- Configure auto-scaling policies for ECS
- Add AWS Config rules for compliance monitoring
- Implement VPC Flow Logs for network monitoring
- Add AWS Systems Manager Parameter Store for non-secret configuration
