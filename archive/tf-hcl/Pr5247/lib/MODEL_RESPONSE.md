### Reasoning Trace
---

The user is asking for a comprehensive Terraform configuration for a multi-region AWS VPC setup. Let me break down the requirements:

1. VPC with /20 CIDR block
2. 3 public subnets (/26) and 3 private subnets (/24) across 3 AZs
3. Internet Gateway for public connectivity
4. Single NAT Gateway in first AZ for cost optimization
5. Proper route tables
6. VPC Flow Logs to CloudWatch
7. DHCP options with custom DNS (8.8.8.8, 8.8.4.4)
8. Consistent tagging (Environment, Project, Region)
9. Dynamic AZ selection
10. Module outputs for integration

Let me create a comprehensive Terraform configuration that addresses all these requirements. I'll structure it as a module that can be easily reused across regions.

For the CIDR blocks:
- VPC: /20 (4096 IPs) - e.g., 10.0.0.0/20
- Private subnets: /24 (256 IPs each) - 3 subnets
- Public subnets: /26 (64 IPs each) - 3 subnets

Let me calculate the subnet ranges:
- VPC CIDR: 10.0.0.0/20 (10.0.0.0 - 10.0.15.255)
- Private Subnet 1: 10.0.0.0/24 (10.0.0.0 - 10.0.0.255)
- Private Subnet 2: 10.0.1.0/24 (10.0.1.0 - 10.0.1.255)
- Private Subnet 3: 10.0.2.0/24 (10.0.2.0 - 10.0.2.255)


- Public Subnet 1: 10.0.3.0/26 (10.0.3.0 - 10.0.3.63)
- Public Subnet 2: 10.0.3.64/26 (10.0.3.64 - 10.0.3.127)
- Public Subnet 3: 10.0.3.128/26 (10.0.3.128 - 10.0.3.191)

I'll design a flexible module structure that allows for easy customization and region-specific deployments. The configuration will leverage Terraform's data sources to dynamically select availability zones and create a scalable network architecture.
### Answer 
---

I'll create a comprehensive Terraform configuration for your multi-region VPC infrastructure. This solution follows AWS best practices while meeting your specific requirements for a financial services application.

## Project Structure

```
terraform-vpc/
├── main.tf           # Main VPC resources
├── variables.tf      # Input variables
├── outputs.tf        # Module outputs
├── flow-logs.tf      # VPC Flow Logs configuration
├── versions.tf       # Provider requirements
└── terraform.tfvars  # Example variable values
```

## Terraform Configuration

### **versions.tf** - Provider Configuration

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### **variables.tf** - Input Variables

```hcl
variable "region" {
  description = "AWS region for deployment"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/20"
}

variable "environment" {
  description = "Environment name (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "financial-services"
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "flow_log_retention_days" {
  description = "Number of days to retain flow logs"
  type        = number
  default     = 30
}

variable "custom_dns_servers" {
  description = "Custom DNS servers for DHCP options"
  type        = list(string)
  default     = ["8.8.8.8", "8.8.4.4"]
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### **main.tf** - Core VPC Infrastructure

```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
  
  # Exclude Local Zones and Wavelength Zones
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Local variables for computed values
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  # Subnet CIDR calculations
  private_subnet_cidrs = [
    cidrsubnet(var.vpc_cidr, 4, 0),  # 10.0.0.0/24
    cidrsubnet(var.vpc_cidr, 4, 1),  # 10.0.1.0/24
    cidrsubnet(var.vpc_cidr, 4, 2),  # 10.0.2.0/24
  ]
  
  public_subnet_cidrs = [
    cidrsubnet(cidrsubnet(var.vpc_cidr, 4, 3), 2, 0),  # 10.0.3.0/26
    cidrsubnet(cidrsubnet(var.vpc_cidr, 4, 3), 2, 1),  # 10.0.3.64/26
    cidrsubnet(cidrsubnet(var.vpc_cidr, 4, 3), 2, 2),  # 10.0.3.128/26
  ]
  
  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project
      Region      = var.region
      ManagedBy   = "Terraform"
    },
    var.tags
  )
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-vpc-${var.region}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-igw-${var.region}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-subnet-${count.index + 1}-${var.region}"
      Type = "Public"
      Tier = "Web"
      AZ   = local.azs[count.index]
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.private_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-subnet-${count.index + 1}-${var.region}"
      Type = "Private"
      Tier = "Database"
      AZ   = local.azs[count.index]
    }
  )
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-eip-${var.region}"
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (Single instance in first AZ for cost optimization)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-nat-gateway-${var.region}"
      AZ   = local.azs[0]
    }
  )
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-public-rt-${var.region}"
      Type = "Public"
    }
  )
}

# Route to Internet Gateway for Public Subnets
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  count = 3
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Tables for Private Subnets (One per AZ for isolation)
resource "aws_route_table" "private" {
  count = 3
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-private-rt-${count.index + 1}-${var.region}"
      Type = "Private"
      AZ   = local.azs[count.index]
    }
  )
}

# Route to NAT Gateway for Private Subnets
resource "aws_route" "private_nat" {
  count = 3
  
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}

# Associate Private Subnets with their Route Tables
resource "aws_route_table_association" "private" {
  count = 3
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DHCP Options Set with Custom DNS
resource "aws_vpc_dhcp_options" "main" {
  domain_name_servers = var.custom_dns_servers
  domain_name         = "${var.region}.compute.internal"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-dhcp-options-${var.region}"
    }
  )
}

# Associate DHCP Options with VPC
resource "aws_vpc_dhcp_options_association" "main" {
  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.main.id
}
```

### **flow-logs.tf** - VPC Flow Logs Configuration

```hcl
# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  name              = "/aws/vpc/${var.project}-${var.region}"
  retention_in_days = var.flow_log_retention_days
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-vpc-flow-logs-${var.region}"
    }
  )
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${var.project}-vpc-flow-logs-role-${var.region}"
  
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
  
  tags = local.common_tags
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${var.project}-vpc-flow-logs-policy-${var.region}"
  role = aws_iam_role.vpc_flow_logs[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0
  
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.vpc_flow_logs[0].arn
  iam_role_arn        = aws_iam_role.vpc_flow_logs[0].arn
  vpc_id              = aws_vpc.main.id
  traffic_type        = "ALL"
  
  tags = merge(
    local.common_tags,
    {
      Name = "${var.project}-vpc-flow-log-${var.region}"
    }
  )
}
```

### **outputs.tf** - Module Outputs

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
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "nat_gateway_ip" {
  description = "Elastic IP address of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = local.azs
}

output "flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = var.enable_flow_logs ? aws_flow_log.main[0].id : null
}

output "flow_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs"
  value       = var.enable_flow_logs ? aws_cloudwatch_log_group.vpc_flow_logs[0].name : null
}
```

## Usage Example

### **main.tf** - Root Module for Multi-Region Deployment

```hcl
# Provider configuration for each region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}

provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}

# US East 1 VPC
module "vpc_us_east_1" {
  source = "./terraform-vpc"
  
  providers = {
    aws = aws.us_east_1
  }
  
  region      = "us-east-1"
  vpc_cidr    = "10.0.0.0/20"
  environment = "production"
  project     = "financial-services"
}

# EU West 1 VPC
module "vpc_eu_west_1" {
  source = "./terraform-vpc"
  
  providers = {
    aws = aws.eu_west_1
  }
  
  region      = "eu-west-1"
  vpc_cidr    = "10.16.0.0/20"
  environment = "production"
  project     = "financial-services"
}

# AP Southeast 1 VPC
module "vpc_ap_southeast_1" {
  source = "./terraform-vpc"
  
  providers = {
    aws = aws.ap_southeast_1
  }
  
  region      = "ap-southeast-1"
  vpc_cidr    = "10.32.0.0/20"
  environment = "production"
  project     = "financial-services"
}
```

## Key Features

### 1. **Network Isolation**
- Separate route tables per private subnet prevent cross-AZ communication
- Public subnets share a common route table for internet access
- Private subnets route through a single NAT Gateway for cost optimization

### 2. **High Availability**
- Resources spread across 3 availability zones
- Automatic AZ selection using data sources
- NAT Gateway placed in first AZ with all private subnets routing through it

### 3. **Security & Compliance**
- VPC Flow Logs automatically enabled with CloudWatch integration
- Custom DNS servers configured via DHCP options
- Comprehensive tagging strategy for resource management

### 4. **Cost Optimization**
- Single NAT Gateway instead of one per AZ (saves ~$90/month per region)
- Small public subnet sizes (/26) to minimize IP waste
- Configurable flow log retention period

### 5. **Scalability**
- /20 VPC CIDR provides 4096 IP addresses for future growth
- Modular design allows easy replication across regions
- Outputs facilitate integration with other infrastructure modules

## Deployment Steps

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Review the plan:**
```bash
terraform plan
```

3. **Apply the configuration:**
```bash
terraform apply -auto-approve
```

4. **Verify deployment:**
```bash
terraform output -json
```

This configuration creates a production-ready, multi-region VPC infrastructure that meets all your requirements while maintaining AWS best practices for security, scalability, and cost optimization.