### Reasoning Trace
---

The user wants a complete Terraform configuration for a production-grade VPC architecture for a financial payment processing system. Let me break down the requirements:

1. **VPC Architecture Requirements:**
   - Custom VPC with CIDR 10.0.0.0/16
   - 3 AZs (dynamic, not hardcoded)
   - Three subnet tiers per AZ:
     - Public: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
     - Private: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
     - Database: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Use locals for CIDR mapping
   - One NAT Gateway per AZ in public subnets (no NAT instances)
   - Route tables:
     - Public → IGW
     - Private → NAT Gateway
     - Database → no internet access
   - VPC Gateway Endpoints for S3 and DynamoDB
   - VPC Flow Logs with 5-minute aggregation to encrypted S3 bucket
   - Network ACLs with explicit DENY-by-default:
     - Allow HTTPS (443)
     - Allow SSH (22) from admin CIDR variable
     - Allow PostgreSQL (5432) between private and database tiers
   - Tags: Project=PaymentPlatform, Environment=Production, CostCenter=Finance
   - Transit Gateway attachment to private subnets
   - Outputs: VPC ID, subnet IDs, NAT Gateway EIPs

2. **Infrastructure & Coding Requirements:**
   - Files in lib/ directory
   - No hardcoding (ARNs, Account IDs, regions, principals)
   - Use locals for naming, CIDRs, tags
   - KMS CMK for encryption
   - Terraform 1.5+, AWS Provider 5.x
   - Use data source for AZs
   - Follow HashiCorp style guide
   - Use for_each and maps

I'll implement a modular, flexible approach that meets these stringent security and architectural requirements. The configuration will leverage dynamic data sources, map-based resource creation, and robust encryption mechanisms to ensure a scalable and secure network infrastructure for the financial payment system.
### Answer 
---

I'll create a complete Terraform configuration for a production-grade VPC architecture for a financial payment processing system. Here's the modular, HashiCorp-style implementation:

## lib/provider.tf

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
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Data source to dynamically fetch availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}
```

## lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "Production"
}

variable "admin_cidr" {
  description = "CIDR block for administrative SSH access"
  type        = string
  default     = "10.100.0.0/16"
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain flow logs"
  type        = number
  default     = 90
}

variable "enable_transit_gateway" {
  description = "Enable Transit Gateway attachment"
  type        = bool
  default     = true
}

variable "transit_gateway_id" {
  description = "ID of existing Transit Gateway (optional)"
  type        = string
  default     = ""
}
```

## lib/tap_stack.tf

```hcl
# Local values for consistent naming and configuration
locals {
  project_name = "PaymentPlatform"
  environment  = var.environment_suffix
  region       = data.aws_region.current.name
  account_id   = data.aws_caller_identity.current.account_id
  
  # Resource naming convention
  name_prefix = "${lower(local.project_name)}-${lower(local.environment)}"
  
  # VPC CIDR blocks
  vpc_cidr      = "10.0.0.0/16"
  public_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  db_cidrs      = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
  
  # Common tags for all resources
  common_tags = {
    Project     = local.project_name
    Environment = local.environment
    CostCenter  = "Finance"
    ManagedBy   = "Terraform"
    Owner       = "SecurityTeam"
  }
  
  # AZ mapping
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# KMS CMK for encryption
resource "aws_kms_key" "vpc_encryption" {
  description             = "KMS key for VPC encryption - ${local.name_prefix}"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow VPC Flow Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
        }
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-kms"
  })
}

resource "aws_kms_alias" "vpc_encryption" {
  name          = "alias/${local.name_prefix}-vpc"
  target_key_id = aws_kms_key.vpc_encryption.key_id
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  for_each = { for idx, cidr in local.public_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  }}
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${each.value.availability_zone}"
    Type = "Public"
    Tier = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  for_each = { for idx, cidr in local.private_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  }}
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr_block
  availability_zone = each.value.availability_zone
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${each.value.availability_zone}"
    Type = "Private"
    Tier = "Application"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  for_each = { for idx, cidr in local.db_cidrs : idx => {
    cidr_block        = cidr
    availability_zone = local.azs[idx]
  }}
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr_block
  availability_zone = each.value.availability_zone
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-${each.value.availability_zone}"
    Type = "Database"
    Tier = "Data"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  for_each = aws_subnet.public
  
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-eip-${each.value.availability_zone}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways - One per AZ for high availability
resource "aws_nat_gateway" "main" {
  for_each = aws_subnet.public
  
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${each.value.availability_zone}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
    Type = "Public"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables - One per AZ
resource "aws_route_table" "private" {
  for_each = aws_subnet.private
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt-${aws_subnet.private[each.key].availability_zone}"
    Type = "Private"
  })
}

resource "aws_route" "private_nat" {
  for_each = aws_route_table.private
  
  route_table_id         = each.value.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[each.key].id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

# Database Route Table (no internet access)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-rt"
    Type = "Database"
  })
}

resource "aws_route_table_association" "database" {
  for_each = aws_subnet.database
  
  subnet_id      = each.value.id
  route_table_id = aws_route_table.database.id
}

# VPC Endpoints
# S3 Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${local.region}.s3"
  
  route_table_ids = concat(
    [for rt in aws_route_table.private : rt.id],
    [aws_route_table.database.id]
  )
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

# DynamoDB Endpoint
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${local.region}.dynamodb"
  
  route_table_ids = concat(
    [for rt in aws_route_table.private : rt.id],
    [aws_route_table.database.id]
  )
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
  })
}

# Network ACLs
# Public NACL
resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id
  
  subnet_ids = [for subnet in aws_subnet.public : subnet.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-nacl"
    Type = "Public"
  })
}

# Public NACL Rules
resource "aws_network_acl_rule" "public_https_ingress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_https_egress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ephemeral_ingress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_ephemeral_egress" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id
  
  subnet_ids = [for subnet in aws_subnet.private : subnet.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-nacl"
    Type = "Private"
  })
}

# Private NACL Rules
resource "aws_network_acl_rule" "private_https_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_https_egress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_ssh_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.admin_cidr
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "private_postgres_to_db" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "private_ephemeral_ingress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_ephemeral_egress" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.vpc_cidr
  from_port      = 1024
  to_port        = 65535
}

# Database NACL
resource "aws_network_acl" "database" {
  vpc_id = aws_vpc.main.id
  
  subnet_ids = [for subnet in aws_subnet.database : subnet.id]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-nacl"
    Type = "Database"
  })
}

# Database NACL Rules
resource "aws_network_acl_rule" "database_postgres_ingress" {
  for_each = { for idx, cidr in local.private_cidrs : idx => cidr }
  
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100 + tonumber(each.key)
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "database_ephemeral_egress" {
  for_each = { for idx, cidr in local.private_cidrs : idx => cidr }
  
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100 + tonumber(each.key)
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = each.value
  from_port      = 1024
  to_port        = 65535
}

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  bucket = "${local.name_prefix}-vpc-flow-logs-${local.account_id}"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

resource "aws_s3_bucket_encryption" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  bucket = aws_s3_bucket.flow_logs[0].id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.vpc_encryption.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  bucket = aws_s3_bucket.flow_logs[0].id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  bucket = aws_s3_bucket.flow_logs[0].id
  
  rule {
    id     = "expire_old_logs"
    status = "Enabled"
    
    expiration {
      days = var.flow_logs_retention_days
    }
  }
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0
  
  log_destination_type = "s3"
  log_destination      = "${aws_s3_bucket.flow_logs[0].arn}/"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  
  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs"
  })
}

# Transit Gateway Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  count = var.enable_transit_gateway ? 1 : 0
  
  subnet_ids         = [for subnet in aws_subnet.private : subnet.id]
  transit_gateway_id = var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id
  vpc_id             = aws_vpc.main.id
  
  dns_support                                     = "enable"
  transit_gateway_default_route_table_association = true
  transit_gateway_default_route_table_propagation = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw-attachment"
  })
}

# Create Transit Gateway if not provided
resource "aws_ec2_transit_gateway" "main" {
  count = var.enable_transit_gateway && var.transit_gateway_id == "" ? 1 : 0
  
  description                     = "Transit Gateway for ${local.name_prefix}"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  dns_support                     = "enable"
  vpn_ecmp_support                = "enable"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tgw"
  })
}

# Routes for Transit Gateway
resource "aws_route" "private_to_tgw" {
  for_each = var.enable_transit_gateway ? aws_route_table.private : {}
  
  route_table_id         = each.value.id
  destination_cidr_block = "192.168.0.0/16" # Example for other regions
  transit_gateway_id     = var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id
  
  depends_on = [aws_ec2_transit_gateway_vpc_attachment.main]
}
```

## lib/outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = { for k, v in aws_subnet.public : k => v.id }
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = { for k, v in aws_subnet.private : k => v.id }
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = { for k, v in aws_subnet.database : k => v.id }
}

output "nat_gateway_eips" {
  description = "Elastic IP addresses associated with NAT Gateways"
  value       = { for k, v in aws_eip.nat : k => v.public_ip }
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = { for k, v in aws_nat_gateway.main : k => v.id }
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.vpc_encryption.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.vpc_encryption.arn
}

output "vpc_endpoints" {
  description = "VPC endpoint IDs"
  value = {
    s3       = aws_vpc_endpoint.s3.id
    dynamodb = aws_vpc_endpoint.dynamodb.id
  }
}

output "flow_logs_s3_bucket" {
  description = "S3 bucket name for VPC flow logs"
  value       = var.enable_flow_logs ? aws_s3_bucket.flow_logs[0].id : null
}

output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = var.enable_transit_gateway ? (var.transit_gateway_id != "" ? var.transit_gateway_id : aws_ec2_transit_gateway.main[0].id) : null
}

output "transit_gateway_attachment_id" {
  description = "ID of the Transit Gateway VPC attachment"
  value       = var.enable_transit_gateway ? aws_ec2_transit_gateway_vpc_attachment.main[0].id : null
}

output "availability_zones" {
  description = "Availability zones used for the VPC"
  value       = local.azs
}

output "network_acl_ids" {
  description = "Network ACL IDs"
  value = {
    public   = aws_network_acl.public.id
    private  = aws_network_acl.private.id
    database = aws_network_acl.database.id
  }
}
```

## How to Apply and Customize

### Prerequisites

1. **Install Terraform 1.5+**
   ```bash
   terraform -version
   ```

2. **Configure AWS credentials**
   ```bash
   aws configure
   # Or use environment variables
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   ```

### Basic Usage

1. **Initialize Terraform**
   ```bash
   cd lib/
   terraform init
   ```

2. **Create a terraform.tfvars file** (optional)
   ```hcl
   aws_region               = "us-west-2"
   environment_suffix       = "Production"
   admin_cidr              = "10.100.0.0/16"
   enable_flow_logs        = true
   flow_logs_retention_days = 90
   enable_transit_gateway   = true
   ```

3. **Plan the deployment**
   ```bash
   terraform plan
   ```

4. **Apply the configuration**
   ```bash
   terraform apply
   ```

### Customization Options

1. **Different Region**: Change `aws_region` variable
   ```bash
   terraform apply -var="aws_region=eu-west-1"
   ```

2. **Disable Transit Gateway**: 
   ```bash
   terraform apply -var="enable_transit_gateway=false"
   ```

3. **Use Existing Transit Gateway**:
   ```bash
   terraform apply -var="transit_gateway_id=tgw-1234567890abcdef"
   ```

4. **Change Admin CIDR**:
   ```bash
   terraform apply -var="admin_cidr=192.168.1.0/24"
   ```

5. **Disable Flow Logs**:
   ```bash
   terraform apply -var="enable_flow_logs=false"
   ```

### Architecture Notes

This configuration creates:
- A highly available VPC architecture across 3 AZs
- Complete network isolation between tiers
- One NAT Gateway per AZ for redundancy
- Encrypted VPC Flow Logs with automatic retention
- Network ACLs with explicit deny-by-default rules
- VPC endpoints to reduce data transfer costs
- KMS CMK for all encryption needs
- Transit Gateway ready for multi-region expansion

The architecture follows AWS Well-Architected Framework principles for security, reliability, and cost optimization.