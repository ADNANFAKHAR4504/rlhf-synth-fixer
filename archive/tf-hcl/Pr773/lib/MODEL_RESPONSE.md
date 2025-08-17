I'll help you create a comprehensive, secure AWS baseline with Terraform. This will be a substantial configuration that follows security best practices and the principle of least privilege.

```hcl
# Variables
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "nova"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access (if needed)"
  type        = list(string)
  default     = []
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
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

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
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

# Random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# KMS Keys
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "${var.project_name} KMS key for ${var.primary_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-kms-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_kms_alias" "primary" {
  provider      = aws.primary
  name          = "alias/${var.project_name}-${var.environment}-${var.primary_region}"
  target_key_id = aws_kms_key.primary.key_id
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "${var.project_name} KMS key for ${var.secondary_region}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-kms-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/${var.project_name}-${var.environment}-${var.secondary_region}"
  target_key_id = aws_kms_key.secondary.key_id
}

# VPCs
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = var.vpc_cidr_primary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = var.vpc_cidr_secondary
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Subnets - Primary Region
resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${var.primary_region}-1"
    Type        = "Public"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.primary.names[0]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${var.primary_region}-1"
    Type        = "Private"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "primary_private_2" {
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = data.aws_availability_zones.primary.names[1]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${var.primary_region}-2"
    Type        = "Private"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Subnets - Secondary Region
resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${var.secondary_region}-1"
    Type        = "Public"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[0]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${var.secondary_region}-1"
    Type        = "Private"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_subnet" "secondary_private_2" {
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.3.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[1]

  tags = {
    Name        = "${var.project_name}-${var.environment}-private-${var.secondary_region}-2"
    Type        = "Private"
    Project     = var.project_name
    Environment = var.environment
  }
}

# NAT Gateways
resource "aws_eip" "primary_nat" {
  provider = aws.primary
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  allocation_id = aws_eip.primary_nat.id
  subnet_id     = aws_subnet.primary_public.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.primary]
}

resource "aws_eip" "secondary_nat" {
  provider = aws.secondary
  domain   = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.secondary]
}

resource "aws_nat_gateway" "secondary" {
  provider      = aws.secondary
  allocation_id = aws_eip.secondary_nat.id
  subnet_id     = aws_subnet.secondary_public.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.secondary]
}

# VPC Peering
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = var.secondary_region
  auto_accept = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-peering"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-peering-accepter"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Route Tables - Primary Region
resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }

  route {
    cidr_block                = var.vpc_cidr_secondary
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rt-public-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }

  route {
    cidr_block                = var.vpc_cidr_secondary
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rt-private-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Route Tables - Secondary Region
resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }

  route {
    cidr_block                = var.vpc_cidr_primary
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rt-public-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }

  route {
    cidr_block                = var.vpc_cidr_primary
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rt-private-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_public.id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_private.id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "primary_private_2" {
  provider       = aws.primary
  subnet_id      = aws_subnet.primary_private_2.id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_public.id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_private.id
  route_table_id = aws_route_table.secondary_private.id
}

resource "aws_route_table_association" "secondary_private_2" {
  provider       = aws.secondary
  subnet_id      = aws_subnet.secondary_private_2.id
  route_table_id = aws_route_table.secondary_private.id
}

# Security Groups
resource "aws_security_group" "ec2_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-${var.environment}-ec2-${var.primary_region}"
  description = "Security group for EC2 instances in ${var.primary_region}"
  vpc_id      = aws_vpc.primary.id

  # Allow inbound from secondary VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  # Allow inbound from same VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-sg-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "ec2_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-${var.environment}-ec2-${var.secondary_region}"
  description = "Security group for EC2 instances in ${var.secondary_region}"
  vpc_id      = aws_vpc.secondary.id

  # Allow inbound from primary VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  # Allow inbound from same VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-sg-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-${var.environment}-rds-${var.primary_region}"
  description = "Security group for RDS instances in ${var.primary_region}"
  vpc_id      = aws_vpc.primary.id

  # Allow PostgreSQL from EC2 security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id]
  }

  # Allow PostgreSQL from secondary VPC (for cross-region access if needed)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_secondary]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-sg-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group" "rds_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-${var.environment}-rds-${var.secondary_region}"
  description = "Security group for RDS instances in ${var.secondary_region}"
  vpc_id      = aws_vpc.secondary.id

  # Allow PostgreSQL from EC2 security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_secondary.id]
  }

  # Allow PostgreSQL from primary VPC (for cross-region access if needed)
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_primary]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-sg-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# Network ACLs
resource "aws_network_acl" "primary_private" {
  provider   = aws.primary
  vpc_id     = aws_vpc.primary.id
  subnet_ids = [aws_subnet.primary_private.id, aws_subnet.primary_private_2.id]

  # Allow inbound from VPC CIDR
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr_primary
    from_port  = 0
    to_port    = 0
  }

  # Allow inbound from secondary VPC
  ingress {
    protocol   = "-1"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr_secondary
    from_port  = 0
    to_port    = 0
  }

  # Allow inbound ephemeral ports from internet (for NAT responses)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound to anywhere
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-nacl-private-${var.primary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_network_acl" "secondary_private" {
  provider   = aws.secondary
  vpc_id     = aws_vpc.secondary.id
  subnet_ids = [aws_subnet.secondary_private.id, aws_subnet.secondary_private_2.id]

  # Allow inbound from VPC CIDR
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr_secondary
    from_port  = 0
    to_port    = 0
  }

  # Allow inbound from primary VPC
  ingress {
    protocol   = "-1"
    rule_no    = 110
    action     = "allow"
    cidr_block = var.vpc_cidr_primary
    from_port  = 0
    to_port    = 0
  }

  # Allow inbound ephemeral ports from internet (for NAT responses)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Allow outbound to anywhere
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-nacl-private-${var.secondary_region}"
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-${var.environment}-ec2-role"

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
    Name        = "${var.project_name}-${var.environment}-ec2-role"
    Project     = var.project_name
    Environment = var.environment
  }
}

# IAM Policy for EC2 instances
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.project_name}-${var.environment}-ec2-policy"
  description = "Policy for EC2 instances with minimal required permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:UpdateInstanceInformation",
          "ssm:SendCommand",
          "ssm:ListCommands",
          "ssm:ListCommandInvocations",
          "ssm:DescribeInstanceInformation",
          "ssm:GetDeployablePatchSnapshotForInstance",
          "ssm:GetDefaultPatchBaseline",
          "ssm:GetManifest",
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:ListAssociations",
          "ssm:ListInstanceAssociations",
          "ssm:PutInventory",
          "ssm:PutComplianceItems",
          "ssm:PutConfigurePackageResult",
          "ssm:UpdateAssociationStatus",
          "ssm:UpdateInstanceAssociationStatus",
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel",
          "ec2messages:AcknowledgeMessage",
          "ec2messages:DeleteMessage",
          "ec2messages:FailMessage",
          "ec2messages:GetEndpoint",
          "ec2messages:GetMessages",
          "ec2messages:SendReply"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.primary.arn,
          "${aws_s3_bucket.primary.arn}/*"
        ]
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-policy"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-profile"
    Project     = var.project_name
    Environment = var.environment
  }
}

# S3 Buckets
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "${var.project_name}-${var.environment}-primary-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-primary"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "secondary" {
  provider = aws.secondary
  bucket   = "${var.project_name}-${var.environment}-secondary-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-secondary"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_s3_bucket" "logs" {
  provider = aws.primary
  bucket   = "${var.project_name}-${var.environment}-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-${var.environment}-logs"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket Configurations
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.primary.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
```
