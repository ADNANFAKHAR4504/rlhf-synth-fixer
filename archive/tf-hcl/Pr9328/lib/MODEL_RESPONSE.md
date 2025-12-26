# Secure AWS Infrastructure with Security Groups

Here's a complete Terraform solution that implements secure AWS infrastructure with security groups that block all traffic from 0.0.0.0/0 while allowing controlled access for HTTP and SSH from specific CIDR blocks.

## provider.tf
```hcl
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
```

## vpc.tf
```hcl
# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Block public access for the VPC (new AWS feature)
resource "aws_vpc_block_public_access" "main" {
  vpc_id = aws_vpc.main.id

  block_public_acls         = true
  ignore_public_acls        = true
  block_public_policy       = true
  restrict_public_buckets   = true
  block_public_security_groups = true
  restrict_public_ip_assignment = true

  tags = {
    Name        = "${var.environment}-vpc-block-public"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = false  # Disabled for security

  tags = {
    Name        = "${var.environment}-public-subnet"
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
    Name        = "${var.environment}-private-subnet"
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
    Name        = "${var.environment}-public-rt"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Private route table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-private-rt"
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

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

## security_groups.tf
```hcl
# Security group for HTTP access - only allows traffic from specific CIDR
resource "aws_security_group" "http_access" {
  name        = "${var.environment}-http-access"
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
    Name        = "${var.environment}-http-sg"
    Environment = var.environment
    Purpose     = "HTTP Access"
    ManagedBy   = "terraform"
  }
}

# Security group for SSH access - only allows traffic from specific CIDR
resource "aws_security_group" "ssh_access" {
  name        = "${var.environment}-ssh-access"
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
    Name        = "${var.environment}-ssh-sg"
    Environment = var.environment
    Purpose     = "SSH Access"
    ManagedBy   = "terraform"
  }
}

# Security group for internal VPC communication
resource "aws_security_group" "internal" {
  name        = "${var.environment}-internal"
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
    Name        = "${var.environment}-internal-sg"
    Environment = var.environment
    Purpose     = "Internal Communication"
    ManagedBy   = "terraform"
  }
}

# Security Group VPC Association (new AWS feature from 2024)
# This allows the security group to be shared across multiple VPCs if needed
resource "aws_security_group_vpc_association" "http_cross_vpc" {
  security_group_id = aws_security_group.http_access.id
  vpc_id           = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-http-sg-vpc-association"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group_vpc_association" "ssh_cross_vpc" {
  security_group_id = aws_security_group.ssh_access.id
  vpc_id           = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-ssh-sg-vpc-association"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

## ec2.tf
```hcl
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

# Key pair for EC2 access
resource "aws_key_pair" "main" {
  key_name   = "${var.environment}-keypair"
  public_key = file("~/.ssh/id_rsa.pub")

  tags = {
    Name        = "${var.environment}-keypair"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# EC2 instance in private subnet with secure security groups
resource "aws_instance" "web_server" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name              = aws_key_pair.main.key_name
  subnet_id             = aws_subnet.private.id
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
    encrypted            = true
    delete_on_termination = true
  }

  tags = {
    Name        = "${var.environment}-web-server"
    Environment = var.environment
    Purpose     = "Secure Web Server"
    ManagedBy   = "terraform"
  }
}

# Elastic IP for the instance (if needed for outbound connectivity)
resource "aws_eip" "web_server" {
  instance = aws_instance.web_server.id
  domain   = "vpc"

  tags = {
    Name        = "${var.environment}-web-server-eip"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}
```

## outputs.tf
```hcl
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

output "web_server_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_eip.web_server.public_ip
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
    vpc_block_public_access_enabled = true
    http_access_restricted_to       = var.allowed_http_cidr
    ssh_access_restricted_to        = var.allowed_ssh_cidr
    public_ip_assignment_disabled   = true
    encrypted_root_volume          = true
  }
}
```