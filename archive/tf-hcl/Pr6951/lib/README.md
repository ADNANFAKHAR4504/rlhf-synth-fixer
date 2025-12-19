# Document Processing System Migration to AWS

This Terraform configuration implements a zero-downtime migration of a document processing system from on-premises to AWS with cross-region replication capabilities.

## Architecture Overview

The infrastructure spans two AWS regions:
- **Source Region**: us-east-1 (primary)
- **Target Region**: eu-west-1 (replica)

### Components

1. **S3 Buckets**: Document storage with cross-region replication
2. **DynamoDB Global Tables**: Metadata tracking with automatic replication
3. **Lambda Functions (ARM64)**: Data synchronization and validation
4. **IAM Roles**: Cross-account and cross-region access management
5. **CloudWatch**: Monitoring, alarms, and dashboards
6. **Step Functions** (optional): Migration workflow orchestration
7. **EventBridge** (optional): Event tracking and automated responses
8. **AWS Backup** (optional): Additional data protection layer

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI v2 configured with appropriate credentials
- Access to both us-east-1 and eu-west-1 regions
- Sufficient AWS service quotas for S3, DynamoDB, Lambda

## Resource Naming Convention

All resources follow the pattern: `{environment}-{region}-{service}-{purpose}`

Example: `doc-proc-us-east-1-s3-documents-dev`

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Edit `terraform.tfvars` to customize:

```hcl
environment_suffix = "dev"           # Change for different environments
source_region      = "us-east-1"     # Source region
target_region      = "eu-west-1"     # Target region
migration_phase    = "planning"      # Current phase: planning, sync, cutover, completed
cutover_date       = "2025-12-31"    # Planned cutover date
alarm_email        = "ops@example.com"  # Email for CloudWatch alarms
```

### 3. Plan Deployment

```bash
terraform plan
```

Review the plan to ensure all resources will be created correctly.

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

### 5. Verify Deployment

```bash
# Check S3 buckets
aws s3 ls | grep doc-proc

# Check DynamoDB tables
aws dynamodb list-tables | grep doc-proc

# Check Lambda functions
aws lambda list-functions | grep doc-proc

# View CloudWatch dashboard
terraform output cloudwatch_dashboard_url
```

## Migration Workflow

### Phase 1: Planning (Current)

1. Deploy infrastructure in both regions
2. Verify all resources are created successfully
3. Test Lambda functions manually
4. Confirm replication is configured

### Phase 2: Synchronization

1. Update `migration_phase` to "sync" in terraform.tfvars
2. Apply changes: `terraform apply`
3. Begin uploading documents to source bucket
4. Monitor replication lag in CloudWatch dashboard
5. Run validation Lambda periodically

### Phase 3: Cutover

1. Update `migration_phase` to "cutover"
2. Apply changes: `terraform apply`
3. Perform final validation
4. Switch application traffic to target region
5. Monitor for any issues

### Phase 4: Completion

1. Update `migration_phase` to "completed"
2. Keep infrastructure running for rollback capability
3. After verification period, decommission source infrastructure

## Monitoring

### CloudWatch Dashboard

Access the migration dashboard:

```bash
terraform output cloudwatch_dashboard_url
```

The dashboard shows:
- S3 replication latency
- DynamoDB replication lag
- Lambda invocations, errors, and throttles
- Migration progress metrics

### CloudWatch Alarms

Alarms are configured for:
- S3 replication lag > 15 minutes
- DynamoDB replication lag > 1 second
- Lambda errors > 10 in 5 minutes
- Lambda throttles > 5 in 5 minutes
- S3 replication failures > 5 in 5 minutes
- DynamoDB throttling

All alarms send notifications to the configured email address.

## Testing

### Test S3 Replication

```bash
# Upload a test file
aws s3 cp test.txt s3://doc-proc-us-east-1-s3-documents-dev/test.txt

# Wait 15 minutes for replication
sleep 900

# Verify in target bucket
aws s3 ls s3://doc-proc-eu-west-1-s3-documents-dev/test.txt --region eu-west-1
```

### Test Lambda Function

```bash
# Invoke data sync Lambda
aws lambda invoke \
  --function-name doc-proc-us-east-1-lambda-sync-dev \
  --payload '{"test": true}' \
  response.json

cat response.json
```

### Test DynamoDB Replication

```bash
# Put item in source region
aws dynamodb put-item \
  --table-name doc-proc-us-east-1-dynamodb-metadata-dev \
  --item '{"DocumentId": {"S": "test-123"}, "Timestamp": {"N": "1234567890"}, "Status": {"S": "test"}}'

# Wait for replication
sleep 5

# Query from target region
aws dynamodb get-item \
  --table-name doc-proc-us-east-1-dynamodb-metadata-dev \
  --key '{"DocumentId": {"S": "test-123"}, "Timestamp": {"N": "1234567890"}}' \
  --region eu-west-1
```

## Step Functions Workflow (Optional)

If enabled, the Step Functions state machine orchestrates the migration:

```bash
# Get state machine ARN
terraform output step_functions_arn

# Start execution
aws stepfunctions start-execution \
  --state-machine-arn <ARN_FROM_OUTPUT> \
  --input '{"phase": "sync", "syncComplete": false}'

# List executions
aws stepfunctions list-executions \
  --state-machine-arn <ARN_FROM_OUTPUT>
```

## Rollback Procedure

If issues occur during cutover:

1. Switch application traffic back to source region (us-east-1)
2. Replication continues bi-directionally
3. No data loss due to continuous sync
4. Update `migration_phase` back to "sync"
5. Investigate and fix issues
6. Retry cutover when ready

## Cost Optimization

### ARM64 Lambda Functions

All Lambda functions use ARM64 (Graviton2) architecture for 20% cost savings:

```hcl
architectures = ["arm64"]
```

### On-Demand DynamoDB

DynamoDB tables use PAY_PER_REQUEST billing for variable workloads during migration.

### S3 Lifecycle Policies

Documents automatically transition to Intelligent-Tiering and Glacier based on retention policies.

## Cleanup

To destroy all resources:

```bash
# WARNING: This will delete all data!
terraform destroy
```

## Troubleshooting

### S3 Replication Not Working

1. Check replication role permissions
2. Verify versioning is enabled on both buckets
3. Check S3 replication metrics in CloudWatch
4. Review CloudWatch alarms for failures

### DynamoDB Replication Lag

1. Check DynamoDB metrics in CloudWatch
2. Verify global tables are configured correctly
3. Check for throttling errors
4. Consider increasing provisioned capacity (if applicable)

### Lambda Errors

1. Check CloudWatch Logs:
   ```bash
   aws logs tail /aws/lambda/doc-proc-us-east-1-lambda-sync-dev --follow
   ```
2. Verify IAM permissions
3. Check Lambda function environment variables
4. Review error metrics in CloudWatch

## Security Considerations

- All S3 buckets use SSE-S3 encryption with bucket keys
- Public access is blocked on all S3 buckets
- IAM roles follow least-privilege principle
- Cross-account access requires external ID
- DynamoDB tables have point-in-time recovery enabled
- All resources are tagged for compliance tracking

## Compliance

All resources are tagged with:
- `MigrationPhase`: Current migration phase
- `CutoverDate`: Planned cutover date
- `ManagedBy`: Terraform
- `Project`: DocumentProcessingMigration
- `Environment`: From environment_suffix variable

## Support

For issues or questions:
1. Check CloudWatch Logs for detailed error messages
2. Review CloudWatch alarms for active alerts
3. Consult AWS documentation for service-specific issues
4. Contact DevOps team at ops@example.com

## References

- [AWS S3 Cross-Region Replication](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication.html)
- [DynamoDB Global Tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [AWS Lambda on Graviton2](https://aws.amazon.com/blogs/aws/aws-lambda-functions-powered-by-aws-graviton2/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
