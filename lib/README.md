# Database Migration Infrastructure

This repository contains CDKTF Python code for orchestrating database migration from on-premises PostgreSQL to AWS Aurora using AWS Database Migration Service (DMS).

## Architecture

The solution implements a complete blue-green deployment strategy with:

- **Aurora PostgreSQL Cluster**: Multi-AZ deployment with 1 writer and 2 reader instances across different availability zones
- **AWS DMS**: Replication instance (dms.r5.large) with full-load-and-cdc migration task
- **Route 53**: Weighted routing for gradual traffic cutover from on-premises to Aurora
- **Lambda Function**: Automated cutover orchestration based on replication lag monitoring
- **EventBridge**: Event-driven architecture for DMS state change notifications
- **CloudWatch**: Comprehensive monitoring dashboard with replication lag, database connections, and performance metrics
- **AWS Backup**: Automated daily snapshots with 7-day retention
- **Parameter Store**: Migration state and configuration management
- **Aurora Backtrack**: 72-hour rollback capability for emergency recovery

## Requirements

- CDKTF 0.20+
- Python 3.11+
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Deployment

### 1. Install Dependencies

```bash
pip install -r requirements.txt
cdktf get
```

### 2. Prepare Lambda Function

```bash
cd lib/lambda
pip install -r requirements.txt -t .
zip -r route53_updater.zip route53_updater.py boto3/
cd ../..
```

### 3. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev123"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-terraform-state-bucket"
```

### 4. Deploy Infrastructure

```bash
cdktf deploy
```

## Migration Process

### Phase 1: Pre-Migration

1. Deploy infrastructure using `cdktf deploy`
2. Verify Aurora cluster is healthy
3. Configure on-premises PostgreSQL for replication (enable WAL, create replication user)
4. Update DMS source endpoint with actual on-premises credentials

### Phase 2: Initial Load

1. Start DMS replication task:
   ```bash
   aws dms start-replication-task \
     --replication-task-arn <task-arn> \
     --start-replication-task-type start-replication
   ```

2. Monitor full load progress in CloudWatch dashboard
3. Wait for full load to complete (status changes to "Load complete, replication ongoing")

### Phase 3: CDC Synchronization

1. Monitor replication lag in CloudWatch dashboard
2. Wait for CDC latency to drop below 60 seconds
3. Lambda function will update Parameter Store when ready for cutover

### Phase 4: Gradual Cutover

Execute gradual traffic shift to Aurora:

```bash
# Shift 20% traffic to Aurora
aws lambda invoke \
  --function-name route53-updater-${ENVIRONMENT_SUFFIX} \
  --payload '{"action": "gradual_cutover", "aurora_weight": 20}' \
  response.json

# Monitor for 30 minutes, then shift to 50%
aws lambda invoke \
  --function-name route53-updater-${ENVIRONMENT_SUFFIX} \
  --payload '{"action": "gradual_cutover", "aurora_weight": 50}' \
  response.json

# Shift to 80%
aws lambda invoke \
  --function-name route53-updater-${ENVIRONMENT_SUFFIX} \
  --payload '{"action": "gradual_cutover", "aurora_weight": 80}' \
  response.json

# Final cutover - 100% to Aurora
aws lambda invoke \
  --function-name route53-updater-${ENVIRONMENT_SUFFIX} \
  --payload '{"action": "manual_cutover"}' \
  response.json
```

### Phase 5: Post-Cutover Validation

1. Monitor application logs for errors
2. Check Aurora performance metrics in CloudWatch
3. Verify data consistency between on-premises and Aurora
4. Keep DMS task running for 24-48 hours for safety

### Rollback Procedure

If issues are detected, execute immediate rollback:

```bash
# Option 1: Shift traffic back to on-premises
aws lambda invoke \
  --function-name route53-updater-${ENVIRONMENT_SUFFIX} \
  --payload '{"action": "rollback"}' \
  response.json

# Option 2: Use Aurora Backtrack (if within 72 hours)
aws rds backtrack-db-cluster \
  --db-cluster-identifier migration-aurora-${ENVIRONMENT_SUFFIX} \
  --backtrack-to "2024-01-01T12:00:00Z"
```

## Monitoring

### CloudWatch Dashboard

Access the migration dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=migration-dashboard-${ENVIRONMENT_SUFFIX}
```

Key metrics monitored:
- DMS CDC latency (source and target)
- Aurora database connections
- DMS throughput (bandwidth and rows/sec)
- Aurora CPU and memory utilization
- Aurora replica lag
- DMS task errors

### CloudWatch Alarms

Three alarms are configured:
1. **DMS Replication Lag**: Triggers when CDC latency > 60 seconds
2. **Aurora High CPU**: Triggers when CPU > 80%
3. **Aurora High Connections**: Triggers when connections > 800

All alarms send notifications to SNS topic: `migration-notifications-${ENVIRONMENT_SUFFIX}`

### Parameter Store

Check migration state:
```bash
aws ssm get-parameter \
  --name /migration/${ENVIRONMENT_SUFFIX}/state \
  --query 'Parameter.Value' \
  --output text | jq .
```

## Security

- **Encryption at Rest**: All data encrypted using AWS KMS
- **Encryption in Transit**: SSL/TLS enabled for all database connections
- **IAM Least Privilege**: All roles follow principle of least privilege
- **VPC Security Groups**: Restrictive ingress/egress rules
- **Secrets Management**: Database credentials should be moved to AWS Secrets Manager (currently hardcoded for demo)

## Cost Optimization

- Aurora Serverless v2 with auto-scaling (0.5-2.0 ACU)
- DMS instance: dms.r5.large (only runs during migration)
- No NAT Gateways (using public subnets)
- 7-day backup retention (minimum required)

Estimated monthly cost during migration: $150-200

## Testing

Run infrastructure validation:
```bash
# Validate CDKTF synthesis
cdktf synth

# Check for errors
cdktf validate

# Test Lambda function locally
python lib/lambda/route53_updater.py
```

## Cleanup

To destroy all resources after successful migration:

```bash
# Stop DMS task first
aws dms stop-replication-task \
  --replication-task-arn <task-arn>

# Destroy infrastructure
cdktf destroy
```

**Note**: Ensure `deletion_protection=False` and `skip_final_snapshot=True` are set to allow clean resource deletion.

## Troubleshooting

### DMS Task Fails to Start

Check:
1. Source endpoint connectivity: `aws dms test-connection`
2. On-premises firewall rules allow DMS IP range
3. PostgreSQL user has replication permissions
4. WAL level set to 'logical' on source database

### High Replication Lag

Solutions:
1. Increase DMS instance size (e.g., dms.r5.xlarge)
2. Tune DMS task settings (batch size, parallel threads)
3. Check Aurora performance insights for bottlenecks
4. Verify network bandwidth between on-premises and AWS

### Lambda Cutover Fails

Check:
1. Lambda CloudWatch logs: `/aws/lambda/route53-updater-${ENVIRONMENT_SUFFIX}`
2. IAM permissions for Route53, SSM, and DMS
3. EventBridge rule is enabled
4. Lambda timeout (currently 300 seconds)

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review DMS task logs in CloudWatch
3. Consult AWS DMS documentation: https://docs.aws.amazon.com/dms/
4. Review Aurora PostgreSQL best practices: https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/

## References

- [AWS DMS Best Practices](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_BestPractices.html)
- [Aurora PostgreSQL Migration](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.Migrating.html)
- [Route 53 Weighted Routing](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-weighted.html)
- [Aurora Backtrack](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Managing.Backtrack.html)
