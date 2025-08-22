# tap_stack.tf
# Complete infrastructure stack for staging and production environments
# Creates VPCs, subnets, EC2 instances, ELBs, RDS, and monitoring resources

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

variable "environments" {
  description = "Environment configurations"
  type = map(object({
    vpc_cidr          = string
    public_subnets    = list(string)
    private_subnets   = list(string)
    instance_type     = string
    db_instance_class = string
  }))
  default = {
    staging = {
      vpc_cidr          = "10.1.0.0/16"
      public_subnets    = ["10.1.1.0/24", "10.1.2.0/24"]
      private_subnets   = ["10.1.10.0/24", "10.1.20.0/24"]
      instance_type     = "t3.small"
      db_instance_class = "db.t3.micro"
    }
    production = {
      vpc_cidr          = "10.2.0.0/16"
      public_subnets    = ["10.2.1.0/24", "10.2.2.0/24"]
      private_subnets   = ["10.2.10.0/24", "10.2.20.0/24"]
      instance_type     = "t3.medium"
      db_instance_class = "db.t3.small"
    }
  }
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    owner   = "devops-team"
    purpose = "tap-stack-infrastructure"
  }
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}


# Locals
locals {
  availability_zones = ["${var.aws_region}a", "${var.aws_region}b"]

  # Common tags merged with environment-specific tags
  common_tags = var.common_tags
}

# Data sources
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# VPCs for each environment
resource "aws_vpc" "main" {
  for_each = var.environments

  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name        = "${each.key}-vpc"
    environment = each.key
  })
}

# Internet Gateways
resource "aws_internet_gateway" "main" {
  for_each = var.environments

  vpc_id = aws_vpc.main[each.key].id

  tags = merge(local.common_tags, {
    Name        = "${each.key}-igw"
    environment = each.key
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.public_subnets : {
          key               = "${env_key}-public-${idx}"
          environment       = env_key
          cidr_block        = cidr
          availability_zone = local.availability_zones[idx]
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id                  = aws_vpc.main[each.value.environment].id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
    Type        = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.private_subnets : {
          key               = "${env_key}-private-${idx}"
          environment       = env_key
          cidr_block        = cidr
          availability_zone = local.availability_zones[idx]
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id            = aws_vpc.main[each.value.environment].id
  cidr_block        = each.value.cidr_block
  availability_zone = each.value.availability_zone

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
    Type        = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.public_subnets : {
          key         = "${env_key}-nat-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.public_subnets : {
          key         = "${env_key}-nat-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public["${each.value.environment}-public-${each.value.subnet_idx}"].id

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
  })
}

# Public Route Tables
resource "aws_route_table" "public" {
  for_each = var.environments

  vpc_id = aws_vpc.main[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-public-rt"
    environment = each.key
  })
}

# Private Route Tables
resource "aws_route_table" "private" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.private_subnets : {
          key         = "${env_key}-private-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id = aws_vpc.main[each.value.environment].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main["${each.value.environment}-nat-${each.value.subnet_idx}"].id
  }

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
  })
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.public_subnets : {
          key         = "${env_key}-public-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public[each.value.environment].id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, cidr in env_config.private_subnets : {
          key         = "${env_key}-private-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "staging_to_production" {
  peer_vpc_id = aws_vpc.main["production"].id
  vpc_id      = aws_vpc.main["staging"].id
  auto_accept = true

  tags = merge(local.common_tags, {
    Name        = "staging-to-production-peering"
    environment = "shared"
  })
}

# VPC Peering Routes - Staging to Production
resource "aws_route" "staging_to_production_public" {
  route_table_id            = aws_route_table.public["staging"].id
  destination_cidr_block    = var.environments.production.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.staging_to_production.id
}

resource "aws_route" "staging_to_production_private" {
  for_each = {
    for combo in flatten([
      for idx, cidr in var.environments.staging.private_subnets : {
        key = "staging-private-${idx}"
      }
    ]) : combo.key => combo
  }

  route_table_id            = aws_route_table.private[each.key].id
  destination_cidr_block    = var.environments.production.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.staging_to_production.id
}

# VPC Peering Routes - Production to Staging
resource "aws_route" "production_to_staging_public" {
  route_table_id            = aws_route_table.public["production"].id
  destination_cidr_block    = var.environments.staging.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.staging_to_production.id
}

resource "aws_route" "production_to_staging_private" {
  for_each = {
    for combo in flatten([
      for idx, cidr in var.environments.production.private_subnets : {
        key = "production-private-${idx}"
      }
    ]) : combo.key => combo
  }

  route_table_id            = aws_route_table.private[each.key].id
  destination_cidr_block    = var.environments.staging.vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.staging_to_production.id
}

# Security Group for EC2 instances (HTTPS only)
resource "aws_security_group" "ec2_https" {
  for_each = var.environments

  name_prefix = "${each.key}-ec2-https-"
  vpc_id      = aws_vpc.main[each.key].id

  # HTTPS inbound from VPC CIDRs
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [each.value.vpc_cidr, var.environments[each.key == "staging" ? "production" : "staging"].vpc_cidr]
  }

  # SSH for management (from VPC only)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [each.value.vpc_cidr]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [each.value.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-ec2-https-sg"
    environment = each.key
  })
}

# Security Group for ELB (HTTPS only)
resource "aws_security_group" "elb_https" {
  for_each = var.environments

  name_prefix = "${each.key}-elb-https-"
  vpc_id      = aws_vpc.main[each.key].id

  # HTTPS inbound from VPC CIDRs
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [each.value.vpc_cidr, var.environments[each.key == "staging" ? "production" : "staging"].vpc_cidr]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [each.value.vpc_cidr]
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-elb-https-sg"
    environment = each.key
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  for_each = var.environments

  name_prefix = "${each.key}-rds-"
  vpc_id      = aws_vpc.main[each.key].id

  # PostgreSQL port from EC2 security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_https[each.key].id]
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-rds-sg"
    environment = each.key
  })
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  for_each = var.environments

  name = "${each.key}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name        = "${each.key}-ec2-role"
    environment = each.key
  })
}

# IAM Policy for EC2 CloudWatch access
resource "aws_iam_policy" "ec2_cloudwatch" {
  for_each = var.environments

  name = "${each.key}-ec2-cloudwatch-policy"

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

  tags = merge(local.common_tags, {
    Name        = "${each.key}-ec2-cloudwatch-policy"
    environment = each.key
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  for_each = var.environments

  role       = aws_iam_role.ec2_role[each.key].name
  policy_arn = aws_iam_policy.ec2_cloudwatch[each.key].arn
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  for_each = var.environments

  name = "${each.key}-ec2-profile"
  role = aws_iam_role.ec2_role[each.key].name

  tags = merge(local.common_tags, {
    Name        = "${each.key}-ec2-profile"
    environment = each.key
  })
}

# EC2 Instances
resource "aws_instance" "web" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, subnet in env_config.private_subnets : {
          key         = "${env_key}-web-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.environments[each.value.environment].instance_type
  subnet_id              = aws_subnet.private["${each.value.environment}-private-${each.value.subnet_idx}"].id
  vpc_security_group_ids = [aws_security_group.ec2_https[each.value.environment].id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile[each.value.environment].name

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y amazon-cloudwatch-agent
              # Configure CloudWatch agent
              /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
              EOF
  )

  tags = merge(local.common_tags, {
    Name        = each.key
    environment = each.value.environment
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  for_each = var.environments

  name               = "${each.key}-alb-tapstack"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.elb_https[each.key].id]
  subnets = [
    aws_subnet.public["${each.key}-public-0"].id,
    aws_subnet.public["${each.key}-public-1"].id
  ]

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name        = "${each.key}-alb"
    environment = each.key
  })
}

# Target Group for ALB
resource "aws_lb_target_group" "main" {
  for_each = var.environments

  name     = "${each.key}-tg"
  port     = 443
  protocol = "HTTPS"
  vpc_id   = aws_vpc.main[each.key].id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTPS"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-tg"
    environment = each.key
  })
}

# Target Group Attachments
resource "aws_lb_target_group_attachment" "main" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, subnet in env_config.private_subnets : {
          key         = "${env_key}-web-${idx}"
          environment = env_key
          subnet_idx  = idx
        }
      ]
    ]) : combo.key => combo
  }

  target_group_arn = aws_lb_target_group.main[each.value.environment].arn
  target_id        = aws_instance.web[each.key].id
  port             = 443
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  for_each = var.environments

  name = "${each.key}-db-subnet-tapstack"
  subnet_ids = [
    aws_subnet.private["${each.key}-private-0"].id,
    aws_subnet.private["${each.key}-private-1"].id
  ]

  tags = merge(local.common_tags, {
    Name        = "${each.key}-db-subnet-group"
    environment = each.key
  })
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  for_each = var.environments

  identifier             = "${each.key}-postgres"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = each.value.db_instance_class
  db_name                = "${each.key}db"
  username               = var.db_username
  password               = random_password.db_password.result
  parameter_group_name   = "default.postgres15"
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name
  vpc_security_group_ids = [aws_security_group.rds[each.key].id]

  backup_retention_period = each.key == "production" ? 7 : 3
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = each.key == "production" ? true : false

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = merge(local.common_tags, {
    Name        = "${each.key}-postgres"
    environment = each.key
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "ec2_logs" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, subnet in env_config.private_subnets : {
          key         = "${env_key}-web-${idx}"
          environment = env_key
        }
      ]
    ]) : combo.key => combo
  }

  name              = "/aws/ec2/${each.key}"
  retention_in_days = each.value.environment == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name        = "${each.key}-log-group"
    environment = each.value.environment
  })
}

resource "aws_cloudwatch_log_group" "alb_logs" {
  for_each = var.environments

  name              = "/aws/applicationloadbalancer/${each.key}"
  retention_in_days = each.key == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name        = "${each.key}-alb-log-group"
    environment = each.key
  })
}

# CloudWatch Alarms for EC2 CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ec2_cpu" {
  for_each = {
    for combo in flatten([
      for env_key, env_config in var.environments : [
        for idx, subnet in env_config.private_subnets : {
          key         = "${env_key}-web-${idx}"
          environment = env_key
        }
      ]
    ]) : combo.key => combo
  }

  alarm_name          = "${each.key}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.web[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-cpu-alarm"
    environment = each.value.environment
  })
}

# CloudWatch Alarms for RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  for_each = var.environments

  alarm_name          = "${each.key}-rds-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres[each.key].id
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-rds-cpu-alarm"
    environment = each.key
  })
}

# CloudWatch Alarms for ALB Target Health
resource "aws_cloudwatch_metric_alarm" "alb_target_health" {
  for_each = var.environments

  alarm_name          = "${each.key}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors ALB unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main[each.key].arn_suffix
    LoadBalancer = aws_lb.main[each.key].arn_suffix
  }

  tags = merge(local.common_tags, {
    Name        = "${each.key}-alb-health-alarm"
    environment = each.key
  })
}

# Outputs
output "vpc_ids" {
  description = "VPC IDs for each environment"
  value = {
    for env, vpc in aws_vpc.main : env => vpc.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs for each environment"
  value = {
    for key, subnet in aws_subnet.public : key => subnet.id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for each environment"
  value = {
    for key, subnet in aws_subnet.private : key => subnet.id
  }
}

output "ec2_instance_ids" {
  description = "EC2 instance IDs"
  value = {
    for key, instance in aws_instance.web : key => instance.id
  }
}

output "ec2_private_ips" {
  description = "EC2 instance private IP addresses"
  value = {
    for key, instance in aws_instance.web : key => instance.private_ip
  }
}

output "alb_dns_names" {
  description = "Application Load Balancer DNS names"
  value = {
    for env, alb in aws_lb.main : env => alb.dns_name
  }
}

output "vpc_peering_connection_id" {
  description = "VPC Peering connection ID between staging and production"
  value       = aws_vpc_peering_connection.staging_to_production.id
}

output "rds_endpoints" {
  description = "RDS instance endpoints"
  value = {
    for env, rds in aws_db_instance.postgres : env => rds.endpoint
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names"
  value = {
    ec2_logs = {
      for key, lg in aws_cloudwatch_log_group.ec2_logs : key => lg.name
    }
    alb_logs = {
      for env, lg in aws_cloudwatch_log_group.alb_logs : env => lg.name
    }
  }
}
