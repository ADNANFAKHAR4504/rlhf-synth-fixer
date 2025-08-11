# Multi-Region AWS Infrastructure with Terraform

I'll create a complete, robust, and scalable multi-region AWS infrastructure using Terraform. This solution follows all the specified constraints and requirements.

## Project Structure

```
terraform-multi-region-aws/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tf
├── providers.tf
├── backend.tf
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev.tfvars
│   ├── test.tfvars
│   └── prod.tfvars
└── README.md
```

## Core Configuration Files

### 1. terraform.tf
```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### 2. backend.tf
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-multi-region-infrastructure"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
    versioning     = true
  }
}
```

### 3. providers.tf
```hcl
# Primary provider for us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment  = var.environment
      Project      = var.project_name
      Owner        = var.owner
      CostCenter   = var.cost_center
      ManagedBy    = "Terraform"
      Region       = "us-east-1"
    }
  }
}

# Secondary provider for eu-west-1
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"

  default_tags {
    tags = {
      Environment  = var.environment
      Project      = var.project_name
      Owner        = var.owner
      CostCenter   = var.cost_center
      ManagedBy    = "Terraform"
      Region       = "eu-west-1"
    }
  }
}
```

### 4. variables.tf
```hcl
variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be one of: dev, test, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "multi-region-app"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

variable "vpc_cidr_us_east_1" {
  description = "CIDR block for VPC in us-east-1"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_eu_west_1" {
  description = "CIDR block for VPC in eu-west-1"
  type        = string
  default     = "10.1.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}
```

### 5. main.tf
```hcl
# Data sources for availability zones
data "aws_availability_zones" "us_east_1" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "eu_west_1" {
  provider = aws.eu_west_1
  state    = "available"
}

# VPC Module - US East 1
module "vpc_us_east_1" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us_east_1
  }

  environment         = var.environment
  region             = "us-east-1"
  vpc_cidr           = var.vpc_cidr_us_east_1
  availability_zones = data.aws_availability_zones.us_east_1.names
  project_name       = var.project_name
}

# VPC Module - EU West 1
module "vpc_eu_west_1" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.eu_west_1
  }

  environment         = var.environment
  region             = "eu-west-1"
  vpc_cidr           = var.vpc_cidr_eu_west_1
  availability_zones = data.aws_availability_zones.eu_west_1.names
  project_name       = var.project_name
}

# Compute Module - US East 1
module "compute_us_east_1" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.us_east_1
  }

  environment         = var.environment
  region             = "us-east-1"
  vpc_id             = module.vpc_us_east_1.vpc_id
  public_subnet_ids  = module.vpc_us_east_1.public_subnet_ids
  private_subnet_ids = module.vpc_us_east_1.private_subnet_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  project_name       = var.project_name
}

# Compute Module - EU West 1
module "compute_eu_west_1" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.eu_west_1
  }

  environment         = var.environment
  region             = "eu-west-1"
  vpc_id             = module.vpc_eu_west_1.vpc_id
  public_subnet_ids  = module.vpc_eu_west_1.public_subnet_ids
  private_subnet_ids = module.vpc_eu_west_1.private_subnet_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  project_name       = var.project_name
}

# Database Module - US East 1
module "database_us_east_1" {
  source = "./modules/database"
  
  providers = {
    aws = aws.us_east_1
  }

  environment           = var.environment
  region               = "us-east-1"
  vpc_id               = module.vpc_us_east_1.vpc_id
  private_subnet_ids   = module.vpc_us_east_1.private_subnet_ids
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  project_name         = var.project_name
}

# Database Module - EU West 1
module "database_eu_west_1" {
  source = "./modules/database"
  
  providers = {
    aws = aws.eu_west_1
  }

  environment           = var.environment
  region               = "eu-west-1"
  vpc_id               = module.vpc_eu_west_1.vpc_id
  private_subnet_ids   = module.vpc_eu_west_1.private_subnet_ids
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  project_name         = var.project_name
}

# Monitoring Module - US East 1
module "monitoring_us_east_1" {
  source = "./modules/monitoring"
  
  providers = {
    aws = aws.us_east_1
  }

  environment           = var.environment
  region               = "us-east-1"
  autoscaling_group_name = module.compute_us_east_1.autoscaling_group_name
  load_balancer_arn     = module.compute_us_east_1.load_balancer_arn
  project_name          = var.project_name
}

# Monitoring Module - EU West 1
module "monitoring_eu_west_1" {
  source = "./modules/monitoring"
  
  providers = {
    aws = aws.eu_west_1
  }

  environment           = var.environment
  region               = "eu-west-1"
  autoscaling_group_name = module.compute_eu_west_1.autoscaling_group_name
  load_balancer_arn     = module.compute_eu_west_1.load_balancer_arn
  project_name          = var.project_name
}
```

## Module Definitions

### VPC Module (modules/vpc/main.tf)
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-vpc-${var.region}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-igw-${var.region}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = min(length(var.availability_zones), 3)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}-${var.region}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = min(length(var.availability_zones), 3)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}-${var.region}"
    Type = "Private"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = min(length(var.availability_zones), 3)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.environment}-nat-eip-${count.index + 1}-${var.region}"
  }
}

resource "aws_nat_gateway" "main" {
  count = min(length(var.availability_zones), 3)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.environment}-nat-gateway-${count.index + 1}-${var.region}"
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
    Name = "${var.environment}-public-rt-${var.region}"
  }
}

resource "aws_route_table" "private" {
  count = min(length(var.availability_zones), 3)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.environment}-private-rt-${count.index + 1}-${var.region}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = min(length(var.availability_zones), 3)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = min(length(var.availability_zones), 3)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### VPC Module Variables (modules/vpc/variables.tf)
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}
```

### VPC Module Outputs (modules/vpc/outputs.tf)
```hcl
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

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

### Compute Module (modules/compute/main.tf)
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

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

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role-${var.region}"

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
    Name = "${var.environment}-ec2-role-${var.region}"
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile-${var.region}"
  role = aws_iam_role.ec2_role.name
}

# IAM Policy for CloudWatch
resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "${var.environment}-ec2-cloudwatch-policy-${var.region}"
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

# Security Group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg-${var.region}"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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

  tags = {
    Name = "${var.environment}-alb-sg-${var.region}"
  }
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-ec2-sg-${var.region}"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-ec2-sg-${var.region}"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "${var.environment}-alb-${var.region}"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg-${var.region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.environment}-tg-${var.region}"
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-lt-${var.region}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from ${var.environment} in ${var.region}</h1>" > /var/www/html/index.html
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
    
    # Configure CloudWatch agent
    cat <<EOT > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
            ],
            "metrics_collection_interval": 60
          }
        }
      }
    }
EOT
    
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.environment}-instance-${var.region}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.environment}-asg-${var.region}"
  vpc_zone_identifier = var.private_subnet_ids
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
    value               = "${var.environment}-asg-${var.region}"
    propagate_at_launch = false
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
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up-${var.region}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down-${var.region}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-cpu-high-${var.region}"
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

  tags = {
    Name = "${var.environment}-cpu-high-${var.region}"
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.environment}-cpu-low-${var.region}"
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

  tags = {
    Name = "${var.environment}-cpu-low-${var.region}"
  }
}
```

### Compute Module Variables (modules/compute/variables.tf)
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}
```

### Compute Module Outputs (modules/compute/outputs.tf)
```hcl
output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}
```

### Database Module (modules/database/main.tf)
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# AWS Secrets Manager secret for database password
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.environment}-db-password-${var.region}"
  description             = "Database password for ${var.environment} environment in ${var.region}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.environment}-db-password-${var.region}"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.environment}-db-subnet-group-${var.region}"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-rds-sg-${var.region}"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-rds-sg-${var.region}"
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres14"
  name   = "${var.environment}-db-params-${var.region}"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min