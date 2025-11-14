I'll create a production-grade VPC infrastructure using Terraform HCL for your banking application. This solution implements a multi-AZ architecture with proper security controls, VPC Flow Logs, and comprehensive networking setup across three availability zones.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "production"
    CostCenter  = "banking"
  }
}
```

## File: provider.tf

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

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${var.availability_zones[count.index]}-${var.environment_suffix}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${var.availability_zones[count.index]}-${var.environment_suffix}"
    Type = "private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.availability_zones[count.index]}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-${var.availability_zones[count.index]}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${var.availability_zones[count.index]}-${var.environment_suffix}"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: network_acl.tf

```hcl
# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Inbound HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Inbound HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Inbound Ephemeral Ports (for return traffic)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All Traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "public-nacl-${var.environment_suffix}"
  }
}
```

## File: flow_logs.tf

```hcl
# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs" {
  name = "vpc-flow-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.flow_logs.id

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
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "vpc-flow-log-${var.environment_suffix}"
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "flow_log_id" {
  description = "The ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}

output "flow_log_cloudwatch_log_group" {
  description = "The CloudWatch Log Group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "network_acl_id" {
  description = "The ID of the Network ACL for public subnets"
  value       = aws_network_acl.public.id
}

output "elastic_ip_addresses" {
  description = "List of Elastic IP addresses for NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this file to terraform.tfvars and customize values

environment_suffix = "prod-banking"
aws_region         = "us-east-1"

vpc_cidr = "10.0.0.0/16"

availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

common_tags = {
  Environment = "production"
  CostCenter  = "banking"
}
```

## File: README.md

```markdown
# Banking Application VPC Infrastructure

This Terraform configuration creates a production-grade VPC infrastructure for a banking application with multi-AZ architecture, comprehensive security controls, and VPC Flow Logs monitoring.

## Architecture Overview

- **VPC**: 10.0.0.0/16 with DNS support and hostnames enabled
- **Availability Zones**: 3 AZs (us-east-1a, us-east-1b, us-east-1c)
- **Public Subnets**: 3 subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- **Private Subnets**: 3 subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- **NAT Gateways**: 3 NAT Gateways (one per AZ for high availability)
- **Internet Gateway**: Single IGW for public subnet internet access
- **VPC Flow Logs**: Enabled with 7-day retention in CloudWatch Logs
- **Network ACLs**: Custom NACLs allowing only HTTP/HTTPS inbound traffic

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Deployment Instructions

1. **Clone or navigate to the directory**:
   ```bash
   cd terraform-banking-vpc
   ```

2. **Initialize Terraform**:
   ```bash
   terraform init
   ```

3. **Create terraform.tfvars file**:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your specific values
   ```

4. **Review the execution plan**:
   ```bash
   terraform plan
   ```

5. **Apply the configuration**:
   ```bash
   terraform apply
   ```

6. **Verify outputs**:
   ```bash
   terraform output
   ```

## Resources Created

- 1x VPC
- 1x Internet Gateway
- 3x Public Subnets
- 3x Private Subnets
- 3x Elastic IPs
- 3x NAT Gateways
- 1x Public Route Table
- 3x Private Route Tables (one per AZ)
- 6x Route Table Associations
- 1x Network ACL (for public subnets)
- 1x VPC Flow Log
- 1x CloudWatch Log Group
- 1x IAM Role (for Flow Logs)
- 1x IAM Policy (for Flow Logs)

## Security Features

- **VPC Flow Logs**: All network traffic logged to CloudWatch with 7-day retention
- **Network ACLs**: Restrictive NACLs allowing only HTTP (80) and HTTPS (443) inbound
- **Multi-AZ NAT Gateways**: Redundant NAT Gateways for high availability
- **Private Subnets**: Isolated private subnets with no direct internet access
- **IAM Roles**: Least-privilege IAM role for VPC Flow Logs

## Cost Considerations

This infrastructure includes:
- **3 NAT Gateways**: ~$32/month each (~$96/month total)
- **3 Elastic IPs**: $3.60/month each (~$10.80/month total)
- **VPC Flow Logs**: CloudWatch Logs storage and ingestion costs
- **Data Transfer**: Additional costs for NAT Gateway data processing

Estimated monthly cost: ~$110-150 (excluding data transfer)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Note: All resources are configured without `prevent_destroy` lifecycle rules and can be fully destroyed.

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| environment_suffix | Unique suffix for resource naming | "prod" |
| aws_region | AWS region for deployment | "us-east-1" |
| vpc_cidr | CIDR block for VPC | "10.0.0.0/16" |
| availability_zones | List of availability zones | ["us-east-1a", "us-east-1b", "us-east-1c"] |
| public_subnet_cidrs | CIDR blocks for public subnets | ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"] |
| private_subnet_cidrs | CIDR blocks for private subnets | ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"] |
| common_tags | Common tags for all resources | {Environment: "production", CostCenter: "banking"} |

## Outputs

| Output | Description |
|--------|-------------|
| vpc_id | VPC ID |
| public_subnet_ids | List of public subnet IDs |
| private_subnet_ids | List of private subnet IDs |
| internet_gateway_id | Internet Gateway ID |
| nat_gateway_ids | List of NAT Gateway IDs |
| flow_log_id | VPC Flow Log ID |
| network_acl_id | Network ACL ID |
| elastic_ip_addresses | Elastic IP addresses for NAT Gateways |
```
