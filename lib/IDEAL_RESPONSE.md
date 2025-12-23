# Production VPC Infrastructure - Ideal Terraform Implementation

This is the ideal implementation for the production VPC infrastructure using Terraform with HCL. The solution creates a secure, highly available VPC network foundation for a financial trading platform with proper separation between public-facing web services and private backend systems.

## Key Implementation Features

1. **VPC Foundation**: VPC with CIDR 10.0.0.0/16, DNS hostnames and resolution enabled
2. **Multi-AZ Subnets**: 3 public and 3 private subnets distributed across us-east-1a, us-east-1b, us-east-1c
3. **Internet Connectivity**: Internet Gateway attached to VPC for public subnet access
4. **NAT Gateway HA**: One NAT Gateway per AZ with dedicated Elastic IPs for high availability
5. **Routing Configuration**: Shared public route table and separate private route tables per AZ
6. **Security Groups**: Web server security group allowing HTTPS/HTTP and database security group restricted to web tier

## File Structure

```
lib/
├── main.tf                # VPC, subnets, gateways, route tables, security groups
├── variables.tf           # Input variables with defaults
├── outputs.tf             # Output values for VPC resources
├── provider.tf            # Provider configuration
├── terraform.tfvars.example  # Example variable values
├── PROMPT.md              # Human-readable requirements
├── MODEL_RESPONSE.md      # Model's response
└── IDEAL_RESPONSE.md      # This file
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment_suffix}`

Examples:
- VPC: `trading-platform-vpc-{environment_suffix}`
- Public Subnets: `public-subnet-1-{environment_suffix}`, `public-subnet-2-{environment_suffix}`, `public-subnet-3-{environment_suffix}`
- Private Subnets: `private-subnet-1-{environment_suffix}`, `private-subnet-2-{environment_suffix}`, `private-subnet-3-{environment_suffix}`
- NAT Gateways: `nat-gateway-1-{environment_suffix}`, `nat-gateway-2-{environment_suffix}`, `nat-gateway-3-{environment_suffix}`
- Security Groups: `web-sg-{environment_suffix}`, `database-sg-{environment_suffix}`

## Security Highlights

- **Network Isolation**: Private subnets have no direct internet access, routing through NAT Gateways
- **Least Privilege Security Groups**: Database security group only allows PostgreSQL traffic from web security group
- **Public Access Control**: Web security group allows HTTPS from anywhere but HTTP only from within VPC
- **Outbound Traffic**: Controlled egress rules on all security groups
- **Multi-AZ Design**: Eliminates single points of failure in network infrastructure

## High Availability Design

- **Multi-AZ Distribution**: Resources spread across 3 availability zones
- **NAT Gateway Per AZ**: Each private subnet routes through its own NAT Gateway
- **Fault Tolerance**: Loss of one AZ does not impact other AZs
- **Independent Route Tables**: Private subnets have separate route tables for isolated failover

## Compliance and Best Practices

- Consistent tagging: Environment, Project, ManagedBy on all resources
- DNS hostnames enabled for internal service discovery
- Private subnets properly isolated from public internet
- Security group rules follow least-privilege principle
- All resources destroyable without retention policies
- Environment suffix ensures resource name uniqueness
- Uses Terraform 1.4+ and AWS Provider 5.x

## Deployment Validation

After deployment, verify:

1. **VPC**: Created with CIDR 10.0.0.0/16, DNS hostnames enabled
2. **Public Subnets**: 3 subnets with CIDRs 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
3. **Private Subnets**: 3 subnets with CIDRs 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
4. **Internet Gateway**: Attached to VPC
5. **NAT Gateways**: 3 NAT Gateways in public subnets with Elastic IPs
6. **Route Tables**: Public route table with 0.0.0.0/0 to IGW, private route tables with 0.0.0.0/0 to NAT
7. **Security Groups**: Web SG allows 443 from anywhere, DB SG allows 5432 from web SG only

## Cost Considerations

Primary costs:
- **NAT Gateways**: $0.045/hour per gateway, $0.045/GB data processed
- **Elastic IPs**: Free when associated with running NAT Gateway
- **VPC**: No cost for VPC, subnets, route tables, security groups
- **Data Transfer**: Standard AWS data transfer rates apply

Note: 3 NAT Gateways for HA will cost approximately $100/month before data transfer.

## Production Readiness

This implementation is production-ready and includes:
- High availability with Multi-AZ design
- Network isolation between web and database tiers
- Scalable architecture supporting additional subnets
- Proper security controls with least-privilege access
- Consistent tagging for cost allocation and management
- Documented and maintainable code

## Next Steps

1. Run `terraform init` to initialize providers
2. Run `terraform validate` to verify configuration
3. Run `terraform plan` to preview changes
4. Run `terraform apply` to create infrastructure
5. Use outputs to configure application resources

---

## Complete Terraform Implementation

### provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      ManagedBy   = "terraform"
      Environment = var.environment_suffix
    }
  }
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "trading-platform"
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
    Project     = "trading-platform"
    ManagedBy   = "terraform"
  }
}
```

### main.tf

```hcl
# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project_name}-vpc-${var.environment_suffix}"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    var.common_tags,
    {
      Name = "igw-${var.environment_suffix}"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    var.common_tags,
    {
      Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "public"
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.common_tags,
    {
      Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
      Type = "private"
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(
    var.common_tags,
    {
      Name = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per public subnet for high availability)
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    var.common_tags,
    {
      Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table (shared by all public subnets)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "public-rt-${var.environment_suffix}"
    }
  )
}

# Private Route Tables (one per private subnet)
resource "aws_route_table" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(
    var.common_tags,
    {
      Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
    }
  )
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Web Server Security Group
resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environment_suffix}-"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "web-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name_prefix = "database-sg-${var.environment_suffix}-"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from web security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "database-sg-${var.environment_suffix}"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

### outputs.tf

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
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = var.availability_zones
}
```

---

## Implementation Notes

### VPC Design Considerations

- VPC CIDR 10.0.0.0/16 provides 65,536 IP addresses for future growth
- Public subnets use 10.0.1.0/24 - 10.0.3.0/24 range
- Private subnets use 10.0.11.0/24 - 10.0.13.0/24 range with gap for expansion
- Each availability zone has one public and one private subnet

### NAT Gateway High Availability

- One NAT Gateway per AZ eliminates cross-AZ traffic and single point of failure
- Each private subnet routes through its local NAT Gateway
- EIP allocation depends on Internet Gateway to ensure proper ordering

### Security Group Best Practices

- Web security group allows HTTPS from internet for public-facing services
- HTTP is restricted to VPC-internal traffic only
- Database security group only accepts traffic from web security group
- Egress rules allow outbound traffic for updates and external integrations

### Route Table Configuration

- Single public route table shared across all public subnets for consistency
- Separate private route tables per subnet allow for isolated failover
- Default route to Internet Gateway for public subnets
- Default route to NAT Gateway for private subnets

### Tagging Strategy

All resources tagged with:
- Environment: production
- Project: trading-platform
- ManagedBy: terraform
- Name: descriptive name with environment suffix

### LocalStack Compatibility

This implementation is compatible with LocalStack for local development:
- VPC, subnets, Internet Gateway, NAT Gateways all supported
- Security groups work as expected
- Route tables and associations function properly
