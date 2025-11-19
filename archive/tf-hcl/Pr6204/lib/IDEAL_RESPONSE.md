
# main.tf

```hcl

# main.tf 
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}


# Secrets Manager for RDS password
resource "random_password" "rds_password" {
  length           = 32
  special          = true
  override_special = "!#$%&()*+,-.:;<=>?[]^{}|~"
}

resource "aws_secretsmanager_secret" "rds_password" {
  name_prefix = "rds-master-password-"
  description = "RDS master password for PostgreSQL database"

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "rds_password" {
  secret_id     = aws_secretsmanager_secret.rds_password.id
  secret_string = random_password.rds_password.result
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Type        = "Public"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${count.index + 1}"
    Type        = "Private"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-nat-eip-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-gateway-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }

  depends_on = [aws_internet_gateway.main]
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
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-${count.index + 1}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"

  ingress {
    description     = "App port from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for RDS PostgreSQL"

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-rds-sg"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb1"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-tg-new"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name        = "${var.project_name}-tg-new"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2" {
  name_prefix = "${var.project_name}-ec2-role-"

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
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# IAM Role Policy for EC2 to access Secrets Manager
resource "aws_iam_role_policy" "ec2_secrets" {
  name_prefix = "ec2-secrets-policy-"
  role        = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_password.arn
      }
    ]
  })
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "${var.project_name}-ec2-profile-"
  role        = aws_iam_role.ec2.name

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.medium"

  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Update system
    yum update -y
    
    # Install Node.js
    yum install -y nodejs npm
    
    # Create app directory
    mkdir -p /opt/app
    cd /opt/app
    
    # Create simple Node.js app
    cat > app.js <<'EOA'
    const http = require('http');
    const port = 3000;

    const server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('OK');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html');
        res.end('<h1>Hello from AWS!</h1>');
      }
    });

    server.listen(port, () => {
      console.log(`Server running on port $${port}`);
    });
    EOA
    
    # Create systemd service
    cat > /etc/systemd/system/nodeapp.service <<'EOS'
    [Unit]
    Description=Node.js Application
    After=network.target

    [Service]
    Type=simple
    User=ec2-user
    WorkingDirectory=/opt/app
    ExecStart=/usr/bin/node app.js
    Restart=always
    RestartSec=10

    [Install]
    WantedBy=multi-user.target
    EOS
    
    # Start the application
    systemctl daemon-reload
    systemctl enable nodeapp.service
    systemctl start nodeapp.service
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-instance"
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name_prefix               = "${var.project_name}-asg-"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = 2
  max_size                  = 10
  desired_capacity          = 2

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "Terraform"
    propagate_at_launch = true
  }
}

# Auto Scaling Policy
resource "aws_autoscaling_policy" "cpu" {
  name                   = "${var.project_name}-cpu-scaling"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Metric Alarm for CPU
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
  alarm_actions       = [aws_autoscaling_policy.cpu.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.project_name}-db-subnet-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier_prefix = "${var.project_name}-db-"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "appdb"
  username = "dbadmin"
  password = aws_secretsmanager_secret_version.rds_password.secret_string

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "${var.project_name}-rds"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "webapp"
}

# Outputs

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS password"
  value       = aws_secretsmanager_secret.rds_password.arn
}

output "vpc_id" {
  description = "The ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (where ALB and NAT Gateways are located)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (where EC2 instances and RDS are located)"
  value       = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  description = "The Security Group ID for the Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "The Security Group ID for the EC2 instances"
  value       = aws_security_group.ec2.id
}

output "asg_name" {
  description = "The name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "The ID of the Launch Template used by the ASG"
  value       = aws_launch_template.main.id
}

output "ec2_iam_instance_profile_arn" {
  description = "The ARN of the IAM Instance Profile attached to the EC2 instances"
  value       = aws_iam_instance_profile.ec2.arn
}

output "rds_db_name" {
  description = "The database name"
  value       = aws_db_instance.main.db_name
}

output "rds_master_username" {
  description = "The master database username"
  value       = aws_db_instance.main.username
}

output "rds_security_group_id" {
  description = "The Security Group ID for the RDS instance"
  value       = aws_security_group.rds.id
}

output "ec2_role_name" {
  description = "The generated name of the EC2 IAM Role"
  value       = aws_iam_role.ec2.name
}
```
# provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```