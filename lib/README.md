# Student Assessment Processing System

This infrastructure implements a secure, FERPA-compliant student assessment data processing system using CDKTF with TypeScript.

## Architecture

- **VPC**: Multi-AZ VPC with public and private subnets
- **ECS Fargate**: Containerized assessment processing workloads
- **RDS Aurora Serverless v2**: MySQL-compatible database for assessment metadata
- **ElastiCache Redis**: In-memory caching for frequently accessed data
- **Secrets Manager**: Secure credential storage with automatic rotation support
- **KMS**: Encryption at rest for all data stores
- **CloudWatch**: Centralized logging and audit trails

## Prerequisites

- Node.js >= 14.0.0
- CDKTF CLI >= 0.15.0
- AWS credentials configured
- Terraform >= 1.0

## Deployment

### Install Dependencies

```bash
npm install
```

### Configure Environment

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
```

### Synthesize Infrastructure

```bash
cdktf synth
```

### Deploy

```bash
cdktf deploy
```

### Destroy

```bash
cdktf destroy
```

## Security Features

1. **Encryption at Rest**: All data encrypted with KMS
2. **Encryption in Transit**: TLS enabled for RDS and Redis
3. **Network Isolation**: Database and cache in private subnets
4. **Least Privilege**: Security groups restrict access between services
5. **Audit Logging**: CloudWatch logs for all data access
6. **Credential Rotation**: Secrets Manager supports automatic rotation

## Resource Naming

All resources include the `environmentSuffix` parameter for uniqueness:
- VPC: `assessment-vpc-${environmentSuffix}`
- ECS Cluster: `assessment-cluster-${environmentSuffix}`
- RDS Cluster: `assessment-cluster-${environmentSuffix}`
- Redis: `assessment-redis-${environmentSuffix}`

## Cost Optimization

- Aurora Serverless v2 scales from 0.5 to 1.0 ACU
- ECS Fargate tasks use minimal resource allocation (256 CPU, 512 MB)
- Redis uses t3.micro instances
- CloudWatch logs retained for 30-90 days

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Compliance

This infrastructure is designed to support FERPA compliance:
- All student data encrypted at rest and in transit
- Audit logs maintained in CloudWatch
- Access controls via security groups and IAM roles
- Credential rotation supported via Secrets Manager
