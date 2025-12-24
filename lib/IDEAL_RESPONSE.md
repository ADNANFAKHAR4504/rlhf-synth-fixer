**`main.tf`**
```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  cloud {
    organization = "your-terraform-cloud-org"
    
    workspaces {
      name = "webapp-staging"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = module.env_module.environment
      Project     = module.env_module.project_name
      Owner       = "Turing"
      ManagedBy   = "terraform"
    }
  }
}

########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}


module "env_module" {
  source = "./modules/env_module"
}

module "vpc_module" {
  source = "./modules/vpc_module"
  environment = module.env_module.environment
  vpc_cidr = module.env_module.vpc_cidr
  availability_zones = module.env_module.availability_zones
  common_tags = module.env_module.common_tags
  project_name = module.env_module.project_name
}

module "security_group_module" {
  source = "./modules/securitygroup_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  vpc_id = module.vpc_module.vpc_id
  vpc_cidr_block = module.env_module.vpc_cidr
  common_tags = module.env_module.common_tags

  depends_on = [ module.vpc_module ]
}

module "lb_module" {
  source = "./modules/lb_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  vpc_id = module.vpc_module.vpc_id
  public_subnet_ids = module.vpc_module.public_subnet_ids
  security_group_id = module.security_group_module.alb_security_group_id
  common_tags = module.env_module.common_tags

  depends_on = [ module.security_group_module ]
}

module "ec2_module" {
  source = "./modules/ec2_module"
  environment = module.env_module.environment
  project_name = module.env_module.project_name
  private_subnet_ids = module.vpc_module.private_subnet_ids
  security_group_id = module.security_group_module.ec2_security_group_id
  instance_profile_name = module.security_group_module.ec2_instance_profile_name
  target_group_arn = module.lb_module.target_group_arn
  instance_type = module.env_module.instance_type
  min_size = module.env_module.as_group_min
  max_size = module.env_module.as_group_max
  desired_capacity = module.env_module.as_group_desired
  common_tags = module.env_module.common_tags

  depends_on = [ module.lb_module ]
}


output "lb_domain" {
  value = module.lb_module.alb_dns_name
}
```

## Terraform Modules

### 1. VPC Module

**`modules/vpc/variables.tf`**
```hcl
variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
  validation {
    condition     = contains(["default", "staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}
```

**`modules/vpc/main.tf`**
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# NAT Gateways
resource "aws_eip" "nat" {
  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-nat-eip"
  })
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-nat-gateway"
  })

  depends_on = [
    aws_internet_gateway.main,
    aws_subnet.public,
    aws_eip.nat
    ]
}


# Route Tables
# Create internet gateway route in default route-table for pubic subnets
resource "aws_route" "attach_gateway" {
    gateway_id = aws_internet_gateway.main.id
    route_table_id = aws_vpc.main.default_route_table_id
    destination_cidr_block = "0.0.0.0/0"
}


# Create private route table for private subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-private-rt"
  })
}

# Route Table Associations
# Associate private route table with private subnets
resource "aws_route_table_association" "private" {
  count = length(var.availability_zones)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
```

**`modules/vpc/outputs.tf`**
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
```

### 2. Security Module

**`modules/security/variables.tf`**
```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.environment}-${var.project_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

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

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb-sg"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-${var.project_name}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-ec2-sg"
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-${var.project_name}-ec2-role"

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

  tags = var.common_tags
}


resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-${var.project_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.common_tags
}
```

**`modules/security/outputs.tf`**
```hcl
output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}
```

### 3. ALB Module

**`modules/alb/variables.tf`**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
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

variable "security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/"
}
```

**`modules/alb/main.tf`**
```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-${var.project_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-tg"
  })
}

# ALB Listener
resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = var.common_tags
}
```

**`modules/alb/outputs.tf`**
```hcl
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}
```

### 4. EC2 Module

**`modules/ec2/variables.tf`**
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

**`modules/ec2/main.tf`**
```hcl
# Data source for latest Ubuntu canonical AMI
data "aws_ami" "ubuntu_jammy" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}


# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-${var.project_name}-"
  image_id      = data.aws_ami.ubuntu_jammy.id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  user_data = filebase64("${path.module}/user_data.sh")

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "${var.environment}-${var.project_name}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.project_name}-launch-template"
  })
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.environment}-${var.project_name}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [var.target_group_arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Enable instance refresh for zero-downtime deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-${var.project_name}-asg"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-${var.project_name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-${var.project_name}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.environment}-${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "10"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.common_tags
}
```

**`modules/ec2/user_data.sh`**
```bash
#!/bin/bash
# Update package list
apt-get update -y

# Install Apache2
apt-get install -y apache2

# Enable Apache2 to start on boot
systemctl enable apache2

# Start Apache2 service
systemctl start apache2

# Create a basic index.html page
echo "<h1>Apache is running on $(hostname -f)</h1>" > /var/www/html/index.html
```

**`modules/ec2/outputs.tf`**
```hcl
output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}
```

## Environment Configurations

### Env Module

**`modules/env/variables.tf`**
```hcl
locals {
  env = terraform.workspace

  vpc_cidr = "10.0.0.0/16"

  availability_zones = ["us-east-1a", "us-east-1b"]

  project = "HCLTuring"

  common_tags = {
    "Application": "multi-env",
    "ManagedBy": "HCL",
    "Owned": "Turing"
  }

  env_type = {
    default = "default"
    staging = "staging"
    production = "production"
  }

  instance_type = {
    default = "t2.micro"
    staging = "t3.micro"
    production = "a1.large"
  }

  as_group_desired = {
    default = 1
    staging = 1
    production = 2
  }

  as_group_min = {
    default = 1
    staging = 1
    production = 2
  }

  as_group_max = {
    default = 2
    staging = 2
    production = 4
  }
}
```

**`modules/env/outputs.tf`**
```hcl
output "vpc_cidr" {
    value = local.vpc_cidr
}

output "availability_zones" {
    value = local.availability_zones
}

output "common_tags" {
    value = local.common_tags
}

output "project_name" {
    value = local.project
}

output environment {
    value = lookup(local.env_type, local.env)
}

output instance_type {
    value = lookup(local.instance_type, local.env)
}

output as_group_desired{
    value = lookup(local.as_group_desired, local.env)
}

output as_group_min {
    value = lookup(local.as_group_min, local.env)
}

output as_group_max {
    value = lookup(local.as_group_max, local.env)
}
```


