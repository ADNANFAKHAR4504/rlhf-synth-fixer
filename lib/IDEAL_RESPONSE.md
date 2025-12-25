# Secure AWS Infrastructure with Security Groups - Ideal Response

This solution implements a secure AWS infrastructure with proper security group configurations that strictly enforce access controls and prevent any traffic from 0.0.0.0/0.

## provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
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

## variables.tf
```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "allowed_http_cidr" {
  description = "CIDR block allowed for HTTP access"
  type        = string
  default     = "192.168.1.0/24"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "203.0.113.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = "dev"
}
```

## main.tf (consolidated infrastructure)
```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

########################
# VPC and Networking
########################

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# NAT Gateway for private subnet outbound connectivity
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name        = "${var.environment}-nat-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false  # Disabled for security

  tags = {
    Name        = "${var.environment}-public-subnet-${var.environment_suffix}"
    Environment = var.environment
    Type        = "Public"
    ManagedBy   = "terraform"
  }
}

# Private subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "${var.environment}-private-subnet-${var.environment_suffix}"
    Environment = var.environment
    Type        = "Private"
    ManagedBy   = "terraform"
  }
}

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Private route table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-private-rt-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Associate public subnet with public route table
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Associate private subnet with private route table
resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

########################
# Security Groups
########################

# Security group for HTTP access - only allows traffic from specific CIDR
resource "aws_security_group" "http_access" {
  name        = "${var.environment}-http-access-${var.environment_suffix}"
  description = "Security group allowing HTTP access from specific CIDR only"
  vpc_id      = aws_vpc.main.id

  # HTTP ingress - only from allowed CIDR
  ingress {
    description = "HTTP from allowed CIDR"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # HTTPS ingress - only from allowed CIDR
  ingress {
    description = "HTTPS from allowed CIDR"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_http_cidr]
  }

  # Outbound internet access for updates
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-http-sg-${var.environment_suffix}"
    Environment = var.environment
    Purpose     = "HTTP Access"
    ManagedBy   = "terraform"
  }
}

# Security group for SSH access - only allows traffic from specific CIDR
resource "aws_security_group" "ssh_access" {
  name        = "${var.environment}-ssh-access-${var.environment_suffix}"
  description = "Security group allowing SSH access from specific CIDR only"
  vpc_id      = aws_vpc.main.id

  # SSH ingress - only from allowed CIDR
  ingress {
    description = "SSH from allowed CIDR"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # Outbound internet access for updates
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-ssh-sg-${var.environment_suffix}"
    Environment = var.environment
    Purpose     = "SSH Access"
    ManagedBy   = "terraform"
  }
}

# Security group for internal VPC communication
resource "aws_security_group" "internal" {
  name        = "${var.environment}-internal-${var.environment_suffix}"
  description = "Security group for internal VPC communication"
  vpc_id      = aws_vpc.main.id

  # Allow all traffic from within VPC
  ingress {
    description = "Internal VPC traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  # Outbound internet access
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.environment}-internal-sg-${var.environment_suffix}"
    Environment = var.environment
    Purpose     = "Internal Communication"
    ManagedBy   = "terraform"
  }
}

########################
# EC2 Instance
########################

# Generate a keypair for SSH access (managed by Terraform)
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "generated_key" {
  key_name   = "${var.environment}-keypair-${var.environment_suffix}"
  public_key = tls_private_key.ssh_key.public_key_openssh

  tags = {
    Name        = "${var.environment}-keypair-${var.environment_suffix}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# EC2 instance in private subnet with secure security groups
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.private.id
  key_name      = aws_key_pair.generated_key.key_name
  vpc_security_group_ids = [
    aws_security_group.http_access.id,
    aws_security_group.ssh_access.id,
    aws_security_group.internal.id
  ]

  # Disable public IP assignment for security
  associate_public_ip_address = false

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Secure Web Server</h1>" > /var/www/html/index.html
    echo "<p>This server only accepts HTTP traffic from ${var.allowed_http_cidr}</p>" >> /var/www/html/index.html
    echo "<p>SSH access is restricted to ${var.allowed_ssh_cidr}</p>" >> /var/www/html/index.html
  EOF
  )

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    encrypted             = true
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.environment}-web-server-${var.environment_suffix}"
    Environment = var.environment
    Purpose     = "Secure Web Server"
    ManagedBy   = "terraform"
  }
}

########################
# Outputs
########################

# VPC outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet outputs
output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

# Security Group outputs
output "http_security_group_id" {
  description = "ID of the HTTP security group"
  value       = aws_security_group.http_access.id
}

output "ssh_security_group_id" {
  description = "ID of the SSH security group"
  value       = aws_security_group.ssh_access.id
}

output "internal_security_group_id" {
  description = "ID of the internal security group"
  value       = aws_security_group.internal.id
}

# EC2 outputs
output "web_server_id" {
  description = "ID of the web server instance"
  value       = aws_instance.web_server.id
}

output "web_server_private_ip" {
  description = "Private IP address of the web server"
  value       = aws_instance.web_server.private_ip
}

# NAT Gateway output
output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

# Security configuration outputs
output "allowed_http_cidr" {
  description = "CIDR block allowed for HTTP access"
  value       = var.allowed_http_cidr
}

output "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  value       = var.allowed_ssh_cidr
}

output "security_summary" {
  description = "Summary of security configuration"
  value = {
    http_access_restricted_to     = var.allowed_http_cidr
    ssh_access_restricted_to      = var.allowed_ssh_cidr
    public_ip_assignment_disabled = true
    encrypted_root_volume         = true
  }
}

output "ssh_private_key" {
  description = "Private SSH key for accessing the EC2 instance"
  value       = tls_private_key.ssh_key.private_key_pem
  sensitive   = true
}
```

## Key Security Features Implemented

1. **Zero Trust from 0.0.0.0/0**: All security groups strictly block any ingress traffic from 0.0.0.0/0
2. **Specific CIDR Restrictions**: 
   - HTTP/HTTPS traffic only from 192.168.1.0/24
   - SSH traffic only from 203.0.113.0/24
3. **Private Subnet Deployment**: EC2 instance deployed in private subnet with no public IP
4. **NAT Gateway**: Provides secure outbound internet connectivity for private resources
5. **Encrypted Storage**: Root volumes encrypted by default
6. **Proper Resource Tagging**: All resources tagged with environment and management metadata
7. **Environment Suffix**: Ensures resource name uniqueness across deployments
8. **Managed SSH Keys**: Terraform generates and manages SSH keys securely

## Security Best Practices Implemented

- ✅ No inbound traffic from 0.0.0.0/0
- ✅ Principle of least privilege for security groups
- ✅ Network segmentation with public/private subnets
- ✅ Encrypted storage volumes
- ✅ No public IPs on compute resources
- ✅ NAT Gateway for secure outbound connectivity
- ✅ Proper resource tagging and naming conventions
- ✅ Infrastructure as Code with version control
- ✅ All resources are destroyable (delete_on_termination = true)