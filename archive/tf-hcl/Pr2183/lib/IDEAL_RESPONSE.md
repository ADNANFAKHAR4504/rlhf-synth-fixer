## Root Configuration Files

### `main.tf`
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
  region = var.region
  
  default_tags {
    tags = local.common_tags
  }
}

# Data source for AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  name_prefix = local.name_prefix
  tags        = local.common_tags
}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  name_prefix         = local.name_prefix
  vpc_cidr           = local.current_network_config.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = local.current_network_config.public_subnets
  private_subnets    = local.current_network_config.private_subnets
  database_subnets   = local.current_network_config.database_subnets
  tags               = local.common_tags
}

# Database Module
module "database" {
  source = "./modules/database"
  
  name_prefix           = local.name_prefix
  db_subnet_group_name  = module.networking.db_subnet_group_name
  vpc_security_group_ids = [module.networking.database_security_group_id]
  
  instance_class      = local.current_db_config.instance_class
  allocated_storage   = local.current_db_config.allocated_storage
  backup_retention    = local.current_db_config.backup_retention
  multi_az           = local.current_db_config.multi_az
  deletion_protection = local.current_db_config.deletion_protection
  
  db_username = var.db_username
  db_password = var.db_password
  
  tags = local.common_tags
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  name_prefix                = local.name_prefix
  vpc_id                    = module.networking.vpc_id
  public_subnet_ids         = module.networking.public_subnet_ids
  private_subnet_ids        = module.networking.private_subnet_ids
  alb_security_group_id     = module.networking.alb_security_group_id
  instance_security_group_id = module.networking.instance_security_group_id
  
  ami_id           = data.aws_ami.amazon_linux.id
  instance_type    = local.current_instance_config.instance_type
  min_size         = local.current_instance_config.min_size
  max_size         = local.current_instance_config.max_size
  desired_capacity = local.current_instance_config.desired_capacity
  volume_size      = local.current_instance_config.volume_size
  
  instance_profile_name = module.iam.instance_profile_name
  
  # Database connection info for user data
  db_endpoint = module.database.db_endpoint
  
  tags = local.common_tags
}
```

### `variables.tf`
```hcl
variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
  default = "staging"
}

variable "department" {
  description = "Department name for tagging"
  type        = string
  default     = "Engineering"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "webapp"
}

variable "region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for cross-region deployments"
  type        = string
  default     = "us-west-2"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = []
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
  default     = "password"
  sensitive   = true
}
```

### `locals.tf`
```hcl
locals {
  # Region-specific availability zones
  region_azs = {
    "us-east-1" = ["us-east-1a", "us-east-1b", "us-east-1c"]
    "us-west-2" = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }

  # Use provided AZs or default to region-specific ones
  effective_azs = length(var.availability_zones) > 0 ? var.availability_zones : local.region_azs[var.region]

  # Environment-specific configurations
  instance_configs = {
    staging = {
      instance_type    = "t3.micro"
      min_size        = 1
      max_size        = 2
      desired_capacity = 1
      volume_size     = 20
    }
    production = {
      instance_type    = "t3.medium"
      min_size        = 2
      max_size        = 6
      desired_capacity = 3
      volume_size     = 50
    }
  }

  # Database configurations with MySQL 8.0.42
  db_configs = {
    staging = {
      instance_class              = "db.t3.micro"
      allocated_storage          = 20
      backup_retention           = 7
      multi_az                   = false
      deletion_protection        = false
      auto_minor_version_upgrade = true
      engine_version            = "8.0.42"
    }
    production = {
      instance_class              = "db.t3.medium"
      allocated_storage          = 100
      backup_retention           = 30
      multi_az                   = true
      deletion_protection        = true
      auto_minor_version_upgrade = false
      engine_version            = "8.0.42"
    }
  }
  
  
  network_configs = {
    staging = {
      vpc_cidr = "10.0.0.0/16"
      public_subnets = [
        "10.0.1.0/24",
        "10.0.2.0/24"
      ]
      private_subnets = [
        "10.0.10.0/24",
        "10.0.20.0/24"
      ]
      database_subnets = [
        "10.0.30.0/24",
        "10.0.40.0/24"
      ]
    }
    production = {
      vpc_cidr = "10.1.0.0/16"
      public_subnets = [
        "10.1.1.0/24",
        "10.1.2.0/24",
        "10.1.3.0/24"
      ]
      private_subnets = [
        "10.1.10.0/24",
        "10.1.20.0/24",
        "10.1.30.0/24"
      ]
      database_subnets = [
        "10.1.40.0/24",
        "10.1.50.0/24",
        "10.1.60.0/24"
      ]
    }
  }

  # Current environment configurations using lookup
  current_instance_config = lookup(local.instance_configs, var.environment, local.instance_configs["staging"])
  current_db_config      = lookup(local.db_configs, var.environment, local.db_configs["staging"])
  current_network_config = lookup(local.network_configs, var.environment, local.network_configs["staging"])

  # Common tags
  common_tags = {
    Department  = var.department
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "Terraform"
    Region      = var.region
    CreatedDate = formatdate("YYYY-MM-DD", timestamp())
  }

  # Resource naming
  name_prefix = "${var.project}-${var.environment}"
}
```

### `outputs.tf`
```hcl
output "lb_domain" {
    value = module.compute.alb_dns_name
}

output "target_group_arn" {
    value = module.compute.target_group_arn
}

output "rds_endpoint" {
    value = module.database.db_endpoint
}
```

## Module Configurations

### `modules/iam/main.tf`
```hcl
# EC2 Instance Role with least privilege
resource "aws_iam_role" "ec2_role" {
  name = "${var.name_prefix}-ec2-role"

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

  tags = var.tags
}

# Minimal policy for EC2 instances
resource "aws_iam_role_policy" "ec2_policy" {
  name = "${var.name_prefix}-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/${var.name_prefix}/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.name_prefix}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.tags
}
```

### `modules/iam/variables.tf`
```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/iam/outputs.tf`
```hcl
output "instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}
```

### `modules/networking/main.tf`
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-subnet-${count.index + 1}"
    Type = "Database"
  })
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-eip"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-gateway"
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

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-rt"
  })
}

resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Database Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${var.name_prefix}-alb-"
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

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "instance" {
  name_prefix = "${var.name_prefix}-instance-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-instance-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.name_prefix}-database-"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora from instances"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.instance.id]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

### `modules/networking/variables.tf`
```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
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

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
}

variable "database_subnets" {
  description = "List of database subnet CIDR blocks"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/networking/outputs.tf`
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

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "db_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "instance_security_group_id" {
  description = "ID of the instance security group"
  value       = aws_security_group.instance.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}
```

### `modules/compute/main.tf`
```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = var.tags
}

resource "aws_lb_target_group" "main" {
  name     = "${var.name_prefix}-tg"
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

  tags = var.tags
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }

  tags = var.tags
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "${var.name_prefix}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.instance_security_group_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = var.volume_size
      volume_type = "gp3"
      encrypted   = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_endpoint = var.db_endpoint
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.name_prefix}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.name_prefix}-asg"
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

  dynamic "tag" {
    for_each = var.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-asg"
    propagate_at_launch = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.name_prefix}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.name_prefix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name_prefix}-cpu-high"
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

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.name_prefix}-cpu-low"
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

  tags = var.tags
}
```

### `modules/compute/user_data.sh`
```bash
#!/bin/bash
yum update -y
yum install -y httpd mysql

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>High Availability Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Database Endpoint: ${db_endpoint}</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF

# Configure CloudWatch agent (optional)
yum install -y amazon-cloudwatch-agent
```

### `modules/compute/variables.tf`
```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
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

variable "alb_security_group_id" {
  description = "Security group ID for ALB"
  type        = string
}

variable "instance_security_group_id" {
  description = "Security group ID for instances"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for instances"
  type        = string
}

variable "instance_type" {
  description = "Instance type"
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

variable "volume_size" {
  description = "EBS volume size"
  type        = number
}

variable "instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/compute/outputs.tf`
```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}
```

### `modules/database/main.tf`
```hcl
# Remove the problematic data sources - we'll use a direct version approach

# Random password generation when not provided
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 16
  special = true
  
  # Ensure password meets MySQL requirements
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  min_special = 1
  
  # Exclude problematic characters for MySQL
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Store database credentials in Parameter Store
resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.name_prefix}/database/username"
  type  = "SecureString"
  value = var.db_username

  tags = var.tags
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.name_prefix}/database/password"
  type  = "SecureString"
  value = var.db_password != null ? var.db_password : random_password.db_password[0].result

  tags = var.tags
}

# RDS Subnet Group (if not passed from networking module)
resource "aws_db_subnet_group" "main" {
  count      = var.db_subnet_group_name == null ? 1 : 0
  name       = "${var.name_prefix}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-db-subnet-group"
  })
}

# RDS Parameter Group for MySQL optimization
resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "${var.name_prefix}-db-params"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "max_connections"
    value = var.instance_class == "db.t3.micro" ? "100" : "1000"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  parameter {
    name  = "innodb_log_buffer_size"
    value = "16777216"
  }

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Option Group
resource "aws_db_option_group" "main" {
  name                     = "${var.name_prefix}-db-options"
  option_group_description = "Option group for ${var.name_prefix}"
  engine_name              = "mysql"
  major_engine_version     = "8.0"

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.name_prefix}-database"

  # Engine Configuration - Direct version specification
  engine         = "mysql"
  engine_version = var.engine_version
  instance_class = var.instance_class

  # Storage Configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_id

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password != null ? var.db_password : random_password.db_password[0].result

  # Network Configuration
  db_subnet_group_name   = var.db_subnet_group_name != null ? var.db_subnet_group_name : aws_db_subnet_group.main[0].name
  vpc_security_group_ids = var.vpc_security_group_ids
  publicly_accessible    = false
  port                   = 3306

  # High Availability & Backup
  multi_az                = var.multi_az
  backup_retention_period = var.backup_retention
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Deletion Protection
  deletion_protection       = var.deletion_protection
  skip_final_snapshot      = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Performance Insights (not available for t3.micro)
  performance_insights_enabled          = var.instance_class != "db.t3.micro" ? true : false
  performance_insights_retention_period = var.instance_class != "db.t3.micro" ? 7 : null

  # Parameter and Option Groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Enhanced Monitoring (not available for t3.micro)
  monitoring_interval = var.instance_class != "db.t3.micro" ? 60 : 0
  monitoring_role_arn = var.instance_class != "db.t3.micro" ? aws_iam_role.rds_monitoring[0].arn : null

  # Enable automated backups
  copy_tags_to_snapshot = true

  # Auto minor version upgrade
  auto_minor_version_upgrade = var.auto_minor_version_upgrade

  # Enable logging
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database"
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      password,
      final_snapshot_identifier,
    ]
  }

  depends_on = [
    aws_db_parameter_group.main,
    aws_db_option_group.main
  ]
}

# Enhanced Monitoring Role (only for non-micro instances)
resource "aws_iam_role" "rds_monitoring" {
  count = var.instance_class != "db.t3.micro" ? 1 : 0
  name  = "${var.name_prefix}-rds-monitoring-role"

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

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.instance_class != "db.t3.micro" ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms for Database Monitoring
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.name_prefix}-database-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.name_prefix}-database-connection-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = var.instance_class == "db.t3.micro" ? "80" : "800"
  alarm_description   = "This metric monitors RDS connection count"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_free_storage" {
  alarm_name          = "${var.name_prefix}-database-free-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_read_latency" {
  alarm_name          = "${var.name_prefix}-database-read-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadLatency"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS read latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_write_latency" {
  alarm_name          = "${var.name_prefix}-database-write-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteLatency"
  namespace           = "AWS/RDS"
  period              = "120"
  statistic           = "Average"
  threshold           = "0.2"
  alarm_description   = "This metric monitors RDS write latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  tags = var.tags
}
```

### `modules/database/vars.tf`
```hcl
variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
  default     = null
}

variable "subnet_ids" {
  description = "List of subnet IDs for DB subnet group (used if db_subnet_group_name is null)"
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "List of VPC security group IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
  
  validation {
    condition = contains([
      "db.t3.micro", "db.t3.small", "db.t3.medium", "db.t3.large",
      "db.t3.xlarge", "db.t3.2xlarge", "db.m5.large", "db.m5.xlarge",
      "db.m5.2xlarge", "db.m5.4xlarge", "db.m5.8xlarge", "db.m5.12xlarge",
      "db.m5.16xlarge", "db.m5.24xlarge", "db.r5.large", "db.r5.xlarge"
    ], var.instance_class)
    error_message = "Instance class must be a valid RDS instance type."
  }
}

variable "engine_version" {
  description = "MySQL engine version"
  type        = string
  default     = "8.0.42"
  
  validation {
    condition     = can(regex("^8\\.0\\.[0-9]+$", var.engine_version))
    error_message = "Engine version must be a valid MySQL 8.0.x version."
  }
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 65536
    error_message = "Allocated storage must be between 20 and 65536 GB."
  }
}

variable "backup_retention" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention >= 0 && var.backup_retention <= 35
    error_message = "Backup retention must be between 0 and 35 days."
  }
}

variable "multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "webapp"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_name)) && length(var.db_name) <= 64
    error_message = "Database name must start with a letter, contain only alphanumeric characters and underscores, and be max 64 characters."
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.db_username)) && length(var.db_username) <= 16
    error_message = "Username must start with a letter, contain only alphanumeric characters and underscores, and be max 16 characters."
  }
}

variable "db_password" {
  description = "Database master password (if null, will be auto-generated)"
  type        = string
  default     = null
  sensitive   = true
  
  validation {
    condition = var.db_password == null || (
      length(var.db_password) >= 8 && 
      length(var.db_password) <= 128 &&
      can(regex("^[a-zA-Z0-9!#$%&*()_+=$${}<>:?-]*$", var.db_password))
    )
    error_message = "Password must be 8-128 characters and contain only allowed characters."
  }
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (if null, uses default)"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

### `modules/database/outputs.tf`
```hcl
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.identifier
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_engine_version" {
  description = "Database engine version"
  value       = aws_db_instance.main.engine_version
}

output "parameter_store_username" {
  description = "Parameter Store path for database username"
  value       = aws_ssm_parameter.db_username.name
}

output "parameter_store_password" {
  description = "Parameter Store path for database password"
  value       = aws_ssm_parameter.db_password.name
  sensitive   = true
}

output "db_parameter_group_name" {
  description = "Database parameter group name"
  value       = aws_db_parameter_group.main.name
}

output "db_option_group_name" {
  description = "Database option group name"
  value       = aws_db_option_group.main.name
}
```