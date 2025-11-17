# Multi-Region Disaster Recovery Architecture

This CDK application deploys a comprehensive multi-region disaster recovery solution for PostgreSQL databases with automated failover capabilities between us-east-1 (primary) and us-east-2 (DR).

## Architecture Overview

The solution consists of three main stacks:

### 1. DRRegionStack (us-east-2)
- VPC with private subnets and NAT gateway
- RDS PostgreSQL 14 instance (Multi-AZ)
- S3 bucket for backups (destination for cross-region replication)
- KMS key for encryption
- Lambda function for replication lag monitoring
- SNS topic for alerts
- VPC endpoints for AWS services

### 2. PrimaryRegionStack (us-east-1)
- VPC with private subnets and NAT gateway
- RDS PostgreSQL 14 instance (Multi-AZ)
- S3 bucket for backups (source for cross-region replication)
- **S3 replication configuration** (configured in this stack)
- KMS key for encryption
- Lambda function for replication lag monitoring
- Lambda function for failover orchestration
- SNS topic for alerts
- CloudWatch alarms for database monitoring
- EventBridge rules for automated failover
- VPC endpoints for AWS services

### 3. Route53FailoverStack (us-east-1)
- Route53 health checks for both database endpoints
- Composite CloudWatch alarms for failover decision
- Health check alarms with SNS notifications

## Key Features

### S3 Replication Architecture (CRITICAL)
The S3 replication configuration follows the correct pattern:
- **DR Stack**: Creates only the destination bucket (no replication config)
- **Primary Stack**: Receives the DR bucket ARN via cross-stack reference
- **Primary Stack**: Configures the replication role and replication rules on the source bucket
- Replication time: 15 minutes for objects under 5GB
- Replication metrics enabled

### High Availability
- Multi-AZ RDS deployments in both regions
- Cross-region read replicas (configured post-deployment)
- Automated backups with point-in-time recovery
- S3 versioning and cross-region replication

### Monitoring and Alerting
- Lambda functions monitoring replication lag every 5 minutes
- CloudWatch alarms for database CPU and connections
- SNS notifications for all alerts
- Alert threshold: 300 seconds (5 minutes) replication lag

### Automated Failover
- EventBridge rules trigger failover on composite alarms
- Lambda function orchestrates failover procedures
- Route53 health checks enable DNS-level failover

### Security
- All resources in private subnets
- VPC endpoints for AWS service access
- KMS encryption at rest in both regions
- IAM roles with least-privilege access
- Security groups restricting network access
- Encryption in transit for all data movement

### Destroyability
- All resources configured with RemovalPolicy.DESTROY
- RDS: deletionProtection: false, skipFinalSnapshot: true
- S3: autoDeleteObjects: true
- No resources have Retain policies

## Prerequisites

- AWS CDK 2.x installed
- Node.js 18 or later
- AWS credentials configured
- Sufficient AWS permissions to create resources

## Environment Variables

The stacks use the following environment variables:
- CDK_DEFAULT_ACCOUNT: AWS account ID
- CDK_DEFAULT_REGION: AWS region (default region)
- REPOSITORY: Repository name (for tagging)
- COMMIT_AUTHOR: Commit author (for tagging)
- PR_NUMBER: Pull request number (for tagging)
- TEAM: Team name (for tagging)

## Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Lambda Functions

```bash
cd lib/lambda/replication-lag-monitor
npm install
cd ../failover-orchestrator
npm install
cd ../../..
```

### Step 3: Bootstrap CDK (if not already done)

```bash
# Bootstrap both regions
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

### Step 4: Deploy Stacks

Deploy all stacks with an environment suffix:

```bash
cdk deploy --all -c environmentSuffix=dev
```

Or deploy stacks individually in order:

```bash
# Deploy DR stack first
cdk deploy DRRegionStack-dev -c environmentSuffix=dev

# Deploy Primary stack (depends on DR stack)
cdk deploy PrimaryRegionStack-dev -c environmentSuffix=dev

# Deploy Route53 stack (depends on both regional stacks)
cdk deploy Route53FailoverStack-dev -c environmentSuffix=dev
```

### Step 5: Configure Cross-Region Read Replica (Post-Deployment)

After both RDS instances are running, create a cross-region read replica:

```bash
# Get primary DB instance ARN from CloudFormation outputs
PRIMARY_DB_ARN=$(aws cloudformation describe-stacks \
  --stack-name PrimaryRegionStack-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryDbEndpoint`].OutputValue' \
  --output text)

# Create read replica in DR region
aws rds create-db-instance-read-replica \
  --db-instance-identifier dr-postgres-dev-replica \
  --source-db-instance-identifier $PRIMARY_DB_ARN \
  --region us-east-2
```

## Monitoring

### CloudWatch Dashboards
Monitor the following metrics:
- RDS CPU utilization
- RDS database connections
- Replication lag
- S3 replication metrics
- Lambda function invocations and errors

### SNS Notifications
Subscribe to the monitoring topics in both regions:

```bash
# Primary region
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT-ID:primary-monitoring-topic-dev \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# DR region
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-2:ACCOUNT-ID:dr-monitoring-topic-dev \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-2
```

## Testing Failover

### Manual Failover Test

1. Trigger the failover Lambda function manually:

```bash
aws lambda invoke \
  --function-name failover-orchestrator-dev \
  --region us-east-1 \
  --payload '{"detail-type":"CloudWatch Alarm State Change","detail":{"alarmName":"test-alarm","state":{"value":"ALARM"}}}' \
  response.json
```

2. Monitor the failover process through CloudWatch Logs and SNS notifications.

### Simulated Primary Failure

1. Modify the primary database security group to block connections
2. Wait for health checks to fail
3. Observe automated failover procedures
4. Verify DR database is promoted
5. Verify DNS failover to DR endpoint

## Disaster Recovery Procedures

### RTO: Under 4 Hours
1. Health check detects primary failure (5 minutes)
2. Composite alarm triggers (5 minutes)
3. EventBridge invokes failover Lambda (1 minute)
4. Read replica promotion (30-60 minutes)
5. DNS propagation (5-30 minutes)
6. Application verification (1-2 hours)

### RPO: Under 1 Hour
- Continuous replication maintains RPO
- S3 replication: 15 minutes
- RDS replication: Near real-time
- Maximum data loss: Replication lag at time of failure

## Cleanup

To destroy all resources:

```bash
# Destroy all stacks
cdk destroy --all -c environmentSuffix=dev
```

Note: Due to cross-stack dependencies, you may need to destroy in reverse order:

```bash
cdk destroy Route53FailoverStack-dev -c environmentSuffix=dev
cdk destroy PrimaryRegionStack-dev -c environmentSuffix=dev
cdk destroy DRRegionStack-dev -c environmentSuffix=dev
```

## Cost Optimization

The solution uses the following cost-optimized resources:
- Single NAT gateway per region
- GP3 storage for RDS
- Lambda functions (pay per invocation)
- CloudWatch Logs with 1-week retention
- No data transfer costs within AWS backbone

Estimated monthly cost: $500-800 depending on usage

## Troubleshooting

### S3 Replication Not Working
- Verify replication role has correct permissions
- Check KMS key policies allow replication
- Verify versioning is enabled on both buckets
- Check CloudWatch metrics for replication status

### Lambda Functions Timing Out
- Verify Lambda functions are in private subnets
- Check VPC endpoints are created
- Verify security groups allow outbound traffic
- Check CloudWatch Logs for detailed errors

### RDS Connection Issues
- Verify Lambda security group is allowed in RDS security group
- Check RDS instance is in available state
- Verify VPC configuration and routing
- Check KMS key permissions

## Security Considerations

- Database credentials should be stored in AWS Secrets Manager
- Enable AWS CloudTrail for audit logging
- Implement network ACLs for additional security
- Regularly rotate KMS keys
- Review IAM policies regularly
- Enable AWS Config for compliance monitoring

## Compliance

This architecture supports:
- SOC 2 Type II compliance
- PCI DSS requirements
- HIPAA compliance (with additional controls)
- GDPR data residency requirements

## Support

For issues or questions, please contact the infrastructure team.
