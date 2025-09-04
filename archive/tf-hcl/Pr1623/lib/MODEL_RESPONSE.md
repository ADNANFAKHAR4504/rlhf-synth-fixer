# Multi-Region Highly Available Web Application on AWS

I'll create a complete, modular Terraform configuration for deploying a highly available web application across two AWS regions with automatic failover capabilities.

## Project Structure

```
terraform-multi-region-app/
├── main.tf
├── variables.tf
├── terraform.tfvars
├── outputs.tf
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── load-balancer/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── dns/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
```

## Root Configuration Files

### `main.tf`

```hcl
# Provider configuration with aliases for multi-region deployment
# Using aliases allows us to deploy resources across multiple regions
# from a single Terraform configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Region      = "primary"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Region      = "secondary"
    }
  }
}

# Data sources for availability zones
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

# VPC Module - Primary Region
module "vpc_primary" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_cidr             = var.primary_vpc_cidr
  availability_zones   = data.aws_availability_zones.primary.names
  environment         = var.environment
  region_name         = "primary"
}

# VPC Module - Secondary Region
module "vpc_secondary" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_cidr             = var.secondary_vpc_cidr
  availability_zones   = data.aws_availability_zones.secondary.names
  environment         = var.environment
  region_name         = "secondary"
}

# Load Balancer Module - Primary Region
module "load_balancer_primary" {
  source = "./modules/load-balancer"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id              = module.vpc_primary.vpc_id
  public_subnet_ids   = module.vpc_primary.public_subnet_ids
  environment        = var.environment
  region_name        = "primary"
}

# Load Balancer Module - Secondary Region
module "load_balancer_secondary" {
  source = "./modules/load-balancer"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_id              = module.vpc_secondary.vpc_id
  public_subnet_ids   = module.vpc_secondary.public_subnet_ids
  environment        = var.environment
  region_name        = "secondary"
}

# Compute Module - Primary Region
module "compute_primary" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id                = module.vpc_primary.vpc_id
  private_subnet_ids    = module.vpc_primary.private_subnet_ids
  alb_target_group_arn  = module.load_balancer_primary.target_group_arn
  alb_security_group_id = module.load_balancer_primary.alb_security_group_id
  environment          = var.environment
  region_name          = "primary"
  instance_type        = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
}

# Compute Module - Secondary Region
module "compute_secondary" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_id                = module.vpc_secondary.vpc_id
  private_subnet_ids    = module.vpc_secondary.private_subnet_ids
  alb_target_group_arn  = module.load_balancer_secondary.target_group_arn
  alb_security_group_id = module.load_balancer_secondary.alb_security_group_id
  environment          = var.environment
  region_name          = "secondary"
  instance_type        = var.instance_type
  min_size            = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity    = var.asg_desired_capacity
}

# DNS Module for Route 53 failover routing
# This module sets up health checks and failover routing between regions
module "dns" {
  source = "./modules/dns"
  
  # DNS is a global service, so we use the primary provider
  providers = {
    aws = aws.primary
  }
  
  domain_name                = var.domain_name
  primary_alb_dns_name       = module.load_balancer_primary.alb_dns_name
  primary_alb_zone_id        = module.load_balancer_primary.alb_zone_id
  secondary_alb_dns_name     = module.load_balancer_secondary.alb_dns_name
  secondary_alb_zone_id      = module.load_balancer_secondary.alb_zone_id
  environment               = var.environment
}
```

### `variables.tf`

```hcl
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "multi-region-webapp"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "example.com"
}
```

### `terraform.tfvars`

```hcl
# Multi-region configuration
primary_region   = "us-east-1"
secondary_region = "us-west-2"

# Environment settings
environment  = "production"
project_name = "multi-region-webapp"

# Network configuration
primary_vpc_cidr   = "10.0.0.0/16"
secondary_vpc_cidr = "10.1.0.0/16"

# Compute configuration
instance_type        = "t3.micro"
asg_min_size        = 2
asg_max_size        = 10
asg_desired_capacity = 3

# DNS configuration
domain_name = "example.com"
```

### `outputs.tf`

```hcl
output "primary_alb_dns_name" {
  description = "DNS name of the primary region ALB"
  value       = module.load_balancer_primary.alb_dns_name
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary region ALB"
  value       = module.load_balancer_secondary.alb_dns_name
}

output "route53_record_name" {
  description = "Route 53 record name for the application"
  value       = module.dns.record_name
}

output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = module.vpc_primary.vpc_id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = module.vpc_secondary.vpc_id
}
```

## Module Configurations

### VPC Module (`modules/vpc/main.tf`)

```hcl
# VPC Module - Creates networking infrastructure
# This module creates a VPC with public and private subnets across multiple AZs
# for high availability and proper network segmentation

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Main VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.environment}-vpc-${var.region_name}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.environment}-igw-${var.region_name}"
  }
}

# Public subnets (one per AZ for high availability)
resource "aws_subnet" "public" {
  count = min(length(var.availability_zones), 3)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}-${var.region_name}"
    Type = "Public"
  }
}

# Private subnets (one per AZ for high availability)
resource "aws_subnet" "private" {
  count = min(length(var.availability_zones), 3)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}-${var.region_name}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = min(length(var.availability_zones), 3)

  domain = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.environment}-eip-nat-${count.index + 1}-${var.region_name}"
  }
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count = min(length(var.availability_zones), 3)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.environment}-nat-${count.index + 1}-${var.region_name}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route table for public subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.environment}-rt-public-${var.region_name}"
  }
}

# Route table associations for public subnets
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route tables for private subnets (one per NAT Gateway)
resource "aws_route_table" "private" {
  count = length(aws_nat_gateway.main)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.environment}-rt-private-${count.index + 1}-${var.region_name}"
  }
}

# Route table associations for private subnets
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### VPC Module (`modules/vpc/variables.tf`)

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region_name" {
  description = "Region name for naming resources"
  type        = string
}
```

### VPC Module (`modules/vpc/outputs.tf`)

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

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

### Load Balancer Module (`modules/load-balancer/main.tf`)

```hcl
# Load Balancer Module - Creates Application Load Balancer
# This module creates an ALB with security groups and target groups
# for distributing traffic across multiple EC2 instances

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${var.environment}-alb-${var.region_name}-"
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

  tags = {
    Name = "${var.environment}-alb-sg-${var.region_name}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.environment}-alb-${var.region_name}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name = "${var.environment}-alb-${var.region_name}"
  }
}

# Target group for ALB
resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg-${var.region_name}"
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

  tags = {
    Name = "${var.environment}-tg-${var.region_name}"
  }
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
}
```

### Load Balancer Module (`modules/load-balancer/variables.tf`)

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of public subnets"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region_name" {
  description = "Region name for naming resources"
  type        = string
}
```

### Load Balancer Module (`modules/load-balancer/outputs.tf`)

```hcl
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}
```

### Compute Module (`modules/compute/main.tf`)

```hcl
# Compute Module - Creates Auto Scaling Group with EC2 instances
# This module creates an ASG with launch template for scalable web servers

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

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

# Security group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${var.environment}-ec2-${var.region_name}-"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-ec2-sg-${var.region_name}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.environment}-ec2-role-${var.region_name}"

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
}

# IAM instance profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.environment}-ec2-profile-${var.region_name}"
  role = aws_iam_role.ec2_role.name
}

# Attach SSM managed instance core policy
resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Launch template for Auto Scaling Group
resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-lt-${var.region_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region_name = var.region_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.environment}-instance-${var.region_name}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name                = "${var.environment}-asg-${var.region_name}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [var.alb_target_group_arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Instance refresh configuration for zero-downtime deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.environment}-asg-${var.region_name}"
    propagate_at_launch = false
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.environment}-scale-up-${var.region_name}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.environment}-scale-down-${var.region_name}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms for Auto Scaling
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.environment}-cpu-high-${var.region_name}"
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
  alarm_name          = "${var.environment}-cpu-low-${var.region_name}"
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
```

### Compute Module User Data (`modules/compute/user_data.sh`)

```bash
#!/bin/bash
yum update -y
yum install -y httpd

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple HTML page with region information
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .region { color: #0066cc; font-size: 24px; font-weight: bold; }
        .info { background-color: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Multi-Region Web Application</h1>
        <div class="info">
            <p>You are being served from the <span class="region">${region_name}</span> region</p>
            <p>Instance ID: <span id="instance-id">Loading...</span></p>
            <p>Availability Zone: <span id="az">Loading...</span></p>
        </div>
        <p>This application demonstrates AWS multi-region deployment with automatic failover.</p>
    </div>
    
    <script>
        // Fetch instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(error => document.getElementById('instance-id').textContent = 'N/A');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(response => response.text())
            .then(data => document.getElementById('az').textContent = data)
            .catch(error => document.getElementById('az').textContent = 'N/A');
    </script>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html
```

### Compute Module (`modules/compute/variables.tf`)

```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "ARN of the ALB target group"
  type        = string
}

variable "alb_security_group_id" {
  description = "ID of the ALB security group"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region_name" {
  description = "Region name for naming resources"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 3
}
```

### Compute Module (`modules/compute/outputs.tf`)

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

### DNS Module (`modules/dns/main.tf`)

```hcl
# DNS Module - Creates Route 53 hosted zone and health checks
# This module implements failover routing between regions using health checks
# Primary region gets priority, secondary region serves as failover

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "${var.environment}-hosted-zone"
    Environment