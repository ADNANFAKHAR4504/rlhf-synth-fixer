# E-Commerce Product Catalog API - Terraform Infrastructure

This implementation provides a complete, production-ready Terraform configuration for deploying an e-commerce product catalog API on AWS with auto-scaling, load balancing, and SSL termination.

## File: lib/main.tf

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "nat-eip-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "private-rt-${var.environment_suffix}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${var.environment_suffix}-"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group for EC2 Instances
resource "aws_security_group" "ec2" {
  name_prefix = "ec2-sg-${var.environment_suffix}-"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ACM Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name = "acm-cert-${var.environment_suffix}"
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
    Name = "alb-${var.environment_suffix}"
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name_prefix = "tg-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  deregistration_delay = 30

  tags = {
    Name = "target-group-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ALB HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# Launch Template
resource "aws_launch_template" "main" {
  name_prefix   = "lt-${var.environment_suffix}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    
    # Create simple health check endpoint
    cat > /var/www/html/health <<'HEALTHEOF'
    OK
    HEALTHEOF
    
    # Create sample API response
    cat > /var/www/html/index.html <<'INDEXEOF'
    {"status": "running", "service": "product-catalog-api"}
    INDEXEOF
    
    systemctl restart httpd
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "ec2-instance-${var.environment_suffix}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "asg-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
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
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "ManagedBy"
    value               = "terraform"
    propagate_at_launch = true
  }
}

# Auto Scaling Policy - Scale Out
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "scale-out-${var.environment_suffix}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - High CPU (Scale Out)
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "This metric monitors EC2 CPU utilization for scale out"
  alarm_actions       = [aws_autoscaling_policy.scale_out.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# Auto Scaling Policy - Scale In
resource "aws_autoscaling_policy" "scale_in" {
  name                   = "scale-in-${var.environment_suffix}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarm - Low CPU (Scale In)
resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "low-cpu-${var.environment_suffix}"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "This metric monitors EC2 CPU utilization for scale in"
  alarm_actions       = [aws_autoscaling_policy.scale_in.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# Data source for existing RDS subnet group
data "aws_db_subnet_group" "existing" {
  name = var.rds_subnet_group_name
}
```

## File: lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|northwest|southwest)-[1-3]$", var.aws_region))
    error_message = "The aws_region must be a valid AWS region identifier."
  }
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development", "dev", "prod", "stage"], var.environment)
    error_message = "Environment must be one of: production, staging, development, dev, prod, stage."
  }
}

variable "project_name" {
  description = "Project name for resource identification"
  type        = string
  default     = "ecommerce-catalog-api"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure deployment uniqueness"
  type        = string
  
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment_suffix)) && length(var.environment_suffix) >= 3 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be 3-20 characters, containing only lowercase letters, numbers, and hyphens."
  }
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

# Instance Configuration
variable "instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.medium"

  validation {
    condition     = can(regex("^t3\\.(micro|small|medium|large|xlarge|2xlarge)$", var.instance_type))
    error_message = "Instance type must be a valid t3 family instance."
  }
}

# Auto Scaling Configuration
variable "asg_min_size" {
  description = "Minimum number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_min_size >= 2
    error_message = "Minimum ASG size must be at least 2 for high availability."
  }
}

variable "asg_max_size" {
  description = "Maximum number of instances in Auto Scaling Group"
  type        = number
  default     = 10

  validation {
    condition     = var.asg_max_size >= 2 && var.asg_max_size <= 20
    error_message = "Maximum ASG size must be between 2 and 20."
  }
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in Auto Scaling Group"
  type        = number
  default     = 2

  validation {
    condition     = var.asg_desired_capacity >= 2
    error_message = "Desired capacity must be at least 2."
  }
}

# SSL Configuration
variable "domain_name" {
  description = "Domain name for ACM certificate"
  type        = string
  default     = "api.example.com"

  validation {
    condition     = can(regex("^[a-z0-9.-]+\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid FQDN."
  }
}

# Database Configuration
variable "rds_subnet_group_name" {
  description = "Name of existing RDS subnet group to reference"
  type        = string
  default     = "prod-db-subnet-group"

  validation {
    condition     = length(var.rds_subnet_group_name) > 0
    error_message = "RDS subnet group name cannot be empty."
  }
}
```

## File: lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "nat_gateway_ip" {
  description = "Public IP address of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ec2_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}
```

## File: lib/terraform.tfvars.example

```hcl
# AWS Configuration
aws_region = "us-east-1"

# Environment Configuration
environment        = "production"
project_name       = "ecommerce-catalog-api"
environment_suffix = "prod-v1"

# Network Configuration
vpc_cidr = "10.0.0.0/16"

# Instance Configuration
instance_type = "t3.medium"

# Auto Scaling Configuration
asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

# SSL Configuration
domain_name = "api.example.com"

# Database Configuration
rds_subnet_group_name = "prod-db-subnet-group"
```

## File: lib/README.md

```markdown
# E-Commerce Product Catalog API - Terraform Infrastructure

This Terraform configuration deploys a highly available, auto-scaling e-commerce product catalog API on AWS with the following features:

- **High Availability**: Resources deployed across 2 availability zones
- **Auto Scaling**: CPU-based scaling (70% scale-out, 30% scale-in) from 2 to 10 instances
- **SSL Termination**: HTTPS support via Application Load Balancer with ACM certificate
- **Security**: Least privilege security groups, private subnet deployment
- **Monitoring**: CloudWatch detailed monitoring and auto-scaling metrics

## Architecture

```
Internet
    |
    v
Application Load Balancer (HTTPS:443)
    |
    v
Target Group (HTTP:80)
    |
    v
Auto Scaling Group (2-10 instances)
    |
    v
EC2 Instances (t3.medium, Amazon Linux 2023)
    |
    v
Existing RDS Database (via subnet group)
```

## Prerequisites

- Terraform >= 1.5
- AWS CLI configured with appropriate credentials
- Existing RDS subnet group named 'prod-db-subnet-group'
- Domain name for ACM certificate validation

## Quick Start

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix = "prod-v1"  # REQUIRED: Unique deployment identifier
domain_name        = "api.yourdomain.com"
```

### 3. Validate Configuration

```bash
terraform validate
terraform fmt -recursive
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 5. Apply Configuration

```bash
terraform apply tfplan
```

### 6. Complete ACM Certificate Validation

After deployment, you need to validate the ACM certificate:

1. Get the certificate validation records:
```bash
terraform output acm_certificate_arn
aws acm describe-certificate --certificate-arn <arn> --region us-east-1
```

2. Add the CNAME record to your DNS provider
3. Wait for validation (usually 5-30 minutes)

## Outputs

After successful deployment:

```bash
terraform output alb_dns_name          # Load balancer DNS name
terraform output autoscaling_group_name # Auto Scaling Group name
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example with `environment_suffix = "prod-v1"`:
- VPC: `vpc-prod-v1`
- ALB: `alb-prod-v1`
- ASG: `asg-prod-v1`

## Auto Scaling Behavior

- **Scale Out**: When CPU > 70% for 4 minutes, add 2 instances
- **Scale In**: When CPU < 30% for 4 minutes, remove 1 instance
- **Cooldown**: 5 minutes between scaling actions
- **Health Checks**: ELB health checks on `/health` endpoint

## Security Configuration

### ALB Security Group
- **Inbound**: HTTPS (443) from 0.0.0.0/0
- **Outbound**: All traffic

### EC2 Security Group
- **Inbound**: HTTP (80) from ALB security group only
- **Outbound**: All traffic

### Network Isolation
- EC2 instances in private subnets (no direct internet access)
- NAT Gateway for outbound connectivity
- ALB in public subnets for internet-facing access

## Monitoring

All EC2 instances have CloudWatch detailed monitoring enabled:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=$(terraform output -raw autoscaling_group_name) \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

## Testing

### Health Check

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl -k https://$ALB_DNS/health
```

Expected response: `OK`

### API Endpoint

```bash
curl -k https://$ALB_DNS/
```

Expected response: `{"status": "running", "service": "product-catalog-api"}`

## Troubleshooting

### Instances Not Registering with Target Group

```bash
# Check instance health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn)

# Check security groups
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw security_group_ec2_id)
```

### ACM Certificate Pending Validation

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw acm_certificate_arn) \
  --region us-east-1
```

Add the provided CNAME record to your DNS provider.

### Auto Scaling Not Triggering

```bash
# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix "high-cpu" \
  --region us-east-1

# Check ASG metrics
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(terraform output -raw autoscaling_group_name)
```

## Blue-Green Deployment Support

This infrastructure supports blue-green deployments through:

1. **Launch Template Versioning**: Create new launch template version
2. **ASG Update**: Update ASG to use new launch template version
3. **Gradual Rollout**: ASG will gradually replace instances
4. **Health Checks**: Unhealthy instances automatically terminated

### Example Blue-Green Update

```bash
# Update launch template (change AMI or user data)
# Then update ASG
aws autoscaling update-auto-scaling-group \
  --auto-scaling-group-name $(terraform output -raw autoscaling_group_name) \
  --launch-template LaunchTemplateId=$(terraform output -raw launch_template_id),Version='$Latest'

# Force instance refresh
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name $(terraform output -raw autoscaling_group_name)
```

## Cost Optimization

Estimated monthly costs (us-east-1, 2-10 instances):

- **EC2 Instances** (t3.medium): $60-$300/month
- **Application Load Balancer**: $22/month + data transfer
- **NAT Gateway**: $32/month + data transfer
- **Data Transfer**: Variable based on traffic
- **CloudWatch**: $3-$10/month

**Total**: ~$117-$364/month (excluding data transfer)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all infrastructure except the referenced RDS subnet group.

## Tags

All resources are tagged with:
- `Environment`: From `environment` variable
- `Project`: From `project_name` variable
- `ManagedBy`: "terraform"

## Compliance

- **AWS Well-Architected Framework**: Follows best practices for reliability, security, and cost optimization
- **High Availability**: Multi-AZ deployment
- **Security**: Least privilege security groups, private subnet deployment
- **Monitoring**: CloudWatch metrics and alarms enabled

## Support

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review security group rules
3. Verify RDS subnet group exists
4. Ensure ACM certificate is validated
```
