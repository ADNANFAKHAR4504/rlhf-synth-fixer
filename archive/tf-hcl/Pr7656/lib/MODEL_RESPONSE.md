# Terraform Infrastructure for E-Commerce Product Catalog API

This solution provides a complete Terraform configuration for deploying a highly available, auto-scaling web application API infrastructure on AWS.

## File: lib/main.tf

```hcl
# Data source for latest Amazon Linux 2 AMI
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

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "vpc-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "igw-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}

# Public Subnets (2 AZs)
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name    = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Project = "e-commerce-api"
    Type    = "public"
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "public-rt-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "alb-sg-${var.environment_suffix}"
    Project = "e-commerce-api"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances - only allow traffic from ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "ec2-sg-${var.environment_suffix}"
    Project = "e-commerce-api"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name    = "alb-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name_prefix = "tg-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  stickiness {
    enabled         = true
    type            = "lb_cookie"
    cookie_duration = 86400
  }

  deregistration_delay = 30

  tags = {
    Name    = "tg-${var.environment_suffix}"
    Project = "e-commerce-api"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ALB Listener - HTTPS (placeholder for future SSL certificate)
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ALB Listener Rule for API versioning (path-based routing)
resource "aws_lb_listener_rule" "api_v1" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  condition {
    path_pattern {
      values = ["/api/v1/*"]
    }
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2.id]

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Update system
    yum update -y

    # Install necessary packages
    yum install -y httpd

    # Create a simple API service
    cat > /var/www/html/index.html <<'HTML'
    <!DOCTYPE html>
    <html>
    <head><title>Product Catalog API</title></head>
    <body>
      <h1>E-Commerce Product Catalog API</h1>
      <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
      <p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
    </body>
    </html>
    HTML

    # Create health check endpoint
    cat > /var/www/html/health <<'HTML'
    OK
    HTML

    # Start and enable httpd
    systemctl start httpd
    systemctl enable httpd

    # Enable CloudWatch Logs (optional)
    yum install -y awslogs
    systemctl start awslogsd
    systemctl enable awslogsd
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "api-instance-${var.environment_suffix}"
      Project = "e-commerce-api"
    }
  }

  tags = {
    Name    = "lt-${var.environment_suffix}"
    Project = "e-commerce-api"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name_prefix         = "asg-${var.environment_suffix}-"
  vpc_zone_identifier = aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 6
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  enabled_metrics = [
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupMaxSize",
    "GroupMinSize",
    "GroupPendingInstances",
    "GroupStandbyInstances",
    "GroupTerminatingInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "asg-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "e-commerce-api"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policy - Target Tracking (CPU)
resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "cpu-target-tracking-${var.environment_suffix}"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# CloudWatch Alarms for monitoring
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = []

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  tags = {
    Name    = "high-cpu-alarm-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}

resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "unhealthy-hosts-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "This metric monitors unhealthy hosts in target group"
  alarm_actions       = []

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = aws_lb_target_group.app.arn_suffix
  }

  tags = {
    Name    = "unhealthy-hosts-alarm-${var.environment_suffix}"
    Project = "e-commerce-api"
  }
}
```

## File: lib/outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.app.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app.id
}

output "api_endpoint" {
  description = "API endpoint URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "health_check_endpoint" {
  description = "Health check endpoint URL"
  value       = "http://${aws_lb.main.dns_name}/health"
}
```

## File: lib/README.md

```markdown
# E-Commerce Product Catalog API Infrastructure

This Terraform configuration deploys a highly available, auto-scaling web application API infrastructure on AWS.

## Architecture

- **VPC**: Custom VPC with CIDR 10.0.0.0/16
- **Subnets**: 2 public subnets across 2 availability zones
- **Load Balancer**: Application Load Balancer (ALB) in public subnets
- **Compute**: Auto Scaling Group with EC2 t3.micro instances (min 2, max 6)
- **Scaling**: Target tracking policy maintaining 70% CPU utilization
- **Security**: Separate security groups for ALB and EC2 instances
- **Monitoring**: CloudWatch alarms for CPU and unhealthy hosts

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS Provider >= 5.0

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review the Plan

```bash
terraform plan -var="environment_suffix=dev"
```

### 3. Apply the Configuration

```bash
terraform apply -var="environment_suffix=dev"
```

### 4. Get Outputs

```bash
terraform output alb_dns_name
terraform output api_endpoint
```

## Testing

### Health Check

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS/health
```

### API Endpoint

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS
```

### Monitor Auto Scaling

```bash
# Get Auto Scaling Group name
ASG_NAME=$(terraform output -raw autoscaling_group_name)

# Describe Auto Scaling Group
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME

# View scaling activities
aws autoscaling describe-scaling-activities --auto-scaling-group-name $ASG_NAME
```

## Configuration

### Variables

- `aws_region`: AWS region (default: us-east-1)
- `environment_suffix`: Environment suffix for resource naming (required for uniqueness)
- `repository`: Repository name for tagging
- `commit_author`: Commit author for tagging
- `pr_number`: PR number for tagging
- `team`: Team name for tagging

### Outputs

- `alb_dns_name`: DNS name of the Application Load Balancer
- `target_group_arn`: ARN of the target group
- `api_endpoint`: Full API endpoint URL
- `health_check_endpoint`: Health check endpoint URL
- `autoscaling_group_name`: Name of the Auto Scaling Group

## Features

### High Availability

- Instances deployed across 2 availability zones
- Application Load Balancer distributes traffic
- Health checks ensure only healthy instances receive traffic

### Auto Scaling

- Minimum 2 instances for redundancy
- Maximum 6 instances for cost control
- Target tracking policy maintains 70% CPU utilization
- Automatic scale-out during high load
- Automatic scale-in during low load

### Security

- ALB accepts HTTP/HTTPS from internet (0.0.0.0/0)
- EC2 instances only accept traffic from ALB security group
- No direct internet access to EC2 instances
- Principle of least privilege

### Monitoring

- CloudWatch alarm for high CPU utilization (>80%)
- CloudWatch alarm for unhealthy hosts
- Detailed monitoring enabled on all instances
- Auto Scaling metrics published to CloudWatch

### Session Persistence

- Sticky sessions enabled with 24-hour cookie duration
- Ensures user sessions remain on same instance

### Path-Based Routing

- Listener rule configured for /api/v1/* paths
- Supports API versioning for future expansion

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=dev"
```

## Cost Optimization

- Uses t3.micro instances (cost-effective)
- Auto Scaling ensures minimum resources during low traffic
- No NAT Gateways (all instances in public subnets)
- No additional data transfer costs

## Troubleshooting

### Instances Not Healthy

Check security group rules and health check configuration:

```bash
aws elbv2 describe-target-health --target-group-arn $(terraform output -raw target_group_arn)
```

### Auto Scaling Not Working

Verify scaling policy and CloudWatch metrics:

```bash
aws autoscaling describe-policies --auto-scaling-group-name $(terraform output -raw autoscaling_group_name)
```

### Connection Issues

Ensure ALB is active and has healthy targets:

```bash
aws elbv2 describe-load-balancers --load-balancer-arns $(terraform output -raw alb_arn)
```

## Notes

- All resources are tagged with `environment_suffix` for easy identification
- Deletion protection is disabled for easy cleanup
- Latest Amazon Linux 2 AMI is automatically selected
- User data script installs and configures Apache httpd
- Health check endpoint returns "OK" at /health
