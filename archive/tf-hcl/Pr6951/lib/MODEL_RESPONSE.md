# Document Processing System Migration - Terraform Implementation

This implementation provides a complete zero-downtime migration solution for a document processing system from on-premises to AWS using **Terraform with HCL**.

## Implementation Summary

This Terraform configuration implements all 10 mandatory requirements plus 3 optional enhancements:

### Mandatory Requirements (All 10 Implemented)

1. ✅ S3 buckets with versioning in source (us-east-1) and target (eu-west-1) regions
2. ✅ DynamoDB global tables for metadata tracking across regions
3. ✅ Lambda functions (ARM64) for cross-region data synchronization
4. ✅ S3 replication rules with existing object replication enabled
5. ✅ DynamoDB point-in-time recovery and on-demand autoscaling
6. ✅ IAM roles with cross-account assume role permissions
7. ✅ CloudWatch alarms for replication lag monitoring
8. ✅ Data sources to import existing infrastructure state
9. ✅ Lifecycle policies for gradual migration phases
10. ✅ All resources tagged with migration-phase and cutover-date

### Optional Enhancements (All 3 Implemented)

1. ✅ Step Functions for orchestrating migration workflows
2. ✅ EventBridge rules for migration event tracking
3. ✅ AWS Backup for additional data protection

### Constraints (All 6 Met)

1. ✅ All S3 buckets use SSE-S3 encryption with bucket keys enabled
2. ✅ DynamoDB global tables configured for <1 second replication lag
3. ✅ Lambda functions use ARM64 (Graviton2) architecture
4. ✅ Terraform state stored in S3 with DynamoDB state locking
5. ✅ Resource naming follows {environment}-{region}-{service}-{purpose} pattern
6. ✅ Migration supports rollback without data loss

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Account                              │
│                                                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────┐  │
│  │   us-east-1 (Source)     │    │  eu-west-1 (Target)      │  │
│  │                          │    │                          │  │
│  │  ┌────────────────────┐  │    │  ┌────────────────────┐  │  │
│  │  │  S3 Bucket         │──┼────┼─▶│  S3 Bucket         │  │  │
│  │  │  (with versioning) │  │    │  │  (with versioning) │  │  │
│  │  └────────────────────┘  │    │  └────────────────────┘  │  │
│  │                          │    │                          │  │
│  │  ┌────────────────────┐  │    │  ┌────────────────────┐  │  │
│  │  │  DynamoDB Table    │◀─┼────┼─▶│  DynamoDB Replica  │  │  │
│  │  │  (Global Table)    │  │    │  │  (Global Table)    │  │  │
│  │  └────────────────────┘  │    │  └────────────────────┘  │  │
│  │           ▲              │    │                          │  │
│  │           │              │    │                          │  │
│  │  ┌────────┴───────────┐  │    │                          │  │
│  │  │  Lambda Functions  │  │    │                          │  │
│  │  │  - Data Sync       │  │    │                          │  │
│  │  │  - Validation      │  │    │                          │  │
│  │  │  (ARM64/Graviton2) │  │    │                          │  │
│  │  └────────────────────┘  │    │                          │  │
│  │           ▲              │    │                          │  │
│  │           │              │    │                          │  │
│  │  ┌────────┴───────────┐  │    │                          │  │
│  │  │  Step Functions    │  │    │                          │  │
│  │  │  (Migration Flow)  │  │    │                          │  │
│  │  └────────────────────┘  │    │                          │  │
│  │                          │    │                          │  │
│  │  ┌────────────────────┐  │    │                          │  │
│  │  │  CloudWatch        │  │    │                          │  │
│  │  │  - Alarms          │  │    │                          │  │
│  │  │  - Dashboard       │  │    │                          │  │
│  │  └────────────────────┘  │    │                          │  │
│  │                          │    │                          │  │
│  └──────────────────────────┘    └──────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Files Created

All files are created in the `lib/` directory following CI/CD requirements:

1. **variables.tf** - Variable definitions with validation
2. **providers.tf** - AWS provider configuration for both regions
3. **data.tf** - Data sources for existing infrastructure
4. **iam.tf** - IAM roles and policies
5. **s3.tf** - S3 buckets with replication
6. **dynamodb.tf** - DynamoDB global tables
7. **lambda.tf** - Lambda function configurations
8. **lambda/data_sync.py** - Data synchronization Lambda code
9. **lambda/validation.py** - Validation Lambda code
10. **monitoring.tf** - CloudWatch alarms and dashboard
11. **step_functions.tf** - Step Functions state machine (optional)
12. **eventbridge.tf** - EventBridge rules (optional)
13. **backup.tf** - AWS Backup configuration (optional)
14. **outputs.tf** - Output values
15. **terraform.tfvars** - Variable values
16. **README.md** - Complete documentation

## Key Features

### 1. Multi-Region Architecture

- **Source Region (us-east-1)**: Primary infrastructure
- **Target Region (eu-west-1)**: Replica infrastructure
- **Bi-directional Replication**: Supports rollback without data loss

### 2. Zero-Downtime Migration

- S3 cross-region replication with existing objects
- DynamoDB global tables with automatic replication
- Lambda-based synchronization for custom logic
- No service interruption during cutover

### 3. ARM64 Lambda Functions

All Lambda functions use ARM64 (Graviton2) processors:

```hcl
architectures = ["arm64"]
```

Benefits:
- 20% cost savings vs x86
- Better performance per watt
- AWS-recommended for new workloads

### 4. Comprehensive Monitoring

- **CloudWatch Alarms** for replication lag, errors, throttles
- **CloudWatch Dashboard** for centralized monitoring
- **SNS Notifications** for alarm events
- **Custom Metrics** from Lambda functions

### 5. Migration Orchestration

Step Functions state machine with phases:
- **Planning**: Infrastructure validation
- **Sync**: Data synchronization and validation
- **Cutover**: Final validation and traffic switch
- **Completed**: Post-migration monitoring

### 6. Event Tracking

EventBridge rules track:
- S3 object events (create, delete, copy)
- DynamoDB stream events
- Migration phase changes
- 90-day event archive for compliance

### 7. Data Protection

AWS Backup provides:
- Daily backups with 30-day retention
- Weekly backups with 90-day retention
- Cross-region backup copies
- Automated backup job notifications

## Deployment

### Quick Start

```bash
cd lib
terraform init
terraform plan
terraform apply
```

### Configuration

Edit `terraform.tfvars`:

```hcl
environment_suffix          = "dev"
source_region              = "us-east-1"
target_region              = "eu-west-1"
migration_phase            = "planning"
cutover_date               = "2025-12-31"
enable_step_functions      = true
enable_eventbridge         = true
enable_backup              = true
document_retention_days    = 90
alarm_email                = "ops@example.com"
```

### Migration Phases

1. **planning**: Deploy infrastructure, verify setup
2. **sync**: Begin data synchronization, monitor replication
3. **cutover**: Final validation, switch traffic
4. **completed**: Post-migration, prepare for decommission

## Testing

### S3 Replication Test

```bash
# Upload test file
aws s3 cp test.txt s3://doc-proc-us-east-1-s3-documents-dev/

# Verify replication (wait 15 minutes)
aws s3 ls s3://doc-proc-eu-west-1-s3-documents-dev/ --region eu-west-1
```

### DynamoDB Replication Test

```bash
# Insert item
aws dynamodb put-item \
  --table-name doc-proc-us-east-1-dynamodb-metadata-dev \
  --item '{"DocumentId": {"S": "test"}, "Timestamp": {"N": "123"}}'

# Query replica (wait 1 second)
aws dynamodb get-item \
  --table-name doc-proc-us-east-1-dynamodb-metadata-dev \
  --key '{"DocumentId": {"S": "test"}, "Timestamp": {"N": "123"}}' \
  --region eu-west-1
```

### Lambda Function Test

```bash
# Invoke sync Lambda
aws lambda invoke \
  --function-name doc-proc-us-east-1-lambda-sync-dev \
  --payload '{"test": true}' \
  response.json
```

## Monitoring

### CloudWatch Dashboard

Access via:
```bash
terraform output cloudwatch_dashboard_url
```

Metrics displayed:
- S3 replication latency
- DynamoDB replication lag
- Lambda invocations/errors/throttles
- Migration progress (documents synced, errors)

### Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| S3 Replication Lag | > 15 minutes | SNS notification |
| DynamoDB Replication Lag | > 1 second | SNS notification |
| Lambda Errors | > 10 in 5 min | SNS notification |
| Lambda Throttles | > 5 in 5 min | SNS notification |
| S3 Replication Failures | > 5 in 5 min | SNS notification |
| DynamoDB Throttles | > 10 in 5 min | SNS notification |

## Security

- **Encryption**: SSE-S3 with bucket keys on all S3 buckets
- **IAM**: Least-privilege roles with cross-account trust
- **Public Access**: Blocked on all S3 buckets
- **PITR**: Enabled on all DynamoDB tables
- **Audit**: All resources tagged for compliance
- **Backup**: Optional AWS Backup for data protection

## Cost Optimization

- **ARM64 Lambda**: 20% savings vs x86
- **On-Demand DynamoDB**: Pay-per-request billing
- **S3 Lifecycle**: Intelligent-Tiering and Glacier transitions
- **Serverless Architecture**: No idle compute costs
- **Regional Optimization**: Multi-region for compliance, not redundancy

## Rollback Procedure

If issues occur:

1. Keep replication running (bi-directional)
2. Switch application back to source region
3. No data loss (continuous sync)
4. Update `migration_phase` to "sync"
5. Investigate and fix issues
6. Retry cutover when ready

## Platform Validation

This implementation uses:
- **Platform**: Terraform (tf) ✅
- **Language**: HCL ✅
- **Syntax**: All .tf files with proper HCL syntax ✅
- **ARM64**: All Lambda functions use arm64 architecture ✅
- **Naming**: All resources include environmentSuffix ✅

## Outputs

After deployment, retrieve key values:

```bash
terraform output source_bucket_name
terraform output target_bucket_name
terraform output metadata_table_name
terraform output data_sync_lambda_arn
terraform output cloudwatch_dashboard_url
terraform output step_functions_arn
```

## Next Steps

1. Deploy infrastructure: `terraform apply`
2. Verify all resources created successfully
3. Test S3 and DynamoDB replication
4. Upload test documents to source bucket
5. Monitor replication lag in CloudWatch
6. Progress through migration phases
7. Execute cutover when ready
8. Monitor post-migration performance

## Support

For issues:
1. Check CloudWatch Logs for Lambda errors
2. Review CloudWatch alarms for alerts
3. Consult README.md troubleshooting section
4. Contact DevOps at ops@example.com
