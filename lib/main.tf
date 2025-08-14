###########################################################
# main.tf
# Terraform stack: VPC + Secure HTTP/HTTPS-only Security Group
###########################################################

########################
# Variables & Defaults
########################

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-west-2"
}

variable "allowed_ipv4_cidrs" {
  description = "List of allowed IPv4 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  # Default to allow from anywhere (IPv4) — change for production!
  default     = ["0.0.0.0/0"]
}

variable "allowed_ipv6_cidrs" {
  description = "List of allowed IPv6 CIDRs for HTTP/HTTPS inbound traffic"
  type        = list(string)
  # Default empty — no IPv6 unless provided
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
  default = {
    Owner       = "devops"
    Environment = "dev"
    Project     = "iac-test-automations"
    ManagedBy   = "Terraform"
  }
}

########################
# Data Source: Availability Zones
########################

provider "aws" {
  region = var.aws_region
}

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
  tags                 = var.tags
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags   = var.tags
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]
  tags                    = var.tags
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = var.tags

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
      description      = "Allow HTTP from IPv6 ${ingress.value}"
      from_port        = 80
      to_port          = 80
      protocol         = "tcp"
      ipv6_cidr_blocks = [ingress.value]
    }
  }

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
  value = aws_vpc.main.id
}

output "subnet_id" {
  value = aws_subnet.public.id
}

output "security_group_id" {
  value = aws_security_group.app_sg.id
}

output "security_group_arn" {
  value = aws_security_group.app_sg.arn
}

output "security_group_name" {
  value = aws_security_group.app_sg.name
}

output "ingress_rules" {
  value = [
    for rule in aws_security_group.app_sg.ingress : {
      from_port = rule.from_port
      to_port   = rule.to_port
      protocol  = rule.protocol
      cidrs     = lookup(rule, "cidr_blocks", null) != null ? rule.cidr_blocks : rule.ipv6_cidr_blocks
    }
  ]
}
