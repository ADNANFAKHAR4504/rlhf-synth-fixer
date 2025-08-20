# Terraform Infrastructure Code for EC2 Instance

I'll help you create the Terraform infrastructure code for your EC2 instance deployment with all the required features.

## provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "development"
      Project     = "ec2-infrastructure"
    }
  }
}
```

## tap_stack.tf

```hcl
# Data source to get the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get environment suffix variable
variable "environment_suffix" {
  description = "Suffix for resource naming to avoid conflicts"
  type        = string
  default     = "dev"
}

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Create public subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-public-${var.environment_suffix}"
  }
}

# Create route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "rt-public-${var.environment_suffix}"
  }
}

# Associate route table with subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security Group for EC2 instance
resource "aws_security_group" "web_security_group" {
  name        = "web-sg-${var.environment_suffix}"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instance allowing HTTP and SSH access"

  # Allow HTTP traffic from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow SSH traffic from anywhere
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-security-group-${var.environment_suffix}"
  }
}

# EC2 Instance
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
  
  # Use IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Root block device with gp3 volume
  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    iops                  = 3000
    encrypted             = true
    delete_on_termination = true
    
    tags = {
      Name = "web-server-root-volume-${var.environment_suffix}"
    }
  }

  vpc_security_group_ids = [aws_security_group.web_security_group.id]

  tags = {
    Name = "web-server-${var.environment_suffix}"
  }
}

# Output the instance information
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.web_server.public_ip
}

output "instance_public_dns" {
  description = "Public DNS name of the EC2 instance"
  value       = aws_instance.web_server.public_dns
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.web_security_group.id
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}
```

This infrastructure code includes:

1. **provider.tf**: Sets up the AWS provider with version constraints and S3 backend configuration
2. **tap_stack.tf**: Contains all the main infrastructure resources including:
   - **Networking Infrastructure**:
     - VPC with DNS support enabled for proper hostname resolution
     - Internet Gateway for public internet connectivity
     - Public subnet with automatic public IP assignment
     - Route table with internet gateway route for outbound connectivity
   - **Security Configuration**:
     - Security group with HTTP (port 80) and SSH (port 22) ingress rules
     - Full egress access for outbound connections
   - **EC2 Instance**:
     - Latest Amazon Linux 2023 AMI automatically selected
     - t3.micro instance type for cost efficiency
     - IMDSv2 enabled for enhanced security
     - 20GB gp3 root volume with 3000 IOPS
     - Volume encryption enabled for data protection
     - Delete on termination to avoid orphaned volumes
   - **Resource Management**:
     - Environment suffix variable for multi-environment deployments
     - All resources tagged with environment suffix to prevent naming conflicts
     - Comprehensive outputs for integration with other systems

The code follows Terraform best practices including:
- Proper resource dependencies and references
- Consistent naming conventions with environment suffixes
- Security hardening with IMDSv2 and encrypted volumes
- Complete networking setup for public accessibility
- Tagging for resource organization and cost tracking
- Modular design with clear separation of concerns