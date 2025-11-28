# Multi-Region Disaster Recovery Infrastructure

This Pulumi TypeScript program implements a comprehensive multi-region disaster recovery solution for a payment processing application across AWS regions us-east-1 (primary) and us-west-2 (secondary).

## Architecture Components

### Core Infrastructure
- **Aurora Global Database**: PostgreSQL 15.4 with primary cluster in us-east-1 and secondary read replica in us-west-2
- **S3 Cross-Region Replication**: Automated replication of application artifacts and backups between regions
- **VPC Multi-Region**: Dedicated VPCs in both regions with 3 AZs each, connected via VPC peering
- **NAT Gateways**: Outbound connectivity for private subnets in both regions

### Monitoring & Health Checks
- **Lambda Health Check Functions**: Node.js 18 functions monitoring database endpoints in both regions
- **Route 53 Health Checks**: 30-second interval monitoring with failover routing
- **CloudWatch Alarms**: Monitoring for database health, replication lag, and RTO/RPO thresholds
- **CloudWatch Dashboards**: Real-time DR metrics visualization in both regions

### Notifications & Alerting
- **SNS Topics**: Disaster recovery event notifications in both regions
- **Multi-Region Alarms**: Automated alerting for failover events and health check failures

## Prerequisites

1. **Pulumi CLI**: Install from https://www.pulumi.com/docs/get-started/install/
   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. **Node.js 18+**: Required for Pulumi and Lambda runtime
   ```bash
   node --version  # Should be >= 18.0.0
   ```

3. **AWS CLI v2**: Configure with appropriate credentials
   ```bash
   aws configure
   # Ensure credentials have permissions for:
   # - VPC, EC2, RDS, S3, Lambda, SNS, CloudWatch, Route53, IAM
   ```

4. **npm**: Install dependencies
   ```bash
   npm install
   ```

## Configuration

### Initialize Pulumi Stack

```bash
# Create a new stack
pulumi stack init dev

# OR select existing stack
pulumi stack select dev
```

### Set Required Configuration

```bash
# Set unique environment suffix (required)
pulumi config set environmentSuffix dev01

# Set database master password (required, secret)
pulumi config set --secret dbPassword YourSecurePassword123!

# Set environment name (optional, defaults to "production")
pulumi config set environment production
```

### Verify Configuration

```bash
pulumi config
```

Expected output:
```
KEY                 VALUE
environment         production
environmentSuffix   dev01
dbPassword          [secret]
```

## Deployment

### Preview Changes

Before deploying, preview the infrastructure changes:

```bash
pulumi preview
```

This will show:
- Resources to be created
- Estimated costs
- Dependencies between resources

### Deploy Infrastructure

Deploy the complete DR infrastructure:

```bash
pulumi up
```

Review the planned changes and confirm by selecting "yes".

**Note**: Initial deployment takes approximately 15-20 minutes due to:
- Aurora Global Database cluster provisioning
- NAT Gateway creation in both regions
- VPC peering establishment
- Lambda function deployment

### View Outputs

After successful deployment:

```bash
pulumi stack output
```

Key outputs include:
- `primaryVpcId` / `secondaryVpcId`: VPC identifiers
- `primaryClusterEndpoint` / `secondaryClusterEndpoint`: Aurora database endpoints
- `primaryBucketName` / `secondaryBucketName`: S3 bucket names
- `primarySnsTopicArn` / `secondarySnsTopicArn`: SNS topic ARNs
- `primaryHealthCheckId` / `secondaryHealthCheckId`: Route 53 health check IDs
- `primaryDashboardName` / `secondaryDashboardName`: CloudWatch dashboard names
- `vpcPeeringConnectionId`: VPC peering connection ID

## Validation

### 1. Verify Aurora Global Database

```bash
# Check primary cluster
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-primary-<environmentSuffix> \
  --region us-east-1

# Check secondary cluster
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-secondary-<environmentSuffix> \
  --region us-west-2

# Check replication status
aws rds describe-global-clusters \
  --global-cluster-identifier global-cluster-<environmentSuffix> \
  --region us-east-1
```

### 2. Verify S3 Replication

```bash
# Check replication configuration
aws s3api get-bucket-replication \
  --bucket dr-bucket-primary-<environmentSuffix> \
  --region us-east-1

# Test replication (upload file to primary)
echo "test" > test.txt
aws s3 cp test.txt s3://dr-bucket-primary-<environmentSuffix>/ --region us-east-1

# Verify in secondary (wait ~1 minute)
aws s3 ls s3://dr-bucket-secondary-<environmentSuffix>/ --region us-west-2
```

### 3. Verify Lambda Health Checks

```bash
# Check Lambda function logs - Primary
aws logs tail /aws/lambda/db-healthcheck-primary-<environmentSuffix> \
  --follow --region us-east-1

# Check Lambda function logs - Secondary
aws logs tail /aws/lambda/db-healthcheck-secondary-<environmentSuffix> \
  --follow --region us-west-2
```

### 4. Verify Route 53 Health Checks

```bash
# Get health check status
PRIMARY_HC_ID=$(pulumi stack output primaryHealthCheckId)
SECONDARY_HC_ID=$(pulumi stack output secondaryHealthCheckId)

aws route53 get-health-check-status --health-check-id $PRIMARY_HC_ID
aws route53 get-health-check-status --health-check-id $SECONDARY_HC_ID
```

### 5. View CloudWatch Dashboards

Navigate to AWS Console:
- Primary Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=dr-metrics-primary-<environmentSuffix>
- Secondary Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=dr-metrics-secondary-<environmentSuffix>

### 6. Subscribe to SNS Notifications

```bash
# Subscribe email to primary SNS topic
PRIMARY_SNS=$(pulumi stack output primarySnsTopicArn)
aws sns subscribe \
  --topic-arn $PRIMARY_SNS \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# Subscribe email to secondary SNS topic
SECONDARY_SNS=$(pulumi stack output secondarySnsTopicArn)
aws sns subscribe \
  --topic-arn $SECONDARY_SNS \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-west-2

# Confirm subscription in email
```

## Disaster Recovery Testing

### Monitor RTO/RPO Metrics

1. **Check Replication Lag** (RPO < 1 minute):
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name AuroraGlobalDBReplicationLag \
     --dimensions Name=DBClusterIdentifier,Value=aurora-secondary-<environmentSuffix> \
     --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Average \
     --region us-west-2
   ```

2. **Monitor Health Check Latency**:
   View in CloudWatch dashboards or query metrics programmatically

### Simulate Failover Scenario

**WARNING**: Only perform in non-production environments

1. **Simulate Primary Region Failure**:
   ```bash
   # Disable primary Lambda health checks
   aws lambda put-function-concurrency \
     --function-name db-healthcheck-primary-<environmentSuffix> \
     --reserved-concurrent-executions 0 \
     --region us-east-1
   ```

2. **Monitor Health Check Failures**:
   - Watch Route 53 health check status change to "Unhealthy"
   - Verify SNS notifications sent
   - Check CloudWatch alarms triggering

3. **Verify Secondary Region Operational**:
   ```bash
   # Check secondary Lambda health checks still running
   aws logs tail /aws/lambda/db-healthcheck-secondary-<environmentSuffix> \
     --follow --region us-west-2
   ```

4. **Restore Primary Region**:
   ```bash
   # Re-enable primary Lambda health checks
   aws lambda delete-function-concurrency \
     --function-name db-healthcheck-primary-<environmentSuffix> \
     --region us-east-1
   ```

### Manual Failover (Promote Secondary to Primary)

In a real disaster scenario:

1. **Promote Secondary Cluster**:
   ```bash
   aws rds remove-from-global-cluster \
     --db-cluster-identifier aurora-secondary-<environmentSuffix> \
     --global-cluster-identifier global-cluster-<environmentSuffix> \
     --region us-west-2
   ```

2. **Update Application Configuration**:
   - Point application to secondary cluster endpoint
   - Update DNS records if needed

3. **Verify Write Capability**:
   - Test write operations on promoted cluster

## Updating Infrastructure

### Modify Configuration

```bash
# Update any configuration value
pulumi config set <key> <value>

# Preview changes
pulumi preview

# Apply changes
pulumi up
```

### Refresh State

```bash
# Refresh Pulumi state from actual AWS resources
pulumi refresh
```

## Cleanup

### Destroy Infrastructure

**WARNING**: This will delete ALL resources including databases and data.

```bash
# Preview resources to be deleted
pulumi destroy --preview

# Destroy infrastructure
pulumi destroy
```

**Important Notes**:
- Empty S3 buckets before destruction if needed
- Aurora clusters use `skipFinalSnapshot: true` so no final snapshots are created
- All resources are configured as destroyable (no Retain policies)

### Delete Stack

After destroying resources:

```bash
# Remove stack from Pulumi state
pulumi stack rm dev
```

## Troubleshooting

### Common Issues

1. **Aurora Global Cluster Creation Fails**:
   - Ensure primary cluster is fully provisioned before secondary
   - Check `dependsOn` relationships in code
   - Verify Aurora version 15.4 is supported in both regions

2. **VPC Peering Not Established**:
   - Verify CIDR blocks don't overlap (10.0.0.0/16 vs 10.1.0.0/16)
   - Check peering accepter created successfully
   - Verify routes added to both route tables

3. **Lambda Functions Timing Out**:
   - Ensure Lambda has proper VPC configuration
   - Verify security groups allow outbound traffic
   - Check NAT Gateway operational for internet access
   - Confirm Lambda execution role has required permissions

4. **S3 Replication Not Working**:
   - Verify versioning enabled on both buckets
   - Check replication role has correct permissions
   - Ensure replication rule status is "Enabled"

5. **Route 53 Health Checks Failing**:
   - Lambda Function URLs must be publicly accessible
   - Verify health check endpoint returns 200 status
   - Check health check configuration (interval, threshold)

### View Logs

```bash
# Pulumi logs
pulumi logs --follow

# AWS CloudWatch logs for Lambda
aws logs tail /aws/lambda/db-healthcheck-primary-<environmentSuffix> --follow --region us-east-1
aws logs tail /aws/lambda/db-healthcheck-secondary-<environmentSuffix> --follow --region us-west-2
```

### Debug Mode

```bash
# Enable verbose logging
pulumi up --logtostderr --v=9
```

## Cost Optimization

### Estimated Monthly Costs

- **Aurora Global Database**: ~$350-500 (db.r6g.large instances)
- **NAT Gateways**: ~$64 (2 gateways × $0.045/hour × 730 hours)
- **S3 Storage + Replication**: ~$25-50 (depending on data volume)
- **Lambda**: ~$1-5 (within free tier for health checks)
- **Route 53 Health Checks**: ~$1 (2 health checks × $0.50/month)
- **CloudWatch**: ~$5-10 (dashboards, logs, metrics)

**Total**: ~$450-630/month

### Cost Reduction Options

1. **Use Aurora Serverless v2**: Replace db.r6g.large with serverless
2. **Reduce NAT Gateways**: Use VPC endpoints for AWS services
3. **Adjust Backup Retention**: Reduce from 7 days if acceptable
4. **Lambda Reserved Concurrency**: Only if needed for production

## Security Best Practices

1. **Rotate Database Passwords**: Use AWS Secrets Manager
2. **Enable MFA**: For AWS account and IAM users
3. **Use VPC Endpoints**: For S3, DynamoDB access without NAT
4. **Enable CloudTrail**: Audit all API calls
5. **Review Security Groups**: Restrict to minimum required access
6. **Enable VPC Flow Logs**: Monitor network traffic

## Support & Documentation

- **Pulumi Documentation**: https://www.pulumi.com/docs/
- **AWS Aurora Global Database**: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html
- **AWS Disaster Recovery**: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html

## License

This infrastructure code is provided as-is for disaster recovery implementation.
