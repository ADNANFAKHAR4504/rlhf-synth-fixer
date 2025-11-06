# Blue-Green Deployment Architecture - Terraform Implementation (Corrected)

This is the corrected implementation of a complete blue-green deployment architecture for containerized web applications using AWS services with Terraform.

## Architecture Overview

- **Platform**: Terraform (HCL)
- **Region**: us-east-1
- **Deployment Pattern**: Blue-Green with weighted traffic routing
- **High Availability**: Multi-AZ deployment with Aurora replication

## File Structure

```
lib/
├── main.tf                  # Terraform configuration with local backend
├── variables.tf             # Input variables with environment_suffix
├── data.tf                  # VPC and subnet data sources
├── iam.tf                   # IAM roles and policies
├── security_groups.tf       # Security groups for all tiers
├── s3.tf                    # Artifacts bucket with lifecycle policies
├── rds.tf                   # Aurora cluster, instances, and RDS Proxy
├── alb.tf                   # Application Load Balancer and target groups
├── launch_templates.tf      # EC2 launch templates for blue/green
├── asg.tf                   # Auto Scaling Groups and policies
├── route53.tf               # Weighted DNS routing
├── cloudwatch.tf            # Alarms and SNS topic
├── outputs.tf               # Stack outputs
├── user_data.sh             # EC2 initialization script
└── terraform.tfvars         # Variable values
```

## Key Corrections Made

### 1. Backend Configuration (Critical)
**Issue**: Original had S3 backend requiring manual input
**Fix**: Changed to local backend for testing:
```hcl
terraform {
  backend "local" {}
}
```

### 2. Removed Duplicate Provider Configuration (Critical)
**Issue**: Both provider.tf and main.tf defined providers, causing initialization failure
**Fix**: Deleted provider.tf, kept configuration in main.tf only

### 3. Route53 Weighted Routing Syntax (Critical)
**Issue**: Direct `weight` attribute not supported
**Fix**: Used `weighted_routing_policy` block:
```hcl
resource "aws_route53_record" "blue" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  set_identifier = "blue-${var.environment_suffix}"

  weighted_routing_policy {
    weight = var.blue_traffic_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

### 4. RDS Proxy Target Configuration (Critical)
**Issue**: Missing required `target_group_name` and invalid `target_arn` attribute
**Fix**: Referenced default target group correctly:
```hcl
resource "aws_db_proxy_target" "main" {
  db_proxy_name          = aws_db_proxy.main.name
  target_group_name      = aws_db_proxy_default_target_group.main.name
  db_cluster_identifier  = aws_rds_cluster.main.cluster_identifier
}
```

### 5. S3 Lifecycle Configuration (High)
**Issue**: Missing required `filter` block in lifecycle rules
**Fix**: Added empty filter blocks:
```hcl
rule {
  id     = "delete-old-versions"
  status = "Enabled"

  filter {}

  noncurrent_version_expiration {
    noncurrent_days = 90
  }
}
```

### 6. Terraform Formatting (Medium)
**Issue**: Multiple files had inconsistent formatting
**Fix**: Ran `terraform fmt -recursive` on all files

## Infrastructure Components

### Networking & Load Balancing
- Application Load Balancer with listener on port 80
- Two target groups (blue and green) for zero-downtime switching
- Security groups with least-privilege access

### Compute Resources
- Separate Auto Scaling Groups for blue and green environments
- Launch templates with Docker-enabled AMIs
- Target tracking scaling policies for CPU and request count
- Instance refresh for rolling updates

### Database Layer
- Aurora MySQL 8.0 cluster with 1 writer and 2 reader instances
- RDS Proxy for connection pooling
- Secrets Manager for credential management
- Enhanced monitoring enabled

### Traffic Management
- Route 53 weighted routing records
- Configurable traffic weights (default: 100% blue, 0% green)
- ALB listener rules for target group routing

### Monitoring & Alerts
- CloudWatch alarms for:
  - Target group health (blue/green)
  - CPU utilization (blue/green/RDS)
  - Request count (blue/green)
  - ALB 5XX errors
  - RDS connections
- SNS topic for alarm notifications

### Storage
- S3 bucket with versioning enabled
- Server-side encryption (AES256)
- Lifecycle policies for old versions
- Public access blocked

### Security
- IAM roles for EC2 instances (S3 and CloudWatch access)
- IAM role for RDS Proxy (Secrets Manager access)
- IAM role for RDS Enhanced Monitoring
- Security groups for network isolation

## Environment Suffix Usage

All resources use `var.environment_suffix` for naming to prevent conflicts:
- ALB: `alb-${var.environment_suffix}`
- ASGs: `asg-blue-${var.environment_suffix}`, `asg-green-${var.environment_suffix}`
- Target Groups: `tg-blue-${var.environment_suffix}`, `tg-green-${var.environment_suffix}`
- RDS Cluster: `aurora-cluster-${var.environment_suffix}`
- RDS Proxy: `rds-proxy-${var.environment_suffix}`
- S3 Bucket: `app-artifacts-${var.environment_suffix}`
- All IAM roles, security groups, and other resources

## Deployment Process

1. Initialize: `terraform init -reconfigure -upgrade`
2. Validate: `terraform validate`
3. Format: `terraform fmt -recursive`
4. Plan: `terraform plan -out=tfplan`
5. Apply: `terraform apply tfplan`

## Testing

### Unit Tests (45 tests)
- Configuration structure validation
- Resource definitions verification
- Security configuration checks
- Environment suffix usage validation
- Best practices compliance

### Integration Tests (36 tests)
- Deployment outputs validation
- Blue-green traffic distribution
- Resource naming conventions
- High availability configuration
- Security configuration
- Infrastructure dependencies

## Key Features

1. **Zero-Downtime Deployments**: Traffic can be switched between blue and green environments using Route 53 weighted routing
2. **High Availability**: Multi-AZ deployment with Aurora reader replicas
3. **Scalability**: Auto Scaling based on CPU and request metrics
4. **Security**: Encrypted storage, least-privilege IAM, network isolation
5. **Monitoring**: Comprehensive CloudWatch alarms for all components
6. **Connection Management**: RDS Proxy prevents connection exhaustion
7. **Artifact Management**: S3 with versioning and lifecycle policies

## Deployment Configuration

Default configuration (terraform.tfvars):
- Instance Type: t3.micro (cost-optimized for testing)
- Min Instances: 1 per ASG
- Desired Instances: 1 per ASG
- Max Instances: 2 per ASG
- Blue Traffic: 100%
- Green Traffic: 0%

## Cost Optimization Notes

For production:
- Increase instance types and counts
- Enable Multi-AZ for Aurora
- Add additional reader instances
- Configure backup retention
- Enable RDS Performance Insights

For testing:
- Use smallest instance types (t3.micro)
- Minimize instance counts
- Consider skipping RDS Aurora (high cost)
- Set short backup retention

## Outputs

The stack outputs all critical resource identifiers needed for:
- Application deployment
- Integration testing
- CI/CD pipelines
- Monitoring dashboards
- Traffic switching operations

See `outputs.tf` for complete list of 23 exported values.