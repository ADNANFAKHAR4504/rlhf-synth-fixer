# Multi-Region Disaster Recovery Infrastructure

Complete disaster recovery solution for payment processing system with sub-second RPO using Pulumi Python.

## Architecture Overview

This infrastructure deploys a production-ready multi-region disaster recovery solution across:
- **Primary Region**: us-east-1
- **DR Region**: us-east-2

### Components

1. **Aurora Global Database**
   - PostgreSQL 13.7 with automated replication
   - Primary cluster: us-east-1 with db.r6g.large instance
   - DR cluster: us-east-2 with db.r6g.large instance
   - Automated backups and point-in-time recovery
   - Sub-second replication lag monitoring

2. **DynamoDB Global Tables**
   - Bi-directional replication between regions
   - Point-in-time recovery enabled (35-day window)
   - Pay-per-request billing mode
   - Global secondary indexes for customer and status queries

3. **Lambda Functions**
   - Payment validation logic in both regions
   - Python 3.9 runtime
   - 512MB memory, 30-second timeout
   - Environment-specific configuration

4. **S3 Cross-Region Replication**
   - Audit logs and transaction receipts
   - Versioning enabled for data protection
   - 15-minute replication time target
   - Public access blocked for security

5. **Route 53 Failover**
   - Health checks for both regions
   - Automatic DNS failover capability
   - Custom domain support

6. **CloudWatch Monitoring**
   - Alarms for replication lag exceeding 1 second
   - Lambda error monitoring
   - SNS notifications for failover events

7. **API Gateway**
   - REST APIs in both regions
   - Regional endpoints for low latency
   - Lambda proxy integration
   - Production stage deployment

8. **IAM Security**
   - Least-privilege IAM roles
   - Cross-region permissions for Lambda
   - S3 replication role with appropriate permissions

## Prerequisites

- Pulumi 3.x or later
- Python 3.9 or later
- AWS CLI v2
- Valid AWS credentials with appropriate permissions
- Sufficient AWS service quotas for multi-region deployment

## Project Structure

```
.
├── Pulumi.yaml              # Pulumi project configuration
├── Pulumi.dev.yaml          # Dev stack configuration
├── tap.py                   # Entry point
├── requirements.txt         # Python dependencies
└── lib/
    ├── __init__.py
    ├── tap_stack.py         # Main infrastructure stack
    ├── PROMPT.md            # Original requirements
    ├── IDEAL_RESPONSE.md    # Complete implementation details
    ├── MODEL_RESPONSE.md    # Initial model output
    ├── MODEL_FAILURES.md    # Improvements documentation
    └── README.md            # This file
```

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Ensure your AWS credentials have permissions for:
- RDS (Aurora Global Database)
- DynamoDB (Global Tables)
- Lambda
- S3
- IAM
- API Gateway
- CloudWatch
- SNS
- Route 53

### 3. Initialize Pulumi Stack

```bash
# Create new stack
pulumi stack init dev

# Set AWS region
pulumi config set aws:region us-east-1

# Set environment suffix
export ENVIRONMENT_SUFFIX=dev
```

## Deployment

### Quick Start

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Step-by-Step Deployment

1. **Review Configuration**
   ```bash
   # Check current stack
   pulumi stack

   # View configuration
   pulumi config
   ```

2. **Preview Resources**
   ```bash
   pulumi preview
   ```

   This will show approximately 40+ resources to be created:
   - 1 Aurora Global Cluster
   - 2 Aurora Regional Clusters
   - 2 Aurora Instances
   - 1 DynamoDB Global Table
   - 2 S3 Buckets + Replication Config
   - 2 Lambda Functions
   - 2 API Gateways with resources/methods
   - 2 SNS Topics
   - Multiple IAM Roles/Policies
   - Multiple CloudWatch Alarms

3. **Deploy**
   ```bash
   pulumi up --yes
   ```

   Expected deployment time: 15-20 minutes
   - Aurora Global Database: ~10 minutes
   - Other resources: ~5-10 minutes

4. **Verify Deployment**
   ```bash
   # Check stack outputs
   pulumi stack output

   # Expected outputs:
   # - primary_aurora_endpoint
   # - dr_aurora_endpoint
   # - dynamodb_table_name
   # - primary_api_endpoint
   # - dr_api_endpoint
   # - primary_s3_bucket
   # - dr_s3_bucket
   # - primary_sns_topic
   # - dr_sns_topic
   ```

## Configuration Options

The stack accepts the following configuration through `TapStackArgs`:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `environment_suffix` | Unique identifier for resources | `dev` |
| `primary_region` | Primary AWS region | `us-east-1` |
| `dr_region` | DR AWS region | `us-east-2` |
| `domain_name` | Custom domain for API Gateway | `payments-{env}.example.com` |
| `replication_lag_threshold` | Max Aurora lag in seconds | `1` |

### Example Custom Configuration

Edit `tap.py` to customize:

```python
from lib.tap_stack import TapStack, TapStackArgs

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(
        environment_suffix="prod",
        primary_region="us-east-1",
        dr_region="us-west-2",
        domain_name="payments.example.com",
        replication_lag_threshold=2
    )
)
```

## Testing

### Test API Endpoints

#### Primary Region
```bash
# Get primary API endpoint
PRIMARY_ENDPOINT=$(pulumi stack output primary_api_endpoint)

# Test payment validation
curl -X POST "${PRIMARY_ENDPOINT}/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-123",
    "customerId": "cust-456",
    "amount": 100.00
  }'
```

#### DR Region
```bash
# Get DR API endpoint
DR_ENDPOINT=$(pulumi stack output dr_api_endpoint)

# Test payment validation
curl -X POST "${DR_ENDPOINT}/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "test-124",
    "customerId": "cust-456",
    "amount": 150.00
  }'
```

### Verify Data Replication

#### DynamoDB
```bash
# Query transaction in primary region
aws dynamodb get-item \
  --table-name payment-transactions-dev \
  --key '{"transactionId": {"S": "test-123"}, "timestamp": {"N": "1699999999"}}' \
  --region us-east-1

# Verify replication to DR region
aws dynamodb get-item \
  --table-name payment-transactions-dev \
  --key '{"transactionId": {"S": "test-123"}, "timestamp": {"N": "1699999999"}}' \
  --region us-east-2
```

#### S3 Replication
```bash
# Upload to primary bucket
PRIMARY_BUCKET=$(pulumi stack output primary_s3_bucket)
echo "test audit log" > test.txt
aws s3 cp test.txt "s3://${PRIMARY_BUCKET}/audit/test.txt"

# Wait 1-2 minutes, then check DR bucket
DR_BUCKET=$(pulumi stack output dr_s3_bucket)
aws s3 ls "s3://${DR_BUCKET}/audit/"
```

#### Aurora Replication Lag
```bash
# Check replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=payment-primary-cluster-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

## Monitoring

### CloudWatch Dashboards

Access dashboards via AWS Console:
- Primary Region: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
- DR Region: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2

### Key Metrics

1. **Aurora Replication Lag** (Target: <1 second)
   - Metric: `AuroraGlobalDBReplicationLag`
   - Alarm threshold: 1000ms

2. **DynamoDB Replication Latency**
   - Metric: `ReplicationLatency`
   - Monitor in both regions

3. **Lambda Function Health**
   - Invocations, Errors, Duration
   - Alarm on >10 errors in 5 minutes

4. **S3 Replication Latency**
   - Metric: `ReplicationLatency`
   - Target: <15 minutes

### SNS Notifications

Subscribe to SNS topics for alerts:

```bash
# Subscribe email to primary SNS topic
PRIMARY_SNS=$(pulumi stack output primary_sns_topic)
aws sns subscribe \
  --topic-arn "${PRIMARY_SNS}" \
  --protocol email \
  --notification-endpoint ops-team@example.com \
  --region us-east-1

# Subscribe to DR SNS topic
DR_SNS=$(pulumi stack output dr_sns_topic)
aws sns subscribe \
  --topic-arn "${DR_SNS}" \
  --protocol email \
  --notification-endpoint ops-team@example.com \
  --region us-east-2
```

## Disaster Recovery Procedures

### RTO and RPO Targets

- **Recovery Time Objective (RTO)**: ~5 minutes (automatic failover)
- **Recovery Point Objective (RPO)**: <1 second (Aurora replication)

### Failover Scenarios

#### Automatic Failover (Primary Region Outage)

The infrastructure is designed for automatic failover:

1. Route 53 health checks detect primary region failure
2. DNS automatically routes to DR region
3. Lambda functions in DR region handle requests
4. DynamoDB global table serves data from DR region
5. Aurora DR cluster available for reads

**No manual intervention required for traffic failover.**

#### Manual Aurora Failover

If you need to promote DR Aurora cluster:

```bash
# Promote DR cluster to standalone
aws rds failover-global-cluster \
  --global-cluster-identifier payment-global-cluster-dev \
  --target-db-cluster-identifier payment-dr-cluster-dev \
  --region us-east-2

# Verify promotion
aws rds describe-db-clusters \
  --db-cluster-identifier payment-dr-cluster-dev \
  --region us-east-2
```

#### Failback to Primary Region

After primary region recovery:

1. Verify primary region health
2. Update Route 53 health check configuration
3. Monitor replication lag
4. Gradually shift traffic back to primary
5. Verify all services operational

### DR Testing Schedule

Recommended testing frequency:

- **Weekly**: Monitor dashboards and replication metrics
- **Monthly**: Test manual API failover
- **Quarterly**: Full DR drill with Aurora failover
- **Annually**: Complete DR test with data validation

## Cost Estimation

Approximate monthly costs for this infrastructure:

| Service | Configuration | Cost (USD) |
|---------|---------------|------------|
| Aurora Global DB | 2x db.r6g.large (2 regions) | ~$800 |
| DynamoDB | Pay-per-request (moderate use) | ~$50 |
| Lambda | 1M requests/month | ~$20 |
| S3 + Replication | 100GB storage + transfer | ~$50 |
| API Gateway | 1M requests/month | ~$35 |
| Data Transfer | Cross-region replication | ~$100 |
| CloudWatch | Metrics, alarms, logs | ~$25 |
| SNS | Notifications | ~$5 |
| **Total** | | **~$1,085/month** |

### Cost Optimization Tips

1. **Use Aurora Serverless v2** for variable workloads
2. **Enable DynamoDB auto-scaling** or reserved capacity
3. **Implement S3 lifecycle policies** for older audit logs
4. **Optimize Lambda memory** based on actual usage
5. **Use CloudWatch Logs Insights** instead of storing all logs

## Security Considerations

### Network Security
- Aurora clusters not publicly accessible
- Lambda functions use IAM roles (no hardcoded credentials)
- S3 buckets block public access
- API Gateway with regional endpoints

### Data Encryption
- **At Rest**:
  - Aurora: Storage encryption enabled
  - DynamoDB: Encryption at rest enabled by default
  - S3: Server-side encryption (AES-256)
- **In Transit**:
  - TLS 1.2+ for all API communications
  - Aurora connections use SSL/TLS

### IAM Best Practices
- Least-privilege IAM roles
- Cross-region permissions scoped to specific actions
- No hardcoded credentials in code
- IAM role assumption for cross-account access

### Recommendations
1. Enable AWS CloudTrail for audit logging
2. Implement AWS Config rules for compliance
3. Use AWS Secrets Manager for database credentials
4. Enable MFA for AWS console access
5. Rotate IAM credentials regularly

## Troubleshooting

### High Replication Lag

**Symptoms**: Aurora replication lag >1 second

**Check**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=payment-primary-cluster-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Maximum \
  --region us-east-1
```

**Possible Causes**:
- High write volume on primary
- Network connectivity issues
- Instance performance degradation

**Resolution**:
- Scale up Aurora instance class
- Reduce write load temporarily
- Check VPC peering (if implemented)

### Lambda Function Errors

**Symptoms**: API returns 500 errors

**Check Logs**:
```bash
aws logs tail /aws/lambda/payment-validator-primary-dev --follow --region us-east-1
```

**Common Issues**:
- IAM permission denied for DynamoDB
- Timeout connecting to DynamoDB
- Invalid input data format

**Resolution**:
- Verify IAM role permissions
- Check Lambda timeout configuration
- Review input validation logic

### DynamoDB Throttling

**Symptoms**: Write requests failing with ThrottlingException

**Check**:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=payment-transactions-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

**Resolution**:
- Review access patterns
- Consider provisioned capacity
- Enable auto-scaling (if using provisioned mode)

### S3 Replication Delays

**Symptoms**: Objects not appearing in DR bucket

**Check**:
```bash
# Check replication status
aws s3api head-object \
  --bucket payment-audit-logs-primary-dev \
  --key audit/test.txt \
  --region us-east-1
```

**Possible Causes**:
- IAM replication role permissions
- S3 replication configuration errors
- Network issues

**Resolution**:
- Verify replication role has correct permissions
- Check S3 replication configuration
- Monitor S3 replication metrics in CloudWatch

## Maintenance

### Regular Tasks

**Weekly**:
- Review CloudWatch dashboards
- Check alarm history
- Monitor replication metrics
- Review Lambda error logs

**Monthly**:
- Test failover procedures
- Review and optimize costs
- Update Lambda functions if needed
- Verify backup retention policies

**Quarterly**:
- Full DR drill with data validation
- Security audit and IAM review
- Update documentation
- Review and test runbooks

### Backup Verification

```bash
# Check Aurora automated backups
aws rds describe-db-cluster-snapshots \
  --db-cluster-identifier payment-primary-cluster-dev \
  --region us-east-1

# Check DynamoDB PITR status
aws dynamodb describe-continuous-backups \
  --table-name payment-transactions-dev \
  --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
# Preview destruction
pulumi destroy

# Confirm and destroy
pulumi destroy --yes

# Remove stack
pulumi stack rm dev
```

**Warning**: This will permanently delete:
- All Aurora databases and backups
- DynamoDB table and data
- S3 buckets and objects
- Lambda functions
- All monitoring and alarms

**Before destroying**:
1. Export any important data
2. Verify no active transactions
3. Notify stakeholders
4. Document the destruction for compliance

## Support and Resources

### Documentation
- [Pulumi AWS Provider](https://www.pulumi.com/docs/clouds/aws/)
- [Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)

### Getting Help
- Check CloudWatch Logs for detailed error messages
- Review Pulumi state: `pulumi stack`
- Consult AWS documentation for service-specific issues
- Contact infrastructure team for critical issues

## License

Internal use only - Financial Services Company.
