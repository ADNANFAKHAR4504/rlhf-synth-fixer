# Database Migration Infrastructure

This Terraform configuration provides a complete infrastructure for migrating an on-premises PostgreSQL database to AWS Aurora PostgreSQL using AWS Database Migration Service (DMS).

## Architecture Overview

The infrastructure includes:

- **RDS Aurora PostgreSQL**: Multi-AZ cluster with automated backups and encryption
- **AWS DMS**: Replication instance with full load and CDC capabilities
- **VPC Networking**: 3 availability zones with public and private subnets
- **S3 Storage**: Versioned bucket with lifecycle policies for file migration
- **CloudWatch**: Comprehensive monitoring dashboard and alarms
- **SNS**: Alert notifications for migration events
- **KMS**: Customer-managed encryption keys for data at rest
- **IAM**: Least privilege roles and policies for DMS

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- On-premises PostgreSQL 13.x database accessible from AWS
- Valid SSL certificates for secure connections

## Deployment Instructions

### Step 1: Configure Variables

Copy the example variables file and customize it:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:

- `environment_suffix`: Unique suffix for resource naming (e.g., "prod-001")
- `dms_source_endpoint_host`: IP address or hostname of on-premises database
- `aurora_master_password`: Strong password for Aurora cluster
- `dms_source_username` and `dms_source_password`: Credentials for source database
- `alarm_email_endpoints`: Email addresses for alerts

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Execution Plan

```bash
terraform plan
```

Review the plan to ensure all resources will be created as expected.

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm deployment.

Deployment takes approximately 20-30 minutes for Aurora cluster provisioning.

### Step 5: Start DMS Replication Task

After infrastructure is deployed, start the DMS replication task:

```bash
aws dms start-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn) \
  --start-replication-task-type start-replication
```

### Step 6: Monitor Migration Progress

Access the CloudWatch dashboard:

```bash
echo "Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$(terraform output -raw cloudwatch_dashboard_name)"
```

Monitor replication lag and error rates.

## Testing

Run Terraform validation and tests:

```bash
# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Run tests
cd ../test
go test -v -timeout 30m
```

## Migration Runbook

See [runbook.md](runbook.md) for detailed migration procedures including:

- Pre-migration checklist
- Cutover procedures
- Rollback steps
- Post-migration verification

## State Management

See [state-migration.md](state-migration.md) for Terraform state management best practices.

## Resource Cleanup

To destroy all resources:

```bash
# Stop DMS replication task first
aws dms stop-replication-task \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Wait for task to stop (5-10 minutes)
aws dms wait replication-task-stopped \
  --replication-task-arn $(terraform output -raw dms_replication_task_arn)

# Destroy infrastructure
terraform destroy
```

## Outputs

Key outputs available after deployment:

- `aurora_cluster_endpoint`: Writer endpoint for Aurora cluster
- `aurora_cluster_reader_endpoint`: Reader endpoint for queries
- `s3_migration_bucket_name`: S3 bucket for file migration
- `cloudwatch_dashboard_name`: CloudWatch dashboard for monitoring
- `dms_replication_task_arn`: ARN of DMS replication task

## Security Considerations

- All data is encrypted at rest using KMS customer-managed keys
- Security groups restrict traffic to only necessary sources
- IAM roles follow least privilege principle
- Aurora cluster has deletion protection disabled for testing (enable in production)
- SNS topics are encrypted with KMS
- S3 bucket blocks all public access

## Cost Optimization

- Aurora uses Serverless v2 or right-sized instances
- S3 lifecycle policies transition to cheaper storage classes
- DMS replication instance sized appropriately for workload
- CloudWatch logs have retention policies

## Support and Troubleshooting

### Common Issues

1. **DMS Connection Failures**: Verify security group rules and network connectivity
2. **Replication Lag**: Check DMS instance size and network bandwidth
3. **Aurora Connection Limits**: Monitor DatabaseConnections metric and adjust instance class
4. **S3 Upload Failures**: Verify IAM permissions and KMS key policies

### Logging

- Aurora logs: CloudWatch Logs group `/aws/rds/cluster/aurora-cluster-*`
- DMS logs: CloudWatch Logs group `/aws/dms/tasks/*`
- Application logs: Configure in ECS tasks

## Contributing

Follow Terraform best practices:

- Use consistent naming conventions
- Tag all resources appropriately
- Document all variables and outputs
- Write tests for infrastructure changes
- Use `terraform fmt` before committing

## License

Internal use only - Proprietary
```
