# Terraform AWS Infrastructure - Complete Solution

This is a single-file Terraform configuration (`tap_stack.tf`) that implements a complete AWS infrastructure with VPC, EC2 instances, RDS PostgreSQL database, S3 storage with KMS encryption, IAM roles, and CloudWatch monitoring.

## Complete Terraform Configuration

**File: `lib/tap_stack.tf`**

```hcl
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider configuration
provider "aws" {
  region = "us-west-2"
}

# Variables
variable "project" {
  description = "Project name"
  type        = string
  default     = "my-project"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner email"
  type        = string
  default     = "owner@example.com"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/32" # Example safe CIDR - replace with your IP
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 1
}

variable "db_username" {
  description = "RDS database username"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "RDS database password"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!" # Change this in production
}

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "alerts@example.com"
}

# Locals
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Owner       = var.owner
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project}-public-subnet-1"
    Type = "Public"
  })
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-west-2b"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project}-public-subnet-2"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.101.0/24"
  availability_zone = "us-west-2a"

  tags = merge(local.common_tags, {
    Name = "${var.project}-private-subnet-1"
    Type = "Private"
  })
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.102.0/24"
  availability_zone = "us-west-2b"

  tags = merge(local.common_tags, {
    Name = "${var.project}-private-subnet-2"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat_1" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project}-nat-eip-1"
  })
}

resource "aws_eip" "nat_2" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project}-nat-eip-2"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = merge(local.common_tags, {
    Name = "${var.project}-nat-1"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = merge(local.common_tags, {
    Name = "${var.project}-nat-2"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-public-rt"
  })
}

resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_1.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-private-rt-1"
  })
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_2.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-private-rt-2"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 10

  tags = merge(local.common_tags, {
    Name = "${var.project}-s3-kms"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.project}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# S3 Bucket
resource "aws_s3_bucket" "main" {
  bucket = "${var.project}-${var.environment}-data-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name = "${var.project}-s3-bucket"
  })
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for EC2
resource "aws_iam_role" "ec2" {
  name = "${var.project}-ec2-role"

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

  tags = local.common_tags
}

# IAM Policy for EC2
resource "aws_iam_policy" "ec2" {
  name        = "${var.project}-ec2-policy"
  description = "Policy for EC2 instances to access S3 and CloudWatch"

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
          aws_s3_bucket.main.arn,
          "${aws_s3_bucket.main.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2.arn
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "${var.project}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = local.common_tags
}

# Security Groups
resource "aws_security_group" "ec2" {
  name        = "${var.project}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-ec2-sg"
  })
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

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

  tags = merge(local.common_tags, {
    Name = "${var.project}-rds-sg"
  })
}

# EC2 Instances
resource "aws_instance" "main" {
  count                  = var.instance_count
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = count.index % 2 == 0 ? aws_subnet.private_1.id : aws_subnet.private_2.id
  iam_instance_profile   = aws_iam_instance_profile.ec2.name
  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = <<-EOF
    #!/bin/bash
    # Install CloudWatch Logs agent
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch agent
    cat <<EOC > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    {
      "metrics": {
        "namespace": "${var.project}",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}
            ],
            "totalcpu": false,
            "metrics_collection_interval": 60
          },
          "mem": {
            "measurement": [
              {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
            ],
            "metrics_collection_interval": 60
          }
        }
      },
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "/aws/ec2/${var.project}",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      }
    }
    EOC
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
      -s
  EOF

  tags = merge(local.common_tags, {
    Name = "${var.project}-ec2-${count.index + 1}"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = merge(local.common_tags, {
    Name = "${var.project}-db-subnet-group"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  publicly_accessible = false
  multi_az            = true

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project}-rds"
  })
}

# SNS Topic
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"

  tags = merge(local.common_tags, {
    Name = "${var.project}-sns-topic"
  })
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  count               = var.instance_count
  alarm_name          = "${var.project}-ec2-${count.index + 1}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors EC2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.main[count.index].id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${var.project}-ec2-${count.index + 1}-cpu-alarm"
  })
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.main[*].id
}

# Optional validation helper
resource "null_resource" "validate" {
  provisioner "local-exec" {
    command = "echo 'Run: terraform validate && terraform plan to verify configuration'"
  }
}
```

## Usage Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Validate Configuration

```bash
terraform validate
```

### 3. Format Code

```bash
terraform fmt
```

### 4. Plan Deployment

```bash
terraform plan
```

### 5. Deploy Infrastructure

```bash
terraform apply
```

### 6. View Outputs

```bash
terraform output
```

### 7. Destroy Resources

```bash
terraform destroy
```

## Key Features

### Network Architecture
- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: 2 subnets (10.0.1.0/24, 10.0.2.0/24) in us-west-2a and us-west-2b
- **Private Subnets**: 2 subnets (10.0.101.0/24, 10.0.102.0/24) in us-west-2a and us-west-2b
- **Internet Gateway**: Provides internet access to public subnets
- **NAT Gateways**: 2 NAT gateways (one per AZ) for private subnet internet access
- **Route Tables**: Separate route tables for public and private subnets

### Storage & Encryption
- **S3 Bucket**: Versioned bucket with KMS encryption
- **KMS Key**: Customer-managed key for S3 encryption
- **Public Access Block**: All four settings enabled to prevent public access

### Compute & Database
- **EC2 Instances**: Configurable count, deployed in private subnets across AZs
- **IAM Instance Profile**: Grants EC2 instances access to S3 and CloudWatch
- **RDS PostgreSQL**: Multi-AZ deployment in private subnets with 7-day backup retention
- **Security Groups**: Restrictive rules (SSH from specific CIDR, PostgreSQL only from EC2)

### Monitoring & Alerts
- **CloudWatch Alarms**: CPU utilization monitoring (>70% threshold)
- **SNS Topic**: Email notifications for alarms
- **CloudWatch Logs**: EC2 instances configured to send logs via user_data script

### Security Features
- Private subnet deployment for EC2 and RDS
- IAM roles with least privilege access
- KMS encryption for S3
- Security groups with restrictive rules
- Multi-AZ deployment for high availability
- No Retain policies (all resources can be destroyed cleanly)

## Variables

All variables have sensible defaults and can be customized:

- `project`: Project name (default: "my-project")
- `environment`: Environment name (default: "dev")
- `owner`: Owner email (default: "owner@example.com")
- `allowed_ssh_cidr`: CIDR for SSH access (default: "203.0.113.0/32")
- `instance_type`: EC2 instance type (default: "t3.micro")
- `instance_count`: Number of EC2 instances (default: 1)
- `db_username`: Database username (default: "dbadmin")
- `db_password`: Database password (sensitive, default: "ChangeMe123!")
- `alert_email`: Email for alerts (default: "alerts@example.com")

## Testing

### Unit Tests
Run unit tests to validate infrastructure code structure:
```bash
npm run test:unit
```

### Integration Tests
After deployment, run integration tests to validate deployed resources:
```bash
npm run test:integration
```

## Notes

1. All resources are tagged with Project, Environment, and Owner for easy identification
2. The configuration uses explicit availability zones (us-west-2a, us-west-2b) as required
3. No retain policies are set - all resources can be destroyed cleanly
4. The configuration is in a single file (tap_stack.tf) as specified
5. RDS has `skip_final_snapshot = true` and `deletion_protection = false` for easy cleanup
6. The db_password variable is marked as sensitive
7. CloudWatch agent is installed via user_data script on EC2 instances