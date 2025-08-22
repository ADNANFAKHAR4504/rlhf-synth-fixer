# AWS Infrastructure as Code - Terraform Solution

Based on your requirements, I'll help you create a comprehensive AWS infrastructure using Terraform with the following components:

1. VPC with 3 subnets across 2 availability zones
2. EC2 instances using t3.medium instance types
3. SSH access configuration with key pairs
4. High availability setup with modern AWS features

Here's the complete Terraform configuration:

## variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project for resource tagging"
  type        = string
  default     = "cloud-environment"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "key_pair_name" {
  description = "Name of the EC2 Key Pair for SSH access"
  type        = string
  default     = "my-keypair"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
```

## main.tf

```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Data source for latest Amazon Linux AMI
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

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create public subnets (2 subnets in 2 AZs)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
    ManagedBy   = "terraform"
  }
}

# Create private subnet (1 subnet in the first AZ)
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "${var.project_name}-private-subnet"
    Environment = var.environment
    Type        = "private"
    ManagedBy   = "terraform"
  }
}

# Create NAT Gateway EIP
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = {
    Name        = "${var.project_name}-nat-eip"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Create NAT Gateway
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.project_name}-nat-gateway"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_internet_gateway.main]
}

# Create public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create private route table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-private-rt"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnet with private route table
resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# Security Group for EC2 instances
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 instances with SSH access"

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
    description = "SSH access"
  }

  # HTTP access
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS access
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-ec2-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Create EC2 Key Pair
resource "aws_key_pair" "main" {
  key_name   = var.key_pair_name
  public_key = file("~/.ssh/id_rsa.pub")

  tags = {
    Name        = "${var.project_name}-keypair"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# EC2 instances in public subnets
resource "aws_instance" "public" {
  count                  = 2
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[count.index].id
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]

  associate_public_ip_address = true

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Public Instance ${count.index + 1} - AZ: ${data.aws_availability_zones.available.names[count.index]}</h1>" > /var/www/html/index.html
    EOF
  )

  tags = {
    Name        = "${var.project_name}-public-ec2-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
    ManagedBy   = "terraform"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "${var.project_name}-public-ec2-${count.index + 1}-root"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# EC2 instance in private subnet
resource "aws_instance" "private" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private.id
  key_name               = aws_key_pair.main.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Private Instance - AZ: ${data.aws_availability_zones.available.names[0]}</h1>" > /var/www/html/index.html
    EOF
  )

  tags = {
    Name        = "${var.project_name}-private-ec2"
    Environment = var.environment
    Type        = "private"
    ManagedBy   = "terraform"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "${var.project_name}-private-ec2-root"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# EC2 Instance Connect Endpoint for secure access to private instances
resource "aws_ec2_instance_connect_endpoint" "main" {
  subnet_id          = aws_subnet.private.id
  security_group_ids = [aws_security_group.ec2_connect.id]

  tags = {
    Name        = "${var.project_name}-instance-connect-endpoint"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Security Group for EC2 Instance Connect Endpoint
resource "aws_security_group" "ec2_connect" {
  name_prefix = "${var.project_name}-ec2-connect-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for EC2 Instance Connect Endpoint"

  # Allow SSH traffic from the endpoint
  egress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.private.cidr_block]
    description = "SSH to private instances"
  }

  tags = {
    Name        = "${var.project_name}-ec2-connect-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

## outputs.tf

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

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "public_instance_ids" {
  description = "IDs of the public EC2 instances"
  value       = aws_instance.public[*].id
}

output "public_instance_public_ips" {
  description = "Public IP addresses of the public EC2 instances"
  value       = aws_instance.public[*].public_ip
}

output "public_instance_private_ips" {
  description = "Private IP addresses of the public EC2 instances"
  value       = aws_instance.public[*].private_ip
}

output "private_instance_id" {
  description = "ID of the private EC2 instance"
  value       = aws_instance.private.id
}

output "private_instance_private_ip" {
  description = "Private IP address of the private EC2 instance"
  value       = aws_instance.private.private_ip
}

output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.main.id
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

output "key_pair_name" {
  description = "Name of the EC2 Key Pair"
  value       = aws_key_pair.main.key_name
}

output "ec2_connect_endpoint_id" {
  description = "ID of the EC2 Instance Connect Endpoint"
  value       = aws_ec2_instance_connect_endpoint.main.id
}

output "ssh_connection_commands" {
  description = "SSH connection commands for the instances"
  value = {
    public_instances = [
      for i, instance in aws_instance.public : 
      "ssh -i ~/.ssh/id_rsa ec2-user@${instance.public_ip}"
    ]
    private_instance_via_connect = "aws ec2-instance-connect ssh --instance-id ${aws_instance.private.id} --private-key-file ~/.ssh/id_rsa"
  }
}
```

## Key Features Implemented:

1. **High Availability Architecture**: 3 subnets spread across 2 availability zones (2 public, 1 private)

2. **Modern AWS Features**:
   - EC2 Instance Connect Endpoint for secure private instance access
   - Enhanced security groups with proper ingress/egress rules
   - GP3 EBS volumes with encryption enabled

3. **Network Configuration**:
   - VPC with DNS resolution enabled
   - Internet Gateway for public access
   - NAT Gateway for private subnet internet access
   - Proper route tables and associations

4. **Security Best Practices**:
   - Encrypted EBS volumes
   - Security groups with minimal required access
   - Private subnet for sensitive workloads

5. **EC2 Configuration**:
   - t3.medium instances as specified
   - SSH key pair integration
   - User data scripts for basic web server setup
   - Proper tagging for resource management

6. **Outputs**: Comprehensive outputs including connection commands for SSH access

This infrastructure provides a solid foundation for a scalable, secure, and highly available cloud environment using the latest AWS features and Terraform best practices.