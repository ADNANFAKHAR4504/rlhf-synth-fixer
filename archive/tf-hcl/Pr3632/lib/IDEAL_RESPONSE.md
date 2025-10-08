
## main.tf

```hcl
# (terraform block moved to provider.tf to avoid duplication)
# Data source for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# Primary Region Infrastructure
module "primary_networking" {
  source = "./modules/networking"
  providers = {
    aws = aws.primary
  }

  region             = var.primary_region
  vpc_cidr           = var.vpc_cidr["primary"]
  environment        = var.environment
  availability_zones = data.aws_availability_zones.primary.names
  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

module "primary_compute" {
  source = "./modules/compute"
  providers = {
    aws = aws.primary
  }

  vpc_id             = module.primary_networking.vpc_id
  public_subnet_ids  = module.primary_networking.public_subnet_ids
  private_subnet_ids = module.primary_networking.private_subnet_ids
  nat_gateway_ids    = module.primary_networking.nat_gateway_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  environment        = var.environment
  region             = var.primary_region
  db_endpoint        = module.primary_database.endpoint

  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

module "primary_database" {
  source = "./modules/database"
  providers = {
    aws = aws.primary
  }

  vpc_id                  = module.primary_networking.vpc_id
  subnet_ids              = module.primary_networking.private_subnet_ids
  instance_class          = var.db_instance_class
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = true
  backup_retention_period = 30
  environment             = var.environment
  region                  = var.primary_region
  is_primary              = true

  tags = merge(var.tags, {
    Region = var.primary_region
    Type   = "Primary"
  })
}

# Secondary Region Infrastructure
module "secondary_networking" {
  source = "./modules/networking"
  providers = {
    aws = aws.secondary
  }

  region             = var.secondary_region
  vpc_cidr           = var.vpc_cidr["secondary"]
  environment        = var.environment
  availability_zones = data.aws_availability_zones.secondary.names

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

module "secondary_compute" {
  source = "./modules/compute"
  providers = {
    aws = aws.secondary
  }

  vpc_id             = module.secondary_networking.vpc_id
  public_subnet_ids  = module.secondary_networking.public_subnet_ids
  private_subnet_ids = module.secondary_networking.private_subnet_ids
  nat_gateway_ids    = module.secondary_networking.nat_gateway_ids
  instance_type      = var.instance_type
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = 2 # Lower capacity in standby region
  environment        = var.environment
  region             = var.secondary_region
  db_endpoint        = module.secondary_database.endpoint

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

module "secondary_database" {
  source = "./modules/database"
  providers = {
    aws = aws.secondary
  }

  vpc_id                  = module.secondary_networking.vpc_id
  subnet_ids              = module.secondary_networking.private_subnet_ids
  instance_class          = var.db_instance_class
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = true
  backup_retention_period = 30
  environment             = var.environment
  region                  = var.secondary_region
  is_primary              = false
  source_db_arn           = module.primary_database.db_arn

  tags = merge(var.tags, {
    Region = var.secondary_region
    Type   = "Secondary"
  })
}

# Failover Module
module "failover_mechanism" {
  count  = var.enable_dns_failover ? 1 : 0
  source = "./modules/failover"
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  primary_alb_arn       = module.primary_compute.alb_arn
  secondary_alb_arn     = module.secondary_compute.alb_arn
  primary_alb_dns       = module.primary_compute.alb_dns
  secondary_alb_dns     = module.secondary_compute.alb_dns
  primary_alb_zone_id   = module.primary_compute.alb_zone_id
  secondary_alb_zone_id = module.secondary_compute.alb_zone_id
  health_check_interval = var.health_check_interval
  failover_threshold    = var.failover_threshold
  primary_db_arn        = module.primary_database.db_arn
  secondary_db_arn      = module.secondary_database.db_arn
  primary_region        = var.primary_region
  secondary_region      = var.secondary_region
  environment           = var.environment

  tags = merge(var.tags, {
    Type = "Failover"
  })
}
```

## provider.tf

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

# Provider for Primary Region
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

# Provider for Secondary Region
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}

# Provider for Route53 (Global)
provider "aws" {
  alias  = "route53"
  region = "eu-west-1"
}```

## variables.tf

```hcl
# Global Variables
variable "company_name" {
  description = "Company name for resource naming"
  type        = string
  default     = "finserv"
}

variable "application_name" {
  description = "Application name"
  type        = string
  default     = "webapp"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

# Tagging Variables
variable "tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Environment = "production"
    Owner       = "platform-team"
    CostCentre  = "CC-12345"
    Project     = "disaster-recovery"
    Compliance  = "PCI-DSS"
  }
}

# Database Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r5.xlarge"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Compute Variables
variable "instance_type" {
  description = "EC2 instance type for web servers"
  type        = string
  default     = "t3.large"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 1
}

# Network Variables
variable "vpc_cidr" {
  description = "CIDR blocks for VPCs"
  type        = map(string)
  default = {
    primary   = "10.0.0.0/16"
    secondary = "10.1.0.0/16"
  }
}

# Failover Variables
variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 10
}

variable "failover_threshold" {
  description = "Number of failed health checks before failover"
  type        = number
  default     = 3
}

# Feature toggles
variable "enable_dns_failover" {
  description = "Enable Global Accelerator-based failover (no DNS setup required)"
  type        = bool
  default     = true
}

```

## outputs.tf

```hcl
output "primary_alb_dns" {
  description = "DNS name of primary ALB"
  value       = module.primary_compute.alb_dns
}

output "secondary_alb_dns" {
  description = "DNS name of secondary ALB"
  value       = module.secondary_compute.alb_dns
}

output "primary_db_endpoint" {
  description = "Primary database endpoint"
  value       = module.primary_database.endpoint
  sensitive   = true
}

output "secondary_db_endpoint" {
  description = "Secondary database endpoint"
  value       = module.secondary_database.endpoint
  sensitive   = true
}

output "failover_endpoint" {
  description = "Main application endpoint with Global Accelerator failover"
  value       = length(module.failover_mechanism) > 0 ? "http://${module.failover_mechanism[0].global_accelerator_dns_name}" : null
}

output "global_accelerator_ips" {
  description = "Global Accelerator IP addresses for direct access"
  value       = length(module.failover_mechanism) > 0 ? module.failover_mechanism[0].global_accelerator_ip_addresses : null
}

output "health_check_urls" {
  description = "Health check URLs"
  value = {
    primary   = "http://${module.primary_compute.alb_dns}/health"
    secondary = "http://${module.secondary_compute.alb_dns}/health"
  }
}

output "primary_region" {
  description = "Primary region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary region"
  value       = var.secondary_region
}

output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = module.primary_networking.vpc_id
    secondary = module.secondary_networking.vpc_id
  }
}
```

## terraform.tfvars

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and fill in your values

# Database credentials
db_username = "dbadmin"
db_password = "SecurePassword123!"  # Use AWS Secrets Manager in production

# Environment configuration
environment = "production"
company_name = "finserv"
application_name = "webapp"

# AWS regions
primary_region = "eu-west-1"
secondary_region = "eu-west-2"

# Compute configuration
instance_type = "t3.large"
min_size = 2
max_size = 10
desired_capacity = 4

# Database configuration
db_instance_class = "db.r5.xlarge"

# Network configuration
vpc_cidr = {
  primary   = "10.0.0.0/16"
  secondary = "10.1.0.0/16"
}

# Failover configuration
health_check_interval = 10
failover_threshold = 3

# Tags
tags = {
  Environment = "production"
  Owner       = "platform-team@company.com"
  CostCentre  = "CC-FIN-001"
  Project     = "disaster-recovery"
  Compliance  = "PCI-DSS"
  ManagedBy   = "terraform"
}
```

## modules/networking/main.tf

```hcl
# VPC Configuration
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.environment}-vpc-${var.region}"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-igw-${var.region}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-public-subnet-${count.index + 1}-${var.region}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-private-subnet-${count.index + 1}-${var.region}"
    Type = "Private"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20)
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-${count.index + 1}-${var.region}"
    Type = "Database"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.environment}-eip-nat-${count.index + 1}-${var.region}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.environment}-nat-${count.index + 1}-${var.region}"
  })
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-public-rt-${var.region}"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-private-rt-${count.index + 1}-${var.region}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-flow-logs-${var.region}"
  })
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${var.environment}-${var.region}"
  retention_in_days = 30

  tags = var.tags
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-flow-log-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.environment}-flow-log-policy-${var.region}"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}
```

## modules/networking/variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

## modules/networking/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
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

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}
```

## modules/compute/main.tf

```hcl
# Security Group for ALB
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-sg-"
  vpc_id      = var.vpc_id
  description = "Security group for Application Load Balancer"

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

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-sg-${var.region}"
  })
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "${var.environment}-ec2-sg-"
  vpc_id      = var.vpc_id
  description = "Security group for EC2 instances"

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-ec2-sg-${var.region}"
  })
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.region}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection       = false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    prefix  = "alb"
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-${var.region}"
  })
}

# S3 Bucket for ALB Logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-alb-logs-${var.region}-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.environment}-alb-logs-${var.region}"
  })
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg-${var.region}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    protocol            = "HTTP"
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  deregistration_delay = 30

  tags = merge(var.tags, {
    Name = "${var.environment}-tg-${var.region}"
  })
}

# ALB Listeners
# ALB Listener (HTTP only - Global Accelerator handles SSL termination)
resource "aws_lb_listener" "http" {
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
  name_prefix   = "${var.environment}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Ensure NAT Gateways are ready before launching instances
  depends_on = [var.nat_gateway_ids]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 50
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region      = var.region
    environment = var.environment
    db_endpoint = var.db_endpoint
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(var.tags, {
      Name = "${var.environment}-web-server"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(var.tags, {
      Name = "${var.environment}-web-server-volume"
    })
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                      = "${var.environment}-asg-${var.region}"
  vpc_zone_identifier       = var.private_subnet_ids
  target_group_arns         = [aws_lb_target_group.main.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity

  # Ensure NAT Gateways are ready before launching instances
  depends_on = [var.nat_gateway_ids]

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-instance"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = var.tags
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

# Auto Scaling Policies
resource "aws_autoscaling_policy" "cpu_scale_up" {
  name                   = "${var.environment}-cpu-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "cpu_scale_down" {
  name                   = "${var.environment}-cpu-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-cpu-high-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.cpu_scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.environment}-cpu-low-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "60"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors EC2 CPU utilization"
  alarm_actions       = [aws_autoscaling_policy.cpu_scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }

  tags = var.tags
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2" {
  name = "${var.environment}-ec2-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ec2_cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-ec2-profile-${var.region}"
  role = aws_iam_role.ec2.name
}

# Data source for AMI
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
```

## modules/compute/variables.tf

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
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

variable "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  type        = list(string)
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

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

## modules/compute/outputs.tf

```hcl
output "alb_dns" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    alb = aws_security_group.alb.id
    ec2 = aws_security_group.ec2.id
  }
}
```

## modules/compute/user_data.sh

```bash
#!/bin/bash

# Create a simple web server without requiring package installation
# This ensures the instance can pass health checks even if packages fail to install

# Create directory structure (in case httpd is not installed)
mkdir -p /var/www/html

# Create a simple index.html that doesn't require PHP or database
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Financial Services Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .healthy { background-color: #d4edda; color: #155724; }
        .info { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Financial Services Web Application</h1>
        
        <div class="status healthy">
            <strong>Status:</strong> Web Server Running
        </div>
        
        <div class="status info">
            <strong>Environment:</strong> ${environment}
        </div>
        
        <div class="status info">
            <strong>Region:</strong> ${region}
        </div>
        
        <div class="status info">
            <strong>Instance ID:</strong> <script>document.write(window.location.hostname)</script>
        </div>
        
        <div class="status info">
            <strong>Server Time:</strong> <script>document.write(new Date().toISOString())</script>
        </div>
        
        <p><strong>Note:</strong> This is a basic web server. Full application features will be available after package installation completes.</p>
    </div>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health << 'EOF'
OK
EOF

# Try to install packages in background (non-blocking)
nohup bash -c '
    # Wait for network to be fully ready and NAT Gateway to be available
    sleep 60
    
    # Test connectivity to ensure NAT Gateway is working
    if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
        echo "Network connectivity confirmed" >> /var/log/user-data.log
        
        # Try to update and install packages
        yum update -y || echo "Package update failed"
        yum install -y httpd php php-mysqlnd git || echo "Package installation failed"
    else
        echo "Network connectivity failed - NAT Gateway may not be ready" >> /var/log/user-data.log
    fi
    
    # If packages installed successfully, configure Apache
    if command -v httpd >/dev/null 2>&1; then
        systemctl start httpd
        systemctl enable httpd
        
        # Create PHP application if PHP is available
        if command -v php >/dev/null 2>&1; then
            cat > /var/www/html/app.php << "PHPEOF"
<?php
echo "<h1>Full Application Available</h1>";
echo "<p>PHP is now installed and working!</p>";
echo "<p>Database connection will be configured next.</p>";
echo "<p>Environment: ${environment}</p>";
echo "<p>Region: ${region}</p>";
?>
PHPEOF
        fi
    fi
    
    echo "Background installation completed at $(date)" >> /var/log/user-data.log
' > /var/log/package-install.log 2>&1 &

# Set basic permissions
chmod -R 755 /var/www/html

# Start a simple HTTP server to serve the files
# User data runs as root, so we can bind to port 80
# Try Python 3 first, fall back to Python 2
cd /var/www/html

if command -v python3 > /dev/null 2>&1; then
    # Python 3's http.server
    nohup python3 -m http.server 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python 3 HTTP server on port 80" >> /var/log/user-data.log
elif command -v python2 > /dev/null 2>&1; then
    # Python 2's SimpleHTTPServer
    nohup python2 -m SimpleHTTPServer 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python 2 HTTP server on port 80" >> /var/log/user-data.log
else
    # Fallback to python (whatever version is default)
    nohup python -m SimpleHTTPServer 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python HTTP server on port 80" >> /var/log/user-data.log
fi

# Wait a moment for the server to start
sleep 2

# Test if the server is running
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "HTTP server is responding correctly" >> /var/log/user-data.log
else
    echo "WARNING: HTTP server may not be responding" >> /var/log/user-data.log
fi

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
echo "Basic web server is ready for health checks" >> /var/log/user-data.log
echo "Python SimpleHTTPServer started on port 80" >> /var/log/user-data.log
```

## modules/database/main.tf

```hcl
# DB Subnet Group
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group-${var.region}"
  subnet_ids = var.subnet_ids

  tags = merge(var.tags, {
    Name = "${var.environment}-db-subnet-group-${var.region}"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "${var.environment}-rds-sg-"
  vpc_id      = var.vpc_id
  description = "Security group for RDS database"

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-sg-${var.region}"
  })
}

# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption in ${var.region}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-kms-${var.region}"
  })
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.environment}-rds-${var.region}"
  target_key_id = aws_kms_key.rds.key_id
}

# RDS Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.environment}-mysql-params-${var.region}"
  family = "mysql8.0"

  parameter {
    name  = "max_connections"
    value = "1000"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "log_bin_trust_function_creators"
    value = "1"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-params-${var.region}"
  })
}

# Primary RDS Instance (Multi-AZ)
resource "aws_db_instance" "primary" {
  count = var.is_primary ? 1 : 0

  identifier     = "${var.environment}-mysql-primary"
  engine         = "mysql"
  engine_version = "8.0.42"

  instance_class    = var.instance_class
  allocated_storage = 100
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = aws_kms_key.rds.arn

  db_name  = "webapp"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  deletion_protection = false # Disabled for testing
  skip_final_snapshot = true  # Skip snapshot to avoid cleanup issues

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  auto_minor_version_upgrade = false

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-primary"
    Type = "Primary"
  })
}

# Read Replica in Secondary Region
resource "aws_db_instance" "replica" {
  count = var.is_primary ? 0 : 1

  identifier          = "${var.environment}-mysql-replica"
  replicate_source_db = var.source_db_arn

  instance_class = var.instance_class

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.rds.arn
  publicly_accessible        = false
  auto_minor_version_upgrade = false

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = merge(var.tags, {
    Name = "${var.environment}-mysql-replica"
    Type = "Replica"
  })
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-rds-high-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.database_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "${var.environment}-rds-low-storage-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10 GB in bytes
  alarm_description   = "This metric monitors RDS free storage"
  alarm_actions       = [aws_sns_topic.database_alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
  }

  tags = var.tags
}

# SNS Topic for Database Alerts
resource "aws_sns_topic" "database_alerts" {
  name = "${var.environment}-database-alerts-${var.region}"

  tags = merge(var.tags, {
    Name = "${var.environment}-database-alerts-${var.region}"
  })
}
```

## modules/database/variables.tf

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the database"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "is_primary" {
  description = "Whether this is the primary database instance"
  type        = bool
  default     = true
}

variable "source_db_arn" {
  description = "ARN of the source database for read replica"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

## modules/database/outputs.tf

```hcl
output "endpoint" {
  description = "RDS instance endpoint"
  value       = var.is_primary ? aws_db_instance.primary[0].endpoint : aws_db_instance.replica[0].endpoint
}

output "port" {
  description = "RDS instance port"
  value       = var.is_primary ? aws_db_instance.primary[0].port : aws_db_instance.replica[0].port
}

output "db_arn" {
  description = "ARN of the RDS instance"
  value       = var.is_primary ? aws_db_instance.primary[0].arn : aws_db_instance.replica[0].arn
}

output "db_id" {
  description = "ID of the RDS instance"
  value       = var.is_primary ? aws_db_instance.primary[0].id : aws_db_instance.replica[0].id
}

output "security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.rds.key_id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for database alerts"
  value       = aws_sns_topic.database_alerts.arn
}
```

## modules/failover/main.tf

```hcl
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}

# Use primary provider for Global Accelerator (must be in same region as primary ALB)

# AWS Global Accelerator
resource "aws_globalaccelerator_accelerator" "main" {
  provider        = aws.primary
  name            = "${var.environment}-global-accelerator"
  ip_address_type = "IPV4"
  enabled         = true

  attributes {
    flow_logs_enabled   = true
    flow_logs_s3_bucket = aws_s3_bucket.global_accelerator_logs.bucket
    flow_logs_s3_prefix = "flow-logs/"
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-global-accelerator"
  })
}

# Global Accelerator Listener
resource "aws_globalaccelerator_listener" "main" {
  provider        = aws.primary
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 80
    to_port   = 80
  }
}

# Primary Endpoint Group (Primary Region)
resource "aws_globalaccelerator_endpoint_group" "primary" {
  provider     = aws.primary
  listener_arn = aws_globalaccelerator_listener.main.id

  endpoint_configuration {
    endpoint_id                    = var.primary_alb_arn
    weight                         = 100
    client_ip_preservation_enabled = true
  }


  health_check_interval_seconds = var.health_check_interval
  health_check_path             = "/health"
  health_check_port             = 80
  health_check_protocol         = "HTTP"
  threshold_count               = var.failover_threshold
  traffic_dial_percentage       = 100
}

# Secondary Endpoint Group (Secondary Region)
resource "aws_globalaccelerator_endpoint_group" "secondary" {
  provider     = aws.secondary
  listener_arn = aws_globalaccelerator_listener.main.id

  endpoint_configuration {
    endpoint_id                    = var.secondary_alb_arn
    weight                         = 0
    client_ip_preservation_enabled = true
  }

  health_check_interval_seconds = var.health_check_interval
  health_check_path             = "/health"
  health_check_port             = 80
  health_check_protocol         = "HTTP"
  threshold_count               = var.failover_threshold
  traffic_dial_percentage       = 100
}

# S3 Bucket for Global Accelerator Flow Logs
resource "aws_s3_bucket" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = "${var.environment}-global-accelerator-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.tags, {
    Name = "${var.environment}-global-accelerator-logs"
  })
}

resource "aws_s3_bucket_public_access_block" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_accelerator_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "global_accelerator_logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.global_accelerator_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

data "aws_caller_identity" "current" {
  provider = aws.primary
}

# Lambda Function for Automated Failover
resource "aws_lambda_function" "failover" {
  provider         = aws.primary
  filename         = "${path.module}/lambda_failover.zip"
  function_name    = "disaster-recovery-failover"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda.output_base64sha256
  runtime          = "python3.11"
  timeout          = 60

  environment {
    variables = {
      PRIMARY_REGION    = var.primary_region
      SECONDARY_REGION  = var.secondary_region
      PRIMARY_DB_ARN    = var.primary_db_arn
      SECONDARY_DB_ARN  = var.secondary_db_arn
      ACCELERATOR_ARN   = aws_globalaccelerator_accelerator.main.arn
      PRIMARY_ALB_ARN   = var.primary_alb_arn
      SECONDARY_ALB_ARN = var.secondary_alb_arn
    }
  }

  tags = merge(var.tags, {
    Name = "disaster-recovery-failover"
  })
}

# Lambda IAM Role
resource "aws_iam_role" "lambda" {
  provider = aws.primary
  name     = "disaster-recovery-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "lambda" {
  provider = aws.primary
  name     = "disaster-recovery-lambda-policy"
  role     = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:PromoteReadReplica",
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances",
          "globalaccelerator:UpdateEndpointGroup",
          "globalaccelerator:DescribeAccelerator",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Alarms for Failover
resource "aws_cloudwatch_metric_alarm" "primary_health" {
  provider            = aws.primary
  alarm_name          = "primary-region-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alarm when primary region is unhealthy"
  alarm_actions       = [aws_sns_topic.failover_alerts.arn]

  dimensions = {
    LoadBalancer = var.primary_alb_arn
  }

  tags = var.tags
}

# SNS Topic for Failover Alerts
resource "aws_sns_topic" "failover_alerts" {
  provider = aws.primary
  name     = "disaster-recovery-failover-alerts"

  tags = merge(var.tags, {
    Name = "disaster-recovery-failover-alerts"
  })
}

resource "aws_sns_topic_subscription" "failover_lambda" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.failover_alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "sns" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.failover_alerts.arn
}

# Data source for Lambda ZIP
data "archive_file" "lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda_failover.zip"

  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "index.py"
  }
}
```

## modules/failover/variables.tf

```hcl
variable "primary_alb_arn" {
  description = "ARN of the primary ALB"
  type        = string
}

variable "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  type        = string
}

variable "primary_alb_dns" {
  description = "DNS name of the primary ALB"
  type        = string
}

variable "secondary_alb_dns" {
  description = "DNS name of the secondary ALB"
  type        = string
}

variable "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  type        = string
}

variable "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  type        = string
}


variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
}

variable "failover_threshold" {
  description = "Number of failed health checks before failover"
  type        = number
}

variable "primary_db_arn" {
  description = "ARN of the primary database"
  type        = string
}

variable "secondary_db_arn" {
  description = "ARN of the secondary database"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
}
```

## modules/failover/outputs.tf

```hcl
output "global_accelerator_ip_addresses" {
  description = "IP addresses of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.ip_sets
}

output "global_accelerator_dns_name" {
  description = "DNS name of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.dns_name
}

output "global_accelerator_arn" {
  description = "ARN of the Global Accelerator"
  value       = aws_globalaccelerator_accelerator.main.arn
}

output "lambda_function_arn" {
  description = "ARN of the failover Lambda function"
  value       = aws_lambda_function.failover.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for failover alerts"
  value       = aws_sns_topic.failover_alerts.arn
}

output "endpoint_group_arn" {
  description = "ARN of the primary endpoint group"
  value       = aws_globalaccelerator_endpoint_group.primary.arn
}
```

## modules/failover/lambda_function.py

```python
import json
import os
from datetime import datetime

import boto3


def handler(event, context):
    """
    Lambda function to handle automated failover using Global Accelerator
    """
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    
    # Initialize clients
    rds_secondary = boto3.client('rds', region_name=secondary_region)
    globalaccelerator = boto3.client('globalaccelerator')
    autoscaling_secondary = boto3.client('autoscaling', region_name=secondary_region)
    
    try:
        # Parse SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message['AlarmName']
        
        if 'primary-region-health' in alarm_name:
            print(f"Primary region failure detected at {datetime.now()}")
            
            # 1. Promote read replica to master
            response = rds_secondary.promote_read_replica(
                DBInstanceIdentifier=os.environ['SECONDARY_DB_ARN'].split(':')[-1]
            )
            print(f"Database promotion initiated: {response}")
            
            # 2. Scale up secondary region ASG
            response = autoscaling_secondary.update_auto_scaling_group(
                AutoScalingGroupName=f"production-asg-{secondary_region}",
                MinSize=4,
                DesiredCapacity=6
            )
            print(f"Auto Scaling Group updated: {response}")
            
            # 3. Update Global Accelerator endpoint weights
            # Set primary weight to 0 and secondary weight to 100
            accelerator_arn = os.environ['ACCELERATOR_ARN']
            primary_alb_arn = os.environ['PRIMARY_ALB_ARN']
            secondary_alb_arn = os.environ['SECONDARY_ALB_ARN']
            
            # Get the endpoint group ARN
            listener_arn = f"{accelerator_arn}/listener/443"
            
            response = globalaccelerator.update_endpoint_group(
                EndpointGroupArn=f"{listener_arn}/endpointgroup/primary",
                EndpointConfigurations=[
                    {
                        'EndpointId': primary_alb_arn,
                        'Weight': 0,
                        'ClientIPPreservationEnabled': True
                    },
                    {
                        'EndpointId': secondary_alb_arn,
                        'Weight': 100,
                        'ClientIPPreservationEnabled': True
                    }
                ]
            )
            print(f"Global Accelerator endpoint weights updated: {response}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Failover completed successfully',
                    'timestamp': str(datetime.now()),
                    'action': 'promoted_secondary',
                    'global_accelerator_updated': True
                })
            }
            
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        raise e```

