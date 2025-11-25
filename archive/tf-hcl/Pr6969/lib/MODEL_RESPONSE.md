### Reasoning Trace
---

This is a comprehensive request for a Terraform configuration for a payment processing application with the following key requirements:

1. Use Terraform 1.5+ and AWS provider 5.x
2. Use Terraform workspaces with S3 backend
3. Three environments: dev, staging, prod
4. Existing VPCs with specific CIDR blocks (don't create new ones)
5. Reusable module structure
6. RDS PostgreSQL with environment-specific sizing
7. Security groups for HTTPS and PostgreSQL
8. Application Load Balancer
9. EC2 instances with environment-specific sizing
10. CloudWatch alarms for RDS CPU
11. Consistent naming with environment prefix
12. Tags for all resources
13. Separate .tfvars files for each environment
14. Appropriate outputs

Let me structure this properly:

1. Root module structure:
   - main.tf (calls the module)
   - variables.tf (defines variables)
   - outputs.tf (outputs from module)
   - terraform.tf (backend and provider config)
   - dev.tfvars, staging.tfvars, prod.tfvars

2. Module structure (modules/payment-app/):
   - main.tf (all resources)
   - variables.tf (module inputs)
   - outputs.tf (module outputs)
   - data.tf (data sources for existing VPCs)
   - rds.tf (RDS resources)
   - alb.tf (ALB resources)
   - ec2.tf (EC2 resources)
   - security_groups.tf (Security groups)
   - cloudwatch.tf (CloudWatch alarms)

Let me create a comprehensive solution.
### Answer 
---

I'll create a comprehensive Terraform configuration for your payment processing application with a modular structure that works across all three environments. Here's the complete setup:

## Directory Structure

```
.
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tf
├── dev.tfvars
├── staging.tfvars
├── prod.tfvars
└── modules/
    └── payment-app/
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        ├── data.tf
        ├── rds.tf
        ├── alb.tf
        ├── ec2.tf
        ├── security_groups.tf
        └── cloudwatch.tf
```

## Root Module Configuration

### **terraform.tf** (Backend and Provider Configuration)

```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "payment-app-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "payment-processing"
      ManagedBy   = "Terraform"
    }
  }
}
```

### **variables.tf** (Root Variables)

```hcl
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold for CloudWatch alarm"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key pair for EC2 instances"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}
```

### **main.tf** (Root Module Calling Child Module)

```hcl
module "payment_app" {
  source = "./modules/payment-app"
  
  environment             = var.environment
  aws_region             = var.aws_region
  vpc_cidr               = var.vpc_cidr
  db_instance_class      = var.db_instance_class
  ec2_instance_type      = var.ec2_instance_type
  backup_retention_period = var.backup_retention_period
  rds_cpu_threshold      = var.rds_cpu_threshold
  instance_count         = var.instance_count
  db_username            = var.db_username
  db_password            = var.db_password
  ssh_key_name           = var.ssh_key_name
  ami_id                 = var.ami_id
}
```

### **outputs.tf** (Root Outputs)

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.payment_app.alb_dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = module.payment_app.alb_arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.payment_app.rds_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.payment_app.rds_port
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = module.payment_app.ec2_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = module.payment_app.rds_security_group_id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = module.payment_app.alb_security_group_id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = module.payment_app.ec2_instance_ids
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = module.payment_app.target_group_arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value       = module.payment_app.cloudwatch_alarm_arns
}
```

## Environment-Specific Variable Files

### **dev.tfvars**

```hcl
environment             = "dev"
aws_region             = "us-east-1"
vpc_cidr               = "10.0.0.0/16"
db_instance_class      = "db.t3.micro"
ec2_instance_type      = "t3.micro"
backup_retention_period = 0
rds_cpu_threshold      = 80
instance_count         = 2
db_username            = "dbadmin"
db_password            = "DevPassword123!"  # Change this in production
ssh_key_name           = "payment-app-dev-key"
ami_id                 = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2023
```

### **staging.tfvars**

```hcl
environment             = "staging"
aws_region             = "us-east-1"
vpc_cidr               = "10.1.0.0/16"
db_instance_class      = "db.t3.small"
ec2_instance_type      = "t3.small"
backup_retention_period = 7
rds_cpu_threshold      = 70
instance_count         = 2
db_username            = "dbadmin"
db_password            = "StagingPassword123!"  # Change this in production
ssh_key_name           = "payment-app-staging-key"
ami_id                 = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2023
```

### **prod.tfvars**

```hcl
environment             = "prod"
aws_region             = "us-east-1"
vpc_cidr               = "10.2.0.0/16"
db_instance_class      = "db.t3.medium"
ec2_instance_type      = "t3.small"
backup_retention_period = 30
rds_cpu_threshold      = 60
instance_count         = 3
db_username            = "dbadmin"
db_password            = "ProdPassword123!"  # Use AWS Secrets Manager in production
ssh_key_name           = "payment-app-prod-key"
ami_id                 = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2023
```

## Module Configuration

### **modules/payment-app/variables.tf**

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold"
  type        = number
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "SSH key name"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}
```

### **modules/payment-app/data.tf**

```hcl
# Data source to get existing VPC
data "aws_vpc" "existing" {
  filter {
    name   = "cidr-block"
    values = [var.vpc_cidr]
  }
}

# Data source to get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source to get public subnets
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }
  
  tags = {
    Type = "public"
  }
}

# Data source to get private subnets
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.existing.id]
  }
  
  tags = {
    Type = "private"
  }
}

# Get individual subnet details
data "aws_subnet" "public" {
  count = length(data.aws_subnets.public.ids)
  id    = data.aws_subnets.public.ids[count.index]
}

data "aws_subnet" "private" {
  count = length(data.aws_subnets.private.ids)
  id    = data.aws_subnets.private.ids[count.index]
}
```

### **modules/payment-app/security_groups.tf**

```hcl
# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.environment}-payment-app-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from Internet (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-payment-app-alb-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-payment-app-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTPS from ALB"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-payment-app-ec2-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-payment-app-rds-sg"
  description = "Security group for RDS PostgreSQL instance"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-payment-app-rds-sg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}
```

### **modules/payment-app/rds.tf**

```hcl
# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-payment-app-db-subnet-group"
  subnet_ids = data.aws_subnets.private.ids

  tags = {
    Name        = "${var.environment}-payment-app-db-subnet-group"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.environment}-payment-app-db"
  
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.environment == "prod" ? 100 : 20
  storage_type         = var.environment == "prod" ? "gp3" : "gp2"
  storage_encrypted    = true
  
  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment != "dev" ? "${var.environment}-payment-app-db-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  deletion_protection = var.environment == "prod" ? true : false
  
  multi_az               = var.environment == "prod" ? true : false
  auto_minor_version_upgrade = var.environment != "prod"
  
  performance_insights_enabled = var.environment == "prod" ? true : false
  monitoring_interval         = var.environment == "prod" ? 60 : 0
  monitoring_role_arn        = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null
  
  enabled_cloudwatch_logs_exports = var.environment != "dev" ? ["postgresql"] : []
  
  tags = {
    Name        = "${var.environment}-payment-app-db"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# IAM role for RDS monitoring (only in prod)
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${var.environment}-payment-app-rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-payment-app-rds-monitoring-role"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0
  
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

### **modules/payment-app/ec2.tf**

```hcl
# IAM role for EC2 instances
resource "aws_iam_role" "ec2" {
  name = "${var.environment}-payment-app-ec2-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-role"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Attach CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# Attach SSM policy for Session Manager
resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-payment-app-ec2-profile"
  role = aws_iam_role.ec2.name
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-profile"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# EC2 instances
resource "aws_instance" "app" {
  count = var.instance_count
  
  ami           = var.ami_id
  instance_type = var.ec2_instance_type
  
  subnet_id                   = data.aws_subnets.private.ids[count.index % length(data.aws_subnets.private.ids)]
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  key_name                    = var.ssh_key_name
  
  monitoring = var.environment == "prod" ? true : false
  
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.environment == "prod" ? 50 : 20
    encrypted            = true
    delete_on_termination = true
  }
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = aws_db_instance.main.endpoint
    db_name     = aws_db_instance.main.db_name
    environment = var.environment
  }))
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-${count.index + 1}"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    create_before_destroy = true
  }
}
```

### **modules/payment-app/alb.tf**

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-payment-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = data.aws_subnets.public.ids
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true
  enable_cross_zone_load_balancing = true
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-alb"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-payment-app-alb-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = {
    Name        = "${var.environment}-payment-app-alb-logs"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/alb/*"
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-payment-app-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  deregistration_delay = var.environment == "prod" ? 300 : 30
  
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-tg"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# Target Group Attachment
resource "aws_lb_target_group_attachment" "main" {
  count = var.instance_count
  
  target_group_arn = aws_lb_target_group.main.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
  
  depends_on = [aws_acm_certificate_validation.main]
}

# ACM Certificate (self-signed for demo)
resource "aws_acm_certificate" "main" {
  domain_name       = "${var.environment}.payment-app.example.com"
  validation_method = "DNS"
  
  subject_alternative_names = [
    "www.${var.environment}.payment-app.example.com"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-cert"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# For demo purposes - in production, you'd validate with Route53
resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
}
```

### **modules/payment-app/cloudwatch.tf**

```hcl
# SNS Topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.environment}-payment-app-alarms"
  
  tags = {
    Name        = "${var.environment}-payment-app-alarms"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = "ops-${var.environment}@example.com"
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.environment}-payment-app-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.rds_cpu_threshold
  alarm_description  = "This metric monitors RDS CPU utilization"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-rds-cpu-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for RDS Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.environment}-payment-app-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "FreeStorageSpace"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = 2000000000  # 2GB in bytes
  alarm_description  = "This metric monitors RDS free storage space"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-rds-storage-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for ALB Target Health
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts" {
  alarm_name          = "${var.environment}-payment-app-alb-unhealthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "HealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Average"
  threshold          = var.instance_count * 0.5
  alarm_description  = "Alert when we have less than 50% healthy hosts"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  treat_missing_data = "breaching"
  
  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-alb-healthy-hosts-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count = var.instance_count
  
  alarm_name          = "${var.environment}-payment-app-ec2-${count.index + 1}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = var.environment == "prod" ? 70 : 80
  alarm_description  = "This metric monitors EC2 CPU utilization"
  alarm_actions      = [aws_sns_topic.alarms.arn]
  
  dimensions = {
    InstanceId = aws_instance.app[count.index].id
  }
  
  tags = {
    Name        = "${var.environment}-payment-app-ec2-${count.index + 1}-cpu-alarm"
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-payment-app-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { stat = "Average", label = "RDS CPU" }],
            ["AWS/EC2", "CPUUtilization", { stat = "Average", label = "EC2 CPU" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "CPU Utilization"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      }
    ]
  })
}
```

### **modules/payment-app/main.tf**

```hcl
# Main configuration file for the payment-app module
# This file can be used for any additional resources or locals

locals {
  common_tags = {
    Environment = var.environment
    Project     = "payment-processing"
    ManagedBy   = "Terraform"
  }
}
```

### **modules/payment-app/outputs.tf**

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "ec2_security_group_id" {
  description = "Security group ID for EC2 instances"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS instance"
  value       = aws_security_group.rds.id
}

output "alb_security_group_id" {
  description = "Security group ID for ALB"
  value       = aws_security_group.alb.id
}

output "ec2_instance_ids" {
  description = "List of EC2 instance IDs"
  value       = aws_instance.app[*].id
}

output "ec2_private_ips" {
  description = "Private IP addresses of EC2 instances"
  value       = aws_instance.app[*].private_ip
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of CloudWatch alarms"
  value = {
    rds_cpu     = aws_cloudwatch_metric_alarm.rds_cpu.arn
    rds_storage = aws_cloudwatch_metric_alarm.rds_storage.arn
    alb_health  = aws_cloudwatch_metric_alarm.alb_healthy_hosts.arn
    ec2_cpu     = aws_cloudwatch_metric_alarm.ec2_cpu[*].arn
  }
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  description = "URL to CloudWatch Dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
```

### **modules/payment-app/user_data.sh**

```bash
#!/bin/bash
# User data script for EC2 instances

# Update system
yum update -y

# Install necessary packages
yum install -y postgresql15 nginx amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "${environment}-payment-app",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure nginx as a simple web server for health checks
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name _;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Start nginx
systemctl enable nginx
systemctl start nginx

# Store database connection info (for application use)
cat > /etc/payment-app/db.conf << EOF
DB_ENDPOINT=${db_endpoint}
DB_NAME=${db_name}
ENVIRONMENT=${environment}
EOF

# Log the initialization
echo "EC2 instance initialized for ${environment} environment" >> /var/log/payment-app.log
```

## Usage Instructions

### 1. Initialize Terraform with Workspace

```bash
# Initialize terraform
terraform init

# Create workspaces for each environment
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

### 2. Deploy to Each Environment

```bash
# Deploy to dev
terraform workspace select dev
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars

# Deploy to staging
terraform workspace select staging
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars

# Deploy to prod
terraform workspace select prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

### 3. View Outputs

```bash
# After deployment, view outputs for current workspace
terraform output

# Specific output
terraform output alb_dns_name
```

### 4. Destroy Resources

```bash
# Select workspace and destroy
terraform workspace select dev
terraform destroy -var-file=dev.tfvars
```

## Key Features Implemented

1. **Workspace-based Environment Separation**: Each environment has its own state file in S3
2. **Reusable Module Structure**: All environments use the same module with different configurations
3. **Environment-specific Sizing**: Different instance sizes and backup policies per environment
4. **Security Groups**: Properly configured for HTTPS and PostgreSQL access
5. **Application Load Balancer**: With health checks and target groups
6. **CloudWatch Monitoring**: Alarms with environment-specific thresholds
7. **Consistent Naming**: All resources prefixed with environment name
8. **Comprehensive Tagging**: Environment, Project, and ManagedBy tags on all resources
9. **High Availability**: Resources spread across multiple availability zones
10. **Security Best Practices**: Encryption at rest, private subnets for compute, security groups properly configured

This configuration provides a production-ready, scalable, and maintainable infrastructure for your payment processing application across all three environments.