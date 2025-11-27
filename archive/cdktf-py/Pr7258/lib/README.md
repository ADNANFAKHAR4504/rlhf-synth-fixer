# Payment Processing Migration System - Migration Runbook

Complete guide for migrating a payment processing system from on-premises to AWS with zero downtime using CDKTF Python.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Pre-Migration Checklist](#pre-migration-checklist)
4. [Migration Phases](#migration-phases)
5. [Deployment Instructions](#deployment-instructions)
6. [Traffic Migration Strategy](#traffic-migration-strategy)
7. [Validation Procedures](#validation-procedures)
8. [Rollback Procedure](#rollback-procedure)
9. [Post-Migration Tasks](#post-migration-tasks)
10. [Troubleshooting](#troubleshooting)
11. [Cost Monitoring](#cost-monitoring)

---

## Prerequisites

### Required Tools

- Python 3.9 or higher
- Node.js 18+ and npm
- CDKTF CLI 0.20+
- AWS CLI v2
- psycopg2 library for database connectivity
- boto3 SDK for AWS operations

### AWS Account Requirements

- IAM user/role with permissions for:
  - VPC, EC2, EIP, NAT Gateway
  - RDS (Aurora PostgreSQL)
  - Lambda, ALB, Route53
  - DMS, KMS, Secrets Manager
  - WAF, CloudWatch
  - S3 (for Terraform state)

### Installation Commands

```bash
# Install CDKTF CLI
npm install -g cdktf-cli@latest

# Install Python dependencies
pip install cdktf cdktf-cdktf-provider-aws boto3 psycopg2-binary

# Verify installations
cdktf --version
python3 --version
aws --version
```

### Environment Configuration

```bash
# Configure AWS credentials
aws configure

# Set environment variables
export AWS_REGION=us-east-2
export ENVIRONMENT_SUFFIX=prod
export STATE_BUCKET=iac-rlhf-tf-states
```

---

## Architecture Overview

### Components Deployed

1. **Networking**: VPC with 6 subnets (3 public, 3 private) across 3 AZs
2. **Database**: Aurora PostgreSQL 14 Serverless v2 with Multi-AZ
3. **Compute**: Lambda functions for payment API
4. **Load Balancing**: Application Load Balancer with SSL termination
5. **Migration**: AWS DMS for continuous data replication
6. **Routing**: Route53 with weighted routing for traffic management
7. **Monitoring**: CloudWatch dashboards and alarms
8. **Security**: Secrets Manager, WAF, KMS encryption, security groups
9. **Validation**: Lambda functions for pre/post migration checks
10. **Rollback**: Automated rollback Lambda function

### Cost Estimate

Monthly costs (estimated):
- Aurora Serverless v2: ~$800/month (0.5-4.0 ACU)
- NAT Gateways (3): ~$100/month
- ALB: ~$25/month
- Lambda: ~$20/month (based on 50K transactions/day)
- DMS: ~$150/month (t3.medium, 1 month migration)
- Route53: ~$1/month
- Other services: ~$50/month

**Total: ~$1,150/month** (within $3,000 budget)

Note: DMS costs reduce to ~$0 after migration completes.

---

## Pre-Migration Checklist

### 1. Infrastructure Preparation

- [ ] Create S3 bucket for Terraform state: `iac-rlhf-tf-states`
- [ ] Enable S3 versioning on state bucket
- [ ] Document on-premises database credentials
- [ ] Obtain on-premises database endpoint and port
- [ ] Verify network connectivity from AWS to on-premises
- [ ] Create VPN or Direct Connect (if needed)
- [ ] Register domain name for payment API

### 2. Security Preparation

- [ ] Generate SSL/TLS certificates using ACM or import existing
- [ ] Document all database connection strings
- [ ] Identify all API consumers and their IP addresses
- [ ] Review WAF rules and customize rate limits
- [ ] Set up CloudWatch alarm notification email/SNS

### 3. Data Preparation

- [ ] Perform database backup of on-premises system
- [ ] Document database schema and table structures
- [ ] Identify critical tables requiring replication
- [ ] Calculate total data size (current: 500GB)
- [ ] Estimate data growth rate during migration
- [ ] Plan migration window (recommend off-peak hours)

### 4. Testing Preparation

- [ ] Set up test environment for validation
- [ ] Prepare test data and test scenarios
- [ ] Document expected API response times
- [ ] Identify key performance metrics
- [ ] Create rollback decision criteria

---

## Migration Phases

### Phase 1: Infrastructure Deployment (Duration: 2-3 hours)

#### Step 1.1: Initialize CDKTF Project

```bash
cd lib/
cdktf init --template=python
```

#### Step 1.2: Configure Project

```bash
# Update cdktf.json
cat > cdktf.json << 'EOF'
{
  "language": "python",
  "app": "python3 main.py",
  "projectId": "payment-migration",
  "terraformProviders": [
    "hashicorp/aws@~> 5.0"
  ],
  "context": {}
}
EOF
```

#### Step 1.3: Create Main Entry Point

```bash
# Create main.py
cat > main.py << 'EOF'
#!/usr/bin/env python3

from constructs import Construct
from cdktf import App
from tap_stack import TapStack

app = App()

TapStack(
    app,
    "payment-migration-stack",
    environment_suffix="prod",
    aws_region="us-east-2",
    state_bucket="iac-rlhf-tf-states",
    state_bucket_region="us-east-1",
    default_tags={
        "Project": "PaymentMigration",
        "Environment": "Production",
        "ManagedBy": "CDKTF"
    }
)

app.synth()
EOF

chmod +x main.py
```

#### Step 1.4: Deploy Infrastructure

```bash
# Synthesize Terraform configuration
cdktf synth

# Review the generated Terraform plan
cdktf plan

# Deploy infrastructure
cdktf deploy

# Expected output: All resources created successfully
# Duration: 30-45 minutes
```

#### Step 1.5: Verify Deployment

```bash
# Check VPC creation
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=payment-migration"

# Check Aurora cluster
aws rds describe-db-clusters --db-cluster-identifier payment-aurora-prod

# Check ALB
aws elbv2 describe-load-balancers --names payment-alb-prod

# Check Lambda functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `payment`)]'
```

---

### Phase 2: Database Configuration (Duration: 1 hour)

#### Step 2.1: Update Database Credentials in Secrets Manager

```bash
# Update secret with actual Aurora endpoint
aws secretsmanager put-secret-value \
  --secret-id payment-db-credentials-prod \
  --secret-string '{
    "username": "dbadmin",
    "password": "SECURE_PASSWORD_HERE",
    "engine": "postgres",
    "host": "<AURORA_CLUSTER_ENDPOINT>",
    "port": 5432,
    "dbname": "payments"
  }'
```

#### Step 2.2: Initialize Database Schema

```bash
# Connect to Aurora cluster
export DB_HOST=$(aws rds describe-db-clusters \
  --db-cluster-identifier payment-aurora-prod \
  --query 'DBClusters[0].Endpoint' \
  --output text)

psql -h $DB_HOST -U dbadmin -d payments << 'SQL'
-- Create schema
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    user_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX idx_customers_email ON customers(email);

SQL
```

#### Step 2.3: Verify SSL/TLS Enforcement

```bash
# Test SSL connection
psql "postgresql://dbadmin:PASSWORD@$DB_HOST:5432/payments?sslmode=require" \
  -c "SHOW ssl;"
# Expected output: ssl | on
```

---

### Phase 3: DMS Migration Setup (Duration: 2-3 hours)

#### Step 3.1: Configure Source Endpoint Credentials

```bash
# Update DMS source endpoint with actual on-premises details
aws dms modify-endpoint \
  --endpoint-arn <SOURCE_ENDPOINT_ARN> \
  --server-name onprem-db.company.com \
  --port 5432 \
  --database-name payments \
  --username dbadmin \
  --password ONPREM_PASSWORD
```

#### Step 3.2: Test Endpoint Connections

```bash
# Get replication instance ARN
REPL_INSTANCE_ARN=$(aws dms describe-replication-instances \
  --filters Name=replication-instance-id,Values=payment-dms-prod \
  --query 'ReplicationInstances[0].ReplicationInstanceArn' \
  --output text)

# Test source endpoint
aws dms test-connection \
  --replication-instance-arn $REPL_INSTANCE_ARN \
  --endpoint-arn <SOURCE_ENDPOINT_ARN>

# Test target endpoint
aws dms test-connection \
  --replication-instance-arn $REPL_INSTANCE_ARN \
  --endpoint-arn <TARGET_ENDPOINT_ARN>

# Wait for connections to succeed (check status)
aws dms describe-connections \
  --filters Name=replication-instance-arn,Values=$REPL_INSTANCE_ARN
```

#### Step 3.3: Start Replication Task

```bash
# Get replication task ARN
TASK_ARN=$(aws dms describe-replication-tasks \
  --filters Name=replication-task-id,Values=payment-migration-prod \
  --query 'ReplicationTasks[0].ReplicationTaskArn' \
  --output text)

# Start replication task
aws dms start-replication-task \
  --replication-task-arn $TASK_ARN \
  --start-replication-task-type start-replication

# Monitor task status
watch -n 30 'aws dms describe-replication-tasks \
  --filters Name=replication-task-arn,Values='$TASK_ARN' \
  --query "ReplicationTasks[0].[Status,ReplicationTaskStats]"'
```

#### Step 3.4: Monitor Migration Progress

```bash
# Check table statistics
aws dms describe-table-statistics \
  --replication-task-arn $TASK_ARN

# View CloudWatch metrics for DMS
aws cloudwatch get-metric-statistics \
  --namespace AWS/DMS \
  --metric-name CDCLatencyTarget \
  --dimensions Name=ReplicationTaskIdentifier,Value=payment-migration-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

**Wait for full load to complete and CDC lag to stabilize below 10 seconds before proceeding.**

---

### Phase 4: Lambda Function Deployment (Duration: 1 hour)

#### Step 4.1: Create Lambda Deployment Packages

```bash
# Package validation Lambda
cd lib/lambda/validation
pip install psycopg2-binary boto3 -t .
zip -r ../../validation_function.zip . -x "*.pyc" -x "__pycache__/*"
cd ../../..

# Package rollback Lambda
cd lib/lambda/rollback
pip install boto3 -t .
zip -r ../../rollback_function.zip . -x "*.pyc" -x "__pycache__/*"
cd ../../..
```

#### Step 4.2: Update Lambda Function Code

```bash
# Update validation Lambda
aws lambda update-function-code \
  --function-name payment-validation-prod \
  --zip-file fileb://lib/validation_function.zip

# Update rollback Lambda
aws lambda update-function-code \
  --function-name payment-rollback-prod \
  --zip-file fileb://lib/rollback_function.zip

# Update payment API Lambda (create your payment API handler)
# ... implement payment API logic here ...
```

#### Step 4.3: Test Lambda Functions

```bash
# Test validation Lambda
aws lambda invoke \
  --function-name payment-validation-prod \
  --payload '{}' \
  --cli-binary-format raw-in-base64-out \
  validation_response.json

cat validation_response.json
# Expected: validation_status: PASSED
```

---

### Phase 5: Pre-Migration Validation (Duration: 30 minutes)

#### Step 5.1: Run Automated Validation Checks

```bash
# Invoke validation Lambda
aws lambda invoke \
  --function-name payment-validation-prod \
  --payload '{"check_type": "pre_migration"}' \
  --cli-binary-format raw-in-base64-out \
  pre_validation_result.json

# Review validation results
cat pre_validation_result.json | jq '.'

# Ensure:
# - data_validation.is_valid == true
# - schema_validation.is_valid == true
# - No orphaned_records
# - No invalid_records
```

#### Step 5.2: Verify Data Consistency

```bash
# Compare record counts
echo "Source database record count:"
psql -h onprem-db.company.com -U dbadmin -d payments \
  -c "SELECT 'payments' as table_name, COUNT(*) FROM payments
      UNION SELECT 'transactions', COUNT(*) FROM transactions;"

echo "Target database record count:"
psql -h $DB_HOST -U dbadmin -d payments \
  -c "SELECT 'payments' as table_name, COUNT(*) FROM payments
      UNION SELECT 'transactions', COUNT(*) FROM transactions;"

# Counts should match exactly
```

#### Step 5.3: Performance Testing

```bash
# Test API latency through ALB
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names payment-alb-prod \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Send test requests
for i in {1..100}; do
  curl -s -w "%{http_code} %{time_total}s\n" \
    -o /dev/null \
    https://$ALB_DNS/health
done | awk '{sum+=$2; count++} END {print "Average latency:", sum/count "s"}'

# Expected: < 1 second average latency
```

---

## Traffic Migration Strategy

### Blue-Green Deployment with Gradual Traffic Shifting

This migration uses Route53 weighted routing to gradually shift traffic from on-premises to AWS.

### Traffic Shifting Schedule

| Phase | Old System Weight | New System Weight | Duration | Action |
|-------|------------------|------------------|----------|--------|
| 0 | 100% | 0% | - | Initial state |
| 1 | 90% | 10% | 30 min | Canary deployment |
| 2 | 50% | 50% | 1 hour | Half traffic |
| 3 | 10% | 90% | 1 hour | Majority traffic |
| 4 | 0% | 100% | - | Full cutover |

### Phase 1: Canary Deployment (10% Traffic)

```bash
# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='payment-api-prod.example.com.'].Id" \
  --output text | cut -d'/' -f3)

# Update old system weight to 90
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "payment-api-prod.example.com",
        "Type": "A",
        "SetIdentifier": "old-system",
        "Weight": 90,
        "AliasTarget": {
          "HostedZoneId": "Z1234567890ABC",
          "DNSName": "old-system.company.com",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'

# Update new system weight to 10
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "payment-api-prod.example.com",
        "Type": "A",
        "SetIdentifier": "new-system",
        "Weight": 10,
        "AliasTarget": {
          "HostedZoneId": "'$(aws elbv2 describe-load-balancers --names payment-alb-prod --query 'LoadBalancers[0].CanonicalHostedZoneId' --output text)'",
          "DNSName": "'$ALB_DNS'",
          "EvaluateTargetHealth": true
        }
      }
    }]
  }'
```

**Wait 30 minutes and monitor:**
- Error rates in CloudWatch
- API latency metrics
- Database connection counts
- DMS replication lag

### Phase 2: Half Traffic (50%)

**Only proceed if canary phase shows no issues.**

```bash
# Update weights to 50/50
# Old system: 50
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '...' # (change Weight to 50)

# New system: 50
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '...' # (change Weight to 50)
```

**Monitor for 1 hour.**

### Phase 3: Majority Traffic (90%)

```bash
# Update weights to 10/90
# Old system: 10
# New system: 90
```

**Monitor for 1 hour.**

### Phase 4: Full Cutover (100%)

```bash
# Update weights to 0/100
# Old system: 0
# New system: 100
```

**Continue monitoring for 24 hours before decommissioning old system.**

---

## Validation Procedures

### Continuous Monitoring During Migration

```bash
# View CloudWatch dashboard
aws cloudwatch get-dashboard \
  --dashboard-name payment-migration-prod

# Check alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix payment-
```

### Post-Migration Validation

```bash
# Run post-migration validation
aws lambda invoke \
  --function-name payment-validation-prod \
  --payload '{"check_type": "post_migration"}' \
  --cli-binary-format raw-in-base64-out \
  post_validation_result.json

cat post_validation_result.json | jq '.'
```

### Data Integrity Checks

```bash
# Compare checksums of critical tables
psql -h $DB_HOST -U dbadmin -d payments << 'SQL'
SELECT
    'payments' as table_name,
    COUNT(*) as row_count,
    SUM(amount) as total_amount,
    MAX(created_at) as latest_record
FROM payments
UNION ALL
SELECT
    'transactions',
    COUNT(*),
    SUM(amount),
    MAX(created_at)
FROM transactions;
SQL
```

---

## Rollback Procedure

### When to Rollback

Trigger rollback if any of the following occur:
- Error rate exceeds 5% for more than 5 minutes
- API latency exceeds 3 seconds for more than 10 minutes
- Database connection failures
- Data consistency validation failures
- Business critical functionality failures

### Automated Rollback

```bash
# Invoke rollback Lambda
aws lambda invoke \
  --function-name payment-rollback-prod \
  --payload '{
    "rollback_reason": "High error rate detected",
    "hosted_zone_id": "'$HOSTED_ZONE_ID'",
    "domain_name": "payment-api-prod.example.com",
    "dms_task_arn": "'$TASK_ARN'"
  }' \
  --cli-binary-format raw-in-base64-out \
  rollback_result.json

cat rollback_result.json | jq '.'
```

This will:
1. Route 100% traffic back to old system
2. Stop DMS replication task
3. Publish rollback metrics to CloudWatch
4. Send SNS notification

### Manual Rollback

```bash
# 1. Update Route53 weights immediately
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "payment-api-prod.example.com",
          "Type": "A",
          "SetIdentifier": "old-system",
          "Weight": 100,
          "AliasTarget": {...}
        }
      },
      {
        "Action": "UPSERT",
        "ResourceRecordSet": {
          "Name": "payment-api-prod.example.com",
          "Type": "A",
          "SetIdentifier": "new-system",
          "Weight": 0,
          "AliasTarget": {...}
        }
      }
    ]
  }'

# 2. Stop DMS task
aws dms stop-replication-task \
  --replication-task-arn $TASK_ARN

# 3. Verify traffic is back on old system
watch -n 10 'curl -s https://payment-api-prod.example.com/health'
```

**Rollback Time: < 5 minutes**

---

## Post-Migration Tasks

### Day 1 After Migration

- [ ] Monitor error rates and latency for 24 hours
- [ ] Review all CloudWatch alarms
- [ ] Verify billing and cost tracking
- [ ] Document any issues encountered
- [ ] Keep DMS task running for 24 hours (safety buffer)

### Week 1 After Migration

- [ ] Stop DMS replication task
- [ ] Delete DMS replication instance to reduce costs
- [ ] Archive on-premises database backup
- [ ] Update documentation with new endpoints
- [ ] Train team on new monitoring dashboards
- [ ] Set up automated database backups verification

### Week 2-4 After Migration

- [ ] Decommission on-premises infrastructure
- [ ] Remove temporary VPN/Direct Connect (if applicable)
- [ ] Optimize Aurora Serverless capacity based on actual usage
- [ ] Fine-tune WAF rules based on traffic patterns
- [ ] Review and optimize Lambda concurrency limits
- [ ] Set up automated cost anomaly detection

---

## Troubleshooting

### Issue: High DMS Replication Lag

**Symptoms**: CDC latency > 60 seconds

**Solutions**:
```bash
# Check DMS instance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DMS \
  --metric-name CPUUtilization \
  --dimensions Name=ReplicationInstanceIdentifier,Value=payment-dms-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average

# If CPU > 80%, upgrade instance class
aws dms modify-replication-instance \
  --replication-instance-arn $REPL_INSTANCE_ARN \
  --replication-instance-class dms.t3.large \
  --apply-immediately
```

### Issue: Lambda Function Timeouts

**Symptoms**: Lambda duration > 30 seconds

**Solutions**:
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name payment-api-prod \
  --timeout 60

# Increase memory (also increases CPU)
aws lambda update-function-configuration \
  --function-name payment-api-prod \
  --memory-size 1024
```

### Issue: Aurora Connection Limits

**Symptoms**: "too many connections" errors

**Solutions**:
```bash
# Check current connections
psql -h $DB_HOST -U dbadmin -d payments \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Increase max_connections parameter (requires instance reboot)
aws rds modify-db-cluster-parameter-group \
  --db-cluster-parameter-group-name payment-cluster-pg-prod \
  --parameters "ParameterName=max_connections,ParameterValue=1000,ApplyMethod=pending-reboot"

# Scale up Aurora capacity
# Aurora Serverless v2 automatically scales, verify max_capacity
```

### Issue: Certificate Validation Failures

**Symptoms**: ACM certificate stuck in "Pending validation"

**Solutions**:
```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn <CERT_ARN> \
  --query 'Certificate.DomainValidationOptions'

# Add CNAME records to Route53 for DNS validation
# Or use email validation if DNS not accessible
```

---

## Cost Monitoring

### Daily Cost Check

```bash
# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file://cost-filter.json

# cost-filter.json
{
  "Tags": {
    "Key": "Project",
    "Values": ["PaymentMigration"]
  }
}
```

### Cost Optimization After Migration

```bash
# Stop DMS instance after successful migration
aws dms delete-replication-instance \
  --replication-instance-arn $REPL_INSTANCE_ARN

# Reduce Aurora min capacity if underutilized
aws rds modify-db-cluster \
  --db-cluster-identifier payment-aurora-prod \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=2.0

# Review and adjust Lambda reserved concurrency
aws lambda get-function-concurrency \
  --function-name payment-api-prod
```

### Budget Alert Setup

```bash
# Create budget with $3000 threshold
aws budgets create-budget \
  --account-id <ACCOUNT_ID> \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

---

## Migration Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Infrastructure Deployment | 2-3 hours | Deploy all AWS resources |
| Database Configuration | 1 hour | Initialize schema and configure connections |
| DMS Setup & Initial Load | 8-12 hours | Full data migration (500GB) |
| Lambda Deployment | 1 hour | Deploy and test Lambda functions |
| Pre-Migration Validation | 30 minutes | Run validation checks |
| Traffic Migration (Canary) | 30 minutes | 10% traffic to AWS |
| Traffic Migration (Half) | 1 hour | 50% traffic to AWS |
| Traffic Migration (Majority) | 1 hour | 90% traffic to AWS |
| Full Cutover | Immediate | 100% traffic to AWS |
| Monitoring Period | 24 hours | Continuous monitoring |

**Total Migration Time: 16-20 hours (excluding 24-hour monitoring)**

---

## Contact and Support

For issues during migration:
1. Check CloudWatch logs: `/aws/lambda/payment-*`
2. Review CloudWatch alarms: `payment-*`
3. Check DMS task logs in CloudWatch
4. Review this runbook's troubleshooting section

## Appendix

### Useful Commands Reference

```bash
# Quick status check
aws rds describe-db-clusters --db-cluster-identifier payment-aurora-prod --query 'DBClusters[0].Status'
aws lambda get-function --function-name payment-api-prod --query 'Configuration.State'
aws dms describe-replication-tasks --filters Name=replication-task-id,Values=payment-migration-prod --query 'ReplicationTasks[0].Status'

# Logs
aws logs tail /aws/lambda/payment-validation-prod --follow
aws logs tail /aws/lambda/payment-api-prod --follow

# Metrics
aws cloudwatch get-dashboard --dashboard-name payment-migration-prod
```

---

**Migration completed successfully!**

Last updated: 2025-11-25
