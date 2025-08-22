I'll create a comprehensive multi-region AWS infrastructure configuration using Terraform. Here are the two files:

## File 1: provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for us-east-1
provider "aws" {
  region = "us-east-1"
}

# Secondary provider for eu-west-1
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}
```

## File 2: tap_stack.tf

```hcl
# Variables
variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_pair_name" {
  description = "EC2 key pair name"
  type        = string
  default     = "my-key-pair"
}

# Data sources for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_us_east_1" {
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

data "aws_ami" "amazon_linux_eu_west_1" {
  provider    = aws.eu_west_1
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

# KMS Keys
resource "aws_kms_key" "primary" {
  description             = "KMS key for primary region (us-east-1)"
  deletion_window_in_days = 7

  tags = {
    Name        = "primary-kms-key"
    Environment = "production"
    Region      = "us-east-1"
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/primary-key"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.eu_west_1
  description             = "KMS key for secondary region (eu-west-1)"
  deletion_window_in_days = 7

  tags = {
    Name        = "secondary-kms-key"
    Environment = "production"
    Region      = "eu-west-1"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.eu_west_1
  name          = "alias/secondary-key"
  target_key_id = aws_kms_key.secondary.key_id
}

# VPCs
resource "aws_vpc" "primary" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "primary-vpc"
    Environment = "production"
    Region      = "us-east-1"
  }
}

resource "aws_vpc" "secondary" {
  provider             = aws.eu_west_1
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "secondary-vpc"
    Environment = "production"
    Region      = "eu-west-1"
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  vpc_id = aws_vpc.primary.id

  tags = {
    Name = "primary-igw"
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name = "secondary-igw"
  }
}

# Subnets
resource "aws_subnet" "primary_public" {
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "primary-public-subnet"
  }
}

resource "aws_subnet" "primary_private" {
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "primary-private-subnet"
  }
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.eu_west_1
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = "eu-west-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "secondary-public-subnet"
  }
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.eu_west_1
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "eu-west-1b"

  tags = {
    Name = "secondary-private-subnet"
  }
}

# Route Tables
resource "aws_route_table" "primary_public" {
  vpc_id = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  tags = {
    Name = "primary-public-rt"
  }
}

resource "aws_route_table" "secondary_public" {
  provider = aws.eu_west_1
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  tags = {
    Name = "secondary-public-rt"
  }
}

# Route Table Associations
resource "aws_route_table_association" "primary_public" {
  subnet_id      = aws_subnet.primary_public.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.eu_west_1
  subnet_id      = aws_subnet.secondary_public.id
  route_table_id = aws_route_table.secondary_public.id
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = "eu-west-1"
  auto_accept = false

  tags = {
    Name = "primary-to-secondary-peering"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.eu_west_1
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name = "secondary-peering-accepter"
  }
}

# Routes for VPC Peering
resource "aws_route" "primary_to_secondary" {
  route_table_id            = aws_route_table.primary_public.id
  destination_cidr_block    = aws_vpc.secondary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

resource "aws_route" "secondary_to_primary" {
  provider                  = aws.eu_west_1
  route_table_id            = aws_route_table.secondary_public.id
  destination_cidr_block    = aws_vpc.primary.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
}

# Security Groups
resource "aws_security_group" "primary" {
  name_prefix = "primary-sg"
  vpc_id      = aws_vpc.primary.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

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
    Name = "primary-security-group"
  }
}

resource "aws_security_group" "secondary" {
  provider    = aws.eu_west_1
  name_prefix = "secondary-sg"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

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
    Name = "secondary-security-group"
  }
}

# S3 Buckets
resource "aws_s3_bucket" "primary" {
  bucket = "tap-stack-primary-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "primary-bucket"
    Environment = "production"
    Region      = "us-east-1"
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.eu_west_1
  bucket   = "tap-stack-secondary-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "secondary-bucket"
    Environment = "production"
    Region      = "eu-west-1"
  }
}

resource "aws_s3_bucket" "logging" {
  bucket = "tap-stack-logging-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "logging-bucket"
    Environment = "production"
    Purpose     = "CloudTrail logs"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.secondary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.eu_west_1
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Replication
resource "aws_iam_role" "replication" {
  name = "s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "replication" {
  name = "s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.secondary.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  role       = aws_iam_role.replication.name
  policy_arn = aws_iam_policy.replication.arn
}

resource "aws_s3_bucket_replication_configuration" "primary" {
  depends_on = [aws_s3_bucket_versioning.primary]

  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-to-secondary"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.secondary.arn
      }
    }
  }
}

# S3 Bucket Lifecycle Configuration for Logging
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# DynamoDB Tables for Global Table
resource "aws_dynamodb_table" "primary" {
  name           = "tap-stack-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "primary-dynamodb-table"
    Environment = "production"
  }
}

resource "aws_dynamodb_table" "secondary" {
  provider       = aws.eu_west_1
  name           = "tap-stack-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.secondary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "secondary-dynamodb-table"
    Environment = "production"
  }
}

# DynamoDB Global Table
resource "aws_dynamodb_global_table" "main" {
  depends_on = [
    aws_dynamodb_table.primary,
    aws_dynamodb_table.secondary
  ]

  name = "tap-stack-table"

  replica {
    region_name = "us-east-1"
  }

  replica {
    region_name = "eu-west-1"
  }
}

# RDS Subnet Groups
resource "aws_db_subnet_group" "primary" {
  name       = "primary-subnet-group"
  subnet_ids = [aws_subnet.primary_public.id, aws_subnet.primary_private.id]

  tags = {
    Name = "primary-db-subnet-group"
  }
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.eu_west_1
  name       = "secondary-subnet-group"
  subnet_ids = [aws_subnet.secondary_public.id, aws_subnet.secondary_private.id]

  tags = {
    Name = "secondary-db-subnet-group"
  }
}

# RDS Instances
resource "aws_db_instance" "primary" {
  identifier             = "primary-database"
  allocated_storage      = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.primary.arn
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro"
  db_name              = "primarydb"
  username             = "admin"
  password             = "changeme123!"
  multi_az             = true
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.primary.name
  vpc_security_group_ids = [aws_security_group.primary.id]
  skip_final_snapshot  = true

  tags = {
    Name        = "primary-rds-instance"
    Environment = "production"
  }
}

resource "aws_db_instance" "secondary" {
  provider           = aws.eu_west_1
  identifier         = "secondary-database"
  allocated_storage  = 20
  storage_type      = "gp2"
  storage_encrypted = true
  kms_key_id       = aws_kms_key.secondary.arn
  engine           = "mysql"
  engine_version   = "8.0"
  instance_class   = "db.t3.micro"
  db_name          = "secondarydb"
  username         = "admin"
  password         = "changeme123!"
  multi_az         = true
  publicly_accessible = false
  db_subnet_group_name = aws_db_subnet_group.secondary.name
  vpc_security_group_ids = [aws_security_group.secondary.id]
  skip_final_snapshot = true

  tags = {
    Name        = "secondary-rds-instance"
    Environment = "production"
  }
}

# EC2 Instances
resource "aws_instance" "primary" {
  ami                    = data.aws_ami.amazon_linux_us_east_1.id
  instance_type          = var.ec2_instance_type
  key_name              = var.ec2_key_pair_name
  subnet_id             = aws_subnet.primary_public.id
  vpc_security_group_ids = [aws_security_group.primary.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.primary.arn
  }

  tags = {
    Name        = "primary-ec2-instance"
    Environment = "production"
    Region      = "us-east-1"
  }
}

resource "aws_instance" "secondary" {
  provider               = aws.eu_west_1
  ami                    = data.aws_ami.amazon_linux_eu_west_1.id
  instance_type          = var.ec2_instance_type
  key_name              = var.ec2_key_pair_name
  subnet_id             = aws_subnet.secondary_public.id
  vpc_security_group_ids = [aws_security_group.secondary.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    kms_key_id  = aws_kms_key.secondary.arn
  }

  tags = {
    Name        = "secondary-ec2-instance"
    Environment = "production"
    Region      = "eu-west-1"
  }
}

# IAM Role for Global Access
resource "aws_iam_role" "global_role" {
  name = "tap-stack-global-role"

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
    Name        = "global-iam-role"
    Environment = "production"
  }
}

resource "aws_iam_policy" "global_policy" {
  name        = "tap-stack-global-policy"
  description = "Least privilege policy for tap stack resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.primary.arn,
          aws_dynamodb_table.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.primary.arn,
          aws_kms_key.secondary.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "global_policy_attachment" {
  role       = aws_iam_role.global_role.name
  policy_arn = aws_iam_policy.global_policy.arn
}

# CloudTrail
resource "aws_cloudtrail" "primary" {
  name           = "primary-cloudtrail"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  s3_key_prefix  = "primary-region/"

  kms_key_id = aws_kms_key.primary.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.primary.arn}/*"]
    }
  }

  tags = {
    Name        = "primary-cloudtrail"
    Environment = "production"
  }
}

resource "aws_cloudtrail" "secondary" {
  provider       = aws.eu_west_1
  name           = "secondary-cloudtrail"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  s3_key_prefix  = "secondary-region/"

  kms_key_id = aws_kms_key.primary.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secondary.arn}/*"]
    }
  }

  tags = {
    Name        = "secondary-cloudtrail"
    Environment = "production"
  }
}

# S3 Bucket Policy for CloudTrail
resource "aws_s3_bucket_policy" "logging" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary.id
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary.id
}

output "primary_rds_endpoint" {
  description = "RDS instance endpoint in primary region"
  value       = aws_db_instance.primary.endpoint
  sensitive   = true
}

output "secondary_rds_endpoint" {
  description = "RDS instance endpoint in secondary region"
  value       = aws_db_instance.secondary.endpoint
  sensitive   = true
}

output "primary_s3_bucket_name" {
  description = "Name of the primary S3 bucket"
  value       = aws_s3_bucket.primary.bucket
}

output "secondary_s3_bucket_name" {
  description = "Name of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary.bucket
}

output "logging_s3_bucket_name" {
  description = "Name of the logging S3 bucket"
  value       = aws_s3_bucket.logging.bucket
}

output "primary_ec2_instance_id" {
  description = "ID of the primary EC2 instance"
  value       = aws_instance.primary.id
}

output "secondary_ec2_instance_id" {
  description = "ID of the secondary EC2 instance"
  value       = aws_instance.secondary.id
}

output "primary_kms_key_id" {
  description = "ID of the primary KMS key"
  value       = aws_kms_key.primary.key_id
}

output "secondary_kms_key_id" {
  description = "ID of the secondary KMS key"
  value       = aws_kms_key.secondary.key_id
}

output "dynamodb_global_table_name" {
  description = "Name of the DynamoDB Global Table"
  value       = aws_dynamodb_global_table.main.name
}

output "vpc_peering_connection_id" {
  description = "ID of the VPC peering connection"
  value       = aws_vpc_peering_connection.primary_to_secondary.id
}
```

## Key Features Implemented:

### 🔧 **Provider Configuration**
- Primary provider for `us-east-1`
- Aliased provider for `eu-west-1`

### 🌐 **Networking**
- VPCs in both regions with proper CIDR blocks
- VPC peering connection with cross-region configuration
- Internet gateways and route tables
- Security groups with appropriate rules

### 🗄️ **Data Tier**
- S3 buckets with cross-region replication
- DynamoDB Global Table with replicas in both regions
- Multi-AZ RDS instances in both regions
- All data services encrypted with region-specific KMS keys

### 💻 **Compute**
- EC2 instances in both regions using latest Amazon Linux 2 AMI
- EBS volumes encrypted with KMS keys

### 🔐 **Security & Compliance**
- KMS keys in both regions for encryption at rest
- IAM roles and policies with least-privilege access
- CloudTrail in both regions logging to central S3 bucket
- S3 bucket lifecycle configuration for log retention

### 📊 **Outputs**
- Critical information exported including RDS endpoints, S3 bucket names, and resource IDs

This configuration provides a robust, secure, and highly available multi-region infrastructure that meets all the specified requirements.