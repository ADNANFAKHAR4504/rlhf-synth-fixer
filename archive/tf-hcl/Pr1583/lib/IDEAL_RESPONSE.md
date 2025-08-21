# lib/modules/compute/tap_stack.tf

variable "vpc_id" {
description = "ID of the VPC"
type = string
}

variable "public_subnet_id" {
description = "ID of the public subnet"
type = string
}

variable "security_group_id" {
description = "ID of the security group"
type = string
}

variable "iam_instance_profile" {
description = "Name of the IAM instance profile"
type = string
}

variable "instance_type" {
description = "EC2 instance type"
type = string
default = "t3.micro"
}

variable "key_name" {
description = "AWS Key Pair name"
type = string
default = null
}

## Data source for latest Amazon Linux 2 AMI

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

## EC2 Instance

resource "aws_instance" "web" {
ami = data.aws_ami.amazon_linux.id
instance_type = var.instance_type
subnet_id = var.public_subnet_id
vpc_security_group_ids = [var.security_group_id]
iam_instance_profile = var.iam_instance_profile
key_name = var.key_name

## User data script to install basic web server

user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

    # Create a simple index page
    cat > /var/www/html/index.html << 'HTML'
    <!DOCTYPE html>
    <html>
    <head>
        <title>Secure Web Application</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { color: green; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔒 Secure Web Application</h1>
            <p class="status">✅ Application is running securely!</p>
            <h2>Security Features Implemented:</h2>
            <ul>
                <li>VPC with proper network segmentation</li>
                <li>Security Groups allowing only HTTP/HTTPS</li>
                <li>Network ACLs for additional protection</li>
                <li>IAM roles with minimal permissions</li>
                <li>Encrypted S3 bucket for logs</li>
                <li>All resources properly tagged</li>
            </ul>
        </div>
    </body>
    </html>

HTML

    # Set up log forwarding to S3 (example)
    echo "Web server started at $(date)" > /tmp/webapp.log

EOF
)

## Root block device encryption

root_block_device {
volume_type = "gp3"
volume_size = 8
encrypted = true
delete_on_termination = true
}

tags = {
Name = "secure-web-server"
Type = "WebServer"
}
}

## Outputs

output "instance_id" {
description = "ID of the EC2 instance"
value = aws_instance.web.id
}

output "public_ip" {
description = "Public IP address of the EC2 instance"
value = aws_instance.web.public_ip
}

output "private_ip" {
description = "Private IP address of the EC2 instance"
value = aws_instance.web.private_ip
}

# lib/modules/security/tap_stack.tf

variable "vpc_id" {
description = "ID of the VPC"
type = string
}

variable "public_subnet_id" {
description = "ID of the public subnet"
type = string
}

variable "bucket_arn" {
description = "ARN of the S3 bucket"
type = string
}

## Security Group for Web Server

resource "aws_security_group" "web" {
name = "web-server-sg"
description = "Security group for web server - HTTP/HTTPS only"
vpc_id = var.vpc_id

## Inbound Rules

ingress {
description = "HTTP"
from_port = 80
to_port = 80
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

ingress {
description = "HTTPS"
from_port = 443
to_port = 443
protocol = "tcp"
cidr_blocks = ["0.0.0.0/0"]
}

## Outbound Rules

egress {
description = "All outbound traffic"
from_port = 0
to_port = 0
protocol = "-1"
cidr_blocks = ["0.0.0.0/0"]
}

tags = {
Name = "web-server-sg"
}
}

## Network ACL for Public Subnet

resource "aws_network_acl" "public" {
vpc_id = var.vpc_id
subnet_ids = [var.public_subnet_id]

## Inbound Rules

ingress {
rule_no = 100
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 80
to_port = 80
}

ingress {
rule_no = 110
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 443
to_port = 443
}

## Allow return traffic for outbound connections

ingress {
rule_no = 120
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 1024
to_port = 65535
}

## Outbound Rules

egress {
rule_no = 100
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 80
to_port = 80
}

egress {
rule_no = 110
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 443
to_port = 443
}

## Allow return traffic for inbound connections

egress {
rule_no = 120
protocol = "tcp"
action = "allow"
cidr_block = "0.0.0.0/0"
from_port = 1024
to_port = 65535
}

tags = {
Name = "public-subnet-nacl"
}
}

## IAM Role for EC2 Instance

resource "aws_iam_role" "ec2_role" {
name = "ec2-s3-logs-role"

assume_role_policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Action = "sts:AssumeRole"
Effect = "Allow"
Principal = {
Service = "ec2.amazonaws.com"
}
}
]
})

tags = {
Name = "ec2-s3-logs-role"
}
}

## IAM Policy for S3 Access (Minimal Permissions)

resource "aws_iam_policy" "s3_logs_policy" {
name = "s3-logs-write-policy"
description = "Policy for EC2 to write logs to S3 bucket"

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Effect = "Allow"
Action = [
"s3:PutObject"
]
Resource = "${var.bucket_arn}/\*"
}
]
})
}

## Attach Policy to Role

resource "aws_iam_role_policy_attachment" "s3_logs_attachment" {
role = aws_iam_role.ec2_role.name
policy_arn = aws_iam_policy.s3_logs_policy.arn
}

## Instance Profile

resource "aws_iam_instance_profile" "ec2_profile" {
name = "ec2-s3-logs-profile"
role = aws_iam_role.ec2_role.name
}

## Outputs

output "web_security_group_id" {
description = "ID of the web security group"
value = aws_security_group.web.id
}

output "ec2_instance_profile_name" {
description = "Name of the EC2 instance profile"
value = aws_iam_instance_profile.ec2_profile.name
}

output "iam_role_arn" {
description = "ARN of the IAM role"
value = aws_iam_role.ec2_role.arn
}

# lib/modules/storage/tap_stack.tf

variable "bucket_name" {
description = "Base name of the S3 bucket"
type = string
}

## Generate random suffix for bucket name

resource "random_string" "bucket_suffix" {
length = 8
special = false
upper = false
}

## S3 Bucket for Application Logs

resource "aws_s3_bucket" "logs" {
bucket = "${var.bucket_name}-${random_string.bucket_suffix.result}"

tags = {
Name = "Application Logs Bucket"
Purpose = "WebAppLogs"
}
}

## S3 Bucket Versioning

resource "aws_s3_bucket_versioning" "logs" {
bucket = aws_s3_bucket.logs.id
versioning_configuration {
status = "Enabled"
}
}

## S3 Bucket Server-Side Encryption

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
bucket = aws_s3_bucket.logs.id

rule {
apply_server_side_encryption_by_default {
sse_algorithm = "AES256"
}
bucket_key_enabled = true
}
}

## S3 Bucket Public Access Block

resource "aws_s3_bucket_public_access_block" "logs" {
bucket = aws_s3_bucket.logs.id

block_public_acls = true
block_public_policy = true
ignore_public_acls = true
restrict_public_buckets = true
}

## S3 Bucket Policy - Restrict access to EC2 instance only

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "logs" {
bucket = aws_s3_bucket.logs.id

policy = jsonencode({
Version = "2012-10-17"
Statement = [
{
Sid = "DenyInsecureConnections"
Effect = "Deny"
Principal = "_"
Action = "s3:_"
Resource = [
aws_s3_bucket.logs.arn,
"${aws_s3_bucket.logs.arn}/*"
]
Condition = {
Bool = {
"aws:SecureTransport" = "false"
}
}
}
]
})
}

## Outputs

output "bucket_name" {
description = "Name of the S3 bucket"
value = aws_s3_bucket.logs.bucket
}

output "bucket_arn" {
description = "ARN of the S3 bucket"
value = aws_s3_bucket.logs.arn
}

output "bucket_domain_name" {
description = "Domain name of the S3 bucket"
value = aws_s3_bucket.logs.bucket_domain_name
}

# lib/modules/vpc/tap_stack.tf

variable "vpc_name" {
description = "Name of the VPC"
type = string
}

variable "vpc_cidr" {
description = "CIDR block for VPC"
type = string
}

variable "availability_zones" {
description = "List of availability zones"
type = list(string)
}

variable "public_subnet_cidrs" {
description = "CIDR blocks for public subnets"
type = list(string)
}

## VPC

resource "aws_vpc" "main" {
cidr_block = var.vpc_cidr
enable_dns_hostnames = true
enable_dns_support = true

tags = {
Name = var.vpc_name
}
}

## Internet Gateway

resource "aws_internet_gateway" "main" {
vpc_id = aws_vpc.main.id

tags = {
Name = "${var.vpc_name}-igw"
}
}

## Public Subnets

resource "aws_subnet" "public" {
count = length(var.public_subnet_cidrs)

vpc_id = aws_vpc.main.id
cidr_block = var.public_subnet_cidrs[count.index]
availability_zone = var.availability_zones[count.index]
map_public_ip_on_launch = true

tags = {
Name = "${var.vpc_name}-public-subnet-${count.index + 1}"
Type = "Public"
}
}

## Route Table for Public Subnets

resource "aws_route_table" "public" {
vpc_id = aws_vpc.main.id

route {
cidr_block = "0.0.0.0/0"
gateway_id = aws_internet_gateway.main.id
}

tags = {
Name = "${var.vpc_name}-public-rt"
}
}

## Route Table Associations

resource "aws_route_table_association" "public" {
count = length(aws_subnet.public)

subnet_id = aws_subnet.public[count.index].id
route_table_id = aws_route_table.public.id
}

## Outputs

output "vpc_id" {
description = "ID of the VPC"
value = aws_vpc.main.id
}

output "public_subnet_ids" {
description = "IDs of the public subnets"
value = aws_subnet.public[*].id
}

output "internet_gateway_id" {
description = "ID of the Internet Gateway"
value = aws_internet_gateway.main.id
}

# lib/tap_stack.tf

variable "aws_region" {
description = "AWS region for resources"
type = string
default = "us-west-2"
}

variable "vpc_name" {
description = "Name of the VPC"
type = string
default = "secure-network"
}

variable "vpc_cidr" {
description = "CIDR block for VPC"
type = string
default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
description = "CIDR blocks for public subnets"
type = list(string)
default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "bucket_name" {
description = "Name of the S3 bucket for logs"
type = string
default = "secure-webapp-logs"
}

variable "instance_type" {
description = "EC2 instance type"
type = string
default = "t3.micro"
}

variable "key_name" {
description = "AWS Key Pair name for EC2 access"
type = string
default = null
}

########################

# Data Sources

########################

# Data source for availability zones

data "aws_availability_zones" "available" {
state = "available"
}

########################

# Modules

########################

# VPC Module

module "vpc" {
source = "./modules/vpc"

vpc_name = var.vpc_name
vpc_cidr = var.vpc_cidr
availability_zones = data.aws_availability_zones.available.names
public_subnet_cidrs = var.public_subnet_cidrs
}

# Security Module

module "security" {
source = "./modules/security"

vpc_id = module.vpc.vpc_id
public_subnet_id = module.vpc.public_subnet_ids[0]
bucket_arn = module.storage.bucket_arn
}

# Storage Module

module "storage" {
source = "./modules/storage"

bucket_name = var.bucket_name
}

# Compute Module

module "compute" {
source = "./modules/compute"

vpc_id = module.vpc.vpc_id
public_subnet_id = module.vpc.public_subnet_ids[0]
security_group_id = module.security.web_security_group_id
iam_instance_profile = module.security.ec2_instance_profile_name
instance_type = var.instance_type
key_name = var.key_name
}

########################

# Outputs

########################
output "vpc_id" {
description = "ID of the VPC"
value = module.vpc.vpc_id
}

output "public_subnet_ids" {
description = "IDs of the public subnets"
value = module.vpc.public_subnet_ids
}

output "ec2_instance_id" {
description = "ID of the EC2 instance"
value = module.compute.instance_id
}

output "ec2_public_ip" {
description = "Public IP of the EC2 instance"
value = module.compute.public_ip
}

output "s3_bucket_name" {
description = "Name of the S3 bucket"
value = module.storage.bucket_name
}

output "web_security_group_id" {
description = "ID of the web security group"
value = module.security.web_security_group_id
}
