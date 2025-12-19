I'll design a modularized Terraform configuration that meets all your requirements. This will be a scalable, reusable infrastructure setup for AWS.

## Project Structure

```
terraform-aws-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── iam/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── secrets/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── ec2/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── README.md
```

## Root Configuration Files

### main.tf
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
  region = var.aws_region
  
  default_tags {
    tags = var.common_tags
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  vpc_cidr             = var.vpc_cidr
  availability_zones   = data.aws_availability_zones.available.names
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  common_tags         = var.common_tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"
  
  common_tags = var.common_tags
}

# Secrets Manager Module
module "secrets" {
  source = "./modules/secrets"
  
  secrets_config = var.secrets_config
  common_tags   = var.common_tags
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"
  
  instance_type           = var.instance_type
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  private_subnet_ids     = module.vpc.private_subnet_ids
  ec2_instance_profile   = module.iam.ec2_instance_profile_name
  common_tags           = var.common_tags
  
  depends_on = [module.vpc, module.iam]
}
```

### variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
  
  validation {
    condition = contains([
      "t3.micro", "t3.small", "t3.medium", "t3.large",
      "m5.large", "m5.xlarge", "c5.large", "c5.xlarge"
    ], var.instance_type)
    error_message = "Instance type must be a valid EC2 instance type."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "ScalableInfrastructure"
    ManagedBy   = "Terraform"
  }
}

variable "secrets_config" {
  description = "Configuration for secrets in AWS Secrets Manager"
  type = map(object({
    description = string
    secret_data = map(string)
  }))
  default = {
    "prod/database" = {
      description = "Database credentials for production"
      secret_data = {
        username = "admin"
        password = "change-me-in-production"
      }
    }
    "prod/api-keys" = {
      description = "API keys for production services"
      secret_data = {
        external_api_key = "your-api-key-here"
        service_token   = "your-service-token-here"
      }
    }
  }
}
```

### outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "iam_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = module.iam.ec2_role_arn
}

output "secrets_arns" {
  description = "ARNs of the secrets in Secrets Manager"
  value       = module.secrets.secret_arns
}
```

## VPC Module

### modules/vpc/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "main-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.common_tags, {
    Name = "main-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.common_tags, {
    Name = "public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.common_tags, {
    Name = "private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnet_cidrs)
  
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "nat-eip-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(var.common_tags, {
    Name = "nat-gateway-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.common_tags, {
    Name = "public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(var.common_tags, {
    Name = "private-rt-${count.index + 1}"
  })
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Group for Web Servers
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  vpc_id      = aws_vpc.main.id
  
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
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(var.common_tags, {
    Name = "web-security-group"
  })
}
```

### modules/vpc/variables.tf
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

### modules/vpc/outputs.tf
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

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}
```

## IAM Module

### modules/iam/main.tf
```hcl
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-production-role"
  
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
  
  tags = var.common_tags
}

# IAM Policy for EC2 instances (least privilege)
resource "aws_iam_policy" "ec2_policy" {
  name        = "ec2-production-policy"
  description = "Policy for EC2 instances with least privilege"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:prod/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = var.common_tags
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-production-profile"
  role = aws_iam_role.ec2_role.name
  
  tags = var.common_tags
}

# IAM Role for Lambda functions (if needed for automation)
resource "aws_iam_role" "lambda_role" {
  name = "lambda-production-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.common_tags
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
```

### modules/iam/variables.tf
```hcl
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

### modules/iam/outputs.tf
```hcl
output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
}
```

## Secrets Manager Module

### modules/secrets/main.tf
```hcl
# Create secrets in AWS Secrets Manager
resource "aws_secretsmanager_secret" "secrets" {
  for_each = var.secrets_config
  
  name                    = each.key
  description            = each.value.description
  recovery_window_in_days = 7
  
  tags = var.common_tags
}

# Store secret values
resource "aws_secretsmanager_secret_version" "secret_versions" {
  for_each = var.secrets_config
  
  secret_id     = aws_secretsmanager_secret.secrets[each.key].id
  secret_string = jsonencode(each.value.secret_data)
}

# Create a policy for accessing secrets
resource "aws_secretsmanager_resource_policy" "secret_policy" {
  for_each = var.secrets_config
  
  secret_arn = aws_secretsmanager_secret.secrets[each.key].arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "secretsmanager:GetSecretValue"
        Resource = "*"
        Condition = {
          StringEquals = {
            "secretsmanager:ResourceTag/Environment" = "Production"
          }
        }
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}
```

### modules/secrets/variables.tf
```hcl
variable "secrets_config" {
  description = "Configuration for secrets in AWS Secrets Manager"
  type = map(object({
    description = string
    secret_data = map(string)
  }))
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

### modules/secrets/outputs.tf
```hcl
output "secret_arns" {
  description = "ARNs of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.arn }
}

output "secret_names" {
  description = "Names of the created secrets"
  value       = { for k, v in aws_secretsmanager_secret.secrets : k => v.name }
}
```

## EC2 Module

### modules/ec2/main.tf
```hcl
# Data source for latest Amazon Linux 2 AMI
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

# Launch Template for EC2 instances
resource "aws_launch_template" "web" {
  name_prefix   = "web-template-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [data.aws_security_group.web.id]
  
  iam_instance_profile {
    name = var.ec2_instance_profile
  }
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region = data.aws_region.current.name
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(var.common_tags, {
      Name = "web-server"
    })
  }
  
  tags = var.common_tags
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "web-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.web.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = 2
  max_size         = 6
  desired_capacity = 2
  
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "web-asg-instance"
    propagate_at_launch = true
  }
  
  dynamic "tag" {
    for_each = var.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

# Application Load Balancer
resource "aws_lb" "web" {
  name               = "web-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [data.aws_security_group.web.id]
  subnets            = var.public_subnet_ids
  
  enable_deletion_protection = false
  
  tags = merge(var.common_tags, {
    Name = "web-alb"
  })
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "web-tg"
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
  
  tags = var.common_tags
}

# Load Balancer Listener
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
  
  tags = var.common_tags
}

# Data sources
data "aws_security_group" "web" {
  filter {
    name   = "group-name"
    values = ["web-sg*"]
  }
  
  vpc_id = var.vpc_id
}

data "aws_region" "current" {}
```

### modules/ec2/user_data.sh
```bash
#!/bin/bash
yum update -y
yum install -y httpd aws-cli

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Production Web Server</title>
</head>
<body>
    <h1>Hello from Production Environment!</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Region: ${region}</p>
</body>
</html>
EOF

# Configure CloudWatch agent (basic configuration)
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "metrics": {
        "namespace": "Production/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s
```

### modules/ec2/variables.tf
```hcl
variable "instance_type" {
  description = "EC2 instance type"
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

variable "ec2_instance_profile" {
  description = "IAM instance profile name for EC2"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
}
```

### modules/ec2/outputs.tf
```hcl
output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_autoscaling_group.web.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.web.dns_name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.web.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.web.arn
}
```

## Configuration Files

### terraform.tfvars.example
```hcl
# Copy this file to terraform.tfvars and customize the values

aws_region    = "us-east-1"
instance_type = "t3.micro"

vpc_cidr = "10.0.0.0/16"

public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]

common_tags = {
  Environment = "Production"
  Project     = "ScalableInfrastructure"
  ManagedBy   = "Terraform"
  Owner       = "DevOps Team"
}

secrets_config = {
  "prod/database" = {
    description = "Database credentials for production"
    secret_data = {
      username = "admin"
      password = "your-secure-password-here"
      host     = "prod-db.example.com"
      port     = "5432"
    }
  }
  "prod/api-keys" = {
    description = "API keys for production services"
    secret_data = {
      external_api_key = "your-api-key-here"
      service_token   = "your-service-token-here"
      webhook_secret  = "your-webhook-secret-here"
    }
  }
}
```

### README.md
```markdown
# AWS Scalable Infrastructure with Terraform

This Terraform configuration creates a scalable, secure, and production-ready infrastructure on AWS.

## Architecture Overview

- **VPC**: Custom VPC with public and private subnets across multiple AZs
- **EC2**: Auto Scaling Group with Application Load Balancer
- **IAM**: Least privilege roles and policies
- **Secrets Manager**: Secure storage for sensitive data
- **Security**: Security groups with minimal required access

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0 installed
3. Appropriate AWS permissions for creating resources

## Quick Start

1. Clone this repository
2. Copy `terraform.tfvars.example` to `terraform.tfvars`
3. Update the variables in `terraform.tfvars`
4. Run the following commands:

```bash
terraform init
terraform plan
terraform apply
```

## Module Structure

- `modules/vpc/`: VPC, subnets, routing, and security groups
- `modules/iam/`: IAM roles and policies
- `modules/secrets/`: AWS Secrets Manager configuration
- `modules/ec2/`: EC2 instances, Auto Scaling, and Load Balancer

## Security Features

- All resources tagged with Environment: Production
- IAM roles follow least privilege principle
- Sensitive data stored in AWS Secrets Manager
- Private subnets for application servers
- Security groups with minimal required access

## Customization

You can customize the infrastructure by modifying the variables in `terraform.tfvars`:

- `instance_type`: Change EC2 instance size
- `vpc_cidr`: Modify VPC CIDR block
- `public_subnet_cidrs`/`private_subnet_cidrs`: Adjust subnet configurations
- `secrets_config`: Add or modify secrets

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

## Cost Optimization

- Uses t3.micro instances by default (Free Tier eligible)
- NAT Gateways are created per AZ (consider single NAT for cost savings in dev)
- Auto Scaling Group maintains minimum required capacity
```

## Key Features Implemented

### ✅ Requirements Met:

1. **us-east-1 region**: Configured in provider and variables
2. **Variable for instance type**: Configurable with validation
3. **IAM roles with least privilege**: Separate roles for EC2 and Lambda with minimal permissions
4. **AWS Secrets Manager**: Modular secrets management with resource policies
5. **VPC with public/private subnets**: Multi-AZ setup with NAT gateways
6. **Environment: Production tag**: Applied to all resources via default tags

### 🏗️ Additional Architecture Benefits:

- **Modular Design**: Reusable modules for different environments
- **High Availability**: Multi-AZ deployment with Auto Scaling
- **Load Balancing**: Application Load Balancer with health checks
- **Security**: Security groups, private subnets, and IAM policies
- **Monitoring**: CloudWatch integration for metrics
- **Scalability**: Auto Scaling Group with configurable capacity

### 🚀 Usage:

1. Copy `terraform.tfvars.example` to `terraform.tfvars`
2. Update sensitive values in the secrets configuration
3. Run `terraform init && terraform plan && terraform apply`

This infrastructure is production-ready and follows AWS best practices for security, scalability, and maintainability.