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
    Name        = "${var.project_name}-${var.environment_suffix}-vpc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-igw"
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
    Name        = "${var.project_name}-${var.environment_suffix}-public-subnet-${count.index + 1}"
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
    Name        = "${var.project_name}-${var.environment_suffix}-private-subnet"
    Environment = var.environment
    Type        = "private"
    ManagedBy   = "terraform"
  }
}

# Create NAT Gateway EIP
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-nat-eip"
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
    Name        = "${var.project_name}-${var.environment_suffix}-nat-gateway"
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
    Name        = "${var.project_name}-${var.environment_suffix}-public-rt"
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
    Name        = "${var.project_name}-${var.environment_suffix}-private-rt"
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
  name_prefix = "${var.project_name}-${var.environment_suffix}-ec2-"
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
    Name        = "${var.project_name}-${var.environment_suffix}-ec2-sg"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Generate SSH key pair using TLS provider
resource "tls_private_key" "main" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create EC2 Key Pair
resource "aws_key_pair" "main" {
  key_name   = "${var.project_name}-${var.environment_suffix}-keypair"
  public_key = tls_private_key.main.public_key_openssh

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-keypair"
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
    Name        = "${var.project_name}-${var.environment_suffix}-public-ec2-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
    ManagedBy   = "terraform"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "${var.project_name}-${var.environment_suffix}-public-ec2-${count.index + 1}-root"
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
    Name        = "${var.project_name}-${var.environment_suffix}-private-ec2"
    Environment = var.environment
    Type        = "private"
    ManagedBy   = "terraform"
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name        = "${var.project_name}-${var.environment_suffix}-private-ec2-root"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# EC2 Instance Connect Endpoint commented out due to quota limits
# resource "aws_ec2_instance_connect_endpoint" "main" {
#   subnet_id          = aws_subnet.private.id
#   security_group_ids = [aws_security_group.ec2_connect.id]
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment_suffix}-instance-connect-endpoint"
#     Environment = var.environment
#     ManagedBy   = "terraform"
#   }
# }

# Security Group for EC2 Instance Connect Endpoint commented out
# resource "aws_security_group" "ec2_connect" {
#   name_prefix = "${var.project_name}-${var.environment_suffix}-ec2-connect-"
#   vpc_id      = aws_vpc.main.id
#   description = "Security group for EC2 Instance Connect Endpoint"
#
#   # Allow SSH traffic from the endpoint
#   egress {
#     from_port   = 22
#     to_port     = 22
#     protocol    = "tcp"
#     cidr_blocks = [aws_subnet.private.cidr_block]
#     description = "SSH to private instances"
#   }
#
#   tags = {
#     Name        = "${var.project_name}-${var.environment_suffix}-ec2-connect-sg"
#     Environment = var.environment
#     ManagedBy   = "terraform"
#   }
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }
