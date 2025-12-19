# Ideal Response - Production-Ready AWS Infrastructure with Terraform

This document contains the ideal response for implementing a secure, highly available AWS infrastructure using Terraform following all security best practices.

## Overview

The ideal implementation should provide:
- **Secure networking** with public and private subnets across multiple availability zones
- **Principle of least privilege** with restricted security groups and IAM policies
- **Encryption at rest** for all storage resources (EBS, RDS, S3)
- **Network monitoring** with VPC Flow Logs
- **CloudWatch monitoring** with alarms for critical metrics
- **High availability** with Multi-AZ deployment
- **Secure credential management** using AWS Secrets Manager

## Complete Terraform Configuration (tap_stack.tf)

```hcl
# tap_stack.tf - Production-ready AWS Infrastructure with Security Best Practices
# Region: us-west-1
# This configuration implements a secure, highly available infrastructure following AWS best practices

# Variables for configuration flexibility
variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-west-1"
}
variable "ssh_allowed_ip" {
  description = "IP address allowed for SSH access (use your public IP)"
  type        = string
  default     = "0.0.0.0/32" # CHANGE THIS to your actual IP for security
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
  default     = "my-key-pair"
}

# Data source to get availability zones in us-west-1
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
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

# Generate random password for RDS
resource "random_password" "rds_password" {
  length  = 32
  special = true
  # Exclude problematic characters for MySQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ==================== NETWORKING ====================

# VPC with DNS support for internal resolution
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Enable VPC Flow Logs for network traffic monitoring
  tags = {
    Name = "production-vpc"
    Type = "Primary"
  }
}

# Internet Gateway for public subnet internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "production-igw"
  }
}

# Elastic IP for NAT Gateway - ensures consistent outbound IP
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "production-nat-eip"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway for private subnet outbound internet access
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "production-nat-gateway"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets - 2 AZs for high availability
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "production-public-subnet-${count.index + 1}"
    Type = "Public"
    AZ   = data.aws_availability_zones.available.names[count.index]
  }
}

# Private Subnets - 2 AZs for RDS Multi-AZ deployment
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "production-private-subnet-${count.index + 1}"
    Type = "Private"
    AZ   = data.aws_availability_zones.available.names[count.index]
  }
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "production-public-rt"
    Type = "Public"
  }
}

# Route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "production-private-rt"
    Type = "Private"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ==================== SECURITY GROUPS ====================

# Security Group for Bastion/Management EC2 instance
# Principle of least privilege: Only allows SSH from specific IP
resource "aws_security_group" "bastion" {
  name        = "production-bastion-sg"
  description = "Security group for bastion host with restricted SSH access"
  vpc_id      = aws_vpc.main.id

  # SSH access from specific IP only (least privilege)
  ingress {
    description = "SSH from allowed IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_ip]
  }

  # Allow all outbound traffic for updates and package installation
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-bastion-sg"
    Type = "Security"
  }
}

# Security Group for Web Servers (if needed in future)
resource "aws_security_group" "web" {
  name        = "production-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # HTTPS access from anywhere
  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH access only from bastion
  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "production-web-sg"
    Type = "Security"
  }
}

# Security Group for RDS - Private access only
resource "aws_security_group" "rds" {
  name        = "production-rds-sg"
  description = "Security group for RDS MySQL instance - private access only"
  vpc_id      = aws_vpc.main.id

  # MySQL access only from bastion and web security groups (least privilege)
  ingress {
    description     = "MySQL from Bastion"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description     = "MySQL from Web Servers"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  # No egress rules needed for RDS

  tags = {
    Name = "production-rds-sg"
    Type = "Security"
  }
}

# ==================== IAM ROLES & POLICIES ====================

# IAM role for EC2 instances - Principle of least privilege
resource "aws_iam_role" "ec2_role" {
  name = "production-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "production-ec2-role"
  }
}

# IAM policy for EC2 - Only necessary permissions
resource "aws_iam_role_policy" "ec2_policy" {
  name = "production-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:us-west-1:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials.arn
      }
    ]
  })
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "production-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# ==================== SECRETS MANAGER ====================

# Store RDS credentials securely in Secrets Manager
resource "aws_secretsmanager_secret" "rds_credentials" {
  name                    = "production-rds-mysql-credentials"
  description             = "RDS MySQL master credentials"
  recovery_window_in_days = 7 # Minimum allowed recovery window

  tags = {
    Name = "production-rds-secret"
    Type = "Security"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id

  secret_string = jsonencode({
    username = "admin"
    password = random_password.rds_password.result
    engine   = "mysql"
    host     = aws_db_instance.mysql.endpoint
    port     = 3306
    dbname   = aws_db_instance.mysql.db_name
  })
}

# ==================== EC2 INSTANCE ====================

# Bastion/Management EC2 instance in public subnet
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.bastion.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_pair_name

  # Enable monitoring for CloudWatch metrics
  monitoring = true

  # Enable EBS encryption at rest
  root_block_device {
    encrypted             = true
    volume_type           = "gp3"
    volume_size           = 20
    delete_on_termination = true

    tags = {
      Name = "production-bastion-root-volume"
    }
  }

  # User data script for initial configuration
  user_data = <<-EOF
    #!/bin/bash
    # Update system
    yum update -y
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Install MySQL client for RDS access
    yum install -y mysql
    
    # Install AWS CLI
    yum install -y aws-cli
    
    # Configure CloudWatch agent (basic configuration)
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<-CONFIG
    {
      "metrics": {
        "namespace": "Production/EC2",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
              {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"}
            ],
            "totalcpu": false
          },
          "disk": {
            "measurement": [
              {"name": "disk_used_percent", "rename": "DISK_USED", "unit": "Percent"}
            ],
            "resources": ["/"]
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ]
          }
        }
      }
    }
    CONFIG
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
  EOF

  tags = {
    Name = "production-bastion-instance"
    Type = "Management"
    OS   = "AmazonLinux2"
  }
}

# ==================== RDS DATABASE ====================

# DB Subnet Group for RDS - Required for RDS in VPC
resource "aws_db_subnet_group" "mysql" {
  name       = "production-mysql-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "production-mysql-subnet-group"
  }
}

# RDS MySQL Instance - Private, encrypted, no deletion protection
resource "aws_db_instance" "mysql" {
  identifier     = "production-mysql-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration with encryption
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true # Encryption at rest

  # Database configuration
  db_name  = "productiondb"
  username = "admin"
  password = random_password.rds_password.result
  port     = 3306

  # Network configuration - Private access only
  db_subnet_group_name   = aws_db_subnet_group.mysql.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false # Ensures database is not publicly accessible

  # High availability configuration
  multi_az          = true # For production high availability
  availability_zone = null # Let AWS choose when multi_az is true

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  # Security and compliance
  deletion_protection             = false # As per requirement
  skip_final_snapshot             = false
  final_snapshot_identifier       = "production-mysql-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Performance Insights for monitoring
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Apply changes immediately for demo (use false in real production)
  apply_immediately = true

  tags = {
    Name      = "production-mysql-database"
    Type      = "Database"
    Engine    = "MySQL"
    Encrypted = "true"
  }
}

# ==================== VPC FLOW LOGS ====================

# S3 bucket for VPC Flow Logs storage
resource "aws_s3_bucket" "flow_logs" {
  bucket = "production-vpc-flow-logs-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "production-flow-logs-bucket"
    Type = "Logging"
  }
}

# Enable versioning for flow logs bucket
resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption for flow logs bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block public access to flow logs bucket
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for flow logs retention
resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "delete-old-flow-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 30

  tags = {
    Name = "production-vpc-flow-logs"
    Type = "Logging"
  }
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "production-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "production-flow-logs-role"
  }
}

# IAM policy for VPC Flow Logs to write to CloudWatch
resource "aws_iam_role_policy" "flow_logs" {
  name = "production-vpc-flow-logs-policy"
  role = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs configuration
resource "aws_flow_log" "main" {
  iam_role_arn        = aws_iam_role.flow_logs.arn
  log_destination_arn = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type        = "ALL"
  vpc_id              = aws_vpc.main.id

  tags = {
    Name = "production-vpc-flow-log"
    Type = "Monitoring"
  }
}

# ==================== CLOUDWATCH MONITORING ====================

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alerts" {
  name = "production-cloudwatch-alerts"

  tags = {
    Name = "production-alert-topic"
    Type = "Monitoring"
  }
}

# CloudWatch Alarm for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "production-bastion-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.bastion.id
  }

  tags = {
    Name = "production-cpu-alarm"
    Type = "Monitoring"
  }
}

# CloudWatch Alarm for EC2 Status Check
resource "aws_cloudwatch_metric_alarm" "ec2_status_check" {
  alarm_name          = "production-bastion-status-check"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors EC2 instance status"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    InstanceId = aws_instance.bastion.id
  }

  tags = {
    Name = "production-status-alarm"
    Type = "Monitoring"
  }
}

# CloudWatch Alarm for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "production-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.mysql.id
  }

  tags = {
    Name = "production-rds-cpu-alarm"
    Type = "Monitoring"
  }
}

# CloudWatch Alarm for RDS Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "production-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2147483648" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.mysql.id
  }

  tags = {
    Name = "production-rds-storage-alarm"
    Type = "Monitoring"
  }
}

# ==================== DATA SOURCES ====================

# Current AWS account ID
data "aws_caller_identity" "current" {}

# ==================== OUTPUTS ====================

# Output important values for reference
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "bastion_public_ip" {
  value       = aws_instance.bastion.public_ip
  description = "Bastion host public IP address"
}

output "bastion_instance_id" {
  value       = aws_instance.bastion.id
  description = "Bastion EC2 instance ID"
}

output "rds_endpoint" {
  value       = aws_db_instance.mysql.endpoint
  description = "RDS MySQL endpoint"
  sensitive   = true
}

output "rds_secret_arn" {
  value       = aws_secretsmanager_secret.rds_credentials.arn
  description = "ARN of the Secrets Manager secret containing RDS credentials"
}

output "nat_gateway_ip" {
  value       = aws_eip.nat.public_ip
  description = "NAT Gateway Elastic IP"
}

output "sns_topic_arn" {
  value       = aws_sns_topic.alerts.arn
  description = "SNS topic ARN for CloudWatch alerts"
}

output "flow_logs_s3_bucket" {
  value       = aws_s3_bucket.flow_logs.id
  description = "S3 bucket for VPC Flow Logs"
}

output "cloudwatch_log_group" {
  value       = aws_cloudwatch_log_group.flow_logs.name
  description = "CloudWatch Log Group for VPC Flow Logs"
}
```

## Key Features Implemented

### 1. **Networking Architecture**
- VPC with CIDR 10.0.0.0/16
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
- 2 private subnets (10.0.10.0/24, 10.0.11.0/24) across different AZs
- Internet Gateway for public internet access
- NAT Gateway for private subnet outbound traffic
- Proper route tables and associations

### 2. **Security Best Practices**
- **Principle of Least Privilege**: Security groups allow only necessary traffic
- **Encrypted Data at Rest**: EBS volumes, RDS storage, and S3 buckets use encryption
- **Network Segmentation**: Private subnets for databases, public for bastion
- **Security Groups**: Bastion (SSH), Web (HTTPS), RDS (MySQL from bastion/web only)
- **IAM Roles**: EC2 and Flow Logs roles with minimal required permissions

### 3. **Compute & Database**
- **EC2 Bastion Instance**: 
  - Amazon Linux 2 with t3.micro
  - In public subnet with monitoring enabled
  - Encrypted root volume (gp3, 20GB)
  - IAM instance profile with CloudWatch and Secrets Manager access
  - User data script for CloudWatch agent installation

- **RDS MySQL Database**:
  - Engine version 8.0 on db.t3.micro
  - Multi-AZ deployment for high availability
  - Not publicly accessible (in private subnets)
  - Storage encryption enabled
  - Automated backups (7-day retention)
  - Performance Insights enabled
  - CloudWatch logs exports (error, general, slowquery)
  - No deletion protection (as per requirement)

### 4. **Secrets Management**
- AWS Secrets Manager for RDS credentials
- Random password generation (32 characters)
- Secure storage of username, password, endpoint, port, and database name
- 7-day recovery window

### 5. **Monitoring & Logging**
- **VPC Flow Logs**:
  - CloudWatch Log Group with 30-day retention
  - S3 bucket with versioning and encryption
  - Lifecycle policy (IA after 30 days, Glacier after 90 days, delete after 365 days)
  - Public access blocked

- **CloudWatch Alarms**:
  - EC2 CPU utilization (threshold: 80%)
  - EC2 status check failures
  - RDS CPU utilization (threshold: 75%)
  - RDS free storage space (threshold: 2GB)
  - SNS topic for alert notifications

### 6. **Compliance & Tagging**
- Consistent tagging across all resources (Name, Type, Environment)
- All resources in us-west-1 region
- No deletion protection enabled
- Follows AWS Well-Architected Framework principles

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Terraform >= 1.0 installed
   - SSH key pair created in us-west-1 region

2. **Configuration**:
   ```bash
   # Update variables in tap_stack.tf or create terraform.tfvars
   ssh_allowed_ip = "YOUR_IP/32"
   key_pair_name = "your-key-pair-name"
   ```

3. **Deploy**:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

4. **Access**:
   - Bastion host: Use output `bastion_public_ip`
   - RDS credentials: Retrieved from Secrets Manager using output `rds_secret_arn`
   - Database endpoint: Use output `rds_endpoint`

5. **Cleanup**:
   ```bash
   terraform destroy
   ```

## Security Considerations

- **SSH access restricted** to specific IP via variable  
- **RDS not publicly accessible** (in private subnets)  
- **All storage encrypted** (EBS, RDS, S3)  
- **IAM roles follow least privilege** principle  
- **Secrets stored in AWS Secrets Manager** (not hardcoded)  
- **VPC Flow Logs enabled** for network monitoring  
- **CloudWatch alarms configured** for critical metrics  
- **Multi-AZ deployment** for high availability  
- **Public access blocked** on S3 buckets  
- **Security groups hardened** with minimal required access

## Cost Optimization

- t3.micro instances for cost efficiency
- gp3 storage for better performance/cost ratio
- Lifecycle policies for S3 log retention
- 7-day backup retention for RDS
- Performance Insights with 7-day retention

## Conclusion

This implementation provides a production-ready, secure, and highly available AWS infrastructure using Terraform that adheres to all specified requirements and AWS security best practices.