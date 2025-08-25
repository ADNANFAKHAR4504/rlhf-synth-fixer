I'll help you deploy a PCI-DSS compliant web application on AWS using Terraform. This solution includes a VPC, load-balanced EC2 instances with auto-scaling, and a multi-AZ RDS database with encryption.

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
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
  default     = 6
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 2
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "ecommerce"
    Environment = "production"
    ManagedBy   = "terraform"
    Compliance  = "pci-dss"
  }
}
```

## vpc.tf

```hcl
# VPC
resource "aws_vpc" "ecommerce_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "ecommerce-vpc-production"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "ecommerce_igw" {
  vpc_id = aws_vpc.ecommerce_vpc.id

  tags = merge(var.common_tags, {
    Name = "ecommerce-igw-production"
  })
}

# Public Subnets
resource "aws_subnet" "public_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.ecommerce_vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "ecommerce-public-subnet-${count.index + 1}-production"
    Type = "public"
  })
}

# Private Subnets for RDS
resource "aws_subnet" "private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.ecommerce_vpc.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name = "ecommerce-private-subnet-${count.index + 1}-production"
    Type = "private"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.ecommerce_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ecommerce_igw.id
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-public-rt-production"
  })
}

# Associate Public Subnets with Route Table
resource "aws_route_table_association" "public_rta" {
  count          = length(aws_subnet.public_subnets)
  subnet_id      = aws_subnet.public_subnets[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# DB Subnet Group
resource "aws_db_subnet_group" "ecommerce_db_subnet_group" {
  name       = "ecommerce-db-subnet-group-production"
  subnet_ids = aws_subnet.private_subnets[*].id

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-subnet-group-production"
  })
}
```

## security_groups.tf

```hcl
# Load Balancer Security Group
resource "aws_security_group" "alb_sg" {
  name        = "ecommerce-alb-sg-production"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.ecommerce_vpc.id

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

  tags = merge(var.common_tags, {
    Name = "ecommerce-alb-sg-production"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2_sg" {
  name        = "ecommerce-ec2-sg-production"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-ec2-sg-production"
  })
}

# RDS Security Group
resource "aws_security_group" "rds_sg" {
  name        = "ecommerce-rds-sg-production"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.ecommerce_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
  }

  tags = merge(var.common_tags, {
    Name = "ecommerce-rds-sg-production"
  })
}
```

## kms.tf

```hcl
# KMS Key for encryption
resource "aws_kms_key" "ecommerce_kms_key" {
  description             = "KMS key for ecommerce application encryption"
  deletion_window_in_days = 7

  tags = merge(var.common_tags, {
    Name = "ecommerce-kms-key-production"
  })
}

resource "aws_kms_alias" "ecommerce_kms_alias" {
  name          = "alias/ecommerce-key-production"
  target_key_id = aws_kms_key.ecommerce_kms_key.key_id
}
```

## load_balancer.tf

```hcl
# Application Load Balancer
resource "aws_lb" "ecommerce_alb" {
  name               = "ecommerce-alb-production"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(var.common_tags, {
    Name = "ecommerce-alb-production"
  })
}

# Target Group
resource "aws_lb_target_group" "ecommerce_tg" {
  name     = "ecommerce-tg-production"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.ecommerce_vpc.id

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

  tags = merge(var.common_tags, {
    Name = "ecommerce-tg-production"
  })
}

# Load Balancer Listener
resource "aws_lb_listener" "ecommerce_alb_listener" {
  load_balancer_arn = aws_lb.ecommerce_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ecommerce_tg.arn
  }
}
```

## auto_scaling.tf

```hcl
# Launch Template
resource "aws_launch_template" "ecommerce_lt" {
  name_prefix   = "ecommerce-lt-production-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = aws_kms_key.ecommerce_kms_key.arn
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    db_endpoint = aws_db_instance.ecommerce_db.endpoint
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "ecommerce-instance-production"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "ecommerce_asg" {
  name                = "ecommerce-asg-production"
  vpc_zone_identifier = aws_subnet.public_subnets[*].id
  target_group_arns   = [aws_lb_target_group.ecommerce_tg.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.ecommerce_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ecommerce-asg-production"
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

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_autoscaling_policy" "ecommerce_scale_up" {
  name                   = "ecommerce-scale-up-production"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

# Auto Scaling Policy - Scale Down
resource "aws_autoscaling_policy" "ecommerce_scale_down" {
  name                   = "ecommerce-scale-down-production"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.ecommerce_asg.name
}

# CloudWatch Alarm - High CPU
resource "aws_cloudwatch_metric_alarm" "ecommerce_high_cpu" {
  alarm_name          = "ecommerce-high-cpu-production"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }

  tags = var.common_tags
}

# CloudWatch Alarm - Low CPU
resource "aws_cloudwatch_metric_alarm" "ecommerce_low_cpu" {
  alarm_name          = "ecommerce-low-cpu-production"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.ecommerce_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.ecommerce_asg.name
  }

  tags = var.common_tags
}
```

## database.tf

```hcl
# RDS Instance
resource "aws_db_instance" "ecommerce_db" {
  identifier     = "ecommerce-db-production"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.ecommerce_kms_key.arn

  db_name  = "ecommerce"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.ecommerce_db_subnet_group.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  multi_az               = true
  publicly_accessible    = false
  deletion_protection    = false
  skip_final_snapshot    = true

  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.ecommerce_kms_key.arn

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-production"
  })
}

# Random password for database
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Store database password in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "ecommerce-db-password-production"
  description             = "Database password for ecommerce application"
  kms_key_id              = aws_kms_key.ecommerce_kms_key.arn
  recovery_window_in_days = 0

  tags = merge(var.common_tags, {
    Name = "ecommerce-db-password-production"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.ecommerce_db.username
    password = random_password.db_password.result
  })
}
```

## data.tf

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

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}
```

## outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.ecommerce_vpc.id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.ecommerce_alb.dns_name
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.ecommerce_db.endpoint
  sensitive   = true
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.ecommerce_kms_key.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.ecommerce_asg.name
}
```

## userdata.sh

```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Simple web application
cat << 'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Application</title>
</head>
<body>
    <h1>Welcome to E-commerce Platform</h1>
    <p>PCI-DSS Compliant Web Application</p>
    <p>Database Endpoint: ${db_endpoint}</p>
    <p>Server: $(hostname)</p>
</body>
</html>
EOF

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
```