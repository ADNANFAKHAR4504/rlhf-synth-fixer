### Reasoning Trace
---

The user wants a comprehensive Terraform infrastructure setup for a blog platform with auto-scaling capabilities. Let me break down the requirements:

1. **VPC Setup**:
   - VPC with CIDR 10.0.0.0/16
   - Two public subnets: 10.0.1.0/24 and 10.0.2.0/24 across different AZs
   - Internet Gateway
   - Route tables configured for internet access

2. **Compute Layer**:
   - Auto Scaling Group with t3.micro instances
   - Application Load Balancer (ALB) - internet-facing on port 80
   - Launch template for EC2 instances

3. **Security**:
   - ALB security group: allows inbound HTTP (port 80) from 0.0.0.0/0
   - EC2 security group: only allows inbound from ALB security group
   - Outbound traffic allowed from EC2 instances

4. **IAM**:
   - EC2 role with CloudWatch metrics/logs permissions
   - SSM access for troubleshooting
   - Instance profile attached to launch template

5. **Auto-scaling & Monitoring**:
   - CloudWatch alarms for CPU utilization (scale out >70%, scale in <30%)
   - Alarm for request count (>1000 requests/min triggers scale out)
   - ASG: min=2, max=6, desired=2
   - Health checks via ALB target group

6. **File Organization**:
   - lib/provider.tf: Terraform and provider configuration
   - lib/main.tf: All other resources

7. **Additional Requirements**:
   - AWS provider version 5.0+
   - Default region: us-west-1 (configurable)
   - Random suffix for resource names
   - Specific outputs needed

Let me create these two files with all the requirements.

### Answer
---

I'll create a comprehensive Terraform infrastructure setup for your blog platform with auto-scaling capabilities. This will handle your 5,000 daily readers and scale automatically during traffic spikes.

## lib/provider.tf

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
      version = "~> 3.5"
    }
  }
  backend "s3" {
    
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "blog-platform"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}
```

## lib/main.tf

```hcl
# Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Locals
locals {
  common_tags = {
    Project     = "blog-platform"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  
  vpc_cidr = "10.0.0.0/16"
  public_subnet_cidrs = {
    az1 = "10.0.1.0/24"
    az2 = "10.0.2.0/24"
  }
  
  # Auto Scaling Configuration
  asg_min_size     = 2
  asg_max_size     = 6
  asg_desired_size = 2
  
  # CloudWatch Alarm Thresholds
  cpu_scale_out_threshold = 70
  cpu_scale_in_threshold  = 30
  request_count_threshold = 1000
}

# Random String for Unique Naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# ============================================================================
# VPC
# ============================================================================
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "blog-vpc-${random_string.suffix.result}"
  })
}

# ============================================================================
# Subnets
# ============================================================================
resource "aws_subnet" "public_az1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs.az1
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "blog-public-subnet-az1-${random_string.suffix.result}"
    Type = "public"
    AZ   = data.aws_availability_zones.available.names[0]
  })
}

resource "aws_subnet" "public_az2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs.az2
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "blog-public-subnet-az2-${random_string.suffix.result}"
    Type = "public"
    AZ   = data.aws_availability_zones.available.names[1]
  })
}

# ============================================================================
# Internet Gateway
# ============================================================================
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "blog-igw-${random_string.suffix.result}"
  })
}

# ============================================================================
# Route Tables
# ============================================================================
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "blog-public-rt-${random_string.suffix.result}"
    Type = "public"
  })
}

resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public.id
}

# ============================================================================
# Security Groups
# ============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "blog-alb-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"
  
  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    description     = "Allow traffic to EC2 instances"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "blog-alb-sg-${random_string.suffix.result}"
  })
}

# EC2 Security Group
resource "aws_security_group" "ec2" {
  name_prefix = "blog-ec2-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = merge(local.common_tags, {
    Name = "blog-ec2-sg-${random_string.suffix.result}"
  })
}

# EC2 Security Group Rules (separated to avoid circular dependency)
resource "aws_security_group_rule" "ec2_ingress_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.ec2.id
  description              = "Allow HTTP from ALB"
}

resource "aws_security_group_rule" "ec2_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ec2.id
  description       = "Allow all outbound traffic"
}

# ============================================================================
# IAM Role and Instance Profile
# ============================================================================
resource "aws_iam_role" "ec2" {
  name_prefix = "blog-ec2-role-"
  
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
    Name = "blog-ec2-role-${random_string.suffix.result}"
  })
}

# CloudWatch Metrics and Logs Policy
resource "aws_iam_role_policy" "ec2_cloudwatch" {
  name_prefix = "cloudwatch-"
  role        = aws_iam_role.ec2.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# SSM Managed Instance Core Policy Attachment
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name_prefix = "blog-ec2-profile-"
  role        = aws_iam_role.ec2.name
  
  tags = merge(local.common_tags, {
    Name = "blog-ec2-profile-${random_string.suffix.result}"
  })
}

# ============================================================================
# Launch Template
# ============================================================================
resource "aws_launch_template" "blog" {
  name_prefix   = "blog-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"
  
  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2.arn
  }
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Create a simple index page
    cat <<'INDEX' > /var/www/html/index.html
    <!DOCTYPE html>
    <html>
    <head><title>Blog Platform</title></head>
    <body>
      <h1>Blog Platform</h1>
      <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
      <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
    </body>
    </html>
    INDEX
    
    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name        = "blog-instance-${var.environment}-${random_string.suffix.result}"
      Environment = var.environment
      ASG         = "blog-asg-${random_string.suffix.result}"
    })
  }
  
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "optional"
    http_put_response_hop_limit = 1
  }
  
  monitoring {
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "blog-lt-${random_string.suffix.result}"
  })
}

# Data source for Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
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

# ============================================================================
# Application Load Balancer and Target Group
# ============================================================================
resource "aws_lb" "blog" {
  name_prefix        = "blog-"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]
  
  enable_deletion_protection = false
  enable_http2               = true
  
  tags = merge(local.common_tags, {
    Name = "blog-alb-${random_string.suffix.result}"
  })
}

resource "aws_lb_target_group" "blog" {
  name_prefix = "blog-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
  
  deregistration_delay = 300
  
  tags = merge(local.common_tags, {
    Name = "blog-tg-${random_string.suffix.result}"
  })
}

resource "aws_lb_listener" "blog" {
  load_balancer_arn = aws_lb.blog.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blog.arn
  }
}

# ============================================================================
# Auto Scaling Group
# ============================================================================
resource "aws_autoscaling_group" "blog" {
  name_prefix         = "blog-asg-"
  vpc_zone_identifier = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]
  
  min_size         = local.asg_min_size
  max_size         = local.asg_max_size
  desired_capacity = local.asg_desired_size
  
  health_check_type         = "ELB"
  health_check_grace_period = 300
  
  launch_template {
    id      = aws_launch_template.blog.id
    version = "$Latest"
  }
  
  target_group_arns = [aws_lb_target_group.blog.arn]
  
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
    value               = "blog-asg-instance-${random_string.suffix.result}"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
  
  tag {
    key                 = "AutoScalingGroup"
    value               = "blog-asg-${random_string.suffix.result}"
    propagate_at_launch = true
  }
  
  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "blog-scale-out-${random_string.suffix.result}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.blog.name
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "blog-scale-in-${random_string.suffix.result}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.blog.name
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

# CPU Utilization Scale Out Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "blog-cpu-high-${random_string.suffix.result}"
  alarm_description   = "Triggers when CPU utilization is above ${local.cpu_scale_out_threshold}%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = local.cpu_scale_out_threshold
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.blog.name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_out.arn]
  
  tags = merge(local.common_tags, {
    Name = "blog-cpu-high-alarm-${random_string.suffix.result}"
  })
}

# CPU Utilization Scale In Alarm
resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "blog-cpu-low-${random_string.suffix.result}"
  alarm_description   = "Triggers when CPU utilization is below ${local.cpu_scale_in_threshold}%"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 600
  statistic           = "Average"
  threshold           = local.cpu_scale_in_threshold
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.blog.name
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_in.arn]
  
  tags = merge(local.common_tags, {
    Name = "blog-cpu-low-alarm-${random_string.suffix.result}"
  })
}

# Request Count Alarm
resource "aws_cloudwatch_metric_alarm" "request_count_high" {
  alarm_name          = "blog-request-count-high-${random_string.suffix.result}"
  alarm_description   = "Triggers when request count exceeds ${local.request_count_threshold} per minute"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "RequestCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = local.request_count_threshold
  
  dimensions = {
    LoadBalancer = aws_lb.blog.arn_suffix
  }
  
  alarm_actions = [aws_autoscaling_policy.scale_out.arn]
  
  tags = merge(local.common_tags, {
    Name = "blog-request-count-alarm-${random_string.suffix.result}"
  })
}

# ============================================================================
# Outputs
# ============================================================================
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.blog.dns_name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "IDs of the public subnets"
  value = {
    public_az1 = aws_subnet.public_az1.id
    public_az2 = aws_subnet.public_az2.id
  }
}

output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    alb = aws_security_group.alb.id
    ec2 = aws_security_group.ec2.id
  }
}

output "asg_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.blog.name
}

output "cloudwatch_alarm_arns" {
  description = "ARNs of the CloudWatch alarms"
  value = {
    cpu_high         = aws_cloudwatch_metric_alarm.cpu_high.arn
    cpu_low          = aws_cloudwatch_metric_alarm.cpu_low.arn
    request_count_high = aws_cloudwatch_metric_alarm.request_count_high.arn
  }
}
```

## Key Features Implemented

### 🚀 **Auto-Scaling Architecture**
- **Elastic scaling**: Automatically adjusts capacity between 2-6 instances based on load
- **Multi-AZ deployment**: Ensures high availability across two availability zones
- **Health checks**: Automatic instance replacement when health checks fail

### 🔒 **Security**
- **Defense in depth**: ALB acts as the only public entry point
- **Least privilege**: EC2 instances can only be accessed through the ALB
- **IAM roles**: Secure CloudWatch and SSM access without hardcoded credentials

### 📊 **Monitoring & Alerting**
- **CPU-based scaling**: Scale out at 70% CPU, scale in at 30%
- **Request-based scaling**: Additional scaling trigger at 1,000 requests/minute
- **CloudWatch integration**: Full metrics and logging capabilities

### 💰 **Cost Optimization**
- **t3.micro instances**: Cost-effective for your traffic pattern
- **Auto-scaling**: Only pay for what you need during traffic spikes
- **Cooldown periods**: Prevents flapping and unnecessary scaling events

## Deployment Instructions

1. **Initialize Terraform**:
```bash
cd lib
terraform init
```

2. **Review the plan**:
```bash
terraform plan
```

3. **Deploy the infrastructure**:
```bash
terraform apply
```

4. **Access your blog**:
After deployment, use the `alb_dns_name` output to access your blog platform:
```bash
terraform output alb_dns_name
```

## Testing the Auto-Scaling

To verify the auto-scaling works:

1. **Generate load** using a tool like Apache Bench:
```bash
ab -n 10000 -c 100 http://<alb_dns_name>/
```

2. **Monitor scaling events** in the AWS Console:
   - Check EC2 Auto Scaling Groups
   - View CloudWatch Alarms
   - Monitor ALB Target Health

3. **Verify scale-in** by waiting for traffic to decrease and watching instances terminate

The infrastructure is now ready to handle your blog's traffic patterns, automatically scaling to meet demand while maintaining high availability and security.