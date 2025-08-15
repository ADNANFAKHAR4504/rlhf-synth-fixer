I'll create a secure AWS environment using Terraform that meets all your requirements. Let me break this down into the required files with proper security configurations.

## File Structure

```
root/
│
└── lib/
    ├── provider.tf
    └── tap_stack.tf
```

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "tap-stack"
      ManagedBy   = "terraform"
    }
  }
}
```

## lib/tap_stack.tf

```hcl
# Data sources for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# KMS Key for encryption
resource "aws_kms_key" "tap_key" {
  description             = "KMS key for TAP stack encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "tap-stack-key"
  }
}

resource "aws_kms_alias" "tap_key_alias" {
  name          = "alias/tap-stack-key"
  target_key_id = aws_kms_key.tap_key.key_id
}

data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "tap-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "tap-igw"
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
    Name = "tap-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "tap-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = 2

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "tap-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "tap-nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "tap-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = 2

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "tap-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "bastion" {
  name_prefix = "tap-bastion-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for bastion host"

  ingress {
    description = "SSH from trusted networks"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # In production, restrict this to your IP ranges
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tap-bastion-sg"
  }
}

resource "aws_security_group" "private_instances" {
  name_prefix = "tap-private-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for private instances"

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "tap-private-sg"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "tap-rds-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS database"

  ingress {
    description     = "MySQL/Aurora from private instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.private_instances.id]
  }

  tags = {
    Name = "tap-rds-sg"
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "tap-ec2-role"

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
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "tap-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "tap-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Bastion Host
resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.bastion.id]
  subnet_id              = aws_subnet.public[0].id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              EOF
  )

  tags = {
    Name = "tap-bastion"
    Type = "Bastion"
  }
}

# Private EC2 Instances
resource "aws_instance" "private" {
  count = 2

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.private_instances.id]
  subnet_id              = aws_subnet.private[count.index].id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              EOF
  )

  tags = {
    Name = "tap-private-${count.index + 1}"
    Type = "Private"
  }
}

# Key Pair for EC2 instances
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "main" {
  key_name   = "tap-key"
  public_key = tls_private_key.main.public_key_openssh

  tags = {
    Name = "tap-key-pair"
  }
}

# Store private key in AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "private_key" {
  name  = "/tap/ec2/private-key"
  type  = "SecureString"
  value = tls_private_key.main.private_key_pem

  tags = {
    Name = "tap-private-key"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "tap-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "tap-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "tap-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.tap_key.arn

  db_name  = "tapdb"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "tap-database"
  }
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store DB password in AWS Systems Manager Parameter Store
resource "aws_ssm_parameter" "db_password" {
  name  = "/tap/rds/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name = "tap-db-password"
  }
}

# S3 Bucket with encryption
resource "aws_s3_bucket" "main" {
  bucket = "tap-stack-bucket-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "tap-main-bucket"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.tap_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# VPC Flow Logs
resource "aws_flow_log" "vpc" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name              = "/aws/vpc/flowlogs"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.tap_key.arn
}

resource "aws_iam_role" "flow_log" {
  name = "tap-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "tap-flow-log-policy"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  count = length(aws_instance.private)

  alarm_name          = "tap-high-cpu-${count.index + 1}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.private[count.index].id
  }

  tags = {
    Name = "tap-high-cpu-alarm-${count.index + 1}"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "tap-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name = "tap-rds-cpu-alarm"
  }
}

# Route 53 Private Hosted Zone and DNS Logging
resource "aws_route53_zone" "private" {
  name = "tap.internal"

  vpc {
    vpc_id = aws_vpc.main.id
  }

  tags = {
    Name = "tap-private-zone"
  }
}

resource "aws_cloudwatch_log_group" "route53_dns" {
  name              = "/aws/route53/tap.internal"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.tap_key.arn
}

resource "aws_route53_query_log" "main" {
  depends_on = [aws_cloudwatch_log_group.route53_dns]

  destination_arn = aws_cloudwatch_log_group.route53_dns.arn
  zone_id         = aws_route53_zone.private.zone_id
}

# DNS Records
resource "aws_route53_record" "bastion" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "bastion"
  type    = "A"
  ttl     = 300
  records = [aws_instance.bastion.private_ip]
}

resource "aws_route53_record" "private" {
  count = length(aws_instance.private)

  zone_id = aws_route53_zone.private.zone_id
  name    = "app-${count.index + 1}"
  type    = "A"
  ttl     = 300
  records = [aws_instance.private[count.index].private_ip]
}

resource "aws_route53_record" "database" {
  zone_id = aws_route53_zone.private.zone_id
  name    = "database"
  type    = "CNAME"
  ttl     = 300
  records = [aws_db_instance.main.endpoint]
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host"
  value       = aws_instance.bastion.public_ip
}

output "private_instance_ips" {
  description = "Private IPs of the private instances"
  value       = aws_instance.private[*].private_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.tap_key.key_id
}

output "private_key_ssm_parameter" {
  description = "SSM parameter name for EC2 private key"
  value       = aws_ssm_parameter.private_key.name
}
```

## Architecture Overview

This Terraform configuration creates a secure AWS environment with the following components:

### **Security Features**
- **KMS Encryption**: All S3 buckets and RDS instances use customer-managed KMS keys
- **IAM Least Privilege**: Minimal permissions for EC2 instances and flow logs
- **Network Segmentation**: Public/private subnet separation with NAT gateways
- **Security Groups**: Restrictive inbound rules, bastion-only SSH access

### **Network Architecture**
- **VPC**: 10.0.0.0/16 CIDR with DNS resolution enabled
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24 (for bastion and NAT gateways)
- **Private Subnets**: 10.0.10.0/24, 10.0.11.0/24 (for EC2 instances and RDS)
- **Multi-AZ**: Resources distributed across two availability zones

### **Compute Resources**
- **Bastion Host**: Single t3.micro in public subnet for SSH access
- **Private Instances**: Two t3.micro instances in private subnets
- **RDS**: MySQL 8.0 with 7-day backup retention and encryption

### **Monitoring & Logging**
- **VPC Flow Logs**: All network traffic logged to CloudWatch
- **CloudWatch Alarms**: CPU monitoring for EC2 and RDS
- **Route 53 DNS Logging**: Private zone query logging
- **Log Encryption**: All logs encrypted with KMS

### **Key Security Implementations**

1. **Encryption at Rest**: KMS encryption for S3, RDS, and CloudWatch logs
2. **Network Security**: Private subnets with NAT gateway internet access
3. **Access Control**: Bastion host as single entry point for SSH
4. **Monitoring**: Comprehensive logging and alerting
5. **Secrets Management**: Database passwords and SSH keys in SSM Parameter Store

### **Deployment Instructions**

1. Navigate to the `lib/` directory
2. Initialize Terraform: `terraform init`
3. Plan deployment: `terraform plan`
4. Apply configuration: `terraform apply`

The infrastructure follows AWS Well-Architected Framework principles and implements defense-in-depth security strategies throughout the stack.