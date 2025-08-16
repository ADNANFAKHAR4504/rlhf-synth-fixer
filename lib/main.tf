###########################################################
# main.tf
# Terraform stack: Secure HTTP/HTTPS-only Security Group
# Uses existing VPC to avoid VPC limit issues
# All variables, logic, and outputs in one file.
###########################################################

# Usage:
# terraform init
# terraform plan
# terraform apply

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region to deploy resources (used in provider.tf)"
  type        = string
  default     = "us-west-2"
}

variable "vpc_id" {
  description = "VPC ID where the security group will be created (leave empty to use default VPC)"
  type        = string
  default     = ""
  
  validation {
    condition     = var.vpc_id == "" || can(regex("^vpc-[a-z0-9]{8,17}$", var.vpc_id))
    error_message = "VPC ID must be empty (for auto-detection) or a valid AWS VPC identifier (vpc-xxxxxxxx)."
  }
}

variable "allowed_ipv4_cidrs" {
  description = "List of allowed IPv4 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = ["10.0.0.0/8"]  # Private network only - secure default
  
  validation {
    condition = length(var.allowed_ipv4_cidrs) > 0 && alltrue([
      for cidr in var.allowed_ipv4_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "At least one valid IPv4 CIDR must be provided (e.g., 10.0.0.0/16, 192.168.1.0/24)."
  }
}

variable "allowed_ipv6_cidrs" {
  description = "List of allowed IPv6 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = []
  
  validation {
    condition = alltrue([
      for cidr in var.allowed_ipv6_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All IPv6 CIDRs must be valid CIDR notation (e.g., 2001:db8::/32)."
  }
}

variable "allow_all_outbound" {
  description = "Allow all outbound traffic if true; otherwise restrict egress"
  type        = bool
  default     = true
}

variable "security_group_name" {
  description = "Name of the security group"
  type        = string
  default     = "app-http-https-sg"
}

variable "security_group_description" {
  description = "Description of the security group"
  type        = string
  default     = "Security group allowing only HTTP/HTTPS inbound traffic from specified CIDRs"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Owner       = "devops"
    Environment = "dev"
    Project     = "iac-test-automations"
    ManagedBy   = "terraform"
  }
}

########################
# Locals and Data Sources
########################

# Find default VPC if vpc_id not specified
data "aws_vpc" "default" {
  count   = var.vpc_id == "" ? 1 : 0
  default = true
}

# Get specified VPC
data "aws_vpc" "specified" {
  count = var.vpc_id != "" ? 1 : 0
  id    = var.vpc_id
}

locals {
  # Use specified VPC or default VPC
  vpc_id = var.vpc_id != "" ? var.vpc_id : data.aws_vpc.default[0].id
  vpc_cidr = var.vpc_id != "" ? data.aws_vpc.specified[0].cidr_block : data.aws_vpc.default[0].cidr_block
}

########################
# Security Group
########################

resource "aws_security_group" "app_sg" {
  name        = var.security_group_name
  description = var.security_group_description
  vpc_id      = local.vpc_id
  tags        = merge(var.tags, { Name = var.security_group_name })

  # IPv4 HTTP
  dynamic "ingress" {
    for_each = var.allowed_ipv4_cidrs
    content {
      description = "Allow HTTP from IPv4 ${ingress.value}"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # IPv4 HTTPS
  dynamic "ingress" {
    for_each = var.allowed_ipv4_cidrs
    content {
      description = "Allow HTTPS from IPv4 ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  # IPv6 HTTP
  dynamic "ingress" {
    for_each = var.allowed_ipv6_cidrs
    content {
      description      = "Allow HTTP from IPv6 ${ingress.value}"
      from_port        = 80
      to_port          = 80
      protocol         = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

  # IPv6 HTTPS
  dynamic "ingress" {
    for_each = var.allowed_ipv6_cidrs
    content {
      description      = "Allow HTTPS from IPv6 ${ingress.value}"
      from_port        = 443
      to_port          = 443
      protocol         = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

  # Egress rules
  dynamic "egress" {
    for_each = var.allow_all_outbound ? [1] : []
    content {
      description      = "Allow all outbound traffic"
      from_port        = 0
      to_port          = 0
      protocol         = "-1"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = ["::/0"]
    }
  }

  # Restricted egress (when allow_all_outbound is false)
  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Allow HTTPS outbound for package updates"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Allow HTTP outbound for package updates"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}

########################
# Outputs
########################

output "vpc_id" {
  description = "The ID of the VPC"
  value       = local.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = local.vpc_cidr
}

output "security_group_id" {
  description = "The ID of the security group"
  value       = aws_security_group.app_sg.id
}

output "security_group_arn" {
  description = "The ARN of the security group"
  value       = aws_security_group.app_sg.arn
}

output "security_group_name" {
  description = "The name of the security group"
  value       = aws_security_group.app_sg.name
}

output "ingress_rules_summary" {
  description = "Summary of ingress rules"
  value = {
    total_rules = length(aws_security_group.app_sg.ingress)
    rules = [
      for rule in aws_security_group.app_sg.ingress : {
        port        = "${rule.from_port}-${rule.to_port}"
        protocol    = rule.protocol
        description = rule.description
        cidrs       = coalescelist(rule.cidr_blocks, rule.ipv6_cidr_blocks)
      }
    ]
  }
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}