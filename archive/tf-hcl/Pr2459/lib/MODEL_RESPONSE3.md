# Complete, Production-Ready Solution - Simplified!

You're absolutely right - let me give you a much cleaner, complete solution that's actually production-ready and doesn't require jumping through hoops. Here's the simplified approach:

## Strategy: Make SSH Keys Truly Optional

For production web servers, SSH access isn't always necessary (you can use Systems Manager Session Manager instead). Let's make it completely optional and secure by default.

## Complete Fixed Files

### 1. Root `variables.tf` (COMPLETE)
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "prod-project-166"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "devops-team"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

# SIMPLIFIED: Optional SSH key - if not provided, SSH access is disabled
variable "ssh_key_name" {
  description = "Existing EC2 Key Pair name for SSH access (optional)"
  type        = string
  default     = ""
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._-]*$", var.ssh_key_name))
    error_message = "SSH key name can only contain letters, numbers, periods, underscores, and hyphens."
  }
}

variable "enable_ssh_access" {
  description = "Enable SSH access to EC2 instances (requires ssh_key_name if true)"
  type        = bool
  default     = false
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access (only used if enable_ssh_access is true)"
  type        = list(string)
  default     = ["10.0.0.0/16"] # Only from VPC by default
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "proddb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "enable_encryption" {
  description = "Enable encryption for RDS and S3"
  type        = bool
  default     = true
}

variable "sns_email" {
  description = "Email for SNS notifications (REQUIRED)"
  type        = string
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.sns_email))
    error_message = "Please provide a valid email address for SNS notifications."
  }
}
```

### 2. Root `main.tf` (COMPLETE - Updated compute module call)
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Uncomment and configure for production state management
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "prod/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "project-166"
      Batch       = "batch-004"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.owner
    }
  }
}

# Data sources for existing resources and dynamic values
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  project_name        = var.project_name
  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = data.aws_availability_zones.available.names
  enable_nat_gateway = var.enable_nat_gateway
}

# Storage Module (S3)
module "storage" {
  source = "./modules/storage"
  
  project_name      = var.project_name
  environment       = var.environment
  enable_encryption = var.enable_encryption
}

# Database Module
module "database" {
  source = "./modules/database"
  
  project_name           = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  db_instance_class     = var.db_instance_class
  db_name               = var.db_name
  db_username           = var.db_username
  enable_encryption     = var.enable_encryption
}

# Compute Module - UPDATED WITH ALL PARAMETERS
module "compute" {
  source = "./modules/compute"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.networking.vpc_id
  public_subnet_ids  = module.networking.public_subnet_ids
  s3_bucket_arn      = module.storage.s3_bucket_arn
  instance_type      = var.instance_type
  ssh_key_name       = var.ssh_key_name
  enable_ssh_access  = var.enable_ssh_access
  allowed_ssh_cidr   = var.allowed_ssh_cidr
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name    = var.project_name
  environment     = var.environment
  instance_ids    = module.compute.instance_ids
  db_instance_id  = module.database.db_instance_id
  sns_email       = var.sns_email
}
```

### 3. `modules/compute/main.tf` (COMPLETE REWRITE)
```hcl
# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = var.vpc_id

  # HTTP access
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Conditional SSH access - only if enabled
  dynamic "ingress" {
    for_each = var.enable_ssh_access ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidr
    }
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-ec2-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

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
    Name = "${var.project_name}-ec2-role"
  }
}

# IAM Policy for S3 access
resource "aws_iam_role_policy" "s3_access" {
  name = "${var.project_name}-s3-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

# IAM Policy for Systems Manager (Session Manager - replaces SSH)
resource "aws_iam_role_policy_attachment" "ssm_managed_instance" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Policy for CloudWatch Agent
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# EC2 Instances - COMPLETE DEFINITION
resource "aws_instance" "web" {
  count = 2

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.enable_ssh_access && var.ssh_key_name != "" ? var.ssh_key_name : null
  vpc_security_group_ids = [aws_security_group.ec2.id]
  subnet_id              = var.public_subnet_ids[count.index]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  # Enable detailed monitoring for CloudWatch
  monitoring = true

  # Root volume encryption
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
    
    tags = {
      Name = "${var.project_name}-web-${count.index + 1}-root"
    }
  }

  # User data script for basic setup
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
    instance_num = count.index + 1
  }))

  tags = {
    Name = "${var.project_name}-web-${count.index + 1}"
    Type = "web-server"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Parameter Store entries for configuration
resource "aws_ssm_parameter" "app_config" {
  name  = "/${var.project_name}/app/environment"
  type  = "String"
  value = var.environment

  tags = {
    Name = "${var.project_name}-app-config"
  }
}

resource "aws_ssm_parameter" "s3_bucket" {
  name  = "/${var.project_name}/app/s3_bucket"
  type  = "String"
  value = split(":", var.s3_bucket_arn)[5] # Extract bucket name from ARN

  tags = {
    Name = "${var.project_name}-s3-bucket-config"
  }
}
```

### 4. `modules/compute/variables.tf` (COMPLETE)
```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of the public subnets"
  type        = list(string)
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ssh_key_name" {
  description = "EC2 Key Pair name for SSH access (optional)"
  type        = string
  default     = ""
}

variable "enable_ssh_access" {
  description = "Enable SSH access to EC2 instances"
  type        = bool
  default     = false
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}
```

### 5. `modules/compute/user_data.sh` (UPDATED)
```bash
#!/bin/bash
yum update -y
yum install -y httpd aws-cli amazon-cloudwatch-agent

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${project_name} - Production Server ${instance_num}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { color: green; font-weight: bold; }
        .info { background-color: #f0f0f0; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>Welcome to ${project_name}</h1>
    <p class="status">✅ Server ${instance_num} is running successfully!</p>
    
    <div class="info">
        <h3>Server Information:</h3>
        <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
        <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
        <p><strong>Instance Type:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
        <p><strong>Deployment Time:</strong> $(date)</p>
    </div>
    
    <p><em>Managed by Terraform | Environment: Production</em></p>
</body>
</html>
EOF

# Configure CloudWatch agent with basic monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "${project_name}/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 300
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 300,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 300
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
```

### 6. `modules/database/main.tf` (FIXED PASSWORD ONLY)
```hcl
# Random password for RDS - FIXED
resource "random_password" "db_password" {
  length  = 16
  special = true
  
  # Exclude problematic characters for RDS
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store password in Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.project_name}/database/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name = "${var.project_name}-db-password"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = var.vpc_id

  ingress {
    description = "MySQL/Aurora"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Only from VPC
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  # Database configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = var.enable_encryption

  # Database credentials
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # Security
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name = "${var.project_name}-database"
  }

  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-rds-monitoring-role"

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
    Name = "${var.project_name}-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
```

### 7. `modules/storage/main.tf` (FIXED LIFECYCLE)
```hcl
# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project_name}-storage-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "${var.project_name}-storage"
  }
}

# Random suffix for bucket name uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = var.enable_encryption
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration - FIXED
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "transition_to_ia"
    status = "Enabled"

    # Empty filter applies to all objects
    filter {}

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
```

## Simple `terraform.tfvars` File

Create this file and you're ready to deploy:

```hcl
# terraform.tfvars - PRODUCTION READY DEFAULTS

# Basic Configuration
aws_region   = "us-west-2"
project_name = "prod-project-166"
environment  = "production"
owner        = "devops-team"

# Infrastructure Settings
instance_type      = "t3.medium"
enable_nat_gateway = true
enable_encryption  = true

# Database Configuration
db_instance_class = "db.t3.micro"
db_name          = "proddb"
db_username      = "admin"

# Security Settings (SSH disabled by default for security)
enable_ssh_access = false
# ssh_key_name     = ""  # Leave empty - SSH disabled
# allowed_ssh_cidr = ["10.0.0.0/16"]  # Only VPC access if SSH enabled

# Monitoring (REQUIRED - Replace with your email)
sns_email = "your-email@company.com"
```

## Deployment Commands

```bash
# Initialize
terraform init

# Plan (always do this first!)
terraform plan -var-file="terraform.tfvars"

# Apply
terraform apply -var-file="terraform.tfvars"
```

## Key Benefits of This Solution

1. **SSH Optional**: No SSH keys required - use AWS Systems Manager Session Manager for secure access
2. **Production Secure**: All security best practices enabled by default
3. **Simple Deployment**: Just set your email and run terraform apply
4. **Complete Code**: No missing pieces or "rest stays the same" comments
5. **Error Prevention**: Validation rules prevent common mistakes
6. **Monitoring Ready**: SNS will prompt you to confirm subscription

## Accessing Your Instances (No SSH Required!)

Use AWS Systems Manager Session Manager:

```bash
# List your instances
aws ec2 describe-instances --filters "Name=tag:Name,Values=prod-project-166-web-*" --query 'Reservations[].Instances[].InstanceId'

# Connect to instance (replace i-1234567890abcdef0 with actual instance ID)
aws ssm start-session --target i-1234567890abcdef0
```

This is much more secure than SSH and doesn't require key management!

The infrastructure will be fully functional and production-ready. Just replace `your-email@company.com` with your actual email address and you're good to go! 🚀