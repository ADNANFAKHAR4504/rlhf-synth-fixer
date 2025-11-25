# Multi-Region Disaster Recovery Infrastructure

This CDKTF Python project implements a production-ready multi-region disaster recovery architecture for a payment processing system spanning AWS regions us-east-1 (primary) and us-west-2 (secondary).

## Architecture Overview

### Core Components

1. **Aurora Global Database**: MySQL-compatible database with writer in us-east-1 and reader in us-west-2
2. **DynamoDB Global Tables**: Session data storage with automatic cross-region replication
3. **Lambda Functions**: Payment processing logic deployed identically in both regions
4. **Route 53 Failover Routing**: DNS-based automatic failover with health checks
5. **EventBridge**: Cross-region event replication for critical payment events
6. **AWS Backup**: Daily backups with cross-region copy (7-day retention)
7. **CloudWatch**: Unified monitoring dashboards and replication lag alarms
8. **Systems Manager Parameter Store**: Centralized configuration management

### Key Metrics

- **RPO (Recovery Point Objective)**: 5 minutes
- **RTO (Recovery Time Objective)**: 15 minutes
- **Aurora Replication Lag**: < 1 second (typical)
- **DynamoDB Replication**: Milliseconds

## Prerequisites

### Software Requirements

1. **CDKTF CLI** (version 0.20+):
   ```bash
   npm install -g cdktf-cli@latest
   ```

2. **Python** (3.9+):
   ```bash
   python --version  # Verify 3.9 or higher
   ```

3. **Python Dependencies**:
   ```bash
   pip install cdktf>=0.20.0
   pip install cdktf-cdktf-provider-aws>=19.0.0
   ```

4. **AWS CLI** (configured with appropriate permissions):
   ```bash
   aws configure
   ```

### AWS Permissions Required

- VPC, Subnet, Route Table, Internet Gateway, NAT Gateway management
- RDS (Aurora Global Database) full access
- DynamoDB global table creation and management
- Lambda function deployment and configuration
- IAM role and policy management
- Route 53 hosted zone and health check management
- EventBridge rule and event bus management
- AWS Backup vault, plan, and selection management
- CloudWatch dashboard and alarm management
- Systems Manager Parameter Store access

## Project Structure

```
.
├── lib/
│   ├── tap_stack.py           # Main infrastructure stack
│   ├── PROMPT.md               # Requirements specification
│   ├── MODEL_RESPONSE.md       # Implementation details
│   ├── README.md               # This file
│   └── lambda/
│       ├── payment_processor.py  # Lambda function code
│       └── requirements.txt      # Lambda dependencies
├── bin/
│   └── tap.py                  # CDKTF app entry point
└── cdktf.json                  # CDKTF configuration
```

## Deployment Instructions

### Step 1: Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="test"  # Change to your environment suffix
export AWS_DEFAULT_REGION="us-east-1"
```

### Step 2: Initialize CDKTF Project

```bash
cdktf get
```

This downloads the AWS provider schema and generates Python bindings.

### Step 3: Package Lambda Function

```bash
cd lib/lambda
pip install -r requirements.txt -t .
zip -r ../lambda_function.zip .
cd ../..
```

This creates a deployment package for the Lambda function.

### Step 4: Synthesize Terraform Configuration

```bash
cdktf synth
```

This generates Terraform JSON configuration in the `cdktf.out` directory.

### Step 5: Deploy Infrastructure

```bash
cdktf deploy
```

This will:
1. Create VPCs in both regions with 3 AZs each
2. Set up NAT Gateways for private subnet access
3. Deploy Aurora Global Database with writer and reader instances
4. Create DynamoDB global table with point-in-time recovery
5. Deploy Lambda functions in both regions
6. Configure Route 53 failover routing
7. Set up EventBridge rules and event buses
8. Create AWS Backup plans with cross-region copy
9. Configure CloudWatch dashboards and alarms
10. Store configuration in Systems Manager Parameter Store

**Note**: Initial deployment takes approximately 30-40 minutes due to Aurora instance provisioning and NAT Gateway creation.

### Step 6: Post-Deployment Configuration

#### Update Lambda Function Code

The initial deployment uses a placeholder Lambda package. Update with actual code:

```bash
# Create actual Lambda deployment package
cd lib/lambda
zip -r lambda_function.zip payment_processor.py
aws lambda update-function-code \
  --function-name payment-processor-primary-${ENVIRONMENT_SUFFIX} \
  --zip-file fileb://lambda_function.zip \
  --region us-east-1

aws lambda update-function-code \
  --function-name payment-processor-secondary-${ENVIRONMENT_SUFFIX} \
  --zip-file fileb://lambda_function.zip \
  --region us-west-2
```

#### Configure Database Credentials

Store Aurora master password in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name /payment/${ENVIRONMENT_SUFFIX}/db/master-password \
  --secret-string "YourSecurePassword123!" \
  --region us-east-1

aws secretsmanager create-secret \
  --name /payment/${ENVIRONMENT_SUFFIX}/db/master-password \
  --secret-string "YourSecurePassword123!" \
  --region us-west-2
```

Update Lambda environment variables to reference the secret.

#### Configure DNS

If using a custom domain:

1. Update Route 53 hosted zone NS records in your domain registrar
2. Verify health check endpoints are accessible
3. Test DNS resolution:
   ```bash
   dig api.payment-${ENVIRONMENT_SUFFIX}.example.com
   ```

## Validation and Testing

### Verify Deployment

#### Check Primary Aurora Cluster

```bash
aws rds describe-db-clusters \
  --region us-east-1 \
  --query "DBClusters[?contains(DBClusterIdentifier, 'payment-cluster-primary')]"
```

#### Check Secondary Aurora Cluster

```bash
aws rds describe-db-clusters \
  --region us-west-2 \
  --query "DBClusters[?contains(DBClusterIdentifier, 'payment-cluster-secondary')]"
```

#### Check DynamoDB Global Table

```bash
aws dynamodb describe-table \
  --table-name payment-sessions-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

#### Check Lambda Functions

```bash
aws lambda list-functions \
  --region us-east-1 \
  --query "Functions[?contains(FunctionName, 'payment-processor')]"

aws lambda list-functions \
  --region us-west-2 \
  --query "Functions[?contains(FunctionName, 'payment-processor')]"
```

### Test Failover Procedure

#### Manual Failover Test

1. **Trigger failover alarm**:
   ```bash
   aws cloudwatch set-alarm-state \
     --alarm-name payment-replication-lag-primary-${ENVIRONMENT_SUFFIX} \
     --state-value ALARM \
     --state-reason "Testing failover" \
     --region us-east-1
   ```

2. **Promote secondary cluster** (if testing actual failover):
   ```bash
   aws rds failover-global-cluster \
     --global-cluster-identifier payment-global-cluster-${ENVIRONMENT_SUFFIX} \
     --target-db-cluster-identifier payment-cluster-secondary-${ENVIRONMENT_SUFFIX} \
     --region us-west-2
   ```

3. **Monitor Route 53 health checks**:
   ```bash
   aws route53 get-health-check-status \
     --health-check-id <primary-health-check-id>
   ```

4. **Verify traffic switches to secondary region**

### Test Lambda Functions

#### Invoke Primary Lambda

```bash
aws lambda invoke \
  --function-name payment-processor-primary-${ENVIRONMENT_SUFFIX} \
  --payload '{"payment_id": "test-001", "amount": 100, "currency": "USD"}' \
  --region us-east-1 \
  response.json

cat response.json
```

#### Invoke Secondary Lambda

```bash
aws lambda invoke \
  --function-name payment-processor-secondary-${ENVIRONMENT_SUFFIX} \
  --payload '{"payment_id": "test-002", "amount": 200, "currency": "USD"}' \
  --region us-west-2 \
  response.json

cat response.json
```

## Monitoring

### CloudWatch Dashboards

Access dashboards:
- Primary: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=payment-dashboard-primary-${ENVIRONMENT_SUFFIX}
- Secondary: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=payment-dashboard-secondary-${ENVIRONMENT_SUFFIX}

### Key Metrics to Monitor

1. **Aurora Global DB Replication Lag**:
   - Namespace: `AWS/RDS`
   - Metric: `AuroraGlobalDBReplicationLag`
   - Threshold: 60 seconds

2. **Lambda Invocations**:
   - Namespace: `AWS/Lambda`
   - Metrics: `Invocations`, `Errors`, `Duration`

3. **DynamoDB Capacity**:
   - Namespace: `AWS/DynamoDB`
   - Metrics: `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`

### CloudWatch Alarms

Active alarms:
- `payment-replication-lag-primary-${ENVIRONMENT_SUFFIX}`: Alerts when replication lag > 60s
- `payment-replication-lag-secondary-${ENVIRONMENT_SUFFIX}`: Alerts when replication lag > 60s

## Disaster Recovery Procedures

### Failover to Secondary Region

**Automatic Failover (Route 53)**:
1. Route 53 health checks detect primary region failure
2. DNS automatically switches to secondary region within 60-90 seconds
3. Traffic flows to secondary Lambda and Aurora reader

**Manual Failover (Aurora)**:
```bash
# Promote secondary cluster to writer
aws rds failover-global-cluster \
  --global-cluster-identifier payment-global-cluster-${ENVIRONMENT_SUFFIX} \
  --target-db-cluster-identifier payment-cluster-secondary-${ENVIRONMENT_SUFFIX} \
  --region us-west-2

# Update Route 53 record (if needed)
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://failover-dns.json
```

### Rollback to Primary Region

```bash
# Failover back to primary
aws rds failover-global-cluster \
  --global-cluster-identifier payment-global-cluster-${ENVIRONMENT_SUFFIX} \
  --target-db-cluster-identifier payment-cluster-primary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Backup and Recovery

### Backup Configuration

- **Schedule**: Daily at 3:00 AM UTC
- **Retention**: 7 days in both regions
- **Cross-Region Copy**: Enabled (primary → secondary)

### Restore from Backup

```bash
# List available backups
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name payment-backup-vault-primary-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Restore from recovery point
aws backup start-restore-job \
  --recovery-point-arn <recovery-point-arn> \
  --iam-role-arn <backup-role-arn> \
  --metadata file://restore-metadata.json \
  --region us-east-1
```

## Cost Optimization

### Current Cost Drivers

1. **Aurora db.r5.large instances**: ~$290/month (2 instances)
2. **NAT Gateways**: ~$64/month (2 gateways)
3. **DynamoDB on-demand**: Variable based on usage
4. **Lambda**: Variable based on invocations
5. **Data Transfer**: Cross-region replication costs

### Optimization Recommendations

1. **Use Aurora Serverless v2** for auto-scaling and reduced costs
2. **Consider VPC Endpoints** for S3/DynamoDB instead of NAT Gateways
3. **Implement DynamoDB reserved capacity** if usage is predictable
4. **Use CloudWatch Logs Insights** for cost analysis

## Troubleshooting

### Common Issues

#### Aurora Replication Lag

**Symptom**: Replication lag alarm firing

**Solutions**:
1. Check network connectivity between regions
2. Review database load and optimize queries
3. Consider increasing instance size if CPU/memory constrained

#### Lambda Function Timeout

**Symptom**: Lambda functions timing out

**Solutions**:
1. Increase timeout setting (currently 60 seconds)
2. Optimize database queries
3. Check VPC subnet routing and NAT Gateway health

#### DynamoDB Throttling

**Symptom**: DynamoDB throttling errors

**Solutions**:
1. Verify on-demand mode is enabled (current configuration)
2. Check for hot partition keys
3. Implement exponential backoff in Lambda code

#### Route 53 Health Check Failing

**Symptom**: Health checks consistently failing

**Solutions**:
1. Verify health check endpoint is accessible
2. Check security group rules for HTTPS traffic
3. Review CloudWatch Logs for application errors

## Cleanup

To destroy all infrastructure:

```bash
cdktf destroy
```

**Warning**: This will delete all resources including databases, backups, and Lambda functions. Ensure you have backed up any critical data before proceeding.

## Security Considerations

1. **Database Credentials**: Use AWS Secrets Manager (not hardcoded passwords)
2. **IAM Roles**: Follow principle of least privilege
3. **VPC Security Groups**: Restrict access to necessary ports only
4. **Encryption**: Enabled for Aurora, DynamoDB, and backups
5. **Parameter Store**: Use SecureString for sensitive values

## Additional Resources

- [Aurora Global Database Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Route 53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [AWS Backup Documentation](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html)
- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)

## Support

For issues or questions:
1. Check CloudWatch Logs for error details
2. Review AWS Service Health Dashboard
3. Consult PROMPT.md for requirements clarification
4. Review MODEL_RESPONSE.md for implementation details
