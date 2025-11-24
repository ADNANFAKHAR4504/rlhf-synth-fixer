# Multi-Region Disaster Recovery Infrastructure

## Overview

This project implements a comprehensive multi-region disaster recovery (DR) architecture for a payment processing system using **CDKTF with Python**. The infrastructure spans **us-east-1** (primary) and **us-west-2** (secondary) regions with automated failover capabilities.

## Architecture

### AWS Services Implemented

1. **Aurora Global Database** - MySQL 8.0 with db.r6g.large instances
2. **DynamoDB Global Tables** - Session data with on-demand billing
3. **Lambda Functions** - Payment webhook processing (1GB memory)
4. **S3 Buckets** - Cross-region replication for documents
5. **Route 53** - Failover routing with health checks (30-second intervals)
6. **CloudWatch Alarms** - Aurora lag monitoring (60-second threshold)
7. **SNS Topics** - Operational alerts in both regions
8. **EventBridge Rules** - Payment event triggers
9. **AWS Backup** - Aurora backups with 7-day retention
10. **VPC Peering** - Secure database replication between regions

### Recovery Objectives

- **RTO**: Under 5 minutes
- **RPO**: Sub-second for databases, 15 minutes for S3 objects

## Project Structure

```
.
├── lib/
│   ├── tap_stack.py              # Main CDKTF stack implementation
│   ├── lambda/
│   │   ├── payment_processor.py  # Lambda function code
│   │   └── build_lambda.sh       # Lambda packaging script
│   ├── PROMPT.md                 # Original requirements
│   ├── IDEAL_RESPONSE.md         # Implementation documentation
│   ├── MODEL_FAILURES.md         # Anticipated issues guide
│   └── README.md                 # This file
├── tests/
│   ├── unit/
│   │   └── test_tap_stack.py     # Unit tests
│   └── integration/
│       └── test_dr_infrastructure.py  # Integration tests
├── tap.py                        # CDKTF app entry point
├── cdktf.json                    # CDKTF configuration
└── lambda_function.zip           # Lambda deployment package
```

## Prerequisites

- Python 3.9+
- Node.js 18+
- CDKTF CLI 0.20+
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Installation

1. **Install Python dependencies**:
   ```bash
   pipenv install
   pipenv shell
   ```

2. **Install CDKTF providers**:
   ```bash
   cdktf get
   ```

3. **Build Lambda package**:
   ```bash
   bash lib/lambda/build_lambda.sh
   ```

## Configuration

### Environment Variables

```bash
export ENVIRONMENT_SUFFIX="your-suffix"
export PRIMARY_REGION="us-east-1"
export SECONDARY_REGION="us-west-2"
export TERRAFORM_STATE_BUCKET="your-tfstate-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

### Required AWS Permissions

- EC2: VPC, Subnet, Security Group, VPC Peering
- RDS: Aurora Global Database, Cluster, Instance
- DynamoDB: Table, Global Table
- S3: Bucket, Replication
- Lambda: Function, Permission
- Route 53: Hosted Zone, Health Check, Record
- CloudWatch: Alarms, Events
- SNS: Topics
- Backup: Vault, Plan, Selection
- IAM: Role, Policy

## Deployment

### Quick Start

```bash
# 1. Synthesize CDKTF
python tap.py

# 2. Deploy infrastructure
cdktf deploy

# 3. Verify deployment
python tap.py && cdktf deploy --auto-approve
```

### Step-by-Step Deployment

1. **Initialize backend**:
   ```bash
   # Ensure S3 bucket for state exists
   aws s3 mb s3://your-tfstate-bucket
   ```

2. **Build Lambda package**:
   ```bash
   cd lib/lambda
   bash build_lambda.sh
   cd ../..
   ```

3. **Synthesize stack**:
   ```bash
   python tap.py
   ```

4. **Review plan**:
   ```bash
   cdktf plan
   ```

5. **Deploy**:
   ```bash
   cdktf deploy
   ```

6. **Verify outputs**:
   ```bash
   cdktf output
   ```

### Deployment Time

- **Initial deployment**: 25-35 minutes
  - Aurora Global Database: 15-20 minutes
  - VPC Peering: 2-3 minutes
  - Lambda VPC configuration: 3-5 minutes
  - Other resources: 5-10 minutes

- **Subsequent deployments**: 5-10 minutes

## Testing

### Unit Tests

Run unit tests to verify stack configuration:

```bash
pytest tests/unit/ -v
```

### Integration Tests

Run integration tests against deployed infrastructure:

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="test"

# Run integration tests
pytest tests/integration/ -v
```

### Manual Testing

1. **Test Aurora connectivity**:
   ```bash
   aws rds describe-db-clusters \
     --db-cluster-identifier dr-payment-primary-${ENVIRONMENT_SUFFIX} \
     --region us-east-1
   ```

2. **Test DynamoDB replication**:
   ```bash
   # Write to primary region
   aws dynamodb put-item \
     --table-name dr-payment-sessions-${ENVIRONMENT_SUFFIX} \
     --item '{"sessionId":{"S":"test-123"},"timestamp":{"N":"1234567890"}}' \
     --region us-east-1

   # Read from secondary region
   aws dynamodb get-item \
     --table-name dr-payment-sessions-${ENVIRONMENT_SUFFIX} \
     --key '{"sessionId":{"S":"test-123"},"timestamp":{"N":"1234567890"}}' \
     --region us-west-2
   ```

3. **Test Lambda function**:
   ```bash
   aws lambda invoke \
     --function-name dr-payment-processor-primary-${ENVIRONMENT_SUFFIX} \
     --payload '{"detail":{"paymentId":"test-123","amount":100}}' \
     --region us-east-1 \
     response.json
   
   cat response.json
   ```

4. **Test S3 replication**:
   ```bash
   # Upload to primary bucket
   echo "test content" > test.txt
   aws s3 cp test.txt s3://dr-payment-docs-primary-${ENVIRONMENT_SUFFIX}/test.txt
   
   # Wait 1-2 minutes, then check secondary
   aws s3 ls s3://dr-payment-docs-secondary-${ENVIRONMENT_SUFFIX}/
   ```

5. **Test failover**:
   ```bash
   # Get Route 53 health check status
   aws route53 get-health-check-status \
     --health-check-id <health-check-id>
   ```

## Operations

### Monitoring

1. **CloudWatch Alarms**:
   - Aurora replication lag
   - Lambda errors
   - DynamoDB throttling

2. **CloudWatch Logs**:
   - Lambda function logs: `/aws/lambda/dr-payment-processor-*`
   - EventBridge events: `/aws/events/`

3. **CloudWatch Metrics**:
   - Aurora: `AuroraGlobalDBReplicationLag`
   - DynamoDB: `ConsumedReadCapacityUnits`, `ConsumedWriteCapacityUnits`
   - Lambda: `Duration`, `Errors`, `Throttles`
   - S3: `ReplicationLatency`

### Disaster Recovery Procedures

#### Failover to Secondary Region

1. **Automatic Failover** (Route 53):
   - Health checks detect primary failure
   - DNS automatically routes to secondary
   - No manual intervention required

2. **Manual Failover** (Aurora):
   ```bash
   # Detach secondary from global cluster
   aws rds remove-from-global-cluster \
     --db-cluster-identifier dr-payment-secondary-${ENVIRONMENT_SUFFIX} \
     --global-cluster-identifier dr-payment-global-${ENVIRONMENT_SUFFIX} \
     --region us-west-2

   # Modify secondary cluster to allow writes
   aws rds modify-db-cluster \
     --db-cluster-identifier dr-payment-secondary-${ENVIRONMENT_SUFFIX} \
     --apply-immediately \
     --region us-west-2
   ```

#### Failback to Primary Region

1. **After primary recovery**:
   ```bash
   # Re-add secondary to global cluster
   aws rds create-db-cluster \
     --db-cluster-identifier dr-payment-primary-new-${ENVIRONMENT_SUFFIX} \
     --engine aurora-mysql \
     --global-cluster-identifier dr-payment-global-${ENVIRONMENT_SUFFIX} \
     --region us-east-1
   ```

2. **Verify replication**:
   ```bash
   # Check replication lag
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name AuroraGlobalDBReplicationLag \
     --dimensions Name=DBClusterIdentifier,Value=dr-payment-primary-new-${ENVIRONMENT_SUFFIX} \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 60 \
     --statistics Average \
     --region us-east-1
   ```

### Backup and Restore

#### Create Manual Backup

```bash
aws backup start-backup-job \
  --backup-vault-name dr-aurora-backup-vault-${ENVIRONMENT_SUFFIX} \
  --resource-arn <aurora-cluster-arn> \
  --iam-role-arn <backup-role-arn> \
  --region us-east-1
```

#### Restore from Backup

```bash
aws backup start-restore-job \
  --recovery-point-arn <recovery-point-arn> \
  --metadata '{"DBClusterIdentifier":"dr-payment-restored-${ENVIRONMENT_SUFFIX}"}' \
  --iam-role-arn <backup-role-arn> \
  --region us-east-1
```

## Troubleshooting

### Common Issues

1. **Aurora provisioning timeout**:
   - Expected: 15-20 minutes
   - Solution: Increase CDKTF timeout or wait

2. **Lambda VPC cold start**:
   - Expected: 10-15 seconds first invocation
   - Solution: Increase timeout, consider provisioned concurrency

3. **S3 replication delays**:
   - Expected: Up to 15 minutes
   - Solution: Monitor replication metrics, check IAM permissions

4. **VPC peering connection pending**:
   - Solution: Ensure both VPCs are created, check route tables

5. **Route 53 health checks failing**:
   - Solution: Verify security groups allow health check traffic
   - Check Aurora endpoint accessibility

### Debug Commands

```bash
# Check all resources by tag
aws resourcegroupstaggingapi get-resources \
  --tag-filters "Key=EnvironmentSuffix,Values=${ENVIRONMENT_SUFFIX}" \
  --region us-east-1

# Check CDKTF state
cdktf output --json

# Validate Terraform configuration
cd cdktf.out/stacks/TapStack${ENVIRONMENT_SUFFIX}
terraform validate

# View Terraform plan
terraform plan
```

## Cleanup

### Destroy Infrastructure

```bash
# Option 1: Using CDKTF
cdktf destroy

# Option 2: Manual cleanup (if CDKTF fails)
# 1. Empty S3 buckets
aws s3 rm s3://dr-payment-docs-primary-${ENVIRONMENT_SUFFIX} --recursive
aws s3 rm s3://dr-payment-docs-secondary-${ENVIRONMENT_SUFFIX} --recursive

# 2. Remove secondary from global cluster
aws rds remove-from-global-cluster \
  --db-cluster-identifier dr-payment-secondary-${ENVIRONMENT_SUFFIX} \
  --global-cluster-identifier dr-payment-global-${ENVIRONMENT_SUFFIX}

# 3. Delete global cluster
aws rds delete-global-cluster \
  --global-cluster-identifier dr-payment-global-${ENVIRONMENT_SUFFIX}

# 4. Run CDKTF destroy
cdktf destroy --auto-approve
```

## Security Considerations

1. **Secrets Management**: Aurora passwords should be stored in AWS Secrets Manager
2. **IAM Roles**: Use least-privilege permissions
3. **Network Security**: Security groups restrict access appropriately
4. **Encryption**: Enabled at rest and in transit
5. **Audit Logging**: CloudWatch Logs capture all operations

## Cost Optimization

1. **Aurora**: Using Graviton (r6g) instances for better price/performance
2. **DynamoDB**: On-demand billing prevents over-provisioning
3. **Lambda**: Appropriate memory size (1GB) for workload
4. **S3**: Lifecycle policies can be added for older objects
5. **VPC**: No NAT Gateways to minimize costs

## Support and Documentation

- Implementation Details: [lib/IDEAL_RESPONSE.md](IDEAL_RESPONSE.md)
- Known Issues: [lib/MODEL_FAILURES.md](MODEL_FAILURES.md)
- Requirements: [lib/PROMPT.md](PROMPT.md)

## Contributing

When making changes:

1. Update tests in `tests/unit/` and `tests/integration/`
2. Run tests: `pytest tests/ -v`
3. Update documentation in `lib/README.md`
4. Synthesize: `python tap.py`
5. Deploy to test environment first
6. Document any new issues in `MODEL_FAILURES.md`

## License

Internal use only - Turing IaC Test Automations
