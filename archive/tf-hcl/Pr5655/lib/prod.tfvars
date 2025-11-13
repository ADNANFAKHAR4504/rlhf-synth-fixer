# prod.tfvars - Production environment configuration

# General Configuration
aws_region   = "us-east-1"
project_name = "tap-fintech"
environment  = "prod"
cost_center  = "engineering"

# Networking Configuration (Production)
vpc_cidr                = "10.3.0.0/16"
public_subnet_cidrs     = ["10.3.1.0/24", "10.3.2.0/24", "10.3.3.0/24"]
private_subnet_cidrs    = ["10.3.10.0/24", "10.3.20.0/24", "10.3.30.0/24"]
database_subnet_cidrs   = ["10.3.100.0/24", "10.3.200.0/24", "10.3.300.0/24"]

# ECS Configuration (Production)
container_image_tag = "prod"
task_cpu           = 2048
task_memory        = 4096
desired_count      = 4
min_capacity       = 4
max_capacity       = 20

# Auto-scaling thresholds (conservative for production)
cpu_target_utilization    = 60
memory_target_utilization = 60

# Database Configuration (Production)
db_engine_version         = "8.0.mysql_aurora.3.02.0"
db_instance_class        = "db.r6g.xlarge"
db_backup_retention_period = 30
deletion_protection      = false  # Disabled for cost optimization

# Security Configuration (Production - Highly Restricted)
allowed_cidr_blocks = ["10.3.0.0/16"]  # Only VPC traffic

# Monitoring Configuration (Production)
cloudwatch_log_retention_days = 90
enable_container_insights     = true
enable_xray_tracing          = true

# ECR Configuration
ecr_scan_on_push = true

# Route53 Configuration (Production)
# domain_name = "app.example.com"  # Uncomment and set your production domain
# certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"  # Set your ACM certificate ARN
create_route53_records = false

# Additional tags for production
additional_tags = {
  CostCenter    = "engineering"
  Team          = "platform"
  Purpose       = "production"
  Compliance    = "pci-dss"
  DataClass     = "confidential"
  BusinessCritical = "true"
}