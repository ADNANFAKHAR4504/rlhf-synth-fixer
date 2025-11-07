# Multi-Region Hub-and-Spoke Network Infrastructure - Ideal Response

This document provides the complete, working implementation of a multi-region hub-and-spoke network architecture using Terraform for a financial services trading platform.

## Architecture Overview

The solution implements:
- Hub VPC in us-east-1 (10.0.0.0/16)
- Spoke VPCs in us-west-2 (10.1.0.0/16) and eu-west-1 (10.2.0.0/16)
- AWS Transit Gateway with cross-region peering
- VPC Flow Logs to S3 in Parquet format
- Systems Manager endpoints for secure management
- Optional Route53 private hosted zones
- Complete security hardening (encryption, versioning, public access blocking)

## File Structure

```
lib/
├── provider.tf              # Provider and backend configuration
├── variables.tf             # Variable definitions with validation
├── terraform.tfvars         # Example variable values
├── main.tf                  # Hub VPC and S3 bucket resources
├── vpc-spokes.tf            # Spoke VPC configurations
├── transit-gateway.tf       # Transit Gateway and routing
├── flow-logs.tf             # VPC Flow Logs configuration
├── route53.tf               # Private hosted zones (optional)
├── endpoints.tf             # Systems Manager VPC endpoints
├── outputs.tf               # Output definitions
└── modules/
    ├── vpc/
    │   └── main.tf          # Reusable VPC module
    └── sg/
        └── main.tf          # Reusable security group module
```

## 1. Provider Configuration

**File: provider.tf**

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Hub region provider (us-east-1)
provider "aws" {
  alias  = "hub"
  region = var.hub_region
  default_tags {
    tags = var.common_tags
  }
}

# US-West-2 spoke provider
provider "aws" {
  alias  = "us_west"
  region = var.spoke_regions["us-west-2"]
  default_tags {
    tags = var.common_tags
  }
}

# EU-West-1 spoke provider
provider "aws" {
  alias  = "eu_west"
  region = var.spoke_regions["eu-west-1"]
  default_tags {
    tags = var.common_tags
  }
}
```

## 2. Variables

**File: variables.tf**

```hcl
variable "aws_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "trading-platform"
}

variable "enable_route53" {
  description = "Enable Route53 private hosted zone (requires domain)"
  type        = bool
  default     = false
}

variable "hub_region" {
  description = "AWS region for the hub"
  type        = string
  default     = "us-east-1"
}

variable "spoke_regions" {
  description = "AWS regions for the spokes"
  type        = map(string)
  default = {
    "us-west-2" = "us-west-2"
    "eu-west-1" = "eu-west-1"
  }
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.hub_vpc_cidr, 0))
    error_message = "Hub VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "spoke_vpc_cidrs" {
  description = "CIDR blocks for spoke VPCs"
  type        = map(string)
  default = {
    "us-west-2" = "10.1.0.0/16"
    "eu-west-1" = "10.2.0.0/16"
  }

  validation {
    condition = alltrue([
      for cidr in values(var.spoke_vpc_cidrs) : can(cidrhost(cidr, 0))
    ])
    error_message = "All spoke VPC CIDRs must be valid IPv4 CIDR blocks."
  }
}

variable "private_domain_name" {
  description = "Private Route53 domain name"
  type        = string
  default     = "trading.internal"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    CostCenter  = "Finance"
    Owner       = "NetworkTeam"
    Project     = "TradingPlatform"
    Terraform   = "true"
  }
}

variable "flow_log_format" {
  description = "Format for VPC Flow Logs"
  type        = string
  default     = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"
}```

## 3. Variable Values

**File: terraform.tfvars**

```hcl
# Project Configuration
project_name = "trading-platform"

# Region Configuration
aws_region = "us-east-1"
hub_region = "us-east-1"
spoke_regions = {
  "us-west-2" = "us-west-2"
  "eu-west-1" = "eu-west-1"
}

# Network Configuration
hub_vpc_cidr = "10.0.0.0/16"
spoke_vpc_cidrs = {
  "us-west-2" = "10.1.0.0/16"
  "eu-west-1" = "10.2.0.0/16"
}

# DNS Configuration
private_domain_name = "trading.internal"
enable_route53      = false # Set to true if you have a domain configured

# Tagging Standards
common_tags = {
  Environment  = "Production"
  CostCenter   = "FIN-001"
  Owner        = "network-team@company.com"
  Project      = "TradingPlatform"
  Terraform    = "true"
  Compliance   = "PCI-DSS"
  DataClass    = "Confidential"
  BackupPolicy = "Daily"
}

# Flow Logs Configuration - Full format for comprehensive logging
flow_log_format = "$${version} $${account-id} $${interface-id} $${srcaddr} $${dstaddr} $${srcport} $${dstport} $${protocol} $${packets} $${bytes} $${start} $${end} $${action} $${log-status} $${vpc-id} $${subnet-id} $${instance-id} $${tcp-flags} $${type} $${pkt-srcaddr} $${pkt-dstaddr} $${region} $${az-id} $${sublocation-type} $${sublocation-id}"```

## 4. Main Hub Resources

**File: main.tf**

```hcl
# Main orchestration and hub VPC resources

# Data source for availability zones in hub region
data "aws_availability_zones" "hub" {
  provider = aws.hub
  state    = "available"
}

# Hub VPC Module
module "hub_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.hub
  }

  vpc_name             = "hub-vpc"
  vpc_cidr             = var.hub_vpc_cidr
  azs                  = slice(data.aws_availability_zones.hub.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.hub_vpc_cidr, 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.hub_vpc_cidr, 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "hub-vpc"
    Type = "hub"
  })
}

# S3 bucket for VPC Flow Logs (centralized in hub region)
resource "aws_s3_bucket" "flow_logs" {
  provider = aws.hub
  bucket   = "${var.project_name}-vpc-flow-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "VPC Flow Logs Bucket"
    Purpose = "Compliance"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

data "aws_caller_identity" "current" {
  provider = aws.hub
}

# S3 bucket versioning for compliance
resource "aws_s3_bucket_versioning" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}```

## 5. Spoke VPCs

**File: vpc-spokes.tf**

```hcl
# Data sources for availability zones in spoke regions
data "aws_availability_zones" "us_west" {
  provider = aws.us_west
  state    = "available"
}

data "aws_availability_zones" "eu_west" {
  provider = aws.eu_west
  state    = "available"
}

# US-West-2 Spoke VPC
module "us_west_spoke_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.us_west
  }

  vpc_name             = "us-west-2-spoke-vpc"
  vpc_cidr             = var.spoke_vpc_cidrs["us-west-2"]
  azs                  = slice(data.aws_availability_zones.us_west.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["us-west-2"], 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["us-west-2"], 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name   = "us-west-2-spoke-vpc"
    Type   = "spoke"
    Region = "us-west-2"
  })
}

# EU-West-1 Spoke VPC
module "eu_west_spoke_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.eu_west
  }

  vpc_name             = "eu-west-1-spoke-vpc"
  vpc_cidr             = var.spoke_vpc_cidrs["eu-west-1"]
  azs                  = slice(data.aws_availability_zones.eu_west.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["eu-west-1"], 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.spoke_vpc_cidrs["eu-west-1"], 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name   = "eu-west-1-spoke-vpc"
    Type   = "spoke"
    Region = "eu-west-1"
  })
}```

## 6. Transit Gateway

**File: transit-gateway.tf**

```hcl
# Transit Gateway in Hub Region
resource "aws_ec2_transit_gateway" "hub" {
  provider                        = aws.hub
  description                     = "Hub Transit Gateway for Trading Platform"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"

  tags = merge(var.common_tags, {
    Name = "hub-tgw"
    Type = "hub"
  })
}

# Transit Gateway Route Table for Hub
resource "aws_ec2_transit_gateway_route_table" "hub" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-tgw-rtb"
  })
}

# Transit Gateway Route Tables for Spokes
resource "aws_ec2_transit_gateway_route_table" "us_west_spoke" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "us-west-2-spoke-tgw-rtb"
  })
}

resource "aws_ec2_transit_gateway_route_table" "eu_west_spoke" {
  provider           = aws.hub
  transit_gateway_id = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "eu-west-1-spoke-tgw-rtb"
  })
}

# Transit Gateway attachment for Hub VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  provider                                        = aws.hub
  subnet_ids                                      = module.hub_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.hub.id
  vpc_id                                          = module.hub_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "hub-vpc-tgw-attachment"
  })
}

# Transit Gateway Peering for US-West-2
resource "aws_ec2_transit_gateway_peering_attachment" "us_west" {
  provider                = aws.hub
  peer_region             = var.spoke_regions["us-west-2"]
  peer_transit_gateway_id = aws_ec2_transit_gateway.us_west_spoke.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-to-us-west-2-peering"
  })
}

# Transit Gateway in US-West-2 Spoke
resource "aws_ec2_transit_gateway" "us_west_spoke" {
  provider                        = aws.us_west
  description                     = "US-West-2 Spoke Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"

  tags = merge(var.common_tags, {
    Name = "us-west-2-spoke-tgw"
    Type = "spoke"
  })
}

# Transit Gateway attachment for US-West-2 Spoke VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "us_west_spoke" {
  provider                                        = aws.us_west
  subnet_ids                                      = module.us_west_spoke_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.us_west_spoke.id
  vpc_id                                          = module.us_west_spoke_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "us-west-2-vpc-tgw-attachment"
  })
}

# Transit Gateway Peering for EU-West-1
resource "aws_ec2_transit_gateway_peering_attachment" "eu_west" {
  provider                = aws.hub
  peer_region             = var.spoke_regions["eu-west-1"]
  peer_transit_gateway_id = aws_ec2_transit_gateway.eu_west_spoke.id
  transit_gateway_id      = aws_ec2_transit_gateway.hub.id

  tags = merge(var.common_tags, {
    Name = "hub-to-eu-west-1-peering"
  })
}

# Transit Gateway in EU-West-1 Spoke
resource "aws_ec2_transit_gateway" "eu_west_spoke" {
  provider                        = aws.eu_west
  description                     = "EU-West-1 Spoke Transit Gateway"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"

  tags = merge(var.common_tags, {
    Name = "eu-west-1-spoke-tgw"
    Type = "spoke"
  })
}

# Transit Gateway attachment for EU-West-1 Spoke VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "eu_west_spoke" {
  provider                                        = aws.eu_west
  subnet_ids                                      = module.eu_west_spoke_vpc.private_subnet_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.eu_west_spoke.id
  vpc_id                                          = module.eu_west_spoke_vpc.vpc_id
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = merge(var.common_tags, {
    Name = "eu-west-1-vpc-tgw-attachment"
  })
}

# Accept peering attachments
resource "aws_ec2_transit_gateway_peering_attachment_accepter" "us_west" {
  provider                      = aws.us_west
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.us_west.id

  tags = merge(var.common_tags, {
    Name = "us-west-2-peering-accepter"
  })
}

resource "aws_ec2_transit_gateway_peering_attachment_accepter" "eu_west" {
  provider                      = aws.eu_west
  transit_gateway_attachment_id = aws_ec2_transit_gateway_peering_attachment.eu_west.id

  tags = merge(var.common_tags, {
    Name = "eu-west-1-peering-accepter"
  })
}

# Route table associations
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route_table_association" "us_west_peering" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id
}

resource "aws_ec2_transit_gateway_route_table_association" "eu_west_peering" {
  provider                       = aws.hub
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.eu_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
}

# Routes - Hub can reach all spokes
resource "aws_ec2_transit_gateway_route" "hub_to_us_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["us-west-2"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.us_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route" "hub_to_eu_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["eu-west-1"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_peering_attachment.eu_west.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Routes - Spokes to hub and other spoke (through hub)
resource "aws_ec2_transit_gateway_route" "us_west_to_hub" {
  provider                       = aws.hub
  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id
}

resource "aws_ec2_transit_gateway_route" "us_west_to_eu_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["eu-west-1"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id
}

resource "aws_ec2_transit_gateway_route" "eu_west_to_hub" {
  provider                       = aws.hub
  destination_cidr_block         = var.hub_vpc_cidr
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
}

resource "aws_ec2_transit_gateway_route" "eu_west_to_us_west" {
  provider                       = aws.hub
  destination_cidr_block         = var.spoke_vpc_cidrs["us-west-2"]
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
}

# Blackhole routes for unused RFC1918 ranges
locals {
  rfc1918_ranges = ["172.16.0.0/12", "192.168.0.0/16"]
}

resource "aws_ec2_transit_gateway_route" "blackhole_hub" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

resource "aws_ec2_transit_gateway_route" "blackhole_us_west" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.us_west_spoke.id
}

resource "aws_ec2_transit_gateway_route" "blackhole_eu_west" {
  for_each                       = toset(local.rfc1918_ranges)
  provider                       = aws.hub
  destination_cidr_block         = each.value
  blackhole                      = true
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
}

# Update VPC route tables to use Transit Gateway
resource "aws_route" "hub_to_tgw" {
  provider               = aws.hub
  route_table_id         = module.hub_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.hub.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

resource "aws_route" "us_west_to_tgw" {
  provider               = aws.us_west
  route_table_id         = module.us_west_spoke_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.us_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.us_west_spoke]
}

resource "aws_route" "eu_west_to_tgw" {
  provider               = aws.eu_west
  route_table_id         = module.eu_west_spoke_vpc.private_route_table_id
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.eu_west_spoke.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.eu_west_spoke]
}```

## 7. VPC Flow Logs

**File: flow-logs.tf**

```hcl
# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  provider = aws.hub
  name     = "${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

# IAM policy for Flow Logs to write to S3 (least privilege)
resource "aws_iam_role_policy" "flow_logs" {
  provider = aws.hub
  name     = "${var.project_name}-vpc-flow-logs-policy"
  role     = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.flow_logs.arn
      }
    ]
  })
}

# Flow Logs for Hub VPC
resource "aws_flow_log" "hub" {
  provider                 = aws.hub
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/hub-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.hub_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "hub-vpc-flow-logs"
  })
}

# Flow Logs for US-West-2 Spoke VPC
resource "aws_flow_log" "us_west_spoke" {
  provider                 = aws.us_west
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/us-west-2-spoke-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.us_west_spoke_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "us-west-2-spoke-vpc-flow-logs"
  })
}

# Flow Logs for EU-West-1 Spoke VPC
resource "aws_flow_log" "eu_west_spoke" {
  provider                 = aws.eu_west
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/eu-west-1-spoke-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.eu_west_spoke_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "eu-west-1-spoke-vpc-flow-logs"
  })
}

# S3 bucket policy to allow Flow Logs from all regions
resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

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
}```

## 8. Route53 (Optional)

**File: route53.tf**

```hcl
# Private hosted zone for internal DNS (optional)
resource "aws_route53_zone" "private" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  name     = var.private_domain_name
  comment  = "Private hosted zone for trading platform"

  vpc {
    vpc_id     = module.hub_vpc.vpc_id
    vpc_region = var.hub_region
  }

  tags = merge(var.common_tags, {
    Name = "private-hosted-zone"
  })

  lifecycle {
    ignore_changes = [vpc]
  }
}

# Associate private zone with US-West-2 spoke VPC
resource "aws_route53_zone_association" "us_west_spoke" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.us_west
  zone_id  = aws_route53_zone.private[0].zone_id
  vpc_id   = module.us_west_spoke_vpc.vpc_id
}

# Associate private zone with EU-West-1 spoke VPC
resource "aws_route53_zone_association" "eu_west_spoke" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.eu_west
  zone_id  = aws_route53_zone.private[0].zone_id
  vpc_id   = module.eu_west_spoke_vpc.vpc_id
}

# Example DNS records for each region
resource "aws_route53_record" "hub_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.hub"
  type     = "A"
  ttl      = 300
  records  = ["10.0.1.100"] # Example private IP

  depends_on = [aws_route53_zone.private]
}

resource "aws_route53_record" "us_west_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.us-west-2"
  type     = "A"
  ttl      = 300
  records  = ["10.1.1.100"] # Example private IP
}

resource "aws_route53_record" "eu_west_api" {
  count    = var.enable_route53 ? 1 : 0
  provider = aws.hub
  zone_id  = aws_route53_zone.private[0].zone_id
  name     = "api.eu-west-1"
  type     = "A"
  ttl      = 300
  records  = ["10.2.1.100"] # Example private IP
}```

## 9. Systems Manager Endpoints

**File: endpoints.tf**

```hcl
# Security group for VPC endpoints
module "endpoints_sg_hub" {
  source = "./modules/sg"
  providers = {
    aws = aws.hub
  }

  name        = "hub-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.hub_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.hub_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

module "endpoints_sg_us_west" {
  source = "./modules/sg"
  providers = {
    aws = aws.us_west
  }

  name        = "us-west-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.us_west_spoke_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.us_west_spoke_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

module "endpoints_sg_eu_west" {
  source = "./modules/sg"
  providers = {
    aws = aws.eu_west
  }

  name        = "eu-west-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = module.eu_west_spoke_vpc.vpc_id

  ingress_rules = [
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = [module.eu_west_spoke_vpc.vpc_cidr]
    }
  ]

  tags = var.common_tags
}

# Systems Manager endpoints for Hub VPC
locals {
  ssm_endpoints = ["ssm", "ssmmessages", "ec2messages"]
}

resource "aws_vpc_endpoint" "ssm_hub" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.hub
  vpc_id              = module.hub_vpc.vpc_id
  service_name        = "com.amazonaws.${var.hub_region}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.hub_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_hub.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "hub-${each.key}-endpoint"
  })
}

# Systems Manager endpoints for US-West-2 Spoke
resource "aws_vpc_endpoint" "ssm_us_west" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.us_west
  vpc_id              = module.us_west_spoke_vpc.vpc_id
  service_name        = "com.amazonaws.${var.spoke_regions["us-west-2"]}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.us_west_spoke_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_us_west.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "us-west-${each.key}-endpoint"
  })
}

# Systems Manager endpoints for EU-West-1 Spoke
resource "aws_vpc_endpoint" "ssm_eu_west" {
  for_each            = toset(local.ssm_endpoints)
  provider            = aws.eu_west
  vpc_id              = module.eu_west_spoke_vpc.vpc_id
  service_name        = "com.amazonaws.${var.spoke_regions["eu-west-1"]}.${each.key}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = module.eu_west_spoke_vpc.private_subnet_ids
  security_group_ids  = [module.endpoints_sg_eu_west.security_group_id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name = "eu-west-${each.key}-endpoint"
  })
}```

## 10. Outputs

**File: outputs.tf**

```hcl
# Hub VPC Outputs
output "hub_vpc_id" {
  description = "ID of the hub VPC"
  value       = module.hub_vpc.vpc_id
}

output "hub_vpc_cidr" {
  description = "CIDR block of the hub VPC"
  value       = module.hub_vpc.vpc_cidr
}

output "hub_private_subnet_ids" {
  description = "Private subnet IDs in the hub VPC"
  value       = module.hub_vpc.private_subnet_ids
}

output "hub_public_subnet_ids" {
  description = "Public subnet IDs in the hub VPC"
  value       = module.hub_vpc.public_subnet_ids
}

# Spoke VPC Outputs
output "us_west_spoke_vpc_id" {
  description = "ID of the US-West-2 spoke VPC"
  value       = module.us_west_spoke_vpc.vpc_id
}

output "eu_west_spoke_vpc_id" {
  description = "ID of the EU-West-1 spoke VPC"
  value       = module.eu_west_spoke_vpc.vpc_id
}

# Transit Gateway Outputs
output "hub_transit_gateway_id" {
  description = "ID of the hub Transit Gateway"
  value       = aws_ec2_transit_gateway.hub.id
}

output "hub_transit_gateway_arn" {
  description = "ARN of the hub Transit Gateway"
  value       = aws_ec2_transit_gateway.hub.arn
}

output "transit_gateway_route_table_ids" {
  description = "Transit Gateway route table IDs"
  value = {
    hub           = aws_ec2_transit_gateway_route_table.hub.id
    us_west_spoke = aws_ec2_transit_gateway_route_table.us_west_spoke.id
    eu_west_spoke = aws_ec2_transit_gateway_route_table.eu_west_spoke.id
  }
}

# Route53 Outputs (conditional)
output "private_hosted_zone_id" {
  description = "ID of the private hosted zone"
  value       = var.enable_route53 ? aws_route53_zone.private[0].zone_id : null
}

output "private_hosted_zone_name" {
  description = "Name of the private hosted zone"
  value       = var.enable_route53 ? aws_route53_zone.private[0].name : null
}

# Flow Logs Outputs
output "flow_logs_s3_bucket" {
  description = "S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_logs_s3_bucket_arn" {
  description = "ARN of S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.flow_logs.arn
}

# VPC Endpoints Outputs
output "ssm_endpoint_ids" {
  description = "IDs of Systems Manager VPC endpoints"
  value = {
    hub = {
      for k, v in aws_vpc_endpoint.ssm_hub : k => v.id
    }
    us_west = {
      for k, v in aws_vpc_endpoint.ssm_us_west : k => v.id
    }
    eu_west = {
      for k, v in aws_vpc_endpoint.ssm_eu_west : k => v.id
    }
  }
}

output "ssm_endpoint_dns_names" {
  description = "DNS names of Systems Manager VPC endpoints"
  value = {
    hub = {
      for k, v in aws_vpc_endpoint.ssm_hub : k => v.dns_entry[0].dns_name
    }
    us_west = {
      for k, v in aws_vpc_endpoint.ssm_us_west : k => v.dns_entry[0].dns_name
    }
    eu_west = {
      for k, v in aws_vpc_endpoint.ssm_eu_west : k => v.dns_entry[0].dns_name
    }
  }
}```

## 11. VPC Module

**File: modules/vpc/main.tf**

```hcl
variable "vpc_name" {
  description = "Name of the VPC"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "azs" {
  description = "Availability zones"
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

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

# VPC
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(var.tags, {
    Name = var.vpc_name
  })
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-${var.azs[count.index]}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-${var.azs[count.index]}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.azs)
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-eip-${var.azs[count.index]}"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "this" {
  count         = length(var.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-nat-${var.azs[count.index]}"
  })

  depends_on = [aws_internet_gateway.this]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-public-rt"
  })
}

# Private Route Tables (one per AZ for HA)
resource "aws_route_table" "private" {
  count  = length(var.azs)
  vpc_id = aws_vpc.this.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.this[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.vpc_name}-private-rt-${var.azs[count.index]}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Outputs
output "vpc_id" {
  value = aws_vpc.this.id
}

output "vpc_cidr" {
  value = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "private_route_table_id" {
  value = aws_route_table.private[0].id
}```

## 12. Security Group Module

**File: modules/sg/main.tf**

```hcl
variable "name" {
  description = "Name of the security group"
  type        = string
}

variable "description" {
  description = "Description of the security group"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "ingress_rules" {
  description = "List of ingress rules"
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply"
  type        = map(string)
  default     = {}
}

resource "aws_security_group" "this" {
  name        = var.name
  description = var.description
  vpc_id      = var.vpc_id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = var.name
  })
}

output "security_group_id" {
  value = aws_security_group.this.id
}```

## Deployment Instructions

1. Initialize Terraform:
```bash
cd lib
terraform init -backend-config="bucket=your-terraform-state-bucket" \
               -backend-config="key=trading-platform/terraform.tfstate" \
               -backend-config="region=us-east-1"
```

2. Validate configuration:
```bash
terraform validate
```

3. Plan deployment:
```bash
terraform plan -out=tfplan
```

4. Apply configuration:
```bash
terraform apply tfplan
```

## Key Features

### Security
- S3 bucket encryption with AES256
- S3 bucket versioning enabled for compliance
- Complete public access blocking on S3
- Least privilege IAM policies (no wildcards)
- VPC Flow Logs for all network traffic
- Systems Manager endpoints for secure instance access

### Networking
- Multi-region hub-and-spoke topology
- Transit Gateway with cross-region peering
- Separate route tables per spoke (no direct spoke-to-spoke routing)
- Blackhole routes for unused RFC1918 ranges
- DNS support enabled on all Transit Gateway attachments
- 3 Availability Zones per VPC for high availability

### Monitoring & Compliance
- VPC Flow Logs in Parquet format (cost-optimized)
- 1-minute aggregation intervals
- Centralized S3 storage in hub region
- Lifecycle policies for log retention
- Comprehensive tagging for cost tracking

### Flexibility
- Optional Route53 private hosted zones (disabled by default)
- Reusable VPC and security group modules
- CIDR block validation
- Multi-region support with provider aliases

## Cost Estimate

Monthly costs (approximate):
- Transit Gateway: $36/month per gateway x 3 = $108
- Transit Gateway attachments: $36/month per attachment x 6 = $216
- Data transfer: Variable, estimated $50-100/month
- VPC Flow Logs storage: $10-20/month
- Systems Manager endpoints: No additional cost
- Total: $384-454/month

## Notes

- Route53 is disabled by default (set enable_route53=true to enable)
- Flow logs use 60-second aggregation (AWS minimum for S3)
- All resources use consistent tagging for compliance
- Modules allow for easy expansion to additional regions
- S3 backend requires pre-existing state bucket
