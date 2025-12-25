
---

# `ideal_response.md`

This file documents exactly what an ideal assistant output should do when producing `main.tf` for the user's prompt.

```md
# ideal_response.md

## Ideal Response Requirements

The ideal response (the correct `main.tf`) should:

1. Be a single HCL file named `main.tf` containing:
   - `terraform { required_providers { ... } required_version = ... }`
   - All `variable` declarations required by the prompt
   - `locals` used to construct ingress rules
   - `aws_security_group` resource which contains only ingress rules for TCP 80 and TCP 443
   - No references to external modules
   - No default permissive CIDRs like `0.0.0.0/0` or `::/0` in user-provided variables

2. Variables:
   - `aws_region` declared (default "us-east-1") and validated non-empty
   - `vpc_id` required, no default
   - `allowed_ipv4_cidrs` default `[]` and validated (CIDR format check)
   - `allowed_ipv6_cidrs` default `[]` and validated
   - Validation that the two CIDR lists are not both empty (fail plan with clear error)
   - `allow_all_outbound` boolean default `true`
   - `security_group_name` and `security_group_description` with defaults
   - `tags` map default with Owner & Environment keys

3. Ingress construction:
   - Create rules only for ports 80 and 443
   - For each IPv4 CIDR create ingress with `cidr_blocks`
   - For each IPv6 CIDR create ingress with `ipv6_cidr_blocks`
   - No other ingress allowed

4. Egress:
   - If `allow_all_outbound = true`, create a single egress rule allowing all outbound
   - If `allow_all_outbound = false`, create conservative egress rules (HTTPS + DNS) and document reasoning in comments

5. Outputs:
   - `security_group_id`
   - `security_group_arn`
   - `security_group_name`
   - `ingress_rules` — list/map summarizing port and CIDR for easy verification

6. Documentation:
   - Top-of-file comments explaining how to run `terraform init`, `plan`, `apply`
   - Example `terraform apply` CLI with `-var` examples for IPv4 and IPv6
   - How to verify in AWS Console or with `aws cli`

7. Extra:
   - Clear, actionable error messages for validation checks
   - Use HCL2 and Terraform >= 1.3 syntax
   - Minimal but secure defaults, inline comments explaining security rationale

## Why this is ideal
- It enforces secure defaults and avoids accidental exposure.
- It is self-contained and ready to use (provider still in provider.tf).
- It gives clear instructions for users to test and verify the resource in a controlled manner.

###########################################################
# main.tf
# Terraform stack: VPC + Secure HTTP/HTTPS-only Security Group
# All variables, logic, and outputs in one file.
###########################################################

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region to deploy resources (used in provider.tf)"
  type        = string
  default     = "us-west-2"
}

variable "allowed_ipv4_cidrs" {
  description = "List of allowed IPv4 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Change in production for security
}

variable "allowed_ipv6_cidrs" {
  description = "List of allowed IPv6 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  default     = []
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
    ManagedBy   = "Terraform"
  }
}

########################
# Data Sources
########################

data "aws_availability_zones" "available" {
  state = "available"
}

########################
# Networking Resources
########################

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(var.tags, { Name = "main-vpc" })
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "main-igw" })
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]
  tags                    = merge(var.tags, { Name = "public-subnet" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = merge(var.tags, { Name = "public-rt" })

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

########################
# Security Group
########################

resource "aws_security_group" "app_sg" {
  name        = var.security_group_name
  description = var.security_group_description
  vpc_id      = aws_vpc.main.id
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

  # Egress
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
      description = "Restricted outbound traffic placeholder"
      from_port   = 443
      to_port     = 443
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
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "The ID of the public subnet"
  value       = aws_subnet.public.id
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

output "ingress_rules" {
  description = "List of ingress rules"
  value = [
    for rule in aws_security_group.app_sg.ingress : {
      from_port = rule.from_port
      to_port   = rule.to_port
      protocol  = rule.protocol
      cidrs     = try(rule.cidr_blocks, rule.ipv6_cidr_blocks)
    }
  ]
}
