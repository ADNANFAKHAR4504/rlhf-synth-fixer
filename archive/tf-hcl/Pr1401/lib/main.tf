###########################################################
# main.tf
# Terraform stack: Secure HTTP/HTTPS-only Security Group
# Creates VPC if not provided, uses existing VPC otherwise
# All variables, logic, and outputs in one file.
###########################################################

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

########################
# Variables
########################

variable "aws_region" {
  description = "AWS region where resources will be deployed. Used by provider configuration."
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "AWS region must be in valid format (e.g., us-west-2, eu-central-1)."
  }
}

variable "vpc_id" {
  description = "VPC ID where the security group will be created. Leave empty to create a new VPC."
  type        = string
  default     = "" # Empty means create new VPC

  validation {
    condition     = var.vpc_id == "" || can(regex("^vpc-[a-z0-9]{8,17}$", var.vpc_id))
    error_message = "VPC ID must be empty (to create new VPC) or a valid AWS VPC identifier (vpc-xxxxxxxx)."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (only used when creating a new VPC)."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid CIDR notation (e.g., 10.0.0.0/16)."
  }
}

variable "allowed_ipv4_cidrs" {
  description = "List of IPv4 CIDR blocks allowed for HTTP/HTTPS inbound traffic. Use specific networks, avoid 0.0.0.0/0 in production."
  type        = list(string)
  default     = ["0.0.0.0/0"] # Default for testing - override in production

  validation {
    condition = length(var.allowed_ipv4_cidrs) > 0 && alltrue([
      for cidr in var.allowed_ipv4_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "At least one valid IPv4 CIDR must be provided (e.g., 10.0.0.0/16, 192.168.1.0/24)."
  }
}

variable "allowed_ipv6_cidrs" {
  description = "List of IPv6 CIDR blocks allowed for HTTP/HTTPS inbound traffic. Use specific networks for security."
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
  description = "Whether to allow all outbound traffic. Set to false for restricted egress (recommended for production)."
  type        = bool
  default     = true
}

variable "security_group_name_prefix" {
  description = "Prefix for the security group name. A random suffix will be added to ensure uniqueness."
  type        = string
  default     = "app-http-https-sg"

  validation {
    condition     = length(var.security_group_name_prefix) > 0 && length(var.security_group_name_prefix) <= 240
    error_message = "Security group name prefix must be between 1 and 240 characters to allow for suffix."
  }
}

variable "security_group_description" {
  description = "Description for the security group explaining its purpose and allowed traffic."
  type        = string
  default     = "Security group allowing only HTTP/HTTPS inbound traffic from specified CIDRs"

  validation {
    condition     = length(var.security_group_description) > 0 && length(var.security_group_description) <= 255
    error_message = "Security group description must be between 1 and 255 characters."
  }
}

variable "tags" {
  description = "Key-value pairs of tags to apply to all resources for organization and cost tracking."
  type        = map(string)
  default = {
    Owner       = "devops"
    Environment = "dev"
    Project     = "iac-test-automations"
    ManagedBy   = "terraform"
  }
}

########################
# Random Resources for Unique Naming
########################

resource "random_id" "suffix" {
  byte_length = 4
}

########################
# Locals and Validation
########################

locals {
  # Determine whether to create VPC (when vpc_id is empty)
  should_create_vpc = var.vpc_id == ""

  # Determine which VPC to use
  vpc_id = local.should_create_vpc ? aws_vpc.main[0].id : var.vpc_id

  # Dynamic security group name with random suffix
  security_group_name = "${var.security_group_name_prefix}-${random_id.suffix.hex}"

  # Validation: fail if both IPv4 and IPv6 CIDR lists are empty
  has_cidrs = length(var.allowed_ipv4_cidrs) > 0 || length(var.allowed_ipv6_cidrs) > 0
}

########################
# VPC Creation (Optional)
########################

# Create VPC when vpc_id is not provided
resource "aws_vpc" "main" {
  count = local.should_create_vpc ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name      = "vpc-${random_id.suffix.hex}"
    Purpose   = "Created for security group testing"
    CreatedBy = "terraform-${random_id.suffix.hex}"
  })
}

# Internet Gateway for the VPC
resource "aws_internet_gateway" "main" {
  count = local.should_create_vpc ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = merge(var.tags, {
    Name    = "igw-${random_id.suffix.hex}"
    Purpose = "Internet access for VPC"
  })
}

# Default route table with internet access
resource "aws_route_table" "main" {
  count = local.should_create_vpc ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(var.tags, {
    Name    = "rt-main-${random_id.suffix.hex}"
    Purpose = "Main route table with internet access"
  })
}

# Public subnet (optional, for completeness)
resource "aws_subnet" "public" {
  count = local.should_create_vpc ? 1 : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 1)
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "subnet-public-${random_id.suffix.hex}"
    Type = "Public"
  })
}

# Associate route table with subnet
resource "aws_route_table_association" "public" {
  count = local.should_create_vpc ? 1 : 0

  subnet_id      = aws_subnet.public[0].id
  route_table_id = aws_route_table.main[0].id
}

########################
# Data Sources
########################

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get existing VPC data when using provided VPC ID
data "aws_vpc" "selected" {
  count = local.should_create_vpc ? 0 : 1
  id    = var.vpc_id
}

########################
# Validation
########################

# Custom validation to ensure at least one CIDR list is provided
resource "null_resource" "validate_cidrs" {
  count = local.has_cidrs ? 0 : 1

  lifecycle {
    precondition {
      condition     = local.has_cidrs
      error_message = "ERROR: Both allowed_ipv4_cidrs and allowed_ipv6_cidrs are empty. At least one CIDR list must contain values to define allowed traffic sources."
    }
  }
}

########################
# Security Groups
########################

resource "aws_security_group" "app_sg" {
  name        = local.security_group_name
  description = var.security_group_description
  vpc_id      = local.vpc_id
  tags = merge(var.tags, {
    Name      = local.security_group_name
    CreatedBy = "terraform-${random_id.suffix.hex}"
  })

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

  # Egress rules - Allow all outbound
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

  # Restricted egress rules - Only HTTP/HTTPS outbound for updates
  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Allow HTTPS outbound for package updates and API calls"
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Allow HTTP outbound for package repositories"
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  # DNS egress for name resolution (required for most applications)
  dynamic "egress" {
    for_each = var.allow_all_outbound ? [] : [1]
    content {
      description = "Allow DNS outbound for name resolution"
      from_port   = 53
      to_port     = 53
      protocol    = "udp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  depends_on = [null_resource.validate_cidrs]
}

########################
# Outputs
########################

output "vpc_id" {
  description = "The ID of the VPC where the security group was created"
  value       = local.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = local.should_create_vpc ? aws_vpc.main[0].cidr_block : data.aws_vpc.selected[0].cidr_block
}

output "vpc_created" {
  description = "Whether a new VPC was created by this module"
  value       = local.should_create_vpc
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway (only when VPC is created)"
  value       = local.should_create_vpc ? aws_internet_gateway.main[0].id : null
}

output "public_subnet_id" {
  description = "The ID of the public subnet (only when VPC is created)"
  value       = local.should_create_vpc ? aws_subnet.public[0].id : null
}

output "security_group_id" {
  description = "The ID of the created security group"
  value       = aws_security_group.app_sg.id
}

output "security_group_arn" {
  description = "The ARN of the created security group"
  value       = aws_security_group.app_sg.arn
}

output "security_group_name" {
  description = "The name of the created security group"
  value       = aws_security_group.app_sg.name
}

output "ingress_rules_summary" {
  description = "Summary of all ingress rules configured on the security group"
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
  description = "AWS region where resources were deployed"
  value       = var.aws_region
}

output "random_suffix" {
  description = "Random suffix used for resource naming"
  value       = random_id.suffix.hex
}