# Terraform Infrastructure Code for EC2 Instance

I'll help you create the Terraform infrastructure code for your EC2 instance deployment. Here are the files you requested:

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

# Security Group for EC2 instance
resource "aws_security_group" "web_security_group" {
  name_prefix = "web-sg"
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
    Name = "web-security-group"
  }
}

# EC2 Instance
resource "aws_instance" "web_server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro"
  
  # Use IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Root block device with gp3 volume
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    iops        = 3000
    encrypted   = true
    
    tags = {
      Name = "web-server-root-volume"
    }
  }

  vpc_security_group_ids = [aws_security_group.web_security_group.id]

  tags = {
    Name = "web-server"
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
```

This infrastructure code includes:

1. **provider.tf**: Sets up the AWS provider with version constraints and S3 backend configuration
2. **tap_stack.tf**: Contains all the main infrastructure resources including:
   - Data source to automatically get the latest Amazon Linux 2023 AMI
   - Security group with HTTP (port 80) and SSH (port 22) access from anywhere
   - EC2 instance with:
     - Latest Amazon Linux 2023 AMI
     - t3.micro instance type
     - IMDSv2 enabled for enhanced security
     - 20GB gp3 root volume with 3000 IOPS
     - Volume encryption enabled
   - Output values for instance details

The code uses modern Terraform practices and includes proper resource tagging for organization and cost tracking.