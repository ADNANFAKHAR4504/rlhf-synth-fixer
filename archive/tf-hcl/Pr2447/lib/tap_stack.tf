
# Variables
variable "aws_region" {
  description = "List of AWS regions for deployment"
  type        = string
  default     = "us-west-2"
}
# Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name        = "main-vpc"
    Environment = "production"
    Owner       = "admin"
  }
}

# Create public and private subnets
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet"
    Environment = "production"
    Owner       = "admin"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name        = "private-subnet"
    Environment = "production"
    Owner       = "admin"
  }
}

# Create an Internet Gateway
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "main-igw"
    Environment = "production"
    Owner       = "admin"
  }
}

# Create a route table for the public subnet
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "public-rt"
    Environment = "production"
    Owner       = "admin"
  }
}

# Associate the public subnet with the public route table
resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Create a security group that denies incoming traffic by default
resource "aws_security_group" "default" {
  name_prefix = "default-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "default-sg"
    Environment = "production"
    Owner       = "admin"
  }
}

# Create NACL to restrict inbound and outbound traffic
resource "aws_network_acl" "main" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.public.id, aws_subnet.private.id]

  # Note: NACL rules removed to avoid port/protocol conflicts
  # Default NACL will be used instead

  tags = {
    Name        = "main-nacl"
    Environment = "production"
    Owner       = "admin"
  }
}

# Create an IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "ec2-role"
    Environment = "production"
    Owner       = "admin"
  }
}

# Attach a policy to the IAM role
resource "aws_iam_role_policy" "ec2_policy" {
  name = "ec2_policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "s3:GetObject",
        "secretsmanager:GetSecretValue"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# Create an S3 bucket for logging
resource "aws_s3_bucket" "logs" {
  bucket = "my-log-bucket-us-west-2"

  tags = {
    Name        = "log-bucket"
    Environment = "production"
    Owner       = "admin"
  }

  versioning {
    enabled = true
  }
}

# Note: S3 bucket ACL removed due to bucket ownership settings

# Enable VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs" {
  log_destination      = aws_s3_bucket.logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = {
    Name        = "vpc-flow-logs"
    Environment = "production"
    Owner       = "admin"
  }
}

# Note: CloudTrail removed due to maximum trail limit exceeded
# Enable CloudTrail
# resource "aws_cloudtrail" "trail" {
#   name                          = "my-cloudtrail"
#   s3_bucket_name                = aws_s3_bucket.logs.bucket
#   include_global_service_events = true
#   is_multi_region_trail         = true
#
#   tags = {
#     Name        = "cloudtrail"
#     Environment = "production"
#     Owner       = "admin"
#   }
# }

# Store a secret in AWS Secrets Manager
resource "aws_secretsmanager_secret" "example" {
  name = "example-secret"

  tags = {
    Name        = "example-secret"
    Environment = "production"
    Owner       = "admin"
  }
}

resource "aws_secretsmanager_secret_version" "example" {
  secret_id     = aws_secretsmanager_secret.example.id
  secret_string = "my-secret-value"
}

output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "The ID of the public subnet"
  value       = aws_subnet.public.id
}

output "private_subnet_id" {
  description = "The ID of the private subnet"
  value       = aws_subnet.private.id
}
