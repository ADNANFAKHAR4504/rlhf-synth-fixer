### Reasoning Trace
---

The user is asking for a secure three-tier VPC architecture for a financial services client. This is a comprehensive networking setup that needs to be production-ready with strict security requirements. Let me break down what's needed:

1. **VPC Setup**:
   - CIDR: 10.0.0.0/16
   - Region: us-west-2
   - DNS hostnames and resolution enabled
   - Three availability zones: us-west-2a, us-west-2b, us-west-2c

2. **Subnet Architecture** (9 subnets total):
   - Public subnets (3): 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Private subnets (3): 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Database subnets (3): 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24

3. **Gateways**:
   - 1 Internet Gateway for public subnets
   - 3 NAT Gateways (one per public subnet) for private subnet outbound access
   - No internet connectivity for database subnets

4. **Route Tables**:
   - Public subnets: Route to IGW for internet traffic
   - Private subnets: Route to respective NAT Gateways
   - Database subnets: Local VPC routing only

5. **Additional Resources**:
   - DB subnet group for RDS deployments
   - Network ACLs for database subnets blocking all internet inbound traffic

6. **Tagging Requirements**:
   - Environment (using environmentSuffix variable)
   - Project
   - CostCenter

7. **Outputs**:
   I'll specify key infrastructure identifiers to track and reference the created network resources. This includes the unique VPC identifier, comprehensive subnet IDs categorized by their network tier, and the database subnet group name for future RDS configurations.

8. **File Structure**:
   I'll organize the Terraform configurations into two primary files. One will handle provider settings, while the main configuration file will contain all VPC-related resources, ensuring a clean and modular approach to infrastructure definition.
### Answer 
---

I'll help you build a secure three-tier VPC architecture for your financial services client. This solution implements enterprise-grade network isolation with comprehensive security controls and high availability across three availability zones.

## **lib/provider.tf**

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
  region = "us-west-2"
  
  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Environment = var.environmentSuffix
      Project     = var.project
      CostCenter  = var.costCenter
    }
  }
}

# Variables for tagging and naming
variable "environmentSuffix" {
  description = "Environment suffix for resource naming (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "project" {
  description = "Project name for tagging"
  type        = string
  default     = "financial-services"
}

variable "costCenter" {
  description = "Cost center for billing and cost allocation"
  type        = string
  default     = "finance-dept"
}
```

## **lib/main.tf**

```hcl
# ========================================
# VPC Configuration
# ========================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "vpc-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "network"
  }
}

# ========================================
# Internet Gateway
# ========================================
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "igw-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
  }
}

# ========================================
# Public Subnets (Web Tier)
# ========================================
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "subnet-public-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "public"
    Type        = "public"
  }
}

# ========================================
# Private Subnets (Application Tier)
# ========================================
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name        = "subnet-private-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "application"
    Type        = "private"
  }
}

# ========================================
# Database Subnets (Data Tier)
# ========================================
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name        = "subnet-database-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "database"
    Type        = "isolated"
  }
}

# ========================================
# Elastic IPs for NAT Gateways
# ========================================
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"
  
  tags = {
    Name        = "eip-nat-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
  }
  
  depends_on = [aws_internet_gateway.main]
}

# ========================================
# NAT Gateways
# ========================================
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name        = "nat-gateway-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
  }
  
  depends_on = [aws_internet_gateway.main]
}

# ========================================
# Route Table for Public Subnets
# ========================================
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name        = "rt-public-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "public"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ========================================
# Route Tables for Private Subnets
# ========================================
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name        = "rt-private-${count.index + 1}-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "application"
  }
}

# Associate private subnets with their respective route tables
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ========================================
# Route Table for Database Subnets (Local Only)
# ========================================
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  
  # Only local VPC routing - no internet routes
  
  tags = {
    Name        = "rt-database-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "database"
  }
}

# Associate database subnets with database route table
resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# ========================================
# Network ACL for Database Subnets
# ========================================
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id
  
  # Ingress rules - Allow only VPC internal traffic
  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }
  
  # Explicitly deny all internet inbound traffic
  ingress {
    protocol   = -1
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  # Egress rules - Allow VPC internal traffic
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = aws_vpc.main.cidr_block
    from_port  = 0
    to_port    = 0
  }
  
  # Explicitly deny all internet outbound traffic
  egress {
    protocol   = -1
    rule_no    = 200
    action     = "deny"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = {
    Name        = "nacl-database-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
    Tier        = "database"
  }
}

# ========================================
# DB Subnet Group for RDS
# ========================================
resource "aws_db_subnet_group" "main" {
  name        = "db-subnet-group-${var.environmentSuffix}"
  description = "Database subnet group for RDS instances in ${var.environmentSuffix}"
  subnet_ids  = aws_subnet.database[*].id
  
  tags = {
    Name        = "db-subnet-group-${var.environmentSuffix}"
    Environment = var.environmentSuffix
    Project     = var.project
    CostCenter  = var.costCenter
  }
}

# ========================================
# Data Source for Availability Zones
# ========================================
data "aws_availability_zones" "available" {
  state = "available"
  
  filter {
    name   = "zone-name"
    values = ["us-west-2a", "us-west-2b", "us-west-2c"]
  }
}

# ========================================
# Outputs
# ========================================
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}
```

## **Architecture Overview**

This Terraform configuration implements a robust three-tier VPC architecture with the following security features:

### **Network Isolation**
- **Public Tier**: Web-facing resources with direct internet access via Internet Gateway
- **Application Tier**: Private subnets with outbound-only internet access through NAT Gateways
- **Database Tier**: Completely isolated subnets with no internet connectivity

### **High Availability**
- Resources distributed across three availability zones (us-west-2a, us-west-2b, us-west-2c)
- Each AZ has dedicated NAT Gateway for fault tolerance
- Independent route tables for each private subnet ensuring isolated failure domains

### **Security Controls**
- **Network ACLs**: Database subnets explicitly deny all internet traffic (both inbound and outbound)
- **Route Tables**: Database subnets have only local VPC routes, preventing any external communication
- **NAT Gateways**: Private subnets can only initiate outbound connections; no inbound access from internet

### **Compliance & Governance**
- Comprehensive tagging strategy for cost tracking and compliance
- DNS resolution enabled for internal service discovery
- DB subnet group ready for RDS deployments with multi-AZ support

### **Usage Example**

To deploy this infrastructure:

```bash
# Initialize Terraform
terraform init

# Plan with specific environment
terraform plan -var="environmentSuffix=prod" \
               -var="project=financial-services" \
               -var="costCenter=finance-dept"

# Apply the configuration
terraform apply -auto-approve
```

This architecture provides enterprise-grade network security suitable for financial services workloads, with complete isolation between tiers and comprehensive compliance controls.