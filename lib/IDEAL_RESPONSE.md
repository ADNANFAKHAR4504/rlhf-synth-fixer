# Configure S3 backend for remote state management

terraform {
backend "s3" { # Backend configuration will be provided via command line arguments
}
}

#######################

# Variables

#######################

variable "author" {
description = "The author of the infrastructure"
type = string
default = "ngwakoleslieelijah"
}

variable "created_date" {
description = "The date when the infrastructure was created"
type = string
default = "2025-08-17"
}

variable "aws_region" {
description = "The AWS region where resources will be created"
type = string
default = "us-east-1"
}

variable "vpc_cidr" {
description = "CIDR block for the VPC"
type = string
default = "10.0.0.0/16"
}

variable "environment" {
description = "Environment name"
type = string
default = "dev"
}

variable "project_name" {
description = "Name of the project"
type = string
default = "tap-app"
}

#######################

# Random Suffix for Unique Naming

#######################

resource "random_string" "suffix" {
length = 8
special = false
upper = false
}

#######################

# Locals

#######################

locals {

# Use current timestamp: 2025-08-17 05:38:10

timestamp = "053810"

# Create unique name prefix to avoid conflicts with existing resources

name_prefix = "${var.project_name}-${var.environment}-${local.timestamp}-${random_string.suffix.result}"

common_tags = {
Environment = var.environment
Project = var.project_name
DeployTime = local.timestamp
User = "ngwakoleslieelijah"
Author = var.author
CreatedDate = var.created_date
}
}

#######################

# Data Sources

#######################

data "aws_availability_zones" "available" {
state = "available"
filter {
name = "opt-in-status"
values = ["opt-in-not-required"]
}
}

data "aws_ami" "amazon_linux" {
most_recent = true
owners = ["amazon"]
filter {
name = "name"
values = ["amzn2-ami-hvm-*-x86_64-gp2"]
}
filter {
name = "virtualization-type"
values = ["hvm"]
}
}

#######################

# Standalone VPC - No dependencies

#######################

resource "aws_vpc" "standalone" {

# Use a different CIDR to avoid conflicts

cidr_block = "192.168.0.0/16"
enable_dns_support = true
enable_dns_hostnames = true

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-vpc"
})

# No dependencies

lifecycle {
create_before_destroy = true
}
}

resource "aws_internet_gateway" "standalone" {
vpc_id = aws_vpc.standalone.id

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-igw"
})

lifecycle {
create_before_destroy = true
}
}

#######################

# Simple HTTP Server - Independent of all other resources

#######################

resource "aws_subnet" "standalone" {
vpc_id = aws_vpc.standalone.id
cidr_block = "192.168.1.0/24"
availability_zone = data.aws_availability_zones.available.names[0]
map_public_ip_on_launch = true

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-subnet"
})

lifecycle {
create_before_destroy = true
}
}

resource "aws_route_table" "standalone" {
vpc_id = aws_vpc.standalone.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.standalone.id
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-rt"
})
}

resource "aws_route_table_association" "standalone" {
subnet_id = aws_subnet.standalone.id
route_table_id = aws_route_table.standalone.id
}

resource "aws_security_group" "standalone" {
name = "${local.name_prefix}-sg"
description = "Allow HTTP and SSH"
vpc_id = aws_vpc.standalone.id

ingress {
from_port = 80
to_port = 80
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
description = "Allow HTTP"
}

ingress {
from_port = 22
to_port = 22
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
description = "Allow SSH"
}

egress {
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
description = "Allow all outbound"
}

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-sg"
})

lifecycle {
create_before_destroy = true
}
}

resource "aws_instance" "standalone" {
ami = data.aws_ami.amazon_linux.id
instance_type = "t3.micro"
subnet_id = aws_subnet.standalone.id
vpc_security_group_ids = [aws_security_group.standalone.id]

user_data = <<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${local.name_prefix}</h1>" > /var/www/html/index.html
echo "<p>Dependency cycles fixed - 2025-08-17 05:38:10</p>" >> /var/www/html/index.html
echo "<p>User: ngwakoleslieelijah</p>" >> /var/www/html/index.html
EOF

tags = merge(local.common_tags, {
Name = "${local.name_prefix}-server"
})
}

#######################

# Outputs

#######################

output "instance_public_ip" {
description = "Public IP of EC2 instance"
value = aws_instance.standalone.public_ip
}

output "vpc_id" {
description = "ID of the VPC"
value = aws_vpc.standalone.id
}

output "web_url" {
description = "URL to access web server"
value = "http://${aws_instance.standalone.public_ip}"
}

output "deployment_info" {
description = "Deployment information"
value = {
timestamp = "2025-08-17 05:38:10"
user = "ngwakoleslieelijah"
prefix = local.name_prefix
}
}
