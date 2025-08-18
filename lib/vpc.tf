########################
# VPC and Networking (Primary and Secondary Regions)
########################

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

# Primary VPC
resource "aws_vpc" "primary" {
  provider              = aws.primary
  cidr_block            = var.vpc_cidr_primary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-primary"
  }
}

# Secondary VPC
resource "aws_vpc" "secondary" {
  provider              = aws.secondary
  cidr_block            = var.vpc_cidr_secondary
  enable_dns_hostnames  = true
  enable_dns_support    = true
  tags = {
    Name = "${var.name_prefix}-${var.environment}-vpc-secondary"
  }
}

# ... Add public/private subnets, IGW, NAT, route tables, associations for both regions ...

# Outputs for VPC IDs
output "vpc_id_primary" {
  value = aws_vpc.primary.id
}

output "vpc_id_secondary" {
  value = aws_vpc.secondary.id
}
