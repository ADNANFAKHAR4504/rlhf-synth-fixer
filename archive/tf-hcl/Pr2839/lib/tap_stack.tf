# Additional variables
variable "approved_cidrs" {
  description = "Approved CIDR blocks for public access - restricted for production security"
  type        = list(string)
  # More restrictive CIDR blocks for production
  # Consider using your organization's specific IP ranges
  default     = [
    "172.16.0.0/12",    # Private network range (RFC 1918)
    "192.168.0.0/16"    # Private network range (RFC 1918)
  ]
  
  validation {
    condition = length(var.approved_cidrs) > 0
    error_message = "At least one CIDR block must be specified for approved access."
  }
  
  validation {
    condition = alltrue([
      for cidr in var.approved_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All approved_cidrs must be valid CIDR blocks."
  }
}

variable "secret_name" {
  description = "Name of the Secrets Manager secret"
  type        = string
  default     = "app-secret"
}

variable "secret_value" {
  description = "Value for the secret"
  type        = string
  sensitive   = true
  default     = "super-secret-value-123"
}

# Random suffix for secret names to avoid conflicts
resource "random_id" "secret_suffix" {
  byte_length = 4
}

# Data sources
data "aws_caller_identity" "current" {}

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

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Locals for naming
locals {
  account_suffix = substr(data.aws_caller_identity.current.account_id, -4, 4)
  name_prefix    = "prod-${local.account_suffix}"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-public-subnet"
    Type = "Public"
  }
}

# Private Subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "${local.name_prefix}-private-subnet"
    Type = "Private"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${local.name_prefix}-private-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# Public Security Group
resource "aws_security_group" "public" {
  name        = "${local.name_prefix}-public-sg"
  description = "Security group for public resources"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from approved CIDRs"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
  }

  ingress {
    description = "HTTPS from approved CIDRs"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.approved_cidrs
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-public-sg"
  }
}

# Private Security Group
resource "aws_security_group" "private" {
  name        = "${local.name_prefix}-private-sg"
  description = "Security group for private resources"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from public subnet"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
  }

  ingress {
    description     = "HTTP from public subnet"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
  }

  ingress {
    description     = "HTTPS from public subnet"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.public.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-private-sg"
  }
}

# Secrets Manager Secret
resource "aws_secretsmanager_secret" "main" {
  name                    = "${local.name_prefix}-${var.secret_name}-${random_id.secret_suffix.hex}"
  description             = "Application secret for production workload"
  recovery_window_in_days = 0  # Allow immediate deletion for testing

  tags = {
    Name = "${local.name_prefix}-${var.secret_name}"
  }
}

resource "aws_secretsmanager_secret_version" "main" {
  secret_id     = aws_secretsmanager_secret.main.id
  secret_string = var.secret_value
}

# IAM Trust Policy for EC2
data "aws_iam_policy_document" "ec2_trust_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# IAM Policy for Secrets Manager (least privilege)
data "aws_iam_policy_document" "secrets_policy" {
  statement {
    sid    = "GetSecretValue"
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [aws_secretsmanager_secret.main.arn]
    
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name               = "${local.name_prefix}-ec2-role-${random_id.secret_suffix.hex}"
  assume_role_policy = data.aws_iam_policy_document.ec2_trust_policy.json

  tags = {
    Name = "${local.name_prefix}-ec2-role"
  }
}

# IAM Policy
resource "aws_iam_policy" "secrets_policy" {
  name        = "${local.name_prefix}-secrets-policy-${random_id.secret_suffix.hex}"
  description = "Policy for EC2 to access specific Secrets Manager secret"
  policy      = data.aws_iam_policy_document.secrets_policy.json

  tags = {
    Name = "${local.name_prefix}-secrets-policy"
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "secrets_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.secrets_policy.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${local.name_prefix}-ec2-profile-${random_id.secret_suffix.hex}"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${local.name_prefix}-ec2-profile"
  }
}

# EC2 Instance
resource "aws_instance" "main" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.private.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 8
    delete_on_termination = true
    encrypted             = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name = "${local.name_prefix}-instance"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = aws_subnet.private.id
}

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.main.id
}

output "instance_private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.main.private_ip
}

output "instance_profile_arn" {
  description = "ARN of the IAM instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "iam_role_arn" {
  description = "ARN of the IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.main.arn
}

output "public_security_group_id" {
  description = "ID of the public security group"
  value       = aws_security_group.public.id
}

output "private_security_group_id" {
  description = "ID of the private security group"  
  value       = aws_security_group.private.id
}