# Multi-Region Disaster Recovery Infrastructure

Production-ready multi-region disaster recovery infrastructure for payment processing systems using Pulumi with TypeScript. Automated failover between US-EAST-1 (primary) and US-EAST-2 (DR) regions with RPO < 1 minute and RTO < 5 minutes.

## Documentation

- **[README.md](./README.md)** (this file) - Complete deployment and operations guide
- **[MIGRATION.md](./MIGRATION.md)** - v1 to v2 migration procedures and best practices
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[PROMPT.md](./PROMPT.md)** - Original task requirements and constraints

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Route53 Hosted Zone                       │
│              (Health Check-Based Failover Routing)               │
└──────────────────┬────────────────────┬────────────────────────┘
                   │                    │
        ┌──────────▼──────────┐  ┌─────▼─────────────┐
        │  US-EAST-1 PRIMARY  │  │  US-EAST-2 DR     │
        └─────────────────────┘  └───────────────────┘
        │                        │
        │ Application Load       │ Application Load
        │ Balancer (HTTP:80)     │ Balancer (HTTP:80)
        │                        │
        │ Auto Scaling Group     │ Auto Scaling Group
        │ (2-6 t3.medium)        │ (2-6 t3.medium)
        │                        │
        │ Aurora PostgreSQL      │ Aurora PostgreSQL
        │ (Primary Cluster)      │ (Secondary Cluster)
        │                        │
        │ DynamoDB Sessions ─────┼─► Global Replication
        │                        │
        │ CloudWatch Metrics ────┼─► Kinesis Firehose → S3
        │                        │
        │ AWS Backup ────────────┼─► Cross-Region Copy
        └────────────────────────┴───────────────────────┘
```

## Features

### High Availability
- **VPC**: 3 AZs in each region with public and private subnets
- **Auto Scaling**: 2-6 instances per region based on load
- **Load Balancing**: Application Load Balancers with health checks
- **VPC Peering**: Private connectivity between regions

### Database Replication
- **Aurora Global Database**: PostgreSQL 14.6 with < 1 second replication lag
- **DynamoDB Global Tables**: Session data synchronized across regions
- **Customer-Managed KMS**: Encryption at rest with key rotation

### Automated Failover
- **Route53**: Health check-based DNS failover
- **Lambda Orchestration**: Automated failover event handling
- **EventBridge**: CloudWatch alarm integration
- **SNS Alerts**: Multi-region notification system

### Monitoring & Observability
- **CloudWatch Metric Streams**: Cross-region metric replication via Kinesis Firehose
- **Alarms**: Replication lag, unhealthy targets, database health
- **Logs**: RDS PostgreSQL logs exported to CloudWatch

### Backup & Recovery
- **Hourly Backups**: 1-day retention for quick recovery
- **Daily Backups**: 30-day retention with cold storage after 7 days
- **Cross-Region Copies**: Automatic backup to DR region

## Resource Versioning (v2)

All database resources in this infrastructure use a **-v2** naming suffix. This versioning strategy enables:

- **Zero-downtime migrations**: Deploy v2 alongside v1 without service interruption
- **Blue-green deployments**: Validate v2 before switching traffic
- **Safe rollbacks**: Keep v1 resources available as fallback
- **State management**: Avoid Pulumi state conflicts during updates

For detailed migration procedures from v1 to v2 resources, see [MIGRATION.md](./MIGRATION.md).

### v2 Resource Names

| Resource Type | Name Pattern |
|---------------|--------------|
| Secrets Manager | `db-password-v2-{env}` |
| RDS Global Cluster | `global-db-v2-{env}` |
| RDS Clusters | `{primary\|dr}-db-cluster-v2-{env}` |
| RDS Instances | `{primary\|dr}-db-instance-v2-{i}-{env}` |
| DynamoDB Table | `session-table-v2-{env}` |

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with multi-region permissions
- Sufficient service quotas for:
  - VPCs (2)
  - RDS Aurora instances (4)
  - Auto Scaling groups (2)
  - ALBs (2)

## Installation

1. **Clone and navigate to project**:
   ```bash
   cd /path/to/worktree/synth-m0p3q5
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Pulumi stack**:
   ```bash
   pulumi stack init dev
   pulumi config set aws:region us-east-1  # Primary region
   pulumi config set environmentSuffix dev
   ```

## Configuration

### Environment Variables

Set in Pulumi config or environment:

```bash
# Required
export ENVIRONMENT_SUFFIX="dev"  # or prod, staging, etc.

# Optional (defaults shown)
pulumi config set repository "turing/iac-test-automations"
pulumi config set commitAuthor "your-name"
```

### environmentSuffix

The `environmentSuffix` parameter is used throughout the infrastructure for resource naming and identification. It ensures uniqueness across deployments:

```
Resource naming pattern: {resource-type}-{environmentSuffix}
Example: primary-vpc-dev, session-table-prod
```

## Deployment

### Initial Deployment

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Note: Initial deployment takes 15-20 minutes due to:
# - RDS Aurora cluster provisioning (10-12 min)
# - Auto Scaling group warm-up (3-5 min)
# - DNS propagation (1-2 min)
```

### Deployment Output

After successful deployment, you'll see:

```
Outputs:
  primaryEndpoint      : "http://primary-alb-dev-123456789.us-east-1.elb.amazonaws.com"
  drEndpoint           : "http://dr-alb-dev-123456789.us-east-2.elb.amazonaws.com"
  healthCheckStatus    : "Monitoring via Route53 health checks"
  replicationLag       : "< 1 second"
  primaryVpcId         : "vpc-abc123def456"
  drVpcId              : "vpc-xyz789ghi012"
  primarySnsTopicArn   : "arn:aws:sns:us-east-1:...:primary-alerts-dev"
  drSnsTopicArn        : "arn:aws:sns:us-east-2:...:dr-alerts-dev"
  failoverLambdaArn    : "arn:aws:lambda:us-east-1:...:failover-lambda-dev"
  backupPlanId         : "backup-plan-dev-id"
  dynamoTableName      : "session-table-v2-dev"
  dbPasswordSecretArn  : "arn:aws:secretsmanager:us-east-1:...:db-password-v2-dev"
  primaryClusterId     : "primary-db-cluster-v2-dev"
  drClusterId          : "dr-db-cluster-v2-dev"
```

## Testing

### Health Check Verification

```bash
# Check primary ALB health
PRIMARY_ALB=$(pulumi stack output primaryEndpoint)
curl $PRIMARY_ALB/health.html
# Expected output: OK

# Check DR ALB health
DR_ALB=$(pulumi stack output drEndpoint)
curl $DR_ALB/health.html
# Expected output: OK
```

### Database Connectivity

```bash
# Get RDS endpoint from AWS Console or CLI (note: v2 resources)
aws rds describe-db-clusters \
  --db-cluster-identifier primary-db-cluster-v2-dev \
  --region us-east-1 \
  --query 'DBClusters[0].Endpoint' \
  --output text

# Get password from Secrets Manager (note: v2 secret)
aws secretsmanager get-secret-value \
  --secret-id db-password-v2-dev \
  --region us-east-1 \
  --query 'SecretString' \
  --output text

# Connect using psql
psql -h <endpoint> -U dbadmin -d paymentsdb
```

### Failover Testing

**⚠️ WARNING**: This will impact production traffic. Test in non-production environment first.

1. **Simulate primary region failure**:
   ```bash
   # Stop primary ALB target group instances
   aws autoscaling set-desired-capacity \
     --auto-scaling-group-name primary-asg-dev \
     --desired-capacity 0 \
     --region us-east-1
   ```

2. **Monitor failover**:
   ```bash
   # Watch Route53 health check status
   watch -n 10 'aws route53 get-health-check-status \
     --health-check-id <primary-hc-id> \
     --query "HealthCheckObservations[*].[StatusReport.Status]" \
     --output table'
   ```

3. **Verify DNS failover** (takes 2-5 minutes):
   ```bash
   # Check which region is receiving traffic
   dig payments-dev.example.com +short
   # Should show DR ALB IP after failover
   ```

4. **Check Lambda logs**:
   ```bash
   aws logs tail /aws/lambda/failover-lambda-dev \
     --follow \
     --region us-east-1
   ```

5. **Restore primary region**:
   ```bash
   aws autoscaling set-desired-capacity \
     --auto-scaling-group-name primary-asg-dev \
     --desired-capacity 2 \
     --region us-east-1
   ```

## Monitoring

### CloudWatch Dashboards

Access via AWS Console:
1. Navigate to CloudWatch → Dashboards
2. Key metrics to monitor:
   - `AuroraGlobalDBReplicationLag`: Should be < 1000ms
   - `UnHealthyHostCount`: Should be 0
   - `TargetResponseTime`: Monitor latency

### CloudWatch Alarms

Configured alarms:
- `replication-lag-alarm-dev`: Triggers when lag > 1 second
- `primary-unhealthy-alarm-dev`: Triggers when unhealthy targets > 0
- `dr-unhealthy-alarm-dev`: Triggers when DR unhealthy targets > 0

Check alarm status:
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix "replication-lag-alarm" \
  --region us-east-1
```

### SNS Notifications

Subscribe to alerts:
```bash
# Subscribe email to primary alerts
aws sns subscribe \
  --topic-arn $(pulumi stack output primarySnsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
  
# Confirm subscription via email
```

### CloudWatch Metric Streams

Metrics are streamed to S3 buckets in both regions:
- Primary: `s3://primary-metrics-dev/`
- DR: `s3://dr-metrics-dev/`

Access metrics:
```bash
aws s3 ls s3://primary-metrics-dev/ --region us-east-1
```

## Backup and Recovery

### Manual Backup

```bash
# Trigger on-demand backup
aws backup start-backup-job \
  --backup-vault-name primary-backup-vault-dev \
  --resource-arn $(pulumi stack output primaryClusterArn) \
  --iam-role-arn <backup-role-arn> \
  --region us-east-1
```

### List Backups

```bash
# Primary region backups
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name primary-backup-vault-dev \
  --region us-east-1

# DR region backups
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name dr-backup-vault-dev \
  --region us-east-2
```

### Restore from Backup

```bash
# Restore RDS cluster from backup
aws backup start-restore-job \
  --recovery-point-arn <backup-arn> \
  --iam-role-arn <backup-role-arn> \
  --metadata '{"DBClusterIdentifier":"restored-db-cluster"}' \
  --region us-east-2
```

## Cost Optimization

Estimated monthly cost for `dev` environment (2 instances, minimal traffic):

| Service | Cost (USD/month) |
|---------|------------------|
| RDS Aurora (4 x db.r6g.large) | ~$520 |
| EC2 Instances (4 x t3.medium) | ~$120 |
| Application Load Balancers (2) | ~$40 |
| Data Transfer (inter-region) | ~$50 |
| DynamoDB Global Table | ~$25 |
| CloudWatch + Metric Streams | ~$30 |
| AWS Backup | ~$20 |
| VPC Peering | ~$10 |
| **Total** | **~$815** |

### Cost Reduction Strategies

1. **Use Aurora Serverless v2**: Reduces cost by 30-40% for variable workloads
2. **Smaller instances**: Use t3.small instead of t3.medium (-40%)
3. **Reduce backup retention**: 7 days instead of 30 (-60% backup costs)
4. **Schedule DR resources**: Stop DR instances during off-hours
5. **Use Reserved Instances**: 1-year RI for RDS saves 30-40%

## Cleanup

**⚠️ WARNING**: This will permanently delete all resources and data.

```bash
# Delete all infrastructure
pulumi destroy

# Confirm with 'yes' when prompted

# Remove stack
pulumi stack rm dev
```

Note: Some resources may require manual cleanup:
- S3 buckets with versioning
- RDS final snapshots (if retention enabled)
- CloudWatch Logs (if retention configured)

## Troubleshooting

### Issue: RDS cluster creation times out

**Solution**: RDS Aurora can take 10-15 minutes. If timeout:
```bash
pulumi up --refresh  # Resume deployment
```

### Issue: VPC peering connection pending

**Solution**: Check accepter resource exists:
```bash
aws ec2 describe-vpc-peering-connections \
  --filters "Name=status-code,Values=pending-acceptance"
```

### Issue: Health checks failing

**Solution**: Verify security group rules and health endpoint:
```bash
# Check security group
aws ec2 describe-security-groups \
  --group-ids <alb-sg-id>

# Test health endpoint from within VPC
aws ssm start-session --target <instance-id>
curl localhost/health.html
```

### Issue: Lambda failover not triggering

**Solution**: Check EventBridge rule and Lambda permissions:
```bash
# Verify EventBridge rule
aws events list-rules --name-prefix failover-rule

# Check Lambda invocations
aws lambda get-function --function-name failover-lambda-dev
```

### Issue: Cross-region backup failing

**Solution**: Verify DR backup vault exists:
```bash
aws backup describe-backup-vault \
  --backup-vault-name dr-backup-vault-dev \
  --region us-east-2
```

## Security Considerations

- **Secrets**: All passwords stored in Secrets Manager with KMS encryption
- **Encryption**: Customer-managed KMS keys with automatic rotation
- **IAM**: Least-privilege policies for all services
- **Network**: Private subnets for databases, VPC peering for inter-region
- **Monitoring**: CloudWatch logs for all services, audit trail enabled

## Compliance

This infrastructure supports:
- **SOC 2**: Encryption at rest/transit, audit logging, access controls
- **PCI-DSS**: Customer-managed encryption, network segmentation, monitoring
- **HIPAA**: Encrypted storage, secure key management, audit trails

## Version History

This infrastructure is currently at **version 2.0.0**.

For complete version history, breaking changes, and migration notes, see [CHANGELOG.md](./CHANGELOG.md).

### Latest Changes (v2.0.0 - 2025-11-12)

**BREAKING CHANGE**: Database resources renamed with `-v2` suffix

- All database resources use v2 naming convention
- Enables zero-downtime migrations and blue-green deployments
- Requires application configuration updates for new deployments
- See [MIGRATION.md](./MIGRATION.md) for complete migration procedures

## Related Documentation

- **[MIGRATION.md](./MIGRATION.md)** - Detailed v1 to v2 migration guide with step-by-step procedures
- **[CHANGELOG.md](./CHANGELOG.md)** - Complete version history and release notes
- **[PROMPT.md](./PROMPT.md)** - Original infrastructure requirements and constraints

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review Pulumi state: `pulumi stack --show-urns`
3. Consult AWS service quotas and limits
4. Review [CHANGELOG.md](./CHANGELOG.md) for known issues
5. Check [MIGRATION.md](./MIGRATION.md) troubleshooting section
6. Contact your infrastructure team

## License

Internal use only - Turing company proprietary infrastructure.

