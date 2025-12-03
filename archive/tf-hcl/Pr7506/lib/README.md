# Multi-Region Disaster Recovery Infrastructure

Terraform implementation of a comprehensive multi-region DR architecture for transaction processing applications.

## Architecture Overview

- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2
- **Database**: Aurora Global Database with automatic replication
- **DNS Failover**: Route 53 health-check based failover
- **Data Replication**: S3 cross-region replication with RTC
- **Compute**: Auto Scaling Groups (minimum 2 instances per region)
- **Backup**: AWS Backup with cross-region copy
- **Monitoring**: CloudWatch alarms and SNS notifications

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured
- Route 53 hosted zone for your domain
- Access to us-east-1 and us-west-2 regions

## Deployment Instructions

### 1. Configure Variables

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `environment_suffix`: Unique identifier (e.g., "prod01")
- `db_master_password`: Secure database password
- `domain_name`: Your Route 53 domain

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

Deployment time: Approximately 20-30 minutes

### 5. Verify Deployment

```bash
# Check outputs
terraform output

# Test primary endpoint
curl http://$(terraform output -raw primary_alb_dns)/health

# Test secondary endpoint
curl http://$(terraform output -raw secondary_alb_dns)/health
```

## Terraform Workspaces

Manage multiple environments:

```bash
# Create workspace
terraform workspace new production

# Switch workspace
terraform workspace select production

# List workspaces
terraform workspace list
```

## Disaster Recovery Testing

### Simulate Primary Region Failure

1. Stop primary ALB targets
2. Wait 90 seconds for Route 53 to detect failure
3. Verify traffic routes to secondary region

### Manual Database Failover

```bash
aws rds failover-global-cluster \
  --global-cluster-identifier $(terraform output -raw global_cluster_id) \
  --target-db-cluster-identifier aurora-secondary-<suffix> \
  --region us-west-2
```

## Monitoring

### CloudWatch Alarms

- Aurora CPU utilization
- Aurora replication lag
- ALB unhealthy hosts
- S3 replication lag

### Subscribe to Alerts

```bash
aws sns subscribe \
  --topic-arn $(terraform output -raw primary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

## Resource Naming Convention

All resources include `environment_suffix` for uniqueness:
- VPCs: `vpc-{region}-{suffix}`
- S3: `data-{region}-{suffix}`
- Aurora: `aurora-{region}-{suffix}`
- ALB: `alb-{region}-{suffix}`

## Backup and Recovery

### Automated Backups

- Daily backups at 3 AM UTC
- 7-day retention period
- Automatic cross-region copy

### Manual Restore

```bash
aws backup start-restore-job \
  --recovery-point-arn <recovery-point-arn> \
  --metadata file://restore-metadata.json \
  --iam-role-arn $(terraform output -raw backup_role_arn) \
  --region us-east-1
```

## Cost Estimate

Monthly cost (approximate):
- Aurora Global Database: $500-700
- Auto Scaling (4 t3.micro): $30-50
- ALBs: $40-50
- S3 and Replication: $10-30
- AWS Backup: $20-40
- Data Transfer: $50-100

**Total: ~$650-970/month**

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This deletes all resources including databases. Ensure backups exist.

## Troubleshooting

### Aurora Global Database Issues

- Verify both regions support Aurora Global Database
- Check IAM permissions for RDS
- Ensure subnets span multiple AZs

### S3 Replication Not Working

- Verify versioning enabled on both buckets
- Check IAM role permissions
- Confirm different regions for source and destination

### Route 53 Health Checks Failing

- Verify ALB security groups allow traffic
- Check target group health
- Ensure health check path returns 200

## Security Considerations

- Database credentials marked as sensitive
- S3 encryption at rest (SSE-S3)
- All resources tagged for compliance
- Security groups follow least-privilege principle

## Support

Review:
- Terraform documentation
- AWS service limits
- IAM permissions
- CloudWatch logs
