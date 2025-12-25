# Ideal Response - TAP Stack Infrastructure

## Overview

This Terraform configuration implements a complete three-tier AWS infrastructure including VPC networking, Application Load Balancer, Auto Scaling Group with EC2 instances, and CloudWatch monitoring. The implementation is designed to work with LocalStack Community for testing while maintaining production-ready patterns.

## Architecture

The infrastructure consists of the following components:

### Networking Layer
- VPC with 10.0.0.0/16 CIDR block
- 2 public subnets across 2 availability zones
- 2 private subnets across 2 availability zones
- Internet Gateway for public subnet internet access
- NAT Gateway for private subnet outbound connectivity
- Public and private route tables with appropriate associations

### Security Layer
- ALB Security Group allowing HTTP/HTTPS inbound from anywhere
- Application Security Group allowing HTTP only from ALB
- All security groups allow full egress

### Load Balancing Layer (Conditional - requires LocalStack Pro)
- Application Load Balancer in public subnets
- Target Group with health checks on port 80
- HTTP Listener forwarding to target group

### Compute Layer
- Launch Template with Amazon Linux 2 AMI
- User data script installing httpd web server
- Auto Scaling Group spanning private subnets
- Desired capacity of 2, minimum 2, maximum 4 instances

### Monitoring Layer (Conditional)
- CloudWatch CPU high alarm triggering scale out
- CloudWatch CPU low alarm triggering scale in
- ALB unhealthy targets alarm (requires both alarms and load balancer enabled)

## LocalStack Compatibility

This configuration includes conditional resources for LocalStack Community compatibility:

- `enable_load_balancer` (default: false) - ELBv2 requires LocalStack Pro
- `enable_cloudwatch_alarms` (default: false) - CloudWatch alarms have limited support

For production AWS deployment, set both variables to true.

## Complete Terraform Code

### File: lib/tap_stack.tf

```hcl
############################################
# VARIABLES
############################################
variable "project_name" {
  description = "Project identifier used in names and tags"
  type        = string
  default     = "tap"
}

variable "env" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Do NOT configure the provider here; your provider.tf uses this.
variable "aws_region" {
  description = "AWS region (used by provider in provider.tf)"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type for ASG"
  type        = string
  default     = "t3.micro"
}

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms (set to false for LocalStack Community)"
  type        = bool
  default     = false
}

variable "enable_load_balancer" {
  description = "Enable ALB/ELBv2 resources (set to false for LocalStack Community which requires Pro)"
  type        = bool
  default     = false
}

############################################
# DATA SOURCES
############################################
data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Amazon Linux 2 AMI (HVM x86_64, gp2)
data "aws_ami" "al2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

############################################
# LOCALS (names, AZs, CIDRs, tags, userdata)
############################################
locals {
  # Base naming
  name_prefix = "${var.project_name}-${var.env}"

  # Safe names for AWS resources with length limits (ALB/TG <= 32)
  lb_name  = substr("${local.name_prefix}-alb", 0, 32)
  tg_name  = substr("${local.name_prefix}-tg", 0, 32)
  asg_name = substr("${local.name_prefix}-asg", 0, 32)

  # First two AZs dynamically
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # /24s inside /16
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 1), # 10.0.1.0/24
    cidrsubnet(var.vpc_cidr, 8, 2), # 10.0.2.0/24
  ]
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 8, 101), # 10.0.101.0/24
    cidrsubnet(var.vpc_cidr, 8, 102), # 10.0.102.0/24
  ]

  # Consistent tags everywhere
  tags = {
    Project     = var.project_name
    Environment = var.env
    ManagedBy   = "Terraform"
  }

  # User data: install httpd, show instance-id (escape $ for TF)
  app_user_data = <<-EOT
    #!/bin/bash
    set -eux
    yum update -y
    yum install -y httpd
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    echo "<h1>${local.name_prefix} - Instance: $${INSTANCE_ID}</h1>" > /var/www/html/index.html
    systemctl enable httpd
    systemctl start httpd
  EOT
}

############################################
# NETWORKING: VPC, IGW, Subnets, NAT, Routes
############################################
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name_prefix}-igw" })
}

# Public subnets (auto-assign public IPs)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    Tier = "public"
  })
}

# Private subnets (no public IPs)
resource "aws_subnet" "private" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.private_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    Tier = "private"
  })
}

# Elastic IP for NAT (modern provider arg)
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = merge(local.tags, { Name = "${local.name_prefix}-nat-eip" })
}

# NAT Gateway in first public subnet
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = merge(local.tags, { Name = "${local.name_prefix}-nat" })
}

# Public route table -> IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name_prefix}-public-rt" })
}

resource "aws_route" "public_default" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private route table -> NAT
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${local.name_prefix}-private-rt" })
}

resource "aws_route" "private_default" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_assoc" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

############################################
# SECURITY GROUPs
############################################
# ALB SG: allow 80 (and 443 kept open for future TLS, harmless), all egress
resource "aws_security_group" "alb_sg" {
  name        = "${local.name_prefix}-alb-sg"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere (unused until TLS is added)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-alb-sg" })
}

# App/EC2 SG: allow port 80 only from ALB SG; all egress
resource "aws_security_group" "app_sg" {
  name        = "${local.name_prefix}-app-sg"
  description = "App instances security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-app-sg" })
}

############################################
# ALB + TARGET GROUP + HTTP LISTENER
# Note: ELBv2 requires LocalStack Pro
############################################
resource "aws_lb" "app" {
  count = var.enable_load_balancer ? 1 : 0

  name                       = local.lb_name
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_sg.id]
  subnets                    = [for s in aws_subnet.public : s.id]
  idle_timeout               = 60
  enable_deletion_protection = false
  enable_http2               = false
  tags                       = merge(local.tags, { Name = "${local.name_prefix}-alb" })
}

resource "aws_lb_target_group" "app_tg" {
  count = var.enable_load_balancer ? 1 : 0

  name        = local.tg_name
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    protocol            = "HTTP"
    path                = "/"
    matcher             = "200-399"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-tg" })
}

# Plain HTTP listener that forwards to the target group
resource "aws_lb_listener" "http_forward" {
  count = var.enable_load_balancer ? 1 : 0

  load_balancer_arn = aws_lb.app[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg[0].arn
  }
}

############################################
# COMPUTE: LAUNCH TEMPLATE + AUTO SCALING
############################################
resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = data.aws_ami.al2.id
  instance_type = var.instance_type
  user_data     = base64encode(local.app_user_data)

  monitoring { enabled = true }

  vpc_security_group_ids = [aws_security_group.app_sg.id]

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.tags, { Name = "${local.name_prefix}-app" })
  }
  tag_specifications {
    resource_type = "volume"
    tags          = merge(local.tags, { Name = "${local.name_prefix}-app-vol" })
  }

  tags = merge(local.tags, { Name = "${local.name_prefix}-lt" })
}

resource "aws_autoscaling_group" "app" {
  name                      = local.asg_name
  max_size                  = 4
  min_size                  = 2
  desired_capacity          = 2
  vpc_zone_identifier       = [for s in aws_subnet.private : s.id]
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  target_group_arns = var.enable_load_balancer ? [aws_lb_target_group.app_tg[0].arn] : []

  tag {
    key                 = "Name"
    value               = "${local.name_prefix}-app"
    propagate_at_launch = true
  }
  # Propagate standard tags at launch
  dynamic "tag" {
    for_each = local.tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle { create_before_destroy = true }
}

############################################
# SCALING POLICIES + CLOUDWATCH ALARMS
############################################
# Scale OUT if ASG avg CPU > 60% for 5 minutes
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${local.name_prefix}-scale-out"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
  policy_type            = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-cpu-high"
  alarm_description   = "Scale out when average CPU > 60% for 5 minutes"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  threshold           = 60

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions      = [aws_autoscaling_policy.scale_out.arn]
  treat_missing_data = "notBreaching"
  tags               = merge(local.tags, { Name = "${local.name_prefix}-cpu-high" })
}

# Scale IN if ASG avg CPU < 20% for 10 minutes (2x 300s)
resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${local.name_prefix}-scale-in"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 600
  policy_type            = "SimpleScaling"
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  count = var.enable_cloudwatch_alarms ? 1 : 0

  alarm_name          = "${local.name_prefix}-cpu-low"
  alarm_description   = "Scale in when average CPU < 20% for 10 minutes"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  comparison_operator = "LessThanThreshold"
  threshold           = 20

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions      = [aws_autoscaling_policy.scale_in.arn]
  treat_missing_data = "notBreaching"
  tags               = merge(local.tags, { Name = "${local.name_prefix}-cpu-low" })
}

# Alarm for unhealthy ALB targets (requires both alarms and load balancer enabled)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy" {
  count = var.enable_cloudwatch_alarms && var.enable_load_balancer ? 1 : 0

  alarm_name          = "${local.name_prefix}-alb-unhealthy-targets"
  alarm_description   = "ALB has one or more unhealthy targets"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "UnHealthyHostCount"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  comparison_operator = "GreaterThanOrEqualToThreshold"
  threshold           = 1

  dimensions = {
    TargetGroup  = aws_lb_target_group.app_tg[0].arn_suffix
    LoadBalancer = aws_lb.app[0].arn_suffix
  }

  treat_missing_data = "notBreaching"
  tags               = merge(local.tags, { Name = "${local.name_prefix}-alb-unhealthy" })
}

############################################
# OUTPUTS
############################################
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "VPC CIDR"
}

output "public_subnet_ids" {
  value       = [for s in aws_subnet.public : s.id]
  description = "Public subnet IDs"
}

output "private_subnet_ids" {
  value       = [for s in aws_subnet.private : s.id]
  description = "Private subnet IDs"
}

output "alb_dns_name" {
  value       = var.enable_load_balancer ? aws_lb.app[0].dns_name : ""
  description = "ALB DNS name"
}

output "target_group_arn" {
  value       = var.enable_load_balancer ? aws_lb_target_group.app_tg[0].arn : ""
  description = "ALB Target Group ARN"
}

output "asg_name" {
  value       = aws_autoscaling_group.app.name
  description = "Auto Scaling Group name"
}

output "alb_sg_id" {
  value       = aws_security_group.alb_sg.id
  description = "ALB Security Group ID"
}

output "app_sg_id" {
  value       = aws_security_group.app_sg.id
  description = "App/EC2 Security Group ID"
}
```

## Implementation Details

### Naming Strategy

All resources follow a consistent naming pattern using `${var.project_name}-${var.env}` as the base prefix. Resource names with AWS length limits use the `substr` function to ensure compliance.

### Availability Zone Selection

The implementation dynamically selects the first two available AZs using the `aws_availability_zones` data source and `slice` function. This ensures portability across regions.

### Subnet CIDR Calculation

Subnet CIDRs are calculated using the `cidrsubnet` function:
- Public subnets: 10.0.1.0/24 and 10.0.2.0/24
- Private subnets: 10.0.101.0/24 and 10.0.102.0/24

### Security Group Design

Security groups follow the principle of least privilege:
- ALB SG allows inbound HTTP/HTTPS from anywhere
- App SG allows inbound HTTP only from ALB SG
- Both allow all egress for internet connectivity

### Conditional Resources for LocalStack

Resources requiring LocalStack Pro are made conditional:
- ALB, Target Group, Listener: controlled by `enable_load_balancer`
- CloudWatch Alarms: controlled by `enable_cloudwatch_alarms`
- ALB Unhealthy Alarm: requires both flags enabled

### Auto Scaling Configuration

- Minimum 2 instances for high availability
- Maximum 4 instances for cost control
- Scale out when CPU exceeds 60% for 5 minutes
- Scale in when CPU drops below 20% for 10 minutes
- Target group attachment is conditional based on `enable_load_balancer`

## Testing

### Unit Tests

Unit tests validate the Terraform configuration structure including:
- Variable definitions with descriptions and defaults
- Data source configurations
- Resource block structures with conditional patterns
- Output definitions
- Tag patterns

### Integration Tests

Integration tests validate deployed resources against:
- VPC and subnet creation
- Security group rules
- ASG settings

## Outputs

| Output | Description |
|--------|-------------|
| vpc_id | VPC identifier |
| vpc_cidr | VPC CIDR block |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| alb_dns_name | ALB DNS name (empty if load balancer disabled) |
| target_group_arn | Target group ARN (empty if load balancer disabled) |
| asg_name | Auto Scaling Group name |
| alb_sg_id | ALB security group ID |
| app_sg_id | Application security group ID |

## Usage

### LocalStack Community Deployment

```bash
# Default: ALB and CloudWatch alarms disabled
./scripts/localstack-deploy.sh
./scripts/localstack-test.sh
```

### Production Deployment

For production AWS deployment:

```hcl
# terraform.tfvars
enable_load_balancer     = true
enable_cloudwatch_alarms = true
```

Additional production considerations:
1. Add ACM certificate and HTTPS listener
2. Add HTTP to HTTPS redirect
3. Configure Route53 DNS records for the ALB DNS name
4. Adjust instance_type for workload requirements
