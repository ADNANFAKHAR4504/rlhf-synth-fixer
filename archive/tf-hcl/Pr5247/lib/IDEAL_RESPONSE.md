### variables.tf
```hcl
# variables.tf - Input variables for multi-region VPC infrastructure

variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
  validation {
    condition = contains([
      "us-east-1", "us-west-1", "us-west-2", "eu-west-1", "eu-central-1",
      "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ca-central-1"
    ], var.aws_region)
    error_message = "Region must be a valid AWS region."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.environment))
    error_message = "Environment must be lowercase alphanumeric with hyphens."
  }
}

variable "project_name" {
  description = "Name of the project for resource naming and tagging"
  type        = string
  default     = "fintech-vpc"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC - must be /20 for future expansion"
  type        = string
  default     = "10.0.0.0/20"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0)) && can(regex("/20$", var.vpc_cidr))
    error_message = "VPC CIDR must be a valid /20 CIDR block."
  }
}

variable "availability_zones_count" {
  description = "Number of availability zones to use (must be exactly 3)"
  type        = number
  default     = 3
  validation {
    condition     = var.availability_zones_count == 3
    error_message = "Must use exactly 3 availability zones as per requirements."
  }
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway for cost optimization (only in first AZ)"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "custom_dns_servers" {
  description = "Custom DNS servers for DHCP options set"
  type        = list(string)
  default     = ["8.8.8.8", "8.8.4.4"]
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs with CloudWatch destination"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Number of days to retain VPC Flow Logs"
  type        = number
  default     = 14
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.flow_logs_retention_days)
    error_message = "Retention days must be a valid CloudWatch Logs retention period."
  }
}

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Private subnet configuration
variable "private_subnet_suffix" {
  description = "Suffix for private subnet names"
  type        = string
  default     = "private"
}

# Public subnet configuration  
variable "public_subnet_suffix" {
  description = "Suffix for public subnet names"
  type        = string
  default     = "public"
}

variable "map_public_ip_on_launch" {
  description = "Map public IP on launch for instances in public subnets"
  type        = bool
  default     = true
}
```

### locals.tf
```hcl
# locals.tf - Local values and computed configurations

locals {
  # Naming convention with region suffix
  name_prefix = "${var.project_name}-${var.environment}-${var.aws_region}"
  
  # Common tags for all resources
  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      Region      = var.aws_region
      ManagedBy   = "terraform"
      CreatedAt   = formatdate("YYYY-MM-DD", timestamp())
    },
    var.additional_tags
  )

  # VPC configuration
  vpc_name = "${local.name_prefix}-vpc"
  
  # Availability zone configuration
  az_count = var.availability_zones_count
  
  # CIDR calculations for subnets
  # VPC CIDR: 10.0.0.0/20 provides 4096 IP addresses
  # Public subnets: /26 (64 IPs each) - 10.0.0.0/26, 10.0.0.64/26, 10.0.0.128/26
  # Private subnets: /24 (256 IPs each) - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
  
  public_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 6, 0),   # 10.0.0.0/26
    cidrsubnet(var.vpc_cidr, 6, 1),   # 10.0.0.64/26  
    cidrsubnet(var.vpc_cidr, 6, 2),   # 10.0.0.128/26
  ]
  
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 1),   # 10.0.1.0/24
    cidrsubnet(var.vpc_cidr, 4, 2),   # 10.0.2.0/24
    cidrsubnet(var.vpc_cidr, 4, 3),   # 10.0.3.0/24
  ]

  # Subnet names
  public_subnet_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.public_subnet_suffix}-${i + 1}"
  ]
  
  private_subnet_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.private_subnet_suffix}-${i + 1}"
  ]

  # Internet Gateway name
  igw_name = "${local.name_prefix}-igw"
  
  # NAT Gateway configuration
  nat_gateway_name = "${local.name_prefix}-nat"
  nat_eip_name     = "${local.name_prefix}-nat-eip"
  
  # Route table names
  public_route_table_name  = "${local.name_prefix}-public-rt"
  private_route_table_names = [
    for i in range(local.az_count) : "${local.name_prefix}-${var.private_subnet_suffix}-rt-${i + 1}"
  ]

  # DHCP options set name
  dhcp_options_name = "${local.name_prefix}-dhcp"

  # VPC Flow Logs configuration
  flow_logs_name           = "${local.name_prefix}-flow-logs"
  flow_logs_log_group_name = "/aws/vpc/flowlogs/${local.name_prefix}"
  flow_logs_role_name      = "${local.name_prefix}-flow-logs-role"
  flow_logs_policy_name    = "${local.name_prefix}-flow-logs-policy"

  # Security group for VPC endpoints (if needed in future)
  vpc_endpoint_sg_name = "${local.name_prefix}-vpc-endpoints-sg"
}
```

### data.tf
```hcl
# data.tf - Data sources for dynamic resource selection

# Get current AWS region
data "aws_region" "current" {}

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# Dynamically get availability zones for the current region
# Filter to get only available AZs and select exactly 3
data "aws_availability_zones" "available" {
  state = "available"
  
  # Exclude any AZs that might have limited instance types
  exclude_names = []
  
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Local validation to ensure we have at least 3 AZs
locals {
  # Select exactly 3 AZs from available ones
  selected_azs = slice(data.aws_availability_zones.available.names, 0, var.availability_zones_count)
  
  # Validation: ensure we have enough AZs
  az_validation = length(data.aws_availability_zones.available.names) >= var.availability_zones_count ? true : tobool("Region ${var.aws_region} does not have enough availability zones. Required: ${var.availability_zones_count}, Available: ${length(data.aws_availability_zones.available.names)}")
}
```

### vpc.tf
```hcl
# vpc.tf - VPC and core networking components

# Main VPC with /20 CIDR block
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(local.common_tags, {
    Name = local.vpc_name
    Type = "vpc"
  })
}

# Internet Gateway for public subnet internet access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name        = local.igw_name
    Environment = var.environment
    Project     = var.project_name
    Type        = "internet-gateway"
  })

  depends_on = [aws_vpc.main]
}

# DHCP Options Set with custom DNS servers
resource "aws_vpc_dhcp_options" "main" {
  domain_name_servers = var.custom_dns_servers
  domain_name         = var.aws_region == "us-east-1" ? "ec2.internal" : "${var.aws_region}.compute.internal"

  tags = merge(local.common_tags, {
    Name = local.dhcp_options_name
    Type = "dhcp-options"
  })
}

# Associate DHCP Options Set with VPC
resource "aws_vpc_dhcp_options_association" "main" {
  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.main.id
}
```

### subnets.tf
```hcl
# subnets.tf - Public and private subnets across availability zones

# Public subnets (3 subnets with /26 CIDR blocks)
resource "aws_subnet" "public" {
  count = var.availability_zones_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.selected_azs[count.index]
  map_public_ip_on_launch = var.map_public_ip_on_launch

  tags = merge(local.common_tags, {
    Name = local.public_subnet_names[count.index]
    Type = "public-subnet"
    Tier = "public"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}

# Private subnets (3 subnets with /24 CIDR blocks)
resource "aws_subnet" "private" {
  count = var.availability_zones_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.selected_azs[count.index]

  tags = merge(local.common_tags, {
    Name = local.private_subnet_names[count.index]
    Type = "private-subnet"
    Tier = "private"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}
```

### routing.tf
```hcl
# routing.tf - NAT Gateway, route tables, and routing configuration

# Elastic IP for NAT Gateway (only in first AZ for cost optimization)
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway && var.single_nat_gateway ? 1 : 0

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = local.nat_eip_name
    Type = "elastic-ip"
  })

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway in first availability zone only (cost optimization)
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway && var.single_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = local.nat_gateway_name
    Type = "nat-gateway"
    AZ   = local.selected_azs[0]
  })

  depends_on = [
    aws_internet_gateway.main,
    aws_subnet.public
  ]
}

# Route table for public subnets (shared across all public subnets)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # Route to Internet Gateway for internet access
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = local.public_route_table_name
    Type = "route-table"
    Tier = "public"
  })

  depends_on = [aws_vpc.main, aws_internet_gateway.main]
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id

  depends_on = [aws_subnet.public, aws_route_table.public]
}

# Separate route tables for each private subnet (prevents cross-AZ communication)
resource "aws_route_table" "private" {
  count = var.availability_zones_count

  vpc_id = aws_vpc.main.id

  # Route to NAT Gateway for internet access (only if NAT Gateway is enabled)
  dynamic "route" {
    for_each = var.enable_nat_gateway && var.single_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = merge(local.common_tags, {
    Name = local.private_route_table_names[count.index]
    Type = "route-table"
    Tier = "private"
    AZ   = local.selected_azs[count.index]
  })

  depends_on = [aws_vpc.main]
}

# Associate each private subnet with its own route table
resource "aws_route_table_association" "private" {
  count = var.availability_zones_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id

  depends_on = [aws_subnet.private, aws_route_table.private]
}
```

### monitoring.tf
```hcl
# monitoring.tf - VPC Flow Logs and monitoring configuration

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = local.flow_logs_log_group_name
  retention_in_days = var.flow_logs_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.flow_logs_name}-log-group"
    Type = "cloudwatch-log-group"
  })
}

# IAM role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = local.flow_logs_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = local.flow_logs_role_name
    Type = "iam-role"
  })
}

# IAM policy for VPC Flow Logs to write to CloudWatch
resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = local.flow_logs_policy_name
  role = aws_iam_role.vpc_flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect = "Allow"
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.vpc_flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = local.flow_logs_name
    Type = "vpc-flow-logs"
  })

  depends_on = [
    aws_vpc.main,
    aws_cloudwatch_log_group.vpc_flow_logs,
    aws_iam_role_policy.vpc_flow_logs
  ]
}
```

### outputs.tf
```hcl
# outputs.tf - Output values for use by other Terraform modules

# VPC outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Availability zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = local.selected_azs
}

# Public subnet outputs
output "public_subnet_ids" {
  description = "List of IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_arns" {
  description = "List of ARNs of the public subnets"
  value       = aws_subnet.public[*].arn
}

output "public_subnet_cidr_blocks" {
  description = "List of CIDR blocks of the public subnets"
  value       = aws_subnet.public[*].cidr_block
}

# Private subnet outputs
output "private_subnet_ids" {
  description = "List of IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnet_arns" {
  description = "List of ARNs of the private subnets"
  value       = aws_subnet.private[*].arn
}

output "private_subnet_cidr_blocks" {
  description = "List of CIDR blocks of the private subnets"
  value       = aws_subnet.private[*].cidr_block
}

# Internet Gateway outputs
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "internet_gateway_arn" {
  description = "ARN of the Internet Gateway"
  value       = aws_internet_gateway.main.arn
}

# NAT Gateway outputs
output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = var.enable_nat_gateway && var.single_nat_gateway ? aws_nat_gateway.main[0].id : null
}

output "nat_gateway_public_ip" {
  description = "Public IP address of the NAT Gateway"
  value       = var.enable_nat_gateway && var.single_nat_gateway ? aws_eip.nat[0].public_ip : null
}

# Route table outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

# DHCP options outputs
output "dhcp_options_id" {
  description = "ID of the DHCP options set"
  value       = aws_vpc_dhcp_options.main.id
}

# VPC Flow Logs outputs
output "vpc_flow_logs_id" {
  description = "ID of the VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_flow_log.vpc_flow_logs[0].id : null
}

output "vpc_flow_logs_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs"
  value       = var.enable_vpc_flow_logs ? aws_cloudwatch_log_group.vpc_flow_logs[0].name : null
}

# Naming and tagging outputs
output "name_prefix" {
  description = "Name prefix used for all resources"
  value       = local.name_prefix
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}

# Regional information
output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}
```

### provider.tf
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
```
