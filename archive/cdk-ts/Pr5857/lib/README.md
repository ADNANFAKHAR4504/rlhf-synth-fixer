# Migration Infrastructure CDK Application

This CDK application provides a complete infrastructure solution for orchestrating a phased migration of a monolithic application from on-premises to AWS cloud infrastructure.

## Architecture Overview

The solution deploys separate infrastructure stacks for dev, staging, and production environments, with comprehensive migration capabilities including:

- VPC Infrastructure: 3-AZ VPCs with public, private, and isolated subnets
- Database Layer: RDS PostgreSQL Multi-AZ with read replicas
- Data Migration: AWS DMS for continuous replication
- Application Platform: ECS Fargate with auto-scaling
- Load Balancing: Application Load Balancers with health checks
- Caching: ElastiCache Redis clusters
- Monitoring: CloudWatch dashboards and alarms
- Alerting: SNS topics for notifications
- Validation: Lambda functions for pre/post migration checks
- Traffic Management: Route 53 weighted routing for gradual cutover
- Storage: S3 buckets for artifacts with lifecycle policies
- Backup: AWS Backup with 7-day retention
- CI/CD: CodePipeline with manual approval gates

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ installed
- AWS CDK v2 installed: npm install -g aws-cdk
- AWS CLI configured with credentials
- Docker installed (for Lambda layer building)

## Environment Configuration

The application supports three environments with different configurations:

| Environment | VPC CIDR | Migration Phase | Auto-Scaling Min/Max |
|-------------|----------|----------------|---------------------|
| Development | 10.0.0.0/16 | Preparation | 2/10 |
| Staging | 10.1.0.0/16 | Migration | 2/10 |
| Production | 10.2.0.0/16 | Cutover | 2/10 |

## Required Secrets

Before deploying, create the following secrets in AWS Secrets Manager:

```bash
# Dev environment
aws secretsmanager create-secret \
  --name migration-db-credentials-dev \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1

# Staging environment
aws secretsmanager create-secret \
  --name migration-db-credentials-staging \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1

# Production environment
aws secretsmanager create-secret \
  --name migration-db-credentials-prod \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1
```

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Lambda Functions

```bash
# Install Lambda dependencies
cd lib/lambda/pre-migration && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/post-migration && pip install -r requirements.txt -t . && cd ../../..
```

### 3. Configure Environment

Set the target AWS region:

```bash
export CDK_DEFAULT_REGION=ap-southeast-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
```

### 4. Deploy Development Environment

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION

# Deploy dev environment
cdk deploy MigrationStack-dev \
  -c environmentSuffix=dev \
  --require-approval never
```

### 5. Deploy Staging Environment

```bash
cdk deploy MigrationStack-staging \
  -c environmentSuffix=staging \
  --require-approval never
```

### 6. Deploy Production Environment

```bash
cdk deploy MigrationStack-prod \
  -c environmentSuffix=prod \
  --require-approval never
```

### 7. Optional: Deploy Route53 Stack

```bash
cdk deploy Route53Stack-prod \
  -c environmentSuffix=prod \
  -c domainName=example.com \
  --require-approval never
```

## Migration Runbook

### Phase 1: Preparation (Dev Environment)

1. Deploy dev environment
2. Verify infrastructure deployment
3. Run pre-migration validation:
   ```bash
   aws lambda invoke \
     --function-name pre-migration-validation-dev \
     --region ap-southeast-1 \
     output.json
   ```
4. Configure DMS tasks for test data migration
5. Validate application connectivity

### Phase 2: Migration (Staging Environment)

1. Deploy staging environment
2. Set up DMS replication from on-premises to staging RDS
3. Start continuous data replication
4. Monitor replication lag (should be < 30 seconds)
5. Run integration tests against staging environment
6. Validate data consistency

### Phase 3: Cutover (Production Environment)

1. Deploy production environment
2. Configure DMS replication to production RDS
3. Start continuous replication (parallel run)
4. Set Route 53 weights: 75% on-premises, 25% AWS
5. Monitor CloudWatch dashboards for:
   - Database replication lag
   - Application error rates
   - Response times
   - ECS task health
6. Run post-migration validation:
   ```bash
   aws lambda invoke \
     --function-name post-migration-validation-prod \
     --region ap-southeast-1 \
     output.json
   ```

### Phase 4: Complete

1. Gradually increase Route 53 weight to 100% AWS
2. Monitor for 24-48 hours
3. Stop DMS replication
4. Run final validation checks
5. Decommission on-premises infrastructure (after approval)

## Monitoring and Alerts

### CloudWatch Dashboards

Access dashboards at:
- Migration-dev-dev
- Migration-staging-staging
- Migration-prod-prod

### Key Metrics

- Database CPU Utilization (alarm at 80%)
- Database Connections
- ALB Request Count
- Target Response Time (alarm at 1 second)
- Unhealthy Host Count (alarm at 1+)
- ECS CPU/Memory Utilization (auto-scaling triggers)
- DMS Replication Lag
- Lambda Validation Results

### SNS Alerts

Subscribe to alert topics:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-1:ACCOUNT:migration-alerts-prod \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region ap-southeast-1
```

## Rollback Procedures

### Immediate Rollback (Route 53)

```bash
# Set weight to 0 for AWS environment
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://rollback-route53.json
```

### Infrastructure Rollback

```bash
# Destroy specific environment
cdk destroy MigrationStack-prod -c environmentSuffix=prod

# Redeploy previous version
git checkout previous-commit
cdk deploy MigrationStack-prod -c environmentSuffix=prod
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
# Deploy environment first
cdk deploy MigrationStack-dev -c environmentSuffix=dev

# Run integration tests
npm run test:integration
```

## Cleanup

### Destroy Single Environment

```bash
cdk destroy MigrationStack-dev -c environmentSuffix=dev
```

### Destroy All Environments

```bash
cdk destroy --all
```

### Manual Cleanup

Some resources may require manual deletion:
- Secrets Manager secrets (if not using RemovalPolicy)
- CloudWatch log groups (beyond retention period)
- S3 bucket versions (if versioning enabled)

## Troubleshooting

### Database Connection Issues

1. Verify security group rules
2. Check secrets in Secrets Manager
3. Validate VPC and subnet configuration
4. Review RDS instance status

### DMS Replication Lag

1. Check replication instance size
2. Verify network connectivity
3. Monitor source database load
4. Review DMS task logs in CloudWatch

### ECS Task Failures

1. Check CloudWatch logs: /ecs/migration-app
2. Verify IAM role permissions
3. Validate container image availability
4. Review task definition configuration

### Lambda Validation Failures

1. Check Lambda logs in CloudWatch
2. Verify VPC and security group configuration
3. Test database connectivity manually
4. Review Secrets Manager permissions

## Cost Optimization

- NAT Gateways: ~$100/month per AZ (3 AZs = $300/month per environment)
- RDS PostgreSQL t3.large Multi-AZ: ~$350/month
- ECS Fargate: Variable based on task count and duration
- DMS Replication: ~$150/month for t3.large instance
- ElastiCache: ~$100/month for t3.medium cluster
- Data Transfer: Variable based on migration volume

Estimated Total Cost per Environment: $1,000-1,500/month during active migration

## Security Considerations

- All data encrypted at rest and in transit
- Secrets stored in AWS Secrets Manager
- Least-privilege IAM roles for all services
- VPC isolation with private subnets
- Security groups with minimal required access
- CloudWatch logging enabled for audit trails

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS CDK documentation
3. Consult AWS DMS best practices
4. Contact DevOps team

## License

Internal use only - Financial Services Company
