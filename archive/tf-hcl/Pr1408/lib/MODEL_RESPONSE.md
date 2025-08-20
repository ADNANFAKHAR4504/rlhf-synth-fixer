# Terraform HCL for Highly Secure, Multi-Region Financial Services Infrastructure

This Terraform configuration creates a highly secure, highly available infrastructure across two AWS regions for a financial services company.

## File Structure

### `versions.tf`
```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.50"
    }
  }
}
```

### `variables.tf`
```hcl
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary region VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary region VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "company" {
  description = "Company name"
  type        = string
  default     = "finco"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "secure-infrastructure"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Compliance  = "pci-dss"
    Company     = "finco"
    Environment = "dev"
  }
}
```

### `locals.tf`
```hcl
locals {
  name_prefix = "${var.company}-${var.environment}"
  
  common_tags = merge(var.tags, {
    ManagedBy = "terraform"
  })

  # Calculate subnet CIDRs for primary region
  primary_public_cidrs = [
    cidrsubnet(var.vpc_cidr_primary, 8, 1),
    cidrsubnet(var.vpc_cidr_primary, 8, 2),
    cidrsubnet(var.vpc_cidr_primary, 8, 3)
  ]
  
  primary_private_cidrs = [
    cidrsubnet(var.vpc_cidr_primary, 8, 11),
    cidrsubnet(var.vpc_cidr_primary, 8, 12),
    cidrsubnet(var.vpc_cidr_primary, 8, 13)
  ]

  # Calculate subnet CIDRs for secondary region
  secondary_public_cidrs = [
    cidrsubnet(var.vpc_cidr_secondary, 8, 1),
    cidrsubnet(var.vpc_cidr_secondary, 8, 2),
    cidrsubnet(var.vpc_cidr_secondary, 8, 3)
  ]
  
  secondary_private_cidrs = [
    cidrsubnet(var.vpc_cidr_secondary, 8, 11),
    cidrsubnet(var.vpc_cidr_secondary, 8, 12),
    cidrsubnet(var.vpc_cidr_secondary, 8, 13)
  ]
}
```

### `providers.tf`
```hcl
provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
```

### `data.tf`
```hcl
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "vpc_flow_logs_assume_role" {
  statement {
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
    
    actions = ["sts:AssumeRole"]
  }
}

data "aws_iam_policy_document" "vpc_flow_logs_policy" {
  statement {
    effect = "Allow"
    
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams"
    ]
    
    resources = [
      "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}-vpc-flow-logs-primary*",
      "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:log-group:${local.name_prefix}-vpc-flow-logs-secondary*"
    ]
  }
}
```

### `kms.tf`
```hcl
# KMS Key for Primary Region
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for ${local.name_prefix} primary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-kms-primary"
    Region = var.primary_region
  })
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${local.name_prefix}-primary"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS Key for Secondary Region
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for ${local.name_prefix} secondary region encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-kms-secondary"
    Region = var.secondary_region
  })
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${local.name_prefix}-secondary"
  target_key_id = aws_kms_key.secondary.key_id
}
```

### `iam.tf`
```hcl
# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name               = "${local.name_prefix}-vpc-flow-logs-role"
  assume_role_policy = data.aws_iam_policy_document.vpc_flow_logs_assume_role.json
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name   = "${local.name_prefix}-vpc-flow-logs-policy"
  role   = aws_iam_role.vpc_flow_logs.id
  policy = data.aws_iam_policy_document.vpc_flow_logs_policy.json
}
```

### `cloudwatch.tf`
```hcl
# CloudWatch Log Groups - Primary Region
resource "aws_cloudwatch_log_group" "primary" {
  provider          = aws.primary
  name              = "${local.name_prefix}-vpc-flow-logs-primary"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.primary.arn
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-flow-logs-primary"
    Region = var.primary_region
  })
}

# CloudWatch Log Groups - Secondary Region
resource "aws_cloudwatch_log_group" "secondary" {
  provider          = aws.secondary
  name              = "${local.name_prefix}-vpc-flow-logs-secondary"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.secondary.arn
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-flow-logs-secondary"
    Region = var.secondary_region
  })
}
```

### `vpc-primary.tf`
```hcl
# Primary Region VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-primary"
    Region = var.primary_region
  })
}

# Internet Gateway - Primary
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-primary"
    Region = var.primary_region
  })
}

# Public Subnets - Primary
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 3
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.primary_public_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-${count.index + 1}-primary"
    Type   = "public"
    Region = var.primary_region
    AZ     = data.aws_availability_zones.primary.names[count.index]
  })
}

# Private Subnets - Primary
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 3
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.primary_private_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-${count.index + 1}-primary"
    Type   = "private"
    Region = var.primary_region
    AZ     = data.aws_availability_zones.primary.names[count.index]
  })
}

# Elastic IPs for NAT Gateways - Primary
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  count    = 3
  domain   = "vpc"
  
  depends_on = [aws_internet_gateway.primary]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-eip-nat-${count.index + 1}-primary"
    Region = var.primary_region
  })
}

# NAT Gateways - Primary (one per AZ)
resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 3
  allocation_id = aws_eip.primary_nat[count.index].id
  subnet_id     = aws_subnet.primary_public[count.index].id
  
  depends_on = [aws_internet_gateway.primary]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-nat-${count.index + 1}-primary"
    Region = var.primary_region
    AZ     = data.aws_availability_zones.primary.names[count.index]
  })
}

# Route Table - Public Primary
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-public-primary"
    Type   = "public"
    Region = var.primary_region
  })
}

# Route Tables - Private Primary (one per AZ)
resource "aws_route_table" "primary_private" {
  provider = aws.primary
  count    = 3
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-private-${count.index + 1}-primary"
    Type   = "private"
    Region = var.primary_region
    AZ     = data.aws_availability_zones.primary.names[count.index]
  })
}

# Route Table Associations - Public Primary
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

# Route Table Associations - Private Primary
resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 3
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private[count.index].id
}

# VPC Flow Logs - Primary
resource "aws_flow_log" "primary" {
  provider        = aws.primary
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.primary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-flow-logs-primary"
    Region = var.primary_region
  })
}
```

### `vpc-secondary.tf`
```hcl
# Secondary Region VPC
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-vpc-secondary"
    Region = var.secondary_region
  })
}

# Internet Gateway - Secondary
resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-igw-secondary"
    Region = var.secondary_region
  })
}

# Public Subnets - Secondary
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 3
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.secondary_public_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-public-subnet-${count.index + 1}-secondary"
    Type   = "public"
    Region = var.secondary_region
    AZ     = data.aws_availability_zones.secondary.names[count.index]
  })
}

# Private Subnets - Secondary
resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 3
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.secondary_private_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-private-subnet-${count.index + 1}-secondary"
    Type   = "private"
    Region = var.secondary_region
    AZ     = data.aws_availability_zones.secondary.names[count.index]
  })
}

# Elastic IPs for NAT Gateways - Secondary
resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  count    = 3
  domain   = "vpc"
  
  depends_on = [aws_internet_gateway.secondary]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-eip-nat-${count.index + 1}-secondary"
    Region = var.secondary_region
  })
}

# NAT Gateways - Secondary (one per AZ)
resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  count         = 3
  allocation_id = aws_eip.secondary_nat[count.index].id
  subnet_id     = aws_subnet.secondary_public[count.index].id
  
  depends_on = [aws_internet_gateway.secondary]
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-nat-${count.index + 1}-secondary"
    Region = var.secondary_region
    AZ     = data.aws_availability_zones.secondary.names[count.index]
  })
}

# Route Table - Public Secondary
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-public-secondary"
    Type   = "public"
    Region = var.secondary_region
  })
}

# Route Tables - Private Secondary (one per AZ)
resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  count    = 3
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-rt-private-${count.index + 1}-secondary"
    Type   = "private"
    Region = var.secondary_region
    AZ     = data.aws_availability_zones.secondary.names[count.index]
  })
}

# Route Table Associations - Public Secondary
resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

# Route Table Associations - Private Secondary
resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = 3
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private[count.index].id
}

# VPC Flow Logs - Secondary
resource "aws_flow_log" "secondary" {
  provider        = aws.secondary
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.secondary.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-flow-logs-secondary"
    Region = var.secondary_region
  })
}
```

### `s3.tf`
```hcl
# S3 Bucket - Primary Region
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${local.name_prefix}-data-primary-${random_id.bucket_suffix.hex}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-data-primary"
    Region = var.primary_region
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket - Secondary Region
resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${local.name_prefix}-data-secondary-${random_id.bucket_suffix.hex}"
  
  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-data-secondary"
    Region = var.secondary_region
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.secondary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Random ID for bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}
```

### `outputs.tf`
```hcl
output "vpc_ids" {
  description = "VPC IDs for both regions"
  value = {
    primary   = aws_vpc.primary.id
    secondary = aws_vpc.secondary.id
  }
}

output "public_subnet_ids" {
  description = "Public subnet IDs for both regions"
  value = {
    primary   = aws_subnet.primary_public[*].id
    secondary = aws_subnet.secondary_public[*].id
  }
}

output "private_subnet_ids" {
  description = "Private subnet IDs for both regions"
  value = {
    primary   = aws_subnet.primary_private[*].id
    secondary = aws_subnet.secondary_private[*].id
  }
}

output "kms_key_ids" {
  description = "KMS key IDs for both regions"
  value = {
    primary   = aws_kms_key.primary.id
    secondary = aws_kms_key.secondary.id
  }
}

output "s3_bucket_names" {
  description = "S3 bucket names for both regions"
  value = {
    primary   = aws_s3_bucket.primary.id
    secondary = aws_s3_bucket.secondary.id
  }
}

output "cloudwatch_log_group_names" {
  description = "CloudWatch log group names for both regions"
  value = {
    primary   = aws_cloudwatch_log_group.primary.name
    secondary = aws_cloudwatch_log_group.secondary.name
  }
}
```

## Key Security Features

### 1. **Encryption at Rest**
- All KMS keys have rotation enabled
- CloudWatch logs encrypted with region-specific KMS keys
- S3 buckets use SSE-KMS with CMKs
- Bucket key enabled for cost optimization

### 2. **Network Security**
- Private subnets have no direct internet access
- Each AZ has its own NAT Gateway for high availability
- VPC Flow Logs capture all network traffic
- Public access blocked on S3 buckets

### 3. **Least Privilege IAM**
- VPC Flow Logs role only has permissions for CloudWatch operations
- Resource-specific ARNs in IAM policies
- No wildcard permissions

### 4. **High Availability**
- Multi-region deployment
- 3 AZs per region
- NAT Gateway per AZ (no single point of failure)
- S3 versioning enabled

### 5. **Compliance & Monitoring**
- 90-day log retention
- Comprehensive tagging for compliance tracking
- VPC Flow Logs for network monitoring
- All resources tagged with compliance metadata

## Usage

1. Initialize Terraform:
```bash
terraform init
```

2. Format the code:
```bash
terraform fmt
```

3. Validate the configuration:
```bash
terraform validate
```

4. Plan the deployment:
```bash
terraform plan
```

5. Apply the configuration:
```bash
terraform apply
```

This configuration provides a solid foundation for a financial services infrastructure with enterprise-grade security, monitoring, and high availability across multiple AWS regions.