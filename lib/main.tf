# main.tf
# Single-file Terraform stack: HTTP/HTTPS-only Security Group
# ---------------------------------------------------------
# Usage:
# 1. Ensure provider.tf exists and aws_region variable is referenced there.
# 2. Run:
#    terraform init
#    terraform plan -var='vpc_id=<your-vpc-id>' \
#                  -var='allowed_ipv4_cidrs=["203.0.113.0/24"]' \
#                  -var='allowed_ipv6_cidrs=["2001:db8::/64"]'
#    terraform apply -var='vpc_id=<your-vpc-id>' \
#                  -var='allowed_ipv4_cidrs=["203.0.113.0/24"]'
# 3. Verify:
#    aws ec2 describe-security-groups --group-ids <security_group_id>
###########################################################

########################
# Variables
########################
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = length(var.aws_region) > 0
    error_message = "aws_region cannot be empty"
  }
}

variable "vpc_id" {
  description = "ID of the VPC where the Security Group will be created"
  type        = string
  validation {
    condition     = can(regex("^vpc-[0-9a-f]{8,17}$", var.vpc_id))
    error_message = "Invalid VPC ID format. It should be in the form 'vpc-xxxxxxxx' or 'vpc-xxxxxxxxxxxxxxxxx' where x is a hexadecimal digit."
  }
}

variable "allowed_ipv4_cidrs" {
  description = "List of allowed IPv4 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = []
}

variable "allowed_ipv6_cidrs" {
  description = "List of allowed IPv6 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = []
}

variable "allow_all_outbound" {
  description = "Allow all outbound traffic if true; otherwise egress is restricted"
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
  description = "Map of tags to apply to resources"
  type        = map(string)
  default     = {
    Owner       = "devops"
    Environment = "dev"
  }
}

########################
# Validation
########################
locals {
  cidr_validation_warning = (
    length(var.allowed_ipv4_cidrs) == 0 && length(var.allowed_ipv6_cidrs) == 0
  ) ? true : false
}

# Warn if no CIDRs are provided, but allow the plan to proceed
resource "null_resource" "cidr_warning" {
  count = local.cidr_validation_warning ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'Warning: allowed_ipv4_cidrs and allowed_ipv6_cidrs are both empty. No ingress rules will be created.'"
  }
}

########################
# Security Group
########################
resource "aws_security_group" "app_sg" {
  name        = var.security_group_name
  description = var.security_group_description
  vpc_id      = var.vpc_id
  tags        = var.tags

  # IPv4 ingress rules
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

  # IPv6 ingress rules
  dynamic "ingress" {
    for_each = var.allowed_ipv6_cidrs
    content {
      description = "Allow HTTP from IPv6 ${ingress.value}"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

  dynamic "ingress" {
    for_each = var.allowed_ipv6_cidrs
    content {
      description = "Allow HTTPS from IPv6 ${ingress.value}"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
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

  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Restricted outbound traffic placeholder (adjust as needed)"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]  # modify for stricter control
    }
  }
}

########################
# Outputs
########################
output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.app_sg.id
}

output "security_group_arn" {
  description = "ARN of the security group"
  value       = aws_security_group.app_sg.arn
}

output "security_group_name" {
  description = "Name of the security group"
  value       = aws_security_group.app_sg.name
}

output "ingress_rules" {
  description = "List of ingress rules"
  value = [
    for rule in aws_security_group.app_sg.ingress : {
      from_port = rule.from_port
      to_port   = rule.to_port
      protocol  = rule.protocol
      cidrs     = lookup(rule, "cidr_blocks", null) != null ? rule.cidr_blocks : rule.ipv6_cidr_blocks
    }
  ]
}