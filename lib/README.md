# Multi-Region Disaster Recovery for PostgreSQL Database

This Terraform configuration implements a comprehensive multi-region disaster recovery solution for PostgreSQL using AWS RDS Aurora Global Database with automated failover capabilities.

## Architecture

The solution spans two AWS regions (us-east-1 and us-west-2) and includes:

- **RDS Aurora PostgreSQL Global Database**: Primary cluster in us-east-1 with cross-region replication to us-west-2
- **High Availability**: Each cluster has 2 read replicas distributed across availability zones
- **Automated Failover**: Route 53 health checks monitor database health and replication lag, automatically routing traffic to secondary region on failure
- **Backup Strategy**: Automated backups with point-in-time recovery, manual export storage in S3 with cross-region replication
- **Security**: Encryption at rest using KMS, encryption in transit, credentials stored in Secrets Manager with automatic rotation
- **Monitoring**: CloudWatch alarms for replication lag, CPU, connections, SNS notifications for critical events

## Prerequisites

1. **AWS Account**: Access to AWS account with appropriate permissions
2. **Terraform**: Version 1.5.0 or higher
3. **AWS CLI**: Configured with credentials
4. **Existing Infrastructure**:
   - VPCs in us-east-1 and us-west-2 with private subnets across 3 AZs
   - VPC peering between regions configured
   - Route 53 hosted zone for health check domain
   - NAT gateways for outbound connectivity

## Required Variables

You must provide values for the following variables:

```hcl
# VPC and Network Configuration
primary_vpc_id         = "vpc-xxxxxxxxx"      # VPC ID in us-east-1
primary_subnet_ids     = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
secondary_vpc_id       = "vpc-yyyyyyyyy"      # VPC ID in us-west-2
secondary_subnet_ids   = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]

# Route 53 Configuration
hosted_zone_id         = "Z1234567890ABC"     # Route 53 hosted zone ID
health_check_domain    = "example.com"        # Domain for health checks

# Resource Naming
environment_suffix     = "prod-v1"            # Unique suffix for resources
```

## Optional Variables

You can customize the following variables:

```hcl
database_name                 = "transactiondb"    # Database name
master_username               = "dbadmin"          # Master username
db_instance_class            = "db.r6g.large"     # Instance class
backup_retention_period      = 30                  # Days to retain backups
application_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
```

## Deployment Steps

### 1. Configure Backend

Create a `backend.hcl` file:

```hcl
bucket         = "your-terraform-state-bucket"
key            = "disaster-recovery/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true
```

### 2. Create Variables File

Create `terraform.tfvars`:

```hcl
environment_suffix    = "prod-v1"
primary_vpc_id       = "vpc-xxxxxxxxx"
primary_subnet_ids   = ["subnet-xxx", "subnet-yyy", "subnet-zzz"]
secondary_vpc_id     = "vpc-yyyyyyyyy"
secondary_subnet_ids = ["subnet-aaa", "subnet-bbb", "subnet-ccc"]
hosted_zone_id       = "Z1234567890ABC"
health_check_domain  = "example.com"
```

### 3. Initialize Terraform

```bash
cd lib
terraform init -backend-config=backend.hcl
```

### 4. Review Plan

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

**Note**: Initial deployment takes approximately 30-45 minutes due to Aurora Global Database setup and cross-region replication initialization.

## Post-Deployment Configuration

### 1. Test Database Connectivity

```bash
# Get primary endpoint
PRIMARY_ENDPOINT=$(terraform output -raw primary_cluster_endpoint)

# Connect using psql
psql -h $PRIMARY_ENDPOINT -U dbadmin -d transactiondb
```

### 2. Retrieve Database Credentials

```bash
# Get secret ARN
SECRET_ARN=$(terraform output -raw primary_secret_arn)

# Retrieve credentials
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text
```

### 3. Configure Application

Update your application configuration to use the Route 53 failover endpoint:

```
db-primary.example.com
```

This endpoint will automatically route to the healthy cluster.

## Monitoring and Alerts

### CloudWatch Alarms

The following alarms are configured:

1. **Replication Lag**: Alerts when lag exceeds 60 seconds
2. **CPU Utilization**: Alerts when CPU exceeds 80%
3. **Database Connections**: Alerts when connections exceed 100

### SNS Notifications

Subscribe to SNS topics to receive alerts:

```bash
# Subscribe email to primary region events
aws sns subscribe \
  --topic-arn $(terraform output -raw primary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com

# Subscribe email to secondary region events
aws sns subscribe \
  --topic-arn $(terraform output -raw secondary_sns_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-west-2
```

## Disaster Recovery Procedures

### Monitoring Replication Health

```bash
# Check replication lag (CloudWatch)
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=aurora-primary-prod-v1 \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

### Manual Failover Testing

To test failover:

1. Promote secondary cluster to standalone (manual process in AWS Console)
2. Update DNS to point to secondary endpoint
3. Monitor application connectivity

**Note**: Automated failover happens via Route 53 health checks when primary becomes unhealthy.

### Backup and Restore

#### Point-in-Time Recovery

```bash
# Restore to specific time
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier aurora-primary-prod-v1 \
  --db-cluster-identifier aurora-restored-prod-v1 \
  --restore-to-time 2024-01-15T12:00:00Z
```

#### Manual Export to S3

```bash
# Export snapshot to S3
aws rds start-export-task \
  --export-task-identifier export-$(date +%Y%m%d-%H%M%S) \
  --source-arn arn:aws:rds:us-east-1:ACCOUNT_ID:cluster-snapshot:SNAPSHOT_ID \
  --s3-bucket-name $(terraform output -raw primary_backup_bucket) \
  --iam-role-arn arn:aws:iam::ACCOUNT_ID:role/rds-s3-export-role \
  --kms-key-id $(terraform output -raw primary_kms_key_id)
```

## Security Best Practices

1. **Network Isolation**: Database clusters are deployed in private subnets with no public access
2. **Encryption**: All data encrypted at rest using KMS and in transit using SSL/TLS
3. **Credential Management**: Database passwords stored in Secrets Manager with automatic rotation
4. **Access Control**: Security groups restrict database access to application subnets only
5. **Audit Logging**: CloudWatch Logs capture all database activities

## Cost Optimization

- Primary cluster: 2x db.r6g.large instances
- Secondary cluster: 2x db.r6g.large instances
- S3 storage with lifecycle policies (transition to Glacier after 30 days)
- CloudWatch Logs with 30-day retention
- Estimated monthly cost: $2,000-$2,500 (depending on data transfer and storage)

## Maintenance

### Updating Engine Version

```bash
# Plan upgrade
terraform plan -var="engine_version=15.5"

# Apply upgrade
terraform apply -var="engine_version=15.5"
```

### Scaling Instances

```bash
# Update instance class
terraform apply -var="db_instance_class=db.r6g.xlarge"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will permanently delete all database clusters and backups (except those transitioned to Glacier).

## Troubleshooting

### Replication Lag High

1. Check network connectivity between regions (VPC peering)
2. Review database load and consider scaling
3. Verify security groups allow replication traffic

### Health Check Failing

1. Verify Route 53 health check configuration
2. Check CloudWatch alarm states
3. Test database connectivity from health check source

### Connection Timeout

1. Verify security group rules allow traffic from application subnets
2. Check database cluster status
3. Verify DNS resolution of failover endpoint

## Support

For issues or questions:
- Review AWS RDS Aurora documentation
- Check CloudWatch Logs for database errors
