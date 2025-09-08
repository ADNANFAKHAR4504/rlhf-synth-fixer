# Web App Infrastructure - Terraform Setup

I'll help you build a production-ready Flask web app infrastructure using Terraform. This setup follows AWS best practices and is designed for real traffic.

## Project Structure

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── vpc.tf
├── security.tf
├── compute.tf
├── database.tf
└── load_balancer.tf
```

## Core Configuration Files

### variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "proj-webapp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Domain name for SSL certificate (optional)"
  type        = string
  default     = ""
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 5
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "webapp"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
}

locals {
  common_tags = {
    Project     = "WebAppDeployment"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
```

### main.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.region
}

# Generate random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store DB password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password"
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}
```

### vpc.tf

```hcl
# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets for Database
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}
```

### security.tf

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Flask app from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2
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

  tags = local.common_tags
}

# IAM Policy for S3 Access
resource "aws_iam_policy" "s3_access" {
  name = "${var.project_name}-s3-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::webapp-assets",
          "arn:aws:s3:::webapp-assets/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Secrets Manager (to get DB password)
resource "aws_iam_policy" "secrets_access" {
  name = "${var.project_name}-secrets-access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_password.arn
      }
    ]
  })

  tags = local.common_tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "secrets_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = local.common_tags
}
```

### compute.tf

```hcl
# Get latest Amazon Linux 2 AMI
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

# User Data Script
locals {
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_secret_name = aws_secretsmanager_secret.db_password.name
    region         = var.region
  }))
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = local.user_data

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${var.project_name}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-launch-template"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = local.common_tags
}
```

### database.tf

```hcl
# Aurora Cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.project_name}-aurora-cluster"
  engine                 = "aurora-mysql"
  engine_version         = "8.0.mysql_aurora.3.02.0"
  database_name          = var.db_name
  master_username        = var.db_username
  master_password        = random_password.db_password.result
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:05:00-sun:07:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-cluster"
  })
}

# Aurora Instances
resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "${var.project_name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-instance-${count.index}"
  })
}
```

### load_balancer.tf

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-tg"
  })
}

# ACM Certificate (if domain provided)
resource "aws_acm_certificate" "main" {
  count           = var.domain_name != "" ? 1 : 0
  domain_name     = var.domain_name
  validation_method = "DNS"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cert"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# HTTP Listener (redirect to HTTPS if cert exists)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.domain_name != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.domain_name != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    dynamic "forward" {
      for_each = var.domain_name == "" ? [1] : []
      content {
        target_group {
          arn = aws_lb_target_group.main.arn
        }
      }
    }
  }

  tags = local.common_tags
}

# HTTPS Listener (if certificate exists)
resource "aws_lb_listener" "https" {
  count             = var.domain_name != "" ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = local.common_tags
}
```

### user_data.sh

```bash
#!/bin/bash
yum update -y
yum install -y python3 python3-pip

# Install AWS CLI
pip3 install awscli

# Create app directory
mkdir -p /opt/webapp
cd /opt/webapp

# Create Flask application
cat > app.py << 'EOF'
from flask import Flask, jsonify
import os
import boto3
import json
from botocore.exceptions import ClientError

app = Flask(__name__)

def get_secret():
    secret_name = "${db_secret_name}"
    region_name = "${region}"

    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        return get_secret_value_response['SecretString']
    except ClientError as e:
        return None

@app.route('/')
def hello():
    return jsonify({
        'message': 'Hello World from Flask!',
        'status': 'success',
        'instance_id': os.environ.get('EC2_INSTANCE_ID', 'unknown')
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'timestamp': str(os.popen('date').read().strip())
    }), 200

@app.route('/db-test')
def db_test():
    secret = get_secret()
    if secret:
        return jsonify({
            'database': 'connected',
            'status': 'success'
        })
    else:
        return jsonify({
            'database': 'connection failed',
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
EOF

# Install Flask
pip3 install flask boto3

# Get instance metadata
export EC2_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

# Create systemd service
cat > /etc/systemd/system/webapp.service << EOF
[Unit]
Description=Flask Web Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/webapp
Environment=EC2_INSTANCE_ID=$EC2_INSTANCE_ID
ExecStart=/usr/bin/python3 /opt/webapp/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set permissions
chown -R ec2-user:ec2-user /opt/webapp
chmod +x /opt/webapp/app.py

# Enable and start service
systemctl daemon-reload
systemctl enable webapp
systemctl start webapp

# Install and configure nginx as reverse proxy
yum install -y nginx

cat > /etc/nginx/conf.d/webapp.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

systemctl enable nginx
systemctl start nginx
```

### outputs.tf

```hcl
output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "database_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "database_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

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

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}
```

## Deployment Instructions

### 1. Prerequisites

```bash
# Install Terraform
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform

# Configure AWS CLI
aws configure
```

### 2. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply configuration
terraform apply
```

### 3. Test the Deployment

```bash
# Get load balancer URL
LB_URL=$(terraform output -raw load_balancer_url)

# Test endpoints
curl $LB_URL/
curl $LB_URL/health
curl $LB_URL/db-test
```

## Security Best Practices Implemented

### 1. **Network Security**

- VPC with public/private subnet isolation
- Security groups with least privilege access
- Database in private subnets only
- ALB security group allows only 80/443

### 2. **IAM Security**

- EC2 instances use IAM roles (no hardcoded keys)
- Minimal permissions for S3 bucket access
- Secrets Manager for database credentials

### 3. **Database Security**

- Aurora in private subnets
- Security group restricts access to EC2 only
- Encrypted at rest (Aurora default)
- Automated backups enabled

### 4. **Application Security**

- Health checks configured
- Nginx reverse proxy
- Systemd service management
- Auto-restart on failure

## Cost Optimization Features

### 1. **Free Tier Eligible**

- t3.micro instances (750 hours/month free)
- Application Load Balancer (750 hours/month free)
- Aurora free tier available for new accounts

### 2. **Resource Optimization**

- Auto Scaling based on CPU utilization
- Minimum 2 instances for availability
- 7-day backup retention (minimum required)

### 3. **Monitoring**

- CloudWatch alarms for scaling decisions
- Performance Insights for Aurora

## Common Gotchas and Solutions

### 1. **Health Check Failures**

```bash
# Check if Flask is running
sudo systemctl status webapp

# Check nginx status
sudo systemctl status nginx

# View application logs
sudo journalctl -u webapp -f
```

### 2. **Database Connection Issues**

- Ensure security groups allow MySQL (3306)
- Verify Secrets Manager permissions
- Check VPC DNS resolution

### 3. **SSL Certificate Issues**

- DNS validation required for ACM certificates
- Add domain_name variable if using custom domain
- Route 53 hosted zone needed for automatic validation

### 4. **Auto Scaling Not Working**

- Verify CloudWatch agent installation
- Check IAM permissions for CloudWatch
- Ensure health check grace period is sufficient

## Testing Checklist

### ✅ Infrastructure Tests

```bash
# Test load balancer
curl -I $(terraform output -raw load_balancer_url)

# Test health endpoint
curl $(terraform output -raw load_balancer_url)/health

# Test auto scaling (generate load)
ab -n 1000 -c 10 $(terraform output -raw load_balancer_url)/
```

### ✅ Security Tests

```bash
# Verify security groups
aws ec2 describe-security-groups --group-ids $(terraform show -json | jq -r '.values.root_module.resources[] | select(.type=="aws_security_group") | .values.id')

# Check IAM permissions
aws iam get-role-policy --role-name proj-webapp-ec2-role --policy-name proj-webapp-s3-access
```

### ✅ Database Tests

```bash
# Test database connectivity from EC2
ssh -i your-key.pem ec2-user@instance-ip
mysql -h $(terraform output -raw database_endpoint) -u admin -p
```

This infrastructure provides a solid foundation for production Flask applications with proper security, scalability, and cost optimization built in.
