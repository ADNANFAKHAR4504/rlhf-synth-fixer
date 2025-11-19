# Multi-Region PostgreSQL Disaster Recovery Architecture

A comprehensive disaster recovery solution for PostgreSQL databases across AWS regions using CDK TypeScript.

## Architecture Overview

This solution implements a multi-region disaster recovery architecture for PostgreSQL databases with the following capabilities:

- **Primary Region**: us-east-1 with Multi-AZ RDS PostgreSQL 14
- **DR Region**: us-east-2 with read replica
- **RPO**: < 1 hour (Recovery Point Objective)
- **RTO**: < 4 hours (Recovery Time Objective)

### Components

#### Network Layer
- VPC in each region with CIDR 10.0.0.0/16 (primary) and 10.1.0.0/16 (DR)
- 3 Availability Zones in each region
- Private subnets for database and Lambda functions
- 2 NAT Gateways for high availability
- VPC endpoints for AWS services (cost optimization)
- Security groups with least-privilege access

#### Database Layer
- RDS PostgreSQL 14 with Multi-AZ in primary region
- db.r6g.xlarge instance class
- Read replica in primary region (can be extended to DR region)
- KMS encryption at rest
- Automated backups with 7-day retention
- Performance Insights enabled
- CloudWatch Logs enabled (postgresql, upgrade)

#### Storage Layer
- S3 buckets in both regions for backups
- Cross-region replication configuration
- KMS encryption with key rotation
- Versioning enabled
- Lifecycle policies (IA after 30 days, Glacier after 90 days)

#### Monitoring Layer
- CloudWatch alarms for CPU, storage, connections, latency
- Composite alarms for critical failures
- Lambda function for replication lag monitoring (threshold: 300 seconds)
- EventBridge rule to trigger monitoring every 5 minutes
- SNS topic for alarm notifications

#### Failover Layer
- EventBridge rules for CloudWatch alarm state changes
- EventBridge rules for RDS failover events
- Lambda function for failover orchestration
- SNS notifications for failover events

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Access to both us-east-1 and us-east-2 regions

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bootstrap CDK in both regions (if not already done):
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   cdk bootstrap aws://ACCOUNT-ID/us-east-2
   ```

## Deployment

### Deploy to Primary Region (us-east-1)

```bash
# Set environment suffix (e.g., dev, staging, prod)
cdk deploy TapStackdev-primary \
  --context environmentSuffix=dev \
  --region us-east-1
```

### Deploy to DR Region (us-east-2)

```bash
cdk deploy TapStackdev-dr \
  --context environmentSuffix=dev \
  --region us-east-2
```

### Deploy Both Regions

```bash
cdk deploy --all \
  --context environmentSuffix=dev
```

## Configuration

### Environment Suffix

The `environmentSuffix` context variable is used to create unique resource names:

```bash
cdk deploy --all --context environmentSuffix=prod
```

This creates resources like:
- `postgres-dr-vpc-prod-us-east-1`
- `postgres-dr-db-prod-us-east-1`
- `replication-lag-monitor-prod-us-east-1`

### Regions

To change the regions, modify `bin/tap.ts`:

```typescript
const primaryRegion = 'us-west-2';
const drRegion = 'eu-west-1';
```

### Instance Class

To change the RDS instance class, modify `lib/database-stack.ts`:

```typescript
instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE2),
```

## Accessing the Database

### Get Database Credentials

```bash
aws secretsmanager get-secret-value \
  --secret-id postgres-dr-credentials-dev-us-east-1 \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r .password
```

### Connect to Database

```bash
# Get endpoint from CloudFormation outputs
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name TapStackdev-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

# Connect using psql
psql -h $ENDPOINT -U postgres -d postgres
```

## Monitoring

### CloudWatch Alarms

Monitor the following metrics:
- CPU utilization (threshold: 80%)
- Free storage space (threshold: 10 GB)
- Database connections (threshold: 80)
- Read/Write latency (threshold: 100ms)
- Replication lag (threshold: 300 seconds)

### View Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix postgres-dr \
  --region us-east-1
```

### Subscribe to SNS Notifications

```bash
TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name TapStackdev-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AlarmTopicArn`].OutputValue' \
  --output text)

aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

## Failover Procedures

### Manual Failover

1. Verify primary database is unavailable:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier postgres-dr-dev-us-east-1 \
     --region us-east-1
   ```

2. Check replication lag on DR replica:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace PostgreSQL/DR \
     --metric-name ReplicationLag \
     --dimensions Name=DBInstanceIdentifier,Value=postgres-dr-replica-dev-us-east-1 \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-01T23:59:59Z \
     --period 300 \
     --statistics Average \
     --region us-east-1
   ```

3. Promote read replica in DR region (requires custom implementation):
   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier postgres-dr-replica-dev-us-east-2 \
     --region us-east-2
   ```

4. Update application endpoints to point to DR region

### Automated Failover

The solution includes EventBridge rules that trigger the failover Lambda function when:
- Composite CloudWatch alarm enters ALARM state
- RDS failover/failure events occur

The Lambda function sends SNS notifications but requires manual approval for actual failover to prevent accidental promotion.

## Testing

### Run Unit Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Synthesize CloudFormation Templates

```bash
cdk synth TapStackdev-primary
cdk synth TapStackdev-dr
```

## Cost Optimization

The solution includes several cost optimizations:

1. **VPC Endpoints**: Reduces NAT Gateway data transfer costs
2. **S3 Lifecycle Policies**: Automatically transitions old backups to cheaper storage
3. **Single NAT Gateway Option**: Can be configured for non-production environments
4. **Read Replica**: Only created in primary region by default
5. **Performance Insights**: Uses default retention (7 days)

### Estimated Monthly Costs

For `dev` environment suffix:
- RDS db.r6g.xlarge Multi-AZ (Primary): ~$650/month
- RDS db.r6g.xlarge (DR): ~$325/month
- NAT Gateways (2 per region): ~$140/month
- VPC Endpoints: ~$40/month
- S3 Storage: ~$20/month (100 GB)
- Lambda: ~$5/month
- **Total**: ~$1,180/month

## Security

### Encryption

- **At Rest**: KMS encryption for RDS, S3, and Performance Insights
- **In Transit**: SSL/TLS enforced for database connections
- **Key Rotation**: Enabled for KMS keys

### IAM

- Least-privilege IAM roles for Lambda functions
- Service-specific IAM policies
- No hardcoded credentials (uses Secrets Manager)

### Network

- Databases in private subnets only
- Security groups with minimal ingress rules
- VPC endpoints for AWS service communication

## Troubleshooting

### Deployment Issues

**Issue**: Stack fails to deploy due to missing permissions

**Solution**: Ensure IAM user/role has the following permissions:
- RDS: Full access
- VPC: Full access
- Lambda: Full access
- CloudWatch: Full access
- S3: Full access
- KMS: Full access
- IAM: Create/manage roles and policies

**Issue**: Read replica creation fails

**Solution**: Ensure primary database is in "available" state and automated backups are enabled.

### Monitoring Issues

**Issue**: Replication lag monitoring Lambda fails

**Solution**: Check Lambda logs in CloudWatch Logs:
```bash
aws logs tail /aws/lambda/replication-lag-monitor-dev-us-east-1 \
  --follow \
  --region us-east-1
```

### Connectivity Issues

**Issue**: Cannot connect to database from application

**Solution**:
1. Verify security group allows traffic from application
2. Check VPC peering connection status
3. Verify database is in "available" state
4. Check network ACLs

## Cleanup

To avoid ongoing costs, destroy the stacks:

```bash
# Destroy DR region first
cdk destroy TapStackdev-dr --region us-east-2

# Then destroy primary region
cdk destroy TapStackdev-primary --region us-east-1
```

**Note**: Ensure `deletionProtection` is set to `false` in `lib/database-stack.ts` before destroying.

## Additional Resources

- [AWS RDS Multi-Region Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html)
- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html)
- [RDS PostgreSQL Replication](https://www.postgresql.org/docs/current/warm-standby.html)

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review CloudFormation events for deployment issues
3. Consult AWS RDS documentation for database-specific issues
