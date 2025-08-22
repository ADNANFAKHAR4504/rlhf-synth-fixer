# tap_stack.tf - Main infrastructure stack

########################
# Data Sources
########################

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_caller_identity" "current" {}

# Use existing default VPC instead of creating new one to avoid VPC limit
data "aws_vpc" "default" {
  default = true
}

# Get existing subnets from the default VPC, filtering for supported AZs
data "aws_subnets" "existing_public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

data "aws_subnet" "existing_public" {
  count = min(length(data.aws_subnets.existing_public.ids), 2)
  id    = data.aws_subnets.existing_public.ids[count.index]
}

########################
# VPC and Networking (Using existing VPC to avoid limits)
########################

# Commented out VPC creation to use existing VPC instead
# resource "aws_vpc" "main" {
#   cidr_block           = var.vpc_cidr
#   enable_dns_hostnames = true
#   enable_dns_support   = true

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-vpc"
#     Environment = var.environment
#   }
# }

# Using existing VPC's internet gateway
data "aws_internet_gateway" "existing" {
  filter {
    name   = "attachment.vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Use existing subnets instead of creating new ones
# resource "aws_subnet" "public" {
#   count                   = length(var.availability_zones)
#   vpc_id                  = aws_vpc.main.id
#   cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
#   availability_zone       = var.availability_zones[count.index]
#   map_public_ip_on_launch = true

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-public-${count.index + 1}"
#     Environment = var.environment
#     Type        = "Public"
#   }
# }

# Create only private subnets for application instances
# resource "aws_subnet" "private" {
#   count             = 2
#   vpc_id            = data.aws_vpc.existing.id
#   cidr_block        = cidrsubnet(data.aws_vpc.existing.cidr_block, 8, count.index + 100)
#   availability_zone = data.aws_availability_zones.available.names[count.index]

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-private-${count.index + 1}"
#     Environment = var.environment
#     Type        = "Private"
#   }
# }

# Commented out complex networking to use existing VPC
# resource "aws_subnet" "database" {
#   count             = length(var.availability_zones)
#   vpc_id            = aws_vpc.main.id
#   cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
#   availability_zone = var.availability_zones[count.index]

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-database-${count.index + 1}"
#     Environment = var.environment
#     Type        = "Database"
#   }
# }

# resource "aws_nat_gateway" "main" {
#   count         = length(var.availability_zones)
#   allocation_id = aws_eip.nat[count.index].id
#   subnet_id     = aws_subnet.public[count.index].id

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-nat-${count.index + 1}"
#     Environment = var.environment
#   }

#   depends_on = [aws_internet_gateway.main]
# }

# resource "aws_eip" "nat" {
#   count  = length(var.availability_zones)
#   domain = "vpc"

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-eip-${count.index + 1}"
#     Environment = var.environment
#   }

#   depends_on = [aws_internet_gateway.main]
# }

# resource "aws_route_table" "public" {
#   vpc_id = aws_vpc.main.id

#   route {
#     cidr_block = "0.0.0.0/0"
#     gateway_id = aws_internet_gateway.main.id
#   }

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-public-rt"
#     Environment = var.environment
#   }
# }

# resource "aws_route_table" "private" {
#   count  = length(var.availability_zones)
#   vpc_id = aws_vpc.main.id

#   route {
#     cidr_block     = "0.0.0.0/0"
#     nat_gateway_id = aws_nat_gateway.main[count.index].id
#   }

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-private-rt-${count.index + 1}"
#     Environment = var.environment
#   }
# }

# resource "aws_route_table_association" "public" {
#   count          = length(var.availability_zones)
#   subnet_id      = aws_subnet.public[count.index].id
#   route_table_id = aws_route_table.public.id
# }

# resource "aws_route_table_association" "private" {
#   count          = length(var.availability_zones)
#   subnet_id      = aws_subnet.private[count.index].id
#   route_table_id = aws_route_table.private[count.index].id
# }

########################
# Security Groups
########################

resource "aws_security_group" "alb" {
  name        = "${var.app_name}-${var.environment_suffix}-alb-sg-${random_id.suffix.hex}"
  description = "Security group for ALB"
  vpc_id      = data.aws_vpc.default.id

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
    Name        = "${var.app_name}-${var.environment_suffix}-alb-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "web" {
  name        = "${var.app_name}-${var.environment_suffix}-web-sg-${random_id.suffix.hex}"
  description = "Security group for web servers"
  vpc_id      = data.aws_vpc.default.id

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
    cidr_blocks = [data.aws_vpc.default.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-web-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "database" {
  name        = "${var.app_name}-${var.environment_suffix}-db-sg-${random_id.suffix.hex}"
  description = "Security group for RDS database"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-db-sg"
    Environment = var.environment
  }
}

########################
# Application Load Balancer
########################

resource "aws_lb" "main" {
  name               = "${var.app_name}-${var.environment_suffix}-alb-${random_id.suffix.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.existing_public.ids

  enable_deletion_protection = false

  # Using latest 2024 feature: desync mitigation
  desync_mitigation_mode = "defensive"

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-alb"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "main" {
  name     = "${var.app_name}-${var.environment_suffix}-tg-${random_id.suffix.hex}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
    port                = "traffic-port"
  }

  # Using latest 2024 feature: least outstanding requests algorithm
  load_balancing_algorithm_type = "least_outstanding_requests"

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-tg"
    Environment = var.environment
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# SSL certificate and HTTPS listener (placeholder for production)
resource "aws_lb_listener" "https" {
  count = 0 # Disabled to simplify deployment

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

resource "aws_acm_certificate" "main" {
  count = 0 # Disabled to simplify deployment

  domain_name       = "${var.app_name}-${var.environment_suffix}.example.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-cert"
    Environment = var.environment
  }
}

########################
# Launch Template and Auto Scaling Group
########################

resource "aws_launch_template" "main" {
  name_prefix   = "${var.app_name}-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
    app_name    = var.app_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment_suffix}-instance"
      Environment = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main" {
  name                      = "${var.app_name}-${var.environment_suffix}-asg-${random_id.suffix.hex}"
  vpc_zone_identifier       = data.aws_subnets.existing_public.ids
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
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
    value               = "${var.app_name}-${var.environment_suffix}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.app_name}-${var.environment_suffix}-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.app_name}-${var.environment_suffix}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.app_name}-${var.environment_suffix}-cpu-high"
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
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.app_name}-${var.environment_suffix}-cpu-low"
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
}

########################
# RDS Database
########################

# Commented out database subnet group since RDS is disabled
# resource "aws_db_subnet_group" "main" {
#   name       = "${var.app_name}-${var.environment_suffix}-db-subnet-group"
#   subnet_ids = aws_subnet.database[*].id

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-db-subnet-group"
#     Environment = var.environment
#   }
# }

resource "random_id" "suffix" {
  byte_length = 4
}

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_password" {
  name        = "${var.app_name}-${var.environment_suffix}-db-password-${random_id.suffix.hex}"
  description = "Database password for ${var.app_name} ${var.environment}"

  tags = {
    Name        = "${var.app_name}-${var.environment_suffix}-db-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

# Commented out RDS to simplify deployment and avoid limits
# resource "aws_db_instance" "main" {
#   identifier            = "${var.app_name}-${var.environment_suffix}-db"
#   allocated_storage     = var.environment == "prod" ? 100 : 20
#   max_allocated_storage = var.environment == "prod" ? 1000 : 100
#   storage_type          = "gp3"
#   engine                = "mysql"
#   engine_version        = "8.0"
#   instance_class        = var.db_instance_class
#   db_name               = var.db_name
#   username              = var.db_username
#   password              = random_password.db_password.result

#   vpc_security_group_ids = [aws_security_group.database.id]
#   db_subnet_group_name   = aws_db_subnet_group.main.name

#   # Multi-AZ for high availability
#   multi_az = var.environment == "prod" ? true : false

#   # Backup configuration
#   backup_retention_period = var.environment == "prod" ? 7 : 1
#   backup_window           = "03:00-04:00"
#   maintenance_window      = "sun:04:00-sun:05:00"

#   # Security
#   storage_encrypted = true

#   # Performance Insights for monitoring
#   performance_insights_enabled = var.environment == "prod" ? true : false

#   # Always skip final snapshot to ensure destroyability
#   skip_final_snapshot       = true
#   final_snapshot_identifier = null

#   tags = {
#     Name        = "${var.app_name}-${var.environment_suffix}-db"
#     Environment = var.environment
#   }
# }