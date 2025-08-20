# main.tf

# Variable declarations
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Name of the project for resource naming"
  type        = string
  default     = "secure-web-app"
}

variable "allowed_ip_ranges" {
  description = "List of IP ranges allowed to access the application (CIDR blocks)"
  type        = list(string)
  default = [
    "10.0.0.0/8",     # Private network range
    "172.16.0.0/12",  # Private network range
    "192.168.0.0/16", # Private network range
    "203.0.113.0/24"  # Example public IP range (RFC 5737 documentation range)
  ]

  validation {
    condition     = length(var.allowed_ip_ranges) > 0
    error_message = "At least one IP range must be specified for security group access."
  }
}

variable "vpc_id" {
  description = "VPC ID where the security group will be created"
  type        = string
  default     = null # Will use default VPC if not specified
}

# Data source to get default VPC if vpc_id is not provided
data "aws_vpc" "default" {
  count   = var.vpc_id == null ? 1 : 0
  default = true
}

# Local values for resource naming and configuration
locals {
  vpc_id = var.vpc_id != null ? var.vpc_id : data.aws_vpc.default[0].id

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Purpose     = "web-application-security"
  }

  security_group_name = "${var.project_name}-${var.environment}-web-sg"
}

# Security Group Resource
resource "aws_security_group" "web_application_sg" {
  name        = local.security_group_name
  description = "Security group for ${var.project_name} web application - allows HTTP/HTTPS from specified IP ranges only"
  vpc_id      = local.vpc_id

  # Inbound rule for HTTP (port 80)
  dynamic "ingress" {
    for_each = var.allowed_ip_ranges
    content {
      description = "HTTP access from ${ingress.value}"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Inbound rule for HTTPS (port 443)
  dynamic "ingress" {
    for_each = var.allowed_ip_ranges
    content {
      description = "HTTPS access from ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # Outbound rules (allow all outbound traffic by default)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = local.security_group_name
    Type = "web-application-security-group"
  })

  # Lifecycle management
  lifecycle {
    create_before_destroy = true
  }
}

# Output definitions
output "security_group_id" {
  description = "ID of the created security group"
  value       = aws_security_group.web_application_sg.id
}

output "security_group_arn" {
  description = "ARN of the created security group"
  value       = aws_security_group.web_application_sg.arn
}

output "security_group_name" {
  description = "Name of the created security group"
  value       = aws_security_group.web_application_sg.name
}

output "vpc_id" {
  description = "VPC ID where the security group was created"
  value       = local.vpc_id
}

output "allowed_ip_ranges" {
  description = "IP ranges configured for inbound access"
  value       = var.allowed_ip_ranges
}

output "inbound_rules_summary" {
  description = "Summary of configured inbound rules"
  value = {
    http_port       = 80
    https_port      = 443
    allowed_sources = var.allowed_ip_ranges
    total_rules     = length(var.allowed_ip_ranges) * 2 # 2 ports × number of IP ranges
  }
}