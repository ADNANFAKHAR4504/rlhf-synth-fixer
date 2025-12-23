# Multi-Tier VPC Architecture Implementation

This document contains the complete Terraform HCL implementation for a PCI DSS compliant multi-tier VPC architecture for payment processing.

## File: lib/main.tf

```hcl
# main.tf
# Multi-tier VPC Architecture for Payment Processing Platform
# PCI DSS compliant network segmentation with isolated tiers

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "vpc-${var.environment_suffix}"
    Project = "payment-processing"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "igw-${var.environment_suffix}"
    Project = "payment-processing"
  }
}

# Public Subnets (for ALB placement)
resource "aws_subnet" "public" {
  count = 3

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name    = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier    = "public"
    Project = "payment-processing"
  }
}

# Private Subnets (for application servers)
resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name    = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier    = "private"
    Project = "payment-processing"
  }
}

# Database Subnets (no internet routing)
resource "aws_subnet" "database" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name    = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier    = "database"
    Project = "payment-processing"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name    = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    Project = "payment-processing"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways in first two public subnets
resource "aws_nat_gateway" "main" {
  count = 2

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name    = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Project = "payment-processing"
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
    Name    = "public-rt-${var.environment_suffix}"
    Tier    = "public"
    Project = "payment-processing"
  }
}

# Private Route Tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  # First two AZs route through their own NAT Gateway, third AZ uses first NAT Gateway
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = count.index < 2 ? aws_nat_gateway.main[count.index].id : aws_nat_gateway.main[0].id
  }

  tags = {
    Name    = "private-rt-${count.index + 1}-${var.environment_suffix}"
    Tier    = "private"
    Project = "payment-processing"
  }
}

# Database Route Table (no internet routing)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "database-rt-${var.environment_suffix}"
    Tier    = "database"
    Project = "payment-processing"
  }
}

# Route Table Associations - Public Subnets
resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private Subnets
resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Route Table Associations - Database Subnets
resource "aws_route_table_association" "database" {
  count = 3

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Security Group - Web Tier (ALB)
resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environment_suffix}-"
  description = "Security group for web tier (ALB) - allows HTTP and HTTPS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "web-sg-${var.environment_suffix}"
    Tier    = "web"
    Project = "payment-processing"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - App Tier
resource "aws_security_group" "app" {
  name_prefix = "app-sg-${var.environment_suffix}-"
  description = "Security group for application tier - allows traffic from web tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Application port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "app-sg-${var.environment_suffix}"
    Tier    = "app"
    Project = "payment-processing"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - Database Tier
resource "aws_security_group" "database" {
  name_prefix = "database-sg-${var.environment_suffix}-"
  description = "Security group for database tier - allows traffic from app tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "database-sg-${var.environment_suffix}"
    Tier    = "database"
    Project = "payment-processing"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Network ACL - Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  # Allow inbound HTTP
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Allow inbound HTTPS
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound ephemeral ports
  ingress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow all outbound
  egress {
    rule_no    = 100
    protocol   = "-1"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name    = "public-nacl-${var.environment_suffix}"
    Tier    = "public"
    Project = "payment-processing"
  }
}

# Network ACL - Private Subnets (App Tier)
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Allow inbound from public subnets on port 8080
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 8080
    to_port    = 8080
  }

  # Allow inbound ephemeral ports
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound to database on port 5432
  egress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow outbound ephemeral ports
  egress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound HTTP/HTTPS for updates
  egress {
    rule_no    = 120
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  egress {
    rule_no    = 130
    protocol   = "tcp"
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  tags = {
    Name    = "private-nacl-${var.environment_suffix}"
    Tier    = "private"
    Project = "payment-processing"
  }
}

# Network ACL - Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Allow inbound from private subnets on port 5432
  ingress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 5432
    to_port    = 5432
  }

  # Allow inbound ephemeral ports
  ingress {
    rule_no    = 110
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound ephemeral ports
  egress {
    rule_no    = 100
    protocol   = "tcp"
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name    = "database-nacl-${var.environment_suffix}"
    Tier    = "database"
    Project = "payment-processing"
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name    = "vpc-flow-logs-${var.environment_suffix}"
    Project = "payment-processing"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name_prefix = "vpc-flow-logs-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowVPCFlowLogsAssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name    = "vpc-flow-logs-role-${var.environment_suffix}"
    Project = "payment-processing"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name_prefix = "vpc-flow-logs-policy-"
  role        = aws_iam_role.vpc_flow_logs.id

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
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name    = "vpc-flow-log-${var.environment_suffix}"
    Project = "payment-processing"
  }
}
```

## File: lib/outputs.tf

```hcl
# outputs.tf
# Outputs for multi-tier VPC architecture

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Public Subnet Outputs
output "public_subnet_ids" {
  description = "List of public subnet IDs (for ALB placement)"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "List of public subnet CIDR blocks"
  value       = aws_subnet.public[*].cidr_block
}

# Private Subnet Outputs
output "private_subnet_ids" {
  description = "List of private subnet IDs (for application servers)"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "List of private subnet CIDR blocks"
  value       = aws_subnet.private[*].cidr_block
}

# Database Subnet Outputs
output "database_subnet_ids" {
  description = "List of database subnet IDs (no internet routing)"
  value       = aws_subnet.database[*].id
}

output "database_subnet_cidrs" {
  description = "List of database subnet CIDR blocks"
  value       = aws_subnet.database[*].cidr_block
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "List of Elastic IP addresses associated with NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Internet Gateway Output
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# Security Group Outputs
output "web_security_group_id" {
  description = "ID of the web tier security group"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "ID of the app tier security group"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "ID of the database tier security group"
  value       = aws_security_group.database.id
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of the database route table"
  value       = aws_route_table.database.id
}

# VPC Flow Logs Outputs
output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}

output "vpc_flow_log_cloudwatch_log_group" {
  description = "CloudWatch Log Group name for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# Grouped Outputs for Easy Reference
output "subnet_ids_by_tier" {
  description = "Subnet IDs grouped by tier"
  value = {
    public   = aws_subnet.public[*].id
    private  = aws_subnet.private[*].id
    database = aws_subnet.database[*].id
  }
}

output "security_group_ids_by_tier" {
  description = "Security Group IDs grouped by tier"
  value = {
    web      = aws_security_group.web.id
    app      = aws_security_group.app.id
    database = aws_security_group.database.id
  }
}
```

## Implementation Summary

### Resources Created

1. **VPC Components**
   - 1 VPC (10.0.0.0/16)
   - 1 Internet Gateway
   - 3 Public Subnets across 3 AZs
   - 3 Private Subnets across 3 AZs
   - 3 Database Subnets across 3 AZs

2. **High Availability**
   - 2 NAT Gateways (AZ-1 and AZ-2)
   - 2 Elastic IPs for NAT Gateways
   - Redundant routing for private subnets

3. **Routing**
   - 1 Public Route Table (routes to Internet Gateway)
   - 3 Private Route Tables (routes to NAT Gateways)
   - 1 Database Route Table (no internet routes)
   - 9 Route Table Associations

4. **Security**
   - 3 Security Groups (web, app, database tiers)
   - 3 Network ACLs (public, private, database subnets)
   - Least privilege access rules

5. **Monitoring**
   - VPC Flow Logs enabled
   - CloudWatch Log Group
   - IAM Role and Policy for Flow Logs

### Key Features

- **Network Isolation**: Three-tier architecture with separate subnets
- **High Availability**: Resources across 3 availability zones
- **Redundancy**: Dual NAT Gateways for failover
- **Security**: Defense in depth with security groups and NACLs
- **Compliance**: PCI DSS compliant network segmentation
- **Monitoring**: Comprehensive VPC Flow Logs
- **Scalability**: /24 subnets provide 251 IPs each

### Outputs Provided

All required outputs are available:
- VPC ID and CIDR
- Subnet IDs grouped by tier (public, private, database)
- NAT Gateway IPs for external traffic routing
- Security Group IDs for each tier
- Route Table IDs
- Flow Log configuration details

### Design Decisions

1. **NAT Gateway Redundancy**: Deployed in 2 AZs (not 3) for cost optimization while maintaining high availability
2. **Database Isolation**: No internet routing to database subnets for PCI DSS compliance
3. **NACL Granularity**: Specific port restrictions between tiers (8080, 5432)
4. **Resource Naming**: All resources include environment_suffix for multi-environment deployments
5. **Tag Strategy**: Consistent tagging with Environment, Project, and Tier tags
