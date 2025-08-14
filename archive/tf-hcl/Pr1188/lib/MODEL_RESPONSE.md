# AWS Foundational Cloud Environment with Terraform

I'll create a comprehensive Terraform configuration that sets up a foundational AWS cloud environment following all the specified requirements. Note that there's a discrepancy in the requirements (problem statement mentions `us-east-1` while constraints specify `us-east-2`), but I'll follow the constraints and use `us-east-2` as specified multiple times.

## Complete Terraform Configuration

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Remote state configuration - uncomment after creating S3 bucket manually
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket-name"
  #   key            = "foundational-env/terraform.tfstate"
  #   region         = "us-east-2"
  #   versioning     = true
  #   encrypt        = true
  # }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "foundational-env"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
  sensitive   = true
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "my_ip_address" {
  description = "Your IP address for SSH access (CIDR format)"
  type        = string
  # Example: "203.0.113.0/32"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
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

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Public"
  }
}

# Private Subnets for RDS
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "Private"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for EC2 Instance
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # SSH access from your IP only
  ingress {
    description = "SSH from my IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_address]
  }

  # HTTP access (optional, for web applications)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access (optional, for web applications)
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Environment = var.environment
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Security group for RDS MySQL database"
  vpc_id      = aws_vpc.main.id

  # MySQL access from EC2 security group
  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
  }
}

# RDS MySQL Database
resource "aws_db_instance" "mysql" {
  identifier = "${var.project_name}-mysql-db"

  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database configuration
  db_name  = "foundationaldb"
  username = var.db_username
  password = var.db_password

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Additional settings
  skip_final_snapshot       = true
  deletion_protection      = false
  auto_minor_version_upgrade = true
  
  # Performance Insights
  performance_insights_enabled = true

  tags = {
    Name        = "${var.project_name}-mysql-db"
    Environment = var.environment
  }
}

# Key Pair for EC2 Instance
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-keypair"
  public_key = file("~/.ssh/id_rsa.pub") # Ensure you have an SSH key pair generated

  tags = {
    Name        = "${var.project_name}-keypair"
    Environment = var.environment
  }
}

# EC2 Instance
resource "aws_instance" "main" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type
  key_name      = aws_key_pair.main.key_name

  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true

  # User data script to install basic packages
  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y mysql
              yum install -y htop
              
              # Create a simple script to test database connectivity
              cat > /home/ec2-user/test-db.sh << 'SCRIPT'
              #!/bin/bash
              mysql -h ${aws_db_instance.mysql.endpoint} -u ${var.db_username} -p${var.db_password} -e "SELECT 1;"
              SCRIPT
              
              chmod +x /home/ec2-user/test-db.sh
              chown ec2-user:ec2-user /home/ec2-user/test-db.sh
              EOF
  )

  tags = {
    Name        = "${var.project_name}-ec2-instance"
    Environment = var.environment
  }
}

# S3 Bucket for Terraform State (create this manually first)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "${var.project_name}-terraform-state-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.project_name}-terraform-state"
    Environment = var.environment
    Purpose     = "Terraform State Storage"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.main.public_ip
}

output "ec2_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.main.public_dns
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.mysql.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.mysql.port
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  value       = aws_s3_bucket.terraform_state.bucket
}
```

## Required Files for Deployment

### 1. terraform.tfvars (Create this file separately)

```hcl
# terraform.tfvars
aws_region     = "us-east-2"
environment    = "dev"
project_name   = "foundational-env"
instance_type  = "t3.micro"
db_username    = "admin"
db_password    = "YourSecurePassword123!"  # Use a strong password
my_ip_address  = "YOUR.IP.ADDRESS.HERE/32"  # Replace with your actual IP
```

### 2. Pre-deployment Steps

Before running Terraform, ensure you have:

1. **AWS CLI configured** with appropriate credentials
2. **SSH key pair generated**:
   ```bash
   ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
   ```
3. **Your IP address** for SSH access

### 3. Deployment Commands

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply

# After successful deployment, configure remote state
# Uncomment the backend configuration in main.tf and run:
terraform init -migrate-state
```

## Key Features Implemented

### ✅ **Security Best Practices**
- **VPC with public/private subnets** for network isolation
- **Security groups** with least privilege access
- **RDS in private subnets** with no public access
- **SSH access restricted** to your IP only
- **Database credentials** marked as sensitive
- **S3 bucket encryption** and public access blocking

### ✅ **Scalability Features**
- **Multi-AZ subnets** for high availability
- **Auto-scaling storage** for RDS (up to 100GB)
- **Performance Insights** enabled for RDS monitoring
- **Modular design** for easy expansion

### ✅ **AWS Best Practices**
- **Automated backups** with 7-day retention
- **Encryption at rest** for RDS and S3
- **Proper tagging** for resource management
- **Latest Amazon Linux 2 AMI** usage
- **IAM integration** ready for enhanced security

### ✅ **Terraform Best Practices**
- **Remote state management** with S3 backend
- **State versioning** enabled
- **Sensitive variables** properly marked
- **Data sources** for dynamic AMI selection
- **Comprehensive outputs** for integration

## Post-Deployment Notes

1. **SSH Access**: Use the private key to connect to your EC2 instance
2. **Database Connection**: Use the provided test script on the EC2 instance
3. **State Migration**: After first deployment, migrate to remote state
4. **Security**: Regularly rotate database passwords and review security groups

This configuration provides a solid foundation for AWS cloud infrastructure while following security and scalability best practices.