# Payment Processing Migration - CDKTF Python

Infrastructure automation for migrating payment processing systems from development to production using CDKTF with Python.

## Architecture Overview

This implementation provides a complete production-ready infrastructure for payment processing with the following components:

### Core Infrastructure
- **VPC**: Production VPC with 3 availability zones and private subnets
- **RDS Aurora PostgreSQL**: Multi-AZ database cluster with KMS encryption, automated backups
- **DynamoDB**: Session management tables with global secondary indexes and point-in-time recovery
- **Lambda Functions**:
  - Payment processor with VPC integration
  - Parameter migration utility
- **S3 Buckets**:
  - Primary audit logs bucket (us-east-1)
  - Replica bucket with cross-region replication (us-west-2)
  - Versioning and lifecycle policies enabled
- **Application Load Balancer**: Blue-green deployment with two target groups
- **CloudWatch**:
  - Custom dashboard with RDS and Lambda metrics
  - Alarms for CPU usage and error rates
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB (cost optimization)
- **KMS**: Customer-managed encryption keys with automatic rotation

### Security Features
- All data encrypted at rest using KMS
- IAM roles following least-privilege principle
- Security groups with minimal required access
- VPC isolation for compute resources
- CloudWatch logging for all Lambda functions

## Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- CDKTF CLI 0.19+
- AWS CLI configured with appropriate credentials
- Terraform 1.5+

## Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install CDKTF CLI globally
npm install -g cdktf-cli

# Install AWS provider for CDKTF
cdktf get
```

## Configuration

### Environment Suffix
Set a unique suffix for resource naming:

```bash
export ENVIRONMENT_SUFFIX="prod-abc123"
```

This suffix is used throughout the infrastructure to ensure unique resource names and avoid conflicts.

### AWS Region
The infrastructure deploys to:
- Primary region: us-east-1
- Replica region: us-west-2 (S3 replication only)

## Lambda Function Setup

Before deployment, create Lambda deployment packages:

```bash
# Create Lambda directories if not exists
mkdir -p lib/lambda

# Package payment processor
cd lib/lambda
zip payment_processor.zip payment_processor.py

# Package parameter migration
zip parameter_migration.zip parameter_migration.py
cd ../..
```

## Deployment

### Full Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Review the planned changes
cdktf diff

# Deploy infrastructure
cdktf deploy

# Or with auto-approve (not recommended for production)
cdktf deploy --auto-approve
```

### Deployment Time
Expected deployment time: 20-30 minutes due to RDS Aurora cluster provisioning.

## Post-Deployment Configuration

### 1. Parameter Migration

Migrate non-sensitive parameters from dev to prod:

```bash
aws lambda invoke \
  --function-name parameter-migration-${ENVIRONMENT_SUFFIX} \
  --payload '{}' \
  response.json

cat response.json
```

The migration script will:
- Copy parameters from /dev/* to /prod/*
- Skip sensitive parameters (passwords, secrets, tokens)
- Provide summary of migrated, skipped, and errored parameters

### 2. Database Setup

After RDS cluster is created, connect and set up schemas:

```bash
# Get RDS endpoint from outputs
RDS_ENDPOINT=$(cdktf output rds_cluster_endpoint)

# Connect using psql
psql -h ${RDS_ENDPOINT} -U admin -d payments
```

### 3. Configure SNS Alarm Notifications

Subscribe to the alarm topic:

```bash
aws sns subscribe \
  --topic-arn $(cdktf output alarm_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Blue-Green Deployment

The infrastructure includes ALB with two target groups (blue and green) for zero-downtime deployments.

### Deployment Process

1. **Deploy new version to green target group**:
   ```bash
   # Update Lambda function code
   aws lambda update-function-code \
     --function-name payment-processor-${ENVIRONMENT_SUFFIX} \
     --zip-file fileb://new-version.zip
   ```

2. **Run health checks**:
   ```bash
   # Check target group health
   aws elbv2 describe-target-health \
     --target-group-arn <green-target-group-arn>
   ```

3. **Switch ALB listener to green**:
   ```bash
   aws elbv2 modify-listener \
     --listener-arn <listener-arn> \
     --default-actions Type=forward,TargetGroupArn=<green-target-group-arn>
   ```

4. **Monitor for issues** in CloudWatch dashboard

5. **Rollback if needed**:
   ```bash
   # Switch back to blue target group
   aws elbv2 modify-listener \
     --listener-arn <listener-arn> \
     --default-actions Type=forward,TargetGroupArn=<blue-target-group-arn>
   ```

## Validation

### Infrastructure Validation

Run validation checks to compare dev and production configurations (if validation script is created):

```bash
python lib/validation_script.py ${ENVIRONMENT_SUFFIX}
```

This generates a report comparing:
- VPC configurations
- RDS cluster settings
- DynamoDB table schemas
- S3 bucket configurations
- Lambda function settings
- ALB and target group health
- CloudWatch alarms and dashboards

### Manual Validation

```bash
# Check VPC
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=payment-prod-vpc-${ENVIRONMENT_SUFFIX}"

# Check RDS cluster
aws rds describe-db-clusters --db-cluster-identifier payment-aurora-cluster-${ENVIRONMENT_SUFFIX}

# Check DynamoDB table
aws dynamodb describe-table --table-name payment-sessions-${ENVIRONMENT_SUFFIX}

# Check S3 replication status
aws s3api get-bucket-replication --bucket payment-audit-logs-${ENVIRONMENT_SUFFIX}

# Test Lambda function
aws lambda invoke \
  --function-name payment-processor-${ENVIRONMENT_SUFFIX} \
  --payload '{"body": "{\"payment_id\":\"test-123\",\"user_id\":\"user-456\",\"amount\":100}"}' \
  response.json
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard in AWS Console:
```
Dashboard Name: payment-processing-${ENVIRONMENT_SUFFIX}
```

The dashboard includes:
- **RDS Metrics**: CPU utilization, database connections, free memory
- **Lambda Metrics**: Invocations, errors, duration, throttles
- **DynamoDB Metrics**: Consumed capacity, user errors
- **ALB Metrics**: Request count, response times, HTTP status codes

### CloudWatch Alarms

Two critical alarms are configured:

1. **RDS CPU High**
   - Metric: CPUUtilization
   - Threshold: 80%
   - Evaluation: 2 periods of 5 minutes
   - Action: Publishes to SNS topic

2. **Lambda Errors High**
   - Metric: Errors
   - Threshold: 5 errors per minute
   - Evaluation: 2 periods of 1 minute
   - Action: Publishes to SNS topic

### CloudWatch Logs

View Lambda logs:
```bash
aws logs tail /aws/lambda/payment-processor-${ENVIRONMENT_SUFFIX} --follow
```

## Security Considerations

### Encryption
- **RDS**: Encrypted at rest using customer-managed KMS key
- **DynamoDB**: Encrypted using KMS
- **S3**: Server-side encryption (SSE-S3)
- **Lambda Environment Variables**: Consider using AWS Secrets Manager for sensitive values

### IAM Permissions
All IAM roles follow least-privilege principle:
- Lambda role has specific permissions for DynamoDB, S3, and RDS describe operations
- S3 replication role limited to source and destination buckets
- No wildcard actions or resources used

### Network Security
- Lambda functions deployed in VPC with no public access
- RDS cluster in private subnets only
- ALB security group restricts inbound to HTTP/HTTPS
- VPC endpoints eliminate need for NAT Gateway

### Secrets Management
Update the hardcoded database password:
```bash
# Store password in Secrets Manager
aws secretsmanager create-secret \
  --name payment-db-password-${ENVIRONMENT_SUFFIX} \
  --secret-string "your-secure-password"

# Update RDS cluster to use Secrets Manager (manual step)
```

## Cost Optimization

### Current Cost Factors
- RDS Aurora PostgreSQL (2 instances): ~$150-200/month
- Lambda: Pay per invocation (very low cost)
- DynamoDB: On-demand billing (scales with usage)
- S3: Standard storage + replication (~$10-20/month for audit logs)
- VPC Endpoints: No additional charge (savings vs NAT Gateway)
- CloudWatch: Logs retention 7 days (minimal cost)

### Optimization Recommendations

1. **Consider Aurora Serverless v2** for variable workloads:
   ```python
   # In tap_stack.py
   engine_mode="serverless"
   ```

2. **Adjust RDS instance size** based on actual usage:
   ```python
   instance_class="db.t3.small"  # Instead of db.t3.medium
   ```

3. **Use S3 Intelligent-Tiering** for audit logs with unpredictable access patterns

4. **Enable DynamoDB auto-scaling** if switching from on-demand:
   ```python
   billing_mode="PROVISIONED"
   # Add auto-scaling configuration
   ```

5. **Review CloudWatch log retention** after initial stabilization

## Troubleshooting

### Lambda Timeout Issues

If Lambda times out, increase timeout:
```python
# In tap_stack.py
timeout=60  # Increase from 30 seconds
```

### RDS Connection Issues

Check security group rules:
```bash
aws ec2 describe-security-groups \
  --group-names payment-rds-sg-${ENVIRONMENT_SUFFIX}
```

Ensure Lambda is in correct VPC and subnets.

### S3 Replication Delays

Cross-region replication can take several minutes. Check metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name ReplicationLatency \
  --dimensions Name=SourceBucket,Value=payment-audit-logs-${ENVIRONMENT_SUFFIX} \
  --statistics Average \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600
```

### DynamoDB Throttling

If experiencing throttling with on-demand billing, check for hot partitions:
```bash
aws dynamodb describe-table --table-name payment-sessions-${ENVIRONMENT_SUFFIX} | jq '.Table.ItemCount'
```

Consider adding more GSIs or adjusting partition key design.

### ALB Target Group Health

Check target health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn $(cdktf output blue_target_group_arn)
```

Ensure Lambda function is healthy and security groups allow traffic.

## Cleanup

### Pre-Cleanup Steps

1. **Empty S3 buckets** (required for deletion):
   ```bash
   aws s3 rm s3://payment-audit-logs-${ENVIRONMENT_SUFFIX} --recursive
   aws s3 rm s3://payment-audit-logs-replica-${ENVIRONMENT_SUFFIX} --recursive --region us-west-2
   ```

2. **Verify no critical data** in RDS and DynamoDB

### Destroy Infrastructure

```bash
# Destroy all resources
cdktf destroy

# Or with auto-approve
cdktf destroy --auto-approve
```

Expected cleanup time: 15-20 minutes.

### Manual Cleanup

If automated cleanup fails, manually delete:
- RDS cluster snapshots
- CloudWatch log groups
- KMS keys (scheduled for deletion)

## Outputs

After deployment, the following outputs are available:

```bash
cdktf output vpc_id                    # Production VPC ID
cdktf output rds_cluster_endpoint      # RDS cluster write endpoint
cdktf output dynamodb_table_name       # DynamoDB table name
cdktf output audit_bucket_name         # Primary S3 bucket
cdktf output payment_lambda_arn        # Lambda function ARN
cdktf output alb_dns_name              # ALB DNS name
```

## Support and References

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS Provider for CDKTF](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CDKTF Python Guide](https://developer.hashicorp.com/terraform/cdktf/create-and-deploy/python-project)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## License

This infrastructure code is for demonstration purposes. Review and adjust security settings before production use.
