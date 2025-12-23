# Multi-VPC Hub-and-Spoke Network Architecture with Transit Gateway

This implementation provides a complete Terraform solution for a hub-and-spoke network architecture using AWS Transit Gateway for a financial services company requiring strict network isolation.

## Architecture Overview

- **Hub VPC**: Central VPC (10.0.0.0/16) with NAT Gateways for centralized internet egress
- **Production VPC**: Isolated production environment (10.1.0.0/16) with no direct internet access
- **Development VPC**: Isolated development environment (10.2.0.0/16) with no direct internet access
- **Transit Gateway**: Central routing hub connecting all VPCs with separate route domains
- **VPC Flow Logs**: Network monitoring with S3 storage and Glacier lifecycle
- **Route53 Private Hosted Zones**: Internal DNS resolution across VPCs

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
}

variable "region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "multi-vpc-transit"
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "prod_vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "dev_vpc_cidr" {
  description = "CIDR block for development VPC"
  type        = string
  default     = "10.2.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnet deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Number of days before transitioning flow logs to Glacier"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy = "Terraform"
  }
}
```

## File: main.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Hub VPC Module
module "hub_vpc" {
  source = "./modules/vpc"

  vpc_name            = "hub-vpc-${var.environment_suffix}"
  vpc_cidr            = var.hub_vpc_cidr
  availability_zones  = var.availability_zones
  environment         = "hub"
  environment_suffix  = var.environment_suffix
  enable_nat_gateway  = true
  enable_public_subnets = true

  tags = merge(
    var.tags,
    {
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

# Production VPC Module
module "prod_vpc" {
  source = "./modules/vpc"

  vpc_name            = "prod-vpc-${var.environment_suffix}"
  vpc_cidr            = var.prod_vpc_cidr
  availability_zones  = var.availability_zones
  environment         = "production"
  environment_suffix  = var.environment_suffix
  enable_nat_gateway  = false
  enable_public_subnets = false

  tags = merge(
    var.tags,
    {
      Environment = "production"
      Project     = var.project_name
    }
  )
}

# Development VPC Module
module "dev_vpc" {
  source = "./modules/vpc"

  vpc_name            = "dev-vpc-${var.environment_suffix}"
  vpc_cidr            = var.dev_vpc_cidr
  availability_zones  = var.availability_zones
  environment         = "development"
  environment_suffix  = var.environment_suffix
  enable_nat_gateway  = false
  enable_public_subnets = false

  tags = merge(
    var.tags,
    {
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for hub-and-spoke architecture"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support               = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "main-tgw-${var.environment_suffix}"
      Environment = "shared"
      Project     = var.project_name
    }
  )
}

# Transit Gateway Route Tables
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "hub-tgw-rt-${var.environment_suffix}"
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_route_table" "prod" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "prod-tgw-rt-${var.environment_suffix}"
      Environment = "production"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_route_table" "dev" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = merge(
    var.tags,
    {
      Name        = "dev-tgw-rt-${var.environment_suffix}"
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway VPC Attachments
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  subnet_ids         = module.hub_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.hub_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "hub-tgw-attachment-${var.environment_suffix}"
      Environment = "hub"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_vpc_attachment" "prod" {
  subnet_ids         = module.prod_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.prod_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "prod-tgw-attachment-${var.environment_suffix}"
      Environment = "production"
      Project     = var.project_name
    }
  )
}

resource "aws_ec2_transit_gateway_vpc_attachment" "dev" {
  subnet_ids         = module.dev_vpc.transit_gateway_subnet_ids
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = module.dev_vpc.vpc_id
  dns_support        = "enable"

  tags = merge(
    var.tags,
    {
      Name        = "dev-tgw-attachment-${var.environment_suffix}"
      Environment = "development"
      Project     = var.project_name
    }
  )
}

# Transit Gateway Route Table Associations
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route_table_association" "prod" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

resource "aws_ec2_transit_gateway_route_table_association" "dev" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# Transit Gateway Routes - Hub route table
resource "aws_ec2_transit_gateway_route" "hub_to_prod" {
  destination_cidr_block         = var.prod_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.prod.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route" "hub_to_dev" {
  destination_cidr_block         = var.dev_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.dev.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Transit Gateway Routes - Production route table (only to hub)
resource "aws_ec2_transit_gateway_route" "prod_to_hub" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.prod.id
}

# Transit Gateway Routes - Development route table (only to hub)
resource "aws_ec2_transit_gateway_route" "dev_to_hub" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.dev.id
}

# VPC Route Table Routes - Hub private subnets to Transit Gateway
resource "aws_route" "hub_private_to_prod" {
  count                  = length(module.hub_vpc.private_route_table_ids)
  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.prod_vpc_cidr
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "hub_private_to_dev" {
  count                  = length(module.hub_vpc.private_route_table_ids)
  route_table_id         = module.hub_vpc.private_route_table_ids[count.index]
  destination_cidr_block = var.dev_vpc_cidr
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

# VPC Route Table Routes - Production private subnets to Transit Gateway for internet
resource "aws_route" "prod_private_to_internet" {
  count                  = length(module.prod_vpc.private_route_table_ids)
  route_table_id         = module.prod_vpc.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.prod]
}

# VPC Route Table Routes - Development private subnets to Transit Gateway for internet
resource "aws_route" "dev_private_to_internet" {
  count                  = length(module.dev_vpc.private_route_table_ids)
  route_table_id         = module.dev_vpc.private_route_table_ids[count.index]
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.dev]
}

# VPC Flow Logs
module "flow_logs" {
  source = "./modules/flow-logs"
  count  = var.enable_flow_logs ? 1 : 0

  environment_suffix      = var.environment_suffix
  retention_days          = var.flow_logs_retention_days
  vpc_configurations = [
    {
      vpc_id      = module.hub_vpc.vpc_id
      vpc_name    = "hub"
      environment = "hub"
    },
    {
      vpc_id      = module.prod_vpc.vpc_id
      vpc_name    = "production"
      environment = "production"
    },
    {
      vpc_id      = module.dev_vpc.vpc_id
      vpc_name    = "development"
      environment = "development"
    }
  ]

  tags = merge(
    var.tags,
    {
      Project = var.project_name
    }
  )
}

# Route53 Private Hosted Zones
resource "aws_route53_zone" "internal" {
  name = "internal.${var.environment_suffix}.local"

  vpc {
    vpc_id = module.hub_vpc.vpc_id
  }

  tags = merge(
    var.tags,
    {
      Name        = "internal-zone-${var.environment_suffix}"
      Environment = "shared"
      Project     = var.project_name
    }
  )
}

resource "aws_route53_zone_association" "prod" {
  zone_id = aws_route53_zone.internal.zone_id
  vpc_id  = module.prod_vpc.vpc_id
}

resource "aws_route53_zone_association" "dev" {
  zone_id = aws_route53_zone.internal.zone_id
  vpc_id  = module.dev_vpc.vpc_id
}
```

## File: modules/vpc/main.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name        = var.vpc_name
      Environment = var.environment
    }
  )
}

# Internet Gateway (only for hub VPC)
resource "aws_internet_gateway" "main" {
  count  = var.enable_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-igw-${var.environment_suffix}"
      Environment = var.environment
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = var.enable_public_subnets ? length(var.availability_zones) : 0
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-public-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 4)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-private-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "private"
    }
  )
}

# Transit Gateway Subnets (dedicated for TGW attachments)
resource "aws_subnet" "transit_gateway" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 8)
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-tgw-subnet-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "transit-gateway"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-nat-eip-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? length(var.availability_zones) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-nat-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  count  = var.enable_public_subnets ? 1 : 0
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-public-rt-${var.environment_suffix}"
      Environment = var.environment
      Type        = "public"
    }
  )
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  count                  = var.enable_public_subnets ? 1 : 0
  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main[0].id
}

# Public Subnet Route Table Associations
resource "aws_route_table_association" "public" {
  count          = var.enable_public_subnets ? length(var.availability_zones) : 0
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.tags,
    {
      Name        = "${var.environment}-private-rt-${count.index + 1}-${var.environment_suffix}"
      Environment = var.environment
      Type        = "private"
    }
  )
}

# Private Route to NAT Gateway (only in hub VPC)
resource "aws_route" "private_nat" {
  count                  = var.enable_nat_gateway ? length(var.availability_zones) : 0
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Private Subnet Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Transit Gateway Subnet Route Table Associations
resource "aws_route_table_association" "transit_gateway" {
  count          = length(var.availability_zones)
  subnet_id      = aws_subnet.transit_gateway[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: modules/vpc/variables.tf

```hcl
variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

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

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway"
  type        = bool
  default     = false
}

variable "enable_public_subnets" {
  description = "Enable public subnets"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/vpc/outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "transit_gateway_subnet_ids" {
  description = "List of Transit Gateway subnet IDs"
  value       = aws_subnet.transit_gateway[*].id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}
```

## File: modules/flow-logs/main.tf

```hcl
# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  bucket = "vpc-flow-logs-${var.environment_suffix}"

  tags = merge(
    var.tags,
    {
      Name        = "vpc-flow-logs-${var.environment_suffix}"
      Environment = "shared"
      Purpose     = "VPC Flow Logs Storage"
    }
  )
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = var.retention_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.retention_days + 365
    }
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.flow_logs.arn
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  count = length(var.vpc_configurations)

  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = var.vpc_configurations[count.index].vpc_id

  tags = merge(
    var.tags,
    {
      Name        = "${var.vpc_configurations[count.index].vpc_name}-flow-log-${var.environment_suffix}"
      Environment = var.vpc_configurations[count.index].environment
    }
  )
}
```

## File: modules/flow-logs/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "retention_days" {
  description = "Number of days before transitioning to Glacier"
  type        = number
  default     = 30
}

variable "vpc_configurations" {
  description = "List of VPC configurations for flow logs"
  type = list(object({
    vpc_id      = string
    vpc_name    = string
    environment = string
  }))
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## File: modules/flow-logs/outputs.tf

```hcl
output "s3_bucket_id" {
  description = "S3 bucket ID for flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for flow logs"
  value       = aws_s3_bucket.flow_logs.arn
}

output "flow_log_ids" {
  description = "List of VPC Flow Log IDs"
  value       = aws_flow_log.vpc_flow_logs[*].id
}
```

## File: outputs.tf

```hcl
# VPC Outputs
output "hub_vpc_id" {
  description = "Hub VPC ID"
  value       = module.hub_vpc.vpc_id
}

output "prod_vpc_id" {
  description = "Production VPC ID"
  value       = module.prod_vpc.vpc_id
}

output "dev_vpc_id" {
  description = "Development VPC ID"
  value       = module.dev_vpc.vpc_id
}

output "hub_vpc_cidr" {
  description = "Hub VPC CIDR block"
  value       = module.hub_vpc.vpc_cidr
}

output "prod_vpc_cidr" {
  description = "Production VPC CIDR block"
  value       = module.prod_vpc.vpc_cidr
}

output "dev_vpc_cidr" {
  description = "Development VPC CIDR block"
  value       = module.dev_vpc.vpc_cidr
}

# Transit Gateway Outputs
output "transit_gateway_id" {
  description = "Transit Gateway ID"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "Transit Gateway ARN"
  value       = aws_ec2_transit_gateway.main.arn
}

output "hub_tgw_attachment_id" {
  description = "Hub VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.hub.id
}

output "prod_tgw_attachment_id" {
  description = "Production VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.prod.id
}

output "dev_tgw_attachment_id" {
  description = "Development VPC Transit Gateway attachment ID"
  value       = aws_ec2_transit_gateway_vpc_attachment.dev.id
}

# NAT Gateway Outputs
output "hub_nat_gateway_ids" {
  description = "Hub VPC NAT Gateway IDs"
  value       = module.hub_vpc.nat_gateway_ids
}

# Flow Logs Outputs
output "flow_logs_s3_bucket" {
  description = "S3 bucket for VPC Flow Logs"
  value       = var.enable_flow_logs ? module.flow_logs[0].s3_bucket_id : null
}

# Route53 Outputs
output "route53_zone_id" {
  description = "Route53 Private Hosted Zone ID"
  value       = aws_route53_zone.internal.zone_id
}

output "route53_zone_name" {
  description = "Route53 Private Hosted Zone name"
  value       = aws_route53_zone.internal.name
}

# Subnet Outputs
output "hub_private_subnet_ids" {
  description = "Hub VPC private subnet IDs"
  value       = module.hub_vpc.private_subnet_ids
}

output "prod_private_subnet_ids" {
  description = "Production VPC private subnet IDs"
  value       = module.prod_vpc.private_subnet_ids
}

output "dev_private_subnet_ids" {
  description = "Development VPC private subnet IDs"
  value       = module.dev_vpc.private_subnet_ids
}
```

## File: terraform.tfvars.example

```hcl
# Example Terraform variables file
# Copy this to terraform.tfvars and customize

environment_suffix = "demo-123"
region            = "us-east-1"
project_name      = "financial-services-network"

# VPC CIDR blocks (non-overlapping)
hub_vpc_cidr  = "10.0.0.0/16"
prod_vpc_cidr = "10.1.0.0/16"
dev_vpc_cidr  = "10.2.0.0/16"

# Availability zones
availability_zones = ["us-east-1a", "us-east-1b"]

# Flow logs configuration
enable_flow_logs         = true
flow_logs_retention_days = 30

# Common tags
tags = {
  ManagedBy   = "Terraform"
  Owner       = "Platform-Team"
  CostCenter  = "Infrastructure"
  Compliance  = "Required"
}
```

## File: backend.tf.example

```hcl
# Example backend configuration for remote state
# Uncomment and customize for production use

# terraform {
#   backend "s3" {
#     bucket         = "terraform-state-bucket-name"
#     key            = "multi-vpc-transit/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     dynamodb_table = "terraform-state-lock"
#   }
# }
```

## File: README.md

```markdown
# Multi-VPC Hub-and-Spoke Network Architecture

This Terraform configuration deploys a hub-and-spoke network architecture using AWS Transit Gateway for a financial services company requiring strict network isolation between environments.

## Architecture

### Network Topology

- **Hub VPC** (10.0.0.0/16): Central VPC with NAT Gateways for centralized internet egress
  - Public subnets for NAT Gateways
  - Private subnets for workloads
  - Dedicated Transit Gateway subnets

- **Production VPC** (10.1.0.0/16): Isolated production environment
  - Private subnets only (no direct internet access)
  - Dedicated Transit Gateway subnets
  - Routes through hub for internet access

- **Development VPC** (10.2.0.0/16): Isolated development environment
  - Private subnets only (no direct internet access)
  - Dedicated Transit Gateway subnets
  - Routes through hub for internet access

### Key Features

1. **Network Isolation**: Production and development environments cannot communicate directly
2. **Centralized Egress**: All internet-bound traffic flows through hub VPC NAT Gateways
3. **Transit Gateway Routing**: Separate route tables enforce isolation policies
4. **VPC Flow Logs**: Network monitoring with S3 storage and Glacier lifecycle
5. **Private DNS**: Route53 Private Hosted Zones for cross-VPC name resolution
6. **High Availability**: Multi-AZ deployment with redundant NAT Gateways

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, Route53, S3, etc.

## Quick Start

1. **Clone the repository**

   ```bash
   cd /path/to/terraform/config
   ```

2. **Configure variables**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

   **Required variables:**
   - `environment_suffix`: Unique suffix for resource naming (e.g., "prod-001")

3. **Configure remote backend (optional but recommended)**

   ```bash
   cp backend.tf.example backend.tf
   # Edit backend.tf with your S3 bucket and DynamoDB table
   ```

4. **Initialize Terraform**

   ```bash
   terraform init
   ```

5. **Review the plan**

   ```bash
   terraform plan
   ```

6. **Deploy the infrastructure**

   ```bash
   terraform apply
   ```

## Configuration

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `environment_suffix` | Unique suffix for resource naming | (required) |
| `region` | AWS region | `us-east-1` |
| `hub_vpc_cidr` | CIDR block for hub VPC | `10.0.0.0/16` |
| `prod_vpc_cidr` | CIDR block for production VPC | `10.1.0.0/16` |
| `dev_vpc_cidr` | CIDR block for development VPC | `10.2.0.0/16` |
| `availability_zones` | List of AZs | `["us-east-1a", "us-east-1b"]` |
| `enable_flow_logs` | Enable VPC Flow Logs | `true` |
| `flow_logs_retention_days` | Days before transitioning to Glacier | `30` |

### Outputs

The configuration outputs key resource identifiers:

- VPC IDs and CIDR blocks
- Transit Gateway ID and attachment IDs
- NAT Gateway IDs
- Route53 Private Hosted Zone ID
- S3 bucket for flow logs

## Network Routing

### Hub VPC Routing

- Public subnets → Internet Gateway (for internet access)
- Private subnets → NAT Gateway (for internet-bound traffic)
- Private subnets → Transit Gateway (for prod/dev VPCs)

### Production VPC Routing

- Private subnets → Transit Gateway (default route 0.0.0.0/0 to hub)
- Transit Gateway routes only to hub VPC (no direct dev access)

### Development VPC Routing

- Private subnets → Transit Gateway (default route 0.0.0.0/0 to hub)
- Transit Gateway routes only to hub VPC (no direct prod access)

### Transit Gateway Routing

- **Hub Route Table**: Routes to prod (10.1.0.0/16) and dev (10.2.0.0/16) VPCs
- **Production Route Table**: Default route (0.0.0.0/0) to hub only
- **Development Route Table**: Default route (0.0.0.0/0) to hub only

## Security

### Network Isolation

- Production and development VPCs cannot communicate directly
- All inter-VPC traffic flows through Transit Gateway with enforced route domains
- Transit Gateway route tables prevent prod-to-dev and dev-to-prod routing

### Monitoring

- VPC Flow Logs enabled on all VPCs
- Flow logs stored in S3 with encryption
- Automatic lifecycle policy transitions logs to Glacier after 30 days

### Best Practices

- All resources tagged for cost allocation and management
- Private subnets used for workloads in prod and dev
- NAT Gateways deployed across multiple AZs for redundancy
- Dedicated subnets for Transit Gateway attachments

## Cost Optimization

- **Centralized NAT Gateways**: Only in hub VPC reduces NAT Gateway costs
- **S3 Lifecycle Policies**: Automatic transition to Glacier for flow logs
- **Multi-AZ NAT**: Redundancy without excessive over-provisioning

## Maintenance

### Adding a New VPC

1. Create a new VPC module instance in `main.tf`
2. Create Transit Gateway attachment
3. Configure Transit Gateway route table
4. Add VPC routes to Transit Gateway
5. Associate with Route53 Private Hosted Zone

### Updating CIDR Blocks

Update the variables in `terraform.tfvars` and run:

```bash
terraform plan
terraform apply
```

**Note**: Changing VPC CIDR blocks requires recreating VPCs.

### Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**Warning**: This will delete all VPCs, Transit Gateway, and associated resources.

## Troubleshooting

### Common Issues

1. **Transit Gateway attachment timeout**
   - Ensure subnet CIDR blocks don't overlap
   - Verify Transit Gateway subnets are in different AZs

2. **No internet connectivity from prod/dev**
   - Check Transit Gateway routes are properly configured
   - Verify hub VPC NAT Gateways are operational
   - Confirm route tables point to Transit Gateway for 0.0.0.0/0

3. **VPC Flow Logs not appearing**
   - Verify S3 bucket policy allows log delivery
   - Check flow log resource is created successfully
   - Wait 10-15 minutes for initial log delivery

### Debugging

Enable Terraform debugging:

```bash
export TF_LOG=DEBUG
terraform apply
```

Check AWS console for:
- Transit Gateway route tables
- VPC route tables
- NAT Gateway status
- Flow log status

## Support

For issues or questions:
1. Review AWS Transit Gateway documentation
2. Check Terraform AWS provider documentation
3. Review VPC Flow Logs troubleshooting guide

## License

This configuration is provided as-is for infrastructure deployment.
```
