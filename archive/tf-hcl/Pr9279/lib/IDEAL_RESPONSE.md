# Terraform VPC Infrastructure - Ideal Response

## Infrastructure Components

### 1. Provider Configuration (`provider.tf`)
```hcl
terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 3.42.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = var.common_tags
  }
}
```

### 2. Variables Configuration (`variables.tf`)
```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "vpc-infrastructure"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/24"
}

variable "environment_suffix" {
  description = "Suffix to append to resource names for environment isolation"
  type        = string
  default     = "dev"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    ManagedBy   = "terraform"
  }
}
```

### 3. Main Stack Configuration (`tap_stack.tf`)
```hcl
# VPC Module
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  project_name         = "${var.project_name}-${var.environment_suffix}"
  tags                 = var.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  vpc_id           = module.vpc.vpc_id
  project_name     = "${var.project_name}-${var.environment_suffix}"
  allowed_ssh_cidr = var.allowed_ssh_cidr
  tags             = var.common_tags
}
```

### 4. VPC Module (`modules/vpc/main.tf`)
```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Resource
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-igw"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${var.project_name}-eip-${count.index + 1}"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  depends_on = [aws_internet_gateway.main]

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
  })
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-rt"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Lattice Service Network
resource "aws_vpclattice_service_network" "main" {
  name      = "${var.project_name}-service-network"
  auth_type = "AWS_IAM"

  tags = var.tags
}

# VPC Lattice Service Network VPC Association
resource "aws_vpclattice_service_network_vpc_association" "main" {
  vpc_identifier             = aws_vpc.main.id
  service_network_identifier = aws_vpclattice_service_network.main.id

  tags = var.tags
}
```

### 5. VPC Module Variables (`modules/vpc/variables.tf`)
```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### 6. VPC Module Outputs (`modules/vpc/outputs.tf`)
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "service_network_id" {
  description = "ID of the VPC Lattice Service Network"
  value       = aws_vpclattice_service_network.main.id
}
```

### 7. Security Groups Module (`modules/security-groups/main.tf`)
```hcl
# Security Group for Web Traffic (HTTP/HTTPS)
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Security group for web traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-web-sg"
  })
}

# Security Group for SSH Access
resource "aws_security_group" "ssh" {
  name        = "${var.project_name}-ssh-sg"
  description = "Security group for SSH access"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access from allowed CIDR"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "${var.project_name}-ssh-sg"
  })
}
```

### 8. Security Groups Module Variables (`modules/security-groups/variables.tf`)
```hcl
variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### 9. Security Groups Module Outputs (`modules/security-groups/outputs.tf`)
```hcl
output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh.id
}
```

### 10. Root Module Outputs (`outputs.tf`)
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = module.security_groups.web_security_group_id
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = module.security_groups.ssh_security_group_id
}

output "service_network_id" {
  description = "ID of the VPC Lattice Service Network"
  value       = module.vpc.service_network_id
}
```

## Key Features of the Ideal Response

### 1. **Modular Architecture**
- Separated VPC and Security Groups into reusable modules
- Clear separation of concerns between networking and security

### 2. **High Availability**
- Resources deployed across multiple availability zones
- Separate NAT Gateway for each private subnet for redundancy
- Public and private subnets in different AZs

### 3. **Security Best Practices**
- SSH access restricted to specific CIDR (203.0.113.0/24)
- Web traffic allowed only on necessary ports (80, 443)
- Private subnets isolated from direct internet access
- All traffic routed through NAT Gateways for private resources

### 4. **Environment Isolation**
- Environment suffix support for multi-environment deployments
- Prevents resource name conflicts across environments
- Consistent naming convention with environment identifier

### 5. **Latest AWS Features**
- VPC Lattice integration for service mesh capabilities
- AWS IAM authentication for service network
- Support for AWS provider version 3.42.0+

### 6. **Comprehensive Tagging**
- All resources tagged with Environment: Production
- ManagedBy: terraform tag for resource tracking
- Consistent tagging strategy across all resources

### 7. **Network Segmentation**
- Clear separation between public (10.0.1.0/24, 10.0.2.0/24) and private (10.0.10.0/24, 10.0.11.0/24) subnets
- Non-overlapping CIDR blocks
- Proper routing configuration for each subnet type

### 8. **Infrastructure as Code Best Practices**
- Variables with descriptions and type constraints
- Default values for common scenarios
- Comprehensive outputs for integration with other modules
- Proper resource dependencies (NAT Gateway depends on IGW)
- Use of data sources for dynamic AZ selection

### 9. **State Management**
- S3 backend configuration for remote state storage
- Support for state locking and consistency

### 10. **Extensibility**
- Modular design allows easy addition of new components
- Variables make the infrastructure configurable
- Outputs enable integration with other Terraform configurations