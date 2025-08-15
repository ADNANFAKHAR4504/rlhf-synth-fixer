# Secure AWS Infrastructure with Terraform

I'll help you create a comprehensive, secure AWS infrastructure using Terraform with the latest security features. Here's the complete configuration:

## File: variables.tf

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

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "trusted_cidr_blocks" {
  description = "Trusted CIDR blocks for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "WebApplication"
    ManagedBy   = "Terraform"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
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

## File: main.tf

```hcl
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.public_subnets)

  domain = "vpc"

  tags = {
    Name = "nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = length(var.public_subnets)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-route-table"
  }
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count = length(var.private_subnets)

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-route-table-${count.index + 1}"
  }
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count = length(var.private_subnets)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## File: security-groups.tf

```hcl
# Security Group for Web Servers
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for web servers"

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from anywhere"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }

  # SSH access from trusted networks
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.trusted_cidr_blocks
    description = "SSH access from trusted networks"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "web-security-group"
  }
}

# Security Group for Database Servers
resource "aws_security_group" "database" {
  name_prefix = "database-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for database servers"

  # MySQL/Aurora access from web servers
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "MySQL access from web servers"
  }

  # PostgreSQL access from web servers
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
    description     = "PostgreSQL access from web servers"
  }

  # SSH access from trusted networks
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.trusted_cidr_blocks
    description = "SSH access from trusted networks"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "database-security-group"
  }
}

# Security Group for Load Balancer
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access from anywhere"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access from anywhere"
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "alb-security-group"
  }
}
```

## File: network-firewall.tf

```hcl
# Network Firewall Policy
resource "aws_networkfirewall_firewall_policy" "main" {
  name = "main-firewall-policy"

  firewall_policy {
    stateless_default_actions          = ["aws:pass"]
    stateless_fragment_default_actions = ["aws:drop"]

    stateful_default_actions = ["aws:drop_strict"]

    stateful_engine_options {
      rule_order                      = "DEFAULT_ACTION_ORDER"
      stream_exception_policy         = "DROP"
    }

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.allow_web_traffic.arn
    }

    stateful_rule_group_reference {
      resource_arn = aws_networkfirewall_rule_group.block_malicious.arn
    }
  }

  tags = {
    Name = "main-firewall-policy"
  }
}

# Rule Group for Allowing Web Traffic
resource "aws_networkfirewall_rule_group" "allow_web_traffic" {
  capacity = 100
  name     = "allow-web-traffic"
  type     = "STATEFUL"

  rule_group {
    rule_variables {
      ip_sets {
        key = "HOME_NET"
        ip_set {
          definition = [var.vpc_cidr]
        }
      }
    }

    rules_source {
      rules_string = <<EOF
pass tcp $HOME_NET any -> any 80 (msg:"Allow HTTP"; sid:1;)
pass tcp $HOME_NET any -> any 443 (msg:"Allow HTTPS"; sid:2;)
pass tcp $HOME_NET any -> any 53 (msg:"Allow DNS TCP"; sid:3;)
pass udp $HOME_NET any -> any 53 (msg:"Allow DNS UDP"; sid:4;)
pass tcp $HOME_NET any -> any 22 (msg:"Allow SSH"; sid:5;)
pass tcp any any -> $HOME_NET 80 (msg:"Allow HTTP inbound"; sid:6;)
pass tcp any any -> $HOME_NET 443 (msg:"Allow HTTPS inbound"; sid:7;)
EOF
    }
  }

  tags = {
    Name = "allow-web-traffic-rules"
  }
}

# Rule Group for Blocking Malicious Traffic
resource "aws_networkfirewall_rule_group" "block_malicious" {
  capacity = 100
  name     = "block-malicious-traffic"
  type     = "STATEFUL"

  rule_group {
    rules_source {
      rules_string = <<EOF
drop tcp any any -> any any (msg:"Block all other TCP"; sid:100; rev:1;)
drop udp any any -> any any (msg:"Block all other UDP"; sid:101; rev:1;)
EOF
    }
  }

  tags = {
    Name = "block-malicious-traffic-rules"
  }
}

# Network Firewall
resource "aws_networkfirewall_firewall" "main" {
  name                = "main-network-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.main.arn
  vpc_id              = aws_vpc.main.id

  dynamic "subnet_mapping" {
    for_each = aws_subnet.public
    content {
      subnet_id = subnet_mapping.value.id
    }
  }

  tags = {
    Name = "main-network-firewall"
  }
}
```

## File: vpc-lattice.tf

```hcl
# VPC Lattice Service Network
resource "aws_vpclattice_service_network" "main" {
  name      = "main-service-network"
  auth_type = "AWS_IAM"

  tags = {
    Name = "main-service-network"
  }
}

# VPC Association with Service Network
resource "aws_vpclattice_service_network_vpc_association" "main" {
  vpc_identifier             = aws_vpc.main.id
  service_network_identifier = aws_vpclattice_service_network.main.id

  tags = {
    Name = "main-vpc-lattice-association"
  }
}

# VPC Lattice Service for Web Application
resource "aws_vpclattice_service" "web_app" {
  name      = "web-app-service"
  auth_type = "AWS_IAM"

  tags = {
    Name = "web-app-service"
  }
}

# Service Network Service Association
resource "aws_vpclattice_service_network_service_association" "web_app" {
  service_identifier         = aws_vpclattice_service.web_app.id
  service_network_identifier = aws_vpclattice_service_network.main.id

  tags = {
    Name = "web-app-service-association"
  }
}
```

## File: outputs.tf

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

output "web_security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "database_security_group_id" {
  description = "ID of the database security group"
  value       = aws_security_group.database.id
}

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "network_firewall_arn" {
  description = "ARN of the Network Firewall"
  value       = aws_networkfirewall_firewall.main.arn
}

output "vpc_lattice_service_network_id" {
  description = "ID of the VPC Lattice Service Network"
  value       = aws_vpclattice_service_network.main.id
}
```

This infrastructure provides:

1. **Secure VPC Setup**: Multi-AZ deployment with public and private subnets
2. **Network Security**: Security groups with least privilege access
3. **Advanced Security Features**: 
   - AWS Network Firewall for deep packet inspection
   - VPC Lattice for secure service-to-service communication
4. **High Availability**: Resources distributed across multiple AZs
5. **Internet Connectivity**: Internet Gateway for public subnets, NAT Gateways for private subnets
6. **Production Tagging**: All resources tagged with Environment=Production

The configuration follows AWS best practices and incorporates the latest security features available in 2025.