# tap_stack.tf - Complete Infrastructure Stack
# This file creates a multi-environment infrastructure with proper isolation,
# security, and cost optimization practices.

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environments" {
  description = "Environment configurations"
  type = map(object({
    vpc_cidr             = string
    instance_type        = string
    public_subnet_cidrs  = list(string)
    private_subnet_cidrs = list(string)
  }))
  default = {
    dev = {
      vpc_cidr             = "10.0.0.0/16"
      instance_type        = "t2.micro"
      public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
      private_subnet_cidrs = ["10.0.10.0/24", "10.0.20.0/24"]
    }
    staging = {
      vpc_cidr             = "10.1.0.0/16"
      instance_type        = "t3.medium"
      public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
      private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]
    }
    production = {
      vpc_cidr             = "10.2.0.0/16"
      instance_type        = "m5.large"
      public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
      private_subnet_cidrs = ["10.2.10.0/24", "10.2.20.0/24"]
    }
  }
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Owner     = "DevOps-Team"
    Purpose   = "Multi-Environment-Infrastructure"
    ManagedBy = "Terraform"
    Project   = "TAP-Stack"
  }
}

variable "user_data_template" {
  description = "User data script for EC2 instances"
  type        = string
  default     = <<-EOF
#!/bin/bash
yum update -y
yum install -y httpd -y
systemctl start httpd
systemctl enable httpd

cat > /var/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>__ENVIRONMENT__ Environment</title>
</head>
<body>
    <h1>Welcome to __ENVIRONMENT__ Environment</h1>
    <p>This server is running in the __ENVIRONMENT__ environment.</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
HTML

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
EOF
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
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

# ============================================================================
# VPC RESOURCES
# ============================================================================

# Create VPCs for each environment
resource "aws_vpc" "environment_vpc" {
  for_each = var.environments

  cidr_block           = each.value.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "vpc-${each.key}"
    Environment = each.key
  })
}

# Create Internet Gateways
resource "aws_internet_gateway" "environment_igw" {
  for_each = var.environments

  vpc_id = aws_vpc.environment_vpc[each.key].id

  tags = merge(var.common_tags, {
    Name        = "igw-${each.key}"
    Environment = each.key
  })
}

# Create public subnets
resource "aws_subnet" "public_subnets" {
  for_each = {
    for combo in flatten([
      for env_name, env_config in var.environments : [
        for idx, cidr in env_config.public_subnet_cidrs : {
          env_name = env_name
          idx      = idx
          cidr     = cidr
          key      = "${env_name}-public-${idx}"
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id                  = aws_vpc.environment_vpc[each.value.env_name].id
  cidr_block              = each.value.cidr
  availability_zone       = data.aws_availability_zones.available.names[each.value.idx]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name        = "subnet-${each.value.env_name}-public-${each.value.idx + 1}"
    Environment = each.value.env_name
    Type        = "Public"
  })
}

# Create private subnets
resource "aws_subnet" "private_subnets" {
  for_each = {
    for combo in flatten([
      for env_name, env_config in var.environments : [
        for idx, cidr in env_config.private_subnet_cidrs : {
          env_name = env_name
          idx      = idx
          cidr     = cidr
          key      = "${env_name}-private-${idx}"
        }
      ]
    ]) : combo.key => combo
  }

  vpc_id            = aws_vpc.environment_vpc[each.value.env_name].id
  cidr_block        = each.value.cidr
  availability_zone = data.aws_availability_zones.available.names[each.value.idx]

  tags = merge(var.common_tags, {
    Name        = "subnet-${each.value.env_name}-private-${each.value.idx + 1}"
    Environment = each.value.env_name
    Type        = "Private"
  })
}

# Create Elastic IPs for NAT Gateways
resource "aws_eip" "nat_eips" {
  for_each = var.environments

  domain = "vpc"

  tags = merge(var.common_tags, {
    Name        = "eip-nat-${each.key}"
    Environment = each.key
  })

  depends_on = [aws_internet_gateway.environment_igw]
}

# Create NAT Gateways (one per environment in first public subnet)
resource "aws_nat_gateway" "environment_nat" {
  for_each = var.environments

  allocation_id = aws_eip.nat_eips[each.key].id
  subnet_id     = aws_subnet.public_subnets["${each.key}-public-0"].id

  tags = merge(var.common_tags, {
    Name        = "nat-${each.key}"
    Environment = each.key
  })

  depends_on = [aws_internet_gateway.environment_igw]
}

# ============================================================================
# ROUTE TABLES
# ============================================================================

# Public route tables
resource "aws_route_table" "public_rt" {
  for_each = var.environments

  vpc_id = aws_vpc.environment_vpc[each.key].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.environment_igw[each.key].id
  }

  tags = merge(var.common_tags, {
    Name        = "rt-${each.key}-public"
    Environment = each.key
    Type        = "Public"
  })
}

# Private route tables
resource "aws_route_table" "private_rt" {
  for_each = var.environments

  vpc_id = aws_vpc.environment_vpc[each.key].id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.environment_nat[each.key].id
  }

  tags = merge(var.common_tags, {
    Name        = "rt-${each.key}-private"
    Environment = each.key
    Type        = "Private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public_rta" {
  for_each = {
    for combo in flatten([
      for env_name, env_config in var.environments : [
        for idx, cidr in env_config.public_subnet_cidrs : {
          key      = "${env_name}-public-${idx}"
          env_name = env_name
        }
      ]
    ]) : combo.key => combo
  }

  subnet_id      = aws_subnet.public_subnets[each.key].id
  route_table_id = aws_route_table.public_rt[each.value.env_name].id
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private_rta" {
  for_each = {
    for combo in flatten([
      for env_name, env_config in var.environments : [
        for idx, cidr in env_config.private_subnet_cidrs : {
          key      = "${env_name}-private-${idx}"
          env_name = env_name
        }
      ]
    ]) : combo.key => combo
  }

  subnet_id      = aws_subnet.private_subnets[each.key].id
  route_table_id = aws_route_table.private_rt[each.value.env_name].id
}

# ============================================================================
# NETWORK ACLs FOR ENVIRONMENT ISOLATION
# ============================================================================

# Custom Network ACLs for each environment to ensure isolation
resource "aws_network_acl" "environment_nacl" {
  for_each = var.environments

  vpc_id = aws_vpc.environment_vpc[each.key].id

  # Allow inbound HTTP/HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Allow inbound SSH from specific CIDR (adjust as needed)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 22
    to_port    = 22
  }

  # Allow internal VPC communication
  ingress {
    protocol   = -1
    rule_no    = 130
    action     = "allow"
    cidr_block = each.value.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Allow ephemeral ports for return traffic
  ingress {
    protocol   = "tcp"
    rule_no    = 140
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Deny traffic from other environments
  dynamic "ingress" {
    for_each = {
      for env_name, env_config in var.environments : env_name => env_config
      if env_name != each.key
    }
    content {
      protocol   = -1
      rule_no    = 200 + index(keys(var.environments), ingress.key)
      action     = "deny"
      cidr_block = ingress.value.vpc_cidr
      from_port  = 0
      to_port    = 0
    }
  }

  # Allow all outbound traffic
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = merge(var.common_tags, {
    Name        = "nacl-${each.key}"
    Environment = each.key
  })
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# Security group for web servers
resource "aws_security_group" "web_sg" {
  for_each = var.environments

  name_prefix = "web-${each.key}-"
  vpc_id      = aws_vpc.environment_vpc[each.key].id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.environments[each.key].vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "sg-web-${each.key}"
    Environment = each.key
  })

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# IAM ROLES AND POLICIES
# ============================================================================

# IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  for_each = var.environments

  name = "ec2-role-${each.key}"

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

  tags = merge(var.common_tags, {
    Name        = "ec2-role-${each.key}"
    Environment = each.key
  })
}

# IAM policy for CloudWatch and SSM access
resource "aws_iam_policy" "ec2_policy" {
  for_each = var.environments

  name = "ec2-policy-${each.key}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${each.key}/*"
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "ec2-policy-${each.key}"
    Environment = each.key
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  for_each = var.environments

  role       = aws_iam_role.ec2_role[each.key].name
  policy_arn = aws_iam_policy.ec2_policy[each.key].arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  for_each = var.environments

  name = "ec2-profile-${each.key}"
  role = aws_iam_role.ec2_role[each.key].name

  tags = merge(var.common_tags, {
    Name        = "ec2-profile-${each.key}"
    Environment = each.key
  })
}

# ============================================================================
# EC2 INSTANCES
# ============================================================================


# EC2 instances in public subnets
resource "aws_instance" "web_servers" {
  for_each = var.environments

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = each.value.instance_type
  vpc_security_group_ids = [aws_security_group.web_sg[each.key].id]
  subnet_id              = aws_subnet.public_subnets["${each.key}-public-0"].id
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile[each.key].name
  user_data              = replace(var.user_data_template, "__ENVIRONMENT__", each.key)
  root_block_device {
    volume_type = "gp3"
    volume_size = each.key == "production" ? 20 : 10
    encrypted   = true

    tags = merge(var.common_tags, {
      Name        = "ebs-${each.key}-web"
      Environment = each.key
    })
  }

  tags = merge(var.common_tags, {
    Name        = "ec2-${each.key}-web"
    Environment = each.key
    Type        = "WebServer"
  })

  lifecycle {
    create_before_destroy = true
  }
}


# ============================================================================
# OUTPUTS
# ============================================================================

# VPC outputs
output "vpc_ids" {
  description = "IDs of the VPCs"
  value = {
    for env, vpc in aws_vpc.environment_vpc : env => vpc.id
  }
}

output "vpc_cidrs" {
  description = "CIDR blocks of the VPCs"
  value = {
    for env, vpc in aws_vpc.environment_vpc : env => vpc.cidr_block
  }
}

# Subnet outputs
output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value = {
    for key, subnet in aws_subnet.public_subnets : key => subnet.id
  }
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value = {
    for key, subnet in aws_subnet.private_subnets : key => subnet.id
  }
}

# EC2 outputs
output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value = {
    for env, instance in aws_instance.web_servers : env => instance.id
  }
}

output "ec2_public_ips" {
  description = "Public IP addresses of the EC2 instances"
  value = {
    for env, instance in aws_instance.web_servers : env => instance.public_ip
  }
}

output "ec2_private_ips" {
  description = "Private IP addresses of the EC2 instances"
  value = {
    for env, instance in aws_instance.web_servers : env => instance.private_ip
  }
}

# Security Group outputs
output "security_group_ids" {
  description = "IDs of the security groups"
  value = {
    for env, sg in aws_security_group.web_sg : env => sg.id
  }
}

# IAM outputs
output "iam_role_arns" {
  description = "ARNs of the IAM roles"
  value = {
    for env, role in aws_iam_role.ec2_role : env => role.arn
  }
}

# NAT Gateway outputs
output "nat_gateway_ids" {
  description = "IDs of the NAT gateways"
  value = {
    for env, nat in aws_nat_gateway.environment_nat : env => nat.id
  }
}

# Internet Gateway outputs
output "internet_gateway_ids" {
  description = "IDs of the internet gateways"
  value = {
    for env, igw in aws_internet_gateway.environment_igw : env => igw.id
  }
}

# Environment summary
output "environment_summary" {
  description = "Summary of all environments"
  value = {
    for env, config in var.environments : env => {
      vpc_id        = aws_vpc.environment_vpc[env].id
      vpc_cidr      = config.vpc_cidr
      instance_type = config.instance_type
      instance_id   = aws_instance.web_servers[env].id
      public_ip     = aws_instance.web_servers[env].public_ip
      private_ip    = aws_instance.web_servers[env].private_ip
    }
  }
}
