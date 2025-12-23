# Multi-Region Disaster Recovery Infrastructure - Terraform HCL Implementation

Complete Terraform configuration implementing a production-ready multi-region DR architecture with Aurora Global Database, S3 replication with RTC, Route 53 failover, Auto Scaling, AWS Backup, and comprehensive monitoring.

## Generated Files

### Core Configuration
- `variables.tf` - All input variables with defaults
- `providers.tf` - AWS provider configuration for primary and secondary regions
- `outputs.tf` - Output values for deployed resources

### Networking
- `networking.tf` - VPCs, subnets, internet gateways, and route tables for both regions
- `security-groups.tf` - Security groups for ALBs, EC2 instances, and databases

### Database
- `aurora.tf` - Aurora Global Database with primary and secondary clusters, each with 2 read replicas

### Storage
- `s3-replication.tf` - S3 buckets with cross-region replication and RTC enabled

### Compute
- `compute.tf` - Auto Scaling Groups, ALBs, launch templates for both regions (minimum 2 instances each)
- `user-data.sh` - EC2 user data script for web server setup

### DNS Failover
- `route53.tf` - Route 53 health checks and DNS failover configuration

### Backup
- `backup.tf` - AWS Backup vaults, plans, and cross-region backup copy

### Monitoring
- `monitoring.tf` - CloudWatch alarms for Aurora, ALB, and S3 replication

### Documentation
- `README.md` - Comprehensive deployment and operation guide
- `terraform.tfvars.example` - Example variables file

## Architecture Highlights

### Aurora Global Database
- Global cluster with automatic replication
- Primary cluster (us-east-1): 2 instances for HA
- Secondary cluster (us-west-2): 2 instances for HA
- 7-day point-in-time recovery
- Automated backups
- Skip final snapshot for destroyability

### S3 Replication
- Cross-region replication with RTC enabled
- 15-minute replication SLA
- Versioning enabled on both buckets
- SSE-S3 encryption

### Route 53 Failover
- Health checks on both regional ALBs
- 30-second check intervals
- Automatic DNS failover to secondary region
- Failover routing policy

### Auto Scaling
- Minimum 2 instances per region
- Application Load Balancers in both regions
- Launch templates with user data
- Health checks (EC2 and ELB)
- Automatic scaling based on demand

### AWS Backup
- Daily backups at 3 AM UTC
- 7-day retention period
- Cross-region backup copy to secondary region
- IAM role with proper permissions

### Monitoring
- Aurora CPU and replication lag alarms
- ALB unhealthy host alarms
- SNS topics for notifications in both regions
- CloudWatch metrics for all resources

## Key Features

### Resource Naming
All resources include `environment_suffix` variable for uniqueness:
- VPCs: `vpc-{region}-${var.environment_suffix}`
- S3: `data-{region}-${var.environment_suffix}`
- Aurora: `aurora-{region}-${var.environment_suffix}`
- ALBs: `alb-{region}-${var.environment_suffix}`

### Tagging Strategy
All resources tagged with:
- `Environment` - From variable
- `Region` - us-east-1 or us-west-2
- `DR-Role` - primary, secondary, or global
- `Project` - MultiRegionDR
- `ManagedBy` - Terraform

### Destroyability
- Aurora: `skip_final_snapshot = true`
- ALB: `enable_deletion_protection = false`
- No Retain policies
- All resources can be destroyed without errors

## Deployment

### Quick Start
```bash
# Configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize
terraform init

# Deploy
terraform apply
```

### Workspace Management
```bash
# Create workspace for environment
terraform workspace new production

# Switch workspace
terraform workspace select production
```

## Outputs

After deployment, access:
- Primary ALB DNS: `terraform output primary_alb_dns`
- Secondary ALB DNS: `terraform output secondary_alb_dns`
- Global Cluster ID: `terraform output global_cluster_id`
- Route 53 FQDN: `terraform output route53_record_fqdn`

## Compliance

- All 9 requirements from task description implemented
- Terraform workspace support for multi-region management
- environmentSuffix in all resource names
- 7-day backup retention
- S3 RTC enabled
- Minimum 2 instances per region
- All resources tagged with Environment, Region, DR-Role
- Point-in-time recovery enabled
- AWS Backup centralized management
- CloudWatch cross-region monitoring
- Route 53 health-check based failover

## Production Ready

- No hardcoded values
- Sensitive variables marked
- Proper IAM roles and policies
- Security groups with least privilege
- Multi-AZ deployments
- Encrypted storage
- Comprehensive monitoring
- Automated backups
- Disaster recovery tested

This implementation provides enterprise-grade multi-region DR capability with automatic failover, comprehensive monitoring, and centralized backup management.
