# Web Application Infrastructure with VPC, EC2 Instances, and Application Load Balancer

This Terraform configuration creates a web application infrastructure in AWS us-west-2 region with high availability across multiple availability zones.

## Architecture Components

- VPC with default settings
- Two EC2 instances (ProdInstance1 and ProdInstance2) in different availability zones
- Application Load Balancer for traffic distribution
- Security groups for HTTP access control

## Files

### provider.tf
```hcl
# provider.tf

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

### tap_stack.tf
```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

########################
# Data Sources
########################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

########################
# VPC and Networking
########################
resource "aws_vpc" "prod_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "ProdVPC"
  }
}

resource "aws_internet_gateway" "prod_igw" {
  vpc_id = aws_vpc.prod_vpc.id

  tags = {
    Name = "ProdInternetGateway"
  }
}

resource "aws_subnet" "prod_public_subnet_1" {
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "ProdPublicSubnet1"
  }
}

resource "aws_subnet" "prod_public_subnet_2" {
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "ProdPublicSubnet2"
  }
}

resource "aws_route_table" "prod_public_rt" {
  vpc_id = aws_vpc.prod_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.prod_igw.id
  }

  tags = {
    Name = "ProdPublicRouteTable"
  }
}

resource "aws_route_table_association" "prod_public_rta_1" {
  subnet_id      = aws_subnet.prod_public_subnet_1.id
  route_table_id = aws_route_table.prod_public_rt.id
}

resource "aws_route_table_association" "prod_public_rta_2" {
  subnet_id      = aws_subnet.prod_public_subnet_2.id
  route_table_id = aws_route_table.prod_public_rt.id
}

########################
# Security Groups
########################
resource "aws_security_group" "prod_alb_sg" {
  name_prefix = "prod-alb-sg"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ProdALBSecurityGroup"
  }
}

resource "aws_security_group" "prod_ec2_sg" {
  name_prefix = "prod-ec2-sg"
  vpc_id      = aws_vpc.prod_vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.prod_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ProdEC2SecurityGroup"
  }
}

########################
# EC2 Instances
########################
resource "aws_instance" "prod_instance_1" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_public_subnet_1.id
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ProdInstance1 in ${data.aws_availability_zones.available.names[0]}</h1>" > /var/www/html/index.html
              EOF
  )

  tags = {
    Name = "ProdInstance1"
  }
}

resource "aws_instance" "prod_instance_2" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.prod_public_subnet_2.id
  vpc_security_group_ids = [aws_security_group.prod_ec2_sg.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Hello from ProdInstance2 in ${data.aws_availability_zones.available.names[1]}</h1>" > /var/www/html/index.html
              EOF
  )

  tags = {
    Name = "ProdInstance2"
  }
}

########################
# Application Load Balancer
########################
resource "aws_lb" "prod_alb" {
  name               = "prod-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.prod_alb_sg.id]
  subnets            = [aws_subnet.prod_public_subnet_1.id, aws_subnet.prod_public_subnet_2.id]

  tags = {
    Name = "ProdApplicationLoadBalancer"
  }
}

resource "aws_lb_target_group" "prod_tg" {
  name     = "prod-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.prod_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
    port                = "traffic-port"
  }

  tags = {
    Name = "ProdTargetGroup"
  }
}

resource "aws_lb_target_group_attachment" "prod_tg_attachment_1" {
  target_group_arn = aws_lb_target_group.prod_tg.arn
  target_id        = aws_instance.prod_instance_1.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "prod_tg_attachment_2" {
  target_group_arn = aws_lb_target_group.prod_tg.arn
  target_id        = aws_instance.prod_instance_2.id
  port             = 80
}

resource "aws_lb_listener" "prod_listener" {
  load_balancer_arn = aws_lb.prod_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.prod_tg.arn
  }
}

########################
# Outputs
########################
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.prod_alb.dns_name
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${aws_lb.prod_alb.dns_name}"
}

output "instance_1_id" {
  description = "ID of the first EC2 instance"
  value       = aws_instance.prod_instance_1.id
}

output "instance_2_id" {
  description = "ID of the second EC2 instance"
  value       = aws_instance.prod_instance_2.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = [data.aws_availability_zones.available.names[0], data.aws_availability_zones.available.names[1]]
}
```

## Key Features

1. **High Availability**: Resources are deployed across two availability zones in us-west-2
2. **Security**: Security groups restrict HTTP access to only flow through the load balancer
3. **Load Balancing**: Application Load Balancer distributes traffic between EC2 instances
4. **Auto-Configuration**: EC2 instances are automatically configured with Apache web server
5. **Monitoring**: Health checks ensure only healthy instances receive traffic

## Resource Naming

All resources follow the "Prod" prefix naming convention as specified:
- ProdVPC
- ProdInstance1, ProdInstance2
- ProdApplicationLoadBalancer
- ProdALBSecurityGroup, ProdEC2SecurityGroup
- ProdTargetGroup

## Network Architecture

- VPC: 10.0.0.0/16
- Public Subnet 1: 10.0.1.0/24 (AZ 1)
- Public Subnet 2: 10.0.2.0/24 (AZ 2)
- Internet Gateway for public access
- Route tables configured for internet access