# Multi-Region Disaster Recovery Implementation

## Implementation Summary

This implementation provides a comprehensive multi-region disaster recovery architecture for a payment processing system using **CDKTF with Python**. The solution spans **us-east-1** (primary) and **us-west-2** (secondary) regions, implementing automated failover capabilities with an RTO target under 5 minutes.

## Architecture Overview

### Multi-Region Components

1. **Network Infrastructure**
   - Primary VPC (us-east-1): 10.0.0.0/16
   - Secondary VPC (us-west-2): 10.1.0.0/16
   - VPC Peering for secure cross-region communication
   - Private subnets for databases and Lambda functions
   - Public subnets for internet gateway access

2. **Database Layer**
   - Aurora Global Database (MySQL 8.0.mysql_aurora.3.04.0)
   - Primary cluster: db.r6g.large instances in us-east-1
   - Secondary cluster: db.r6g.large instances in us-west-2
   - Automatic replication with lag monitoring (60-second threshold)
   - 7-day backup retention using AWS Backup

3. **Session Management**
   - DynamoDB Global Table with on-demand billing
   - Automatic replication between regions
   - Point-in-time recovery enabled
   - Keys: sessionId (hash), timestamp (range)

4. **Document Storage**
   - S3 buckets in both regions with versioning
   - Cross-region replication with delete marker replication
   - 15-minute replication time SLA
   - IAM role with external ID validation for replication

5. **Compute Layer**
   - Lambda functions deployed identically in both regions
   - 1GB memory allocation
   - VPC integration for database access
   - Python 3.11 runtime
   - Environment-specific configuration

6. **Monitoring and Alerting**
   - CloudWatch alarms for Aurora replication lag
   - SNS topics in both regions for operational alerts
   - 60-second alarm evaluation periods
   - Automatic notifications on threshold breach

7. **Event Processing**
   - EventBridge rules in both regions
   - Triggers Lambda on payment events
   - Event pattern: payment.service source, Payment Transaction detail-type
   - Lambda permissions configured for EventBridge invocation

8. **Failover Management**
   - Route 53 hosted zone with failover routing
   - Health checks every 30 seconds
   - HTTPS string match health checks
   - Primary/secondary record sets with automatic failover

9. **Backup and Recovery**
   - AWS Backup vault in primary region
   - Daily backup schedule (3 AM UTC)
   - 7-day retention policy
   - Tag-based backup selection (Backup=daily)

10. **VPC Peering**
    - Cross-region peering connection
    - Automatic acceptance in secondary region
    - Route table updates for both VPCs
    - Enables secure database replication traffic

## Key Implementation Details

### Resource Naming Convention

All resources follow the pattern: `dr-{resource-type}-{region}-{environment_suffix}`

Examples:
- VPC: `dr-primary-vpc-{environment_suffix}`
- Aurora: `dr-payment-primary-{environment_suffix}`
- Lambda: `dr-payment-processor-primary-{environment_suffix}`
- S3: `dr-payment-docs-primary-{environment_suffix}`

### Security Features

1. **IAM Roles with External ID Validation**
   - S3 replication role: `dr-replication-{environment_suffix}`
   - Lambda execution role: `dr-lambda-{environment_suffix}`
   - Backup service role: Standard managed policies

2. **Security Groups**
   - Aurora: MySQL port 3306 from both VPC CIDR blocks
   - Lambda: Outbound-only access for external API calls

3. **Encryption**
   - S3: Server-side encryption with AES256
   - Aurora: Encryption at rest (default)
   - DynamoDB: Encryption at rest (default)

### Lifecycle Management

All resources configured for destroyability:
- `deletion_protection: false` on Aurora clusters
- `skip_final_snapshot: true` on Aurora clusters
- No retention policies that would prevent cleanup

### Required Tags

All resources tagged with:
- `Environment: DR`
- `CostCenter: Finance`
- `EnvironmentSuffix: {environment_suffix}`

## Deployment Configuration

### Environment Variables

```bash
export ENVIRONMENT_SUFFIX="test"
export PRIMARY_REGION="us-east-1"
export SECONDARY_REGION="us-west-2"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

### Prerequisites

1. AWS credentials configured with appropriate permissions
2. CDKTF CLI installed (version 0.20+)
3. Python 3.9+ with required dependencies
4. Terraform backend S3 bucket created
5. Lambda deployment package built (`lambda_function.zip`)

### Deployment Steps

1. **Build Lambda Package**
   ```bash
   cd lib/lambda
   bash build_lambda.sh
   ```

2. **Initialize CDKTF**
   ```bash
   cdktf get
   ```

3. **Synthesize Stack**
   ```bash
   python tap.py
   ```

4. **Deploy Infrastructure**
   ```bash
   cdktf deploy
   ```

## Testing Strategy

### Unit Tests

Located in `tests/unit/test_tap_stack.py`:
- Stack creation validation
- Provider configuration tests
- Resource naming verification
- Tag compliance checks
- Lifecycle policy validation

Run with:
```bash
pytest tests/unit/ -v
```

### Integration Tests

Located in `tests/integration/test_dr_infrastructure.py`:
- VPC connectivity validation
- Aurora Global Database health checks
- DynamoDB replication verification
- S3 cross-region replication tests
- Lambda function invocation tests
- Route 53 failover configuration
- Backup plan validation

Run with:
```bash
pytest tests/integration/ -v
```

## Outputs

The stack produces the following outputs for integration:

| Output Name | Description |
|------------|-------------|
| `primary_vpc_id` | Primary VPC identifier |
| `secondary_vpc_id` | Secondary VPC identifier |
| `vpc_peering_connection_id` | VPC peering connection ID |
| `global_cluster_id` | Aurora Global Cluster identifier |
| `primary_cluster_endpoint` | Primary Aurora endpoint |
| `secondary_cluster_endpoint` | Secondary Aurora endpoint |
| `dynamodb_table_name` | Global DynamoDB table name |
| `primary_bucket_name` | Primary S3 bucket name |
| `secondary_bucket_name` | Secondary S3 bucket name |
| `primary_lambda_arn` | Primary Lambda function ARN |
| `secondary_lambda_arn` | Secondary Lambda function ARN |
| `primary_sns_topic_arn` | Primary SNS topic ARN |
| `secondary_sns_topic_arn` | Secondary SNS topic ARN |
| `backup_vault_name` | AWS Backup vault name |
| `route53_zone_id` | Route 53 hosted zone ID |
| `api_endpoint` | API endpoint with failover |

## Disaster Recovery Capabilities

### RTO Achievement (Target: < 5 minutes)

1. **Route 53 Failover**: 30-second health checks with 3 failure threshold = 90 seconds detection
2. **DNS TTL**: 60 seconds for record propagation
3. **Lambda Cold Start**: ~5-10 seconds in each region
4. **Total Estimated RTO**: ~3 minutes

### RPO Considerations

1. **Aurora Replication**: Sub-second lag (monitored at 60-second threshold)
2. **DynamoDB Replication**: Typically < 1 second
3. **S3 Replication**: 15-minute SLA for 99.99% of objects
4. **Estimated RPO**: < 1 second for database, < 15 minutes for objects

### Failover Process

1. Route 53 health check detects primary failure
2. DNS automatically routes to secondary endpoint
3. Lambda functions in secondary region process new requests
4. DynamoDB and Aurora secondary clusters serve traffic
5. CloudWatch alarms notify operations team

## Cost Optimization

1. **Aurora**: r6g.large instances (Graviton) for better price/performance
2. **DynamoDB**: On-demand billing (no provisioned capacity waste)
3. **Lambda**: 1GB memory (appropriate for payment processing)
4. **S3**: Standard storage class with lifecycle policies
5. **VPC**: Single public subnet per region (no NAT Gateway costs)

## Compliance and Security

1. **Data Residency**: Data replicated only between specified regions
2. **Encryption**: At-rest and in-transit encryption enabled
3. **Access Control**: Least-privilege IAM roles
4. **Audit Trail**: CloudWatch Logs for all Lambda invocations
5. **Monitoring**: Comprehensive CloudWatch metrics and alarms

## Known Limitations

1. **Aurora Provisioning Time**: 15-20 minutes for initial deployment
2. **VPC Peering**: Manual route table updates on infrastructure changes
3. **Lambda VPC Cold Start**: 10-15 seconds for first invocation
4. **S3 Replication SLA**: 15-minute target may exceed RTO for object access
5. **Route 53 Hosted Zone**: Requires domain ownership for production use

## Maintenance Procedures

### Updating Lambda Code

1. Update code in `lib/lambda/payment_processor.py`
2. Run `bash lib/lambda/build_lambda.sh`
3. Deploy with `cdktf deploy`

### Scaling Aurora

Modify instance class in `lib/tap_stack.py`:
```python
instance_class="db.r6g.2xlarge"  # Scale up
```

### Testing Failover

1. Disable primary health check in Route 53 console
2. Monitor DNS resolution switching to secondary
3. Verify Lambda functions process events in secondary region
4. Re-enable primary health check

## Troubleshooting

### Aurora Replication Lag

```bash
# Check replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=dr-payment-primary-{env} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### Lambda VPC Connectivity

```bash
# Check Lambda network interfaces
aws ec2 describe-network-interfaces \
  --filters "Name=description,Values=*dr-payment-processor*" \
  --region us-east-1
```

### S3 Replication Status

```bash
# Check replication metrics
aws s3api get-bucket-replication \
  --bucket dr-payment-docs-primary-{env}
```

## References

- CDKTF Documentation: https://developer.hashicorp.com/terraform/cdktf
- AWS Aurora Global Database: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html
- DynamoDB Global Tables: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html
- S3 Cross-Region Replication: https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html
- Route 53 Health Checks: https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-types.html
