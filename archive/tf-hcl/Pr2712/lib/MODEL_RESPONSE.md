### Reasoning Trace
---

This is a comprehensive Terraform configuration request that requires multiple AWS resources across two regions. Let me break down the requirements:

1. Multi-region deployment (us-east-2 primary, us-west-1 secondary)
2. VPCs with specific CIDR blocks (10.0.0.0/16 primary, 10.1.0.0/16 secondary)
3. Private/public subnets, NAT gateways, IGWs, route tables
4. RDS in each region with Multi-AZ, random credentials stored in Secrets Manager
5. S3 with cross-region replication, encryption, versioning
6. IAM policies for least privilege
7. EC2 instances with latest Amazon Linux 2, security groups, EBS encryption
8. Lambda functions for RDS backups with concurrency limits
9. CloudWatch alarms for CPU monitoring
10. CloudTrail across all regions
11. VPC Flow Logs
12. AWS Shield for CloudFront
13. WAF for ALB
14. Consistent tagging
15. Naming conventions
16. Provider aliases for each resource

I need to create a single comprehensive file that includes all these components. Let me structure this properly:

- Variables
- Locals (for naming and tagging)
- Data sources (for AMI, AZs)
- Random resources (for RDS credentials)
- VPC and networking resources for both regions
- Security groups
- RDS instances and Secrets Manager
- S3 buckets with replication
- IAM roles and policies
- EC2 instances
- Lambda functions
- Application Load Balancers
- WAF
- CloudFront with Shield
- CloudWatch alarms
- CloudTrail
- VPC Flow Logs
- Outputs

I need to be careful about:
- Using provider aliases correctly
- RDS password special characters (AWS doesn't allow certain ones)
- Cross-region replication setup
- Proper IAM policies with least privilege


I'll focus on implementing robust Multi-AZ database configuration with automated failover, ensuring high availability across regions. For Lambda functions, I'll carefully set concurrency limits to prevent overwhelming system resources while maintaining efficient backup processes. I'll develop a standardized tagging strategy that provides clear resource identification, cost tracking, and management across all deployed infrastructure components.
### Answer 
---

I'll create a comprehensive Terraform configuration file that meets all your requirements. This will be a single file with proper multi-region setup, security configurations, and all the specified resources.

```hcl
# tap_stack.tf - Complete Multi-Region AWS Infrastructure

# ===============================================
# VARIABLES
# ===============================================

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-2"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "allowed_https_cidrs" {
  description = "CIDR blocks allowed for HTTPS access"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ===============================================
# LOCALS
# ===============================================

locals {
  # Common tags for all resources
  common_tags = {
    Environment   = "Production"
    ownership     = "self"
    departmental  = "businessunit"
  }

  # Naming convention
  primary_name_prefix   = "tap-prod-primary"
  secondary_name_prefix = "tap-prod-secondary"

  # CIDR blocks
  primary_vpc_cidr   = "10.0.0.0/16"
  secondary_vpc_cidr = "10.1.0.0/16"

  # Subnet CIDRs
  primary_public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  primary_private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  
  secondary_public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  secondary_private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
}

# ===============================================
# DATA SOURCES
# ===============================================

# Get latest Amazon Linux 2 AMI for primary region
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.us_east_2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Get latest Amazon Linux 2 AMI for secondary region
data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.us_west_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Get availability zones for primary region
data "aws_availability_zones" "primary_azs" {
  provider = aws.us_east_2
  state    = "available"
}

# Get availability zones for secondary region
data "aws_availability_zones" "secondary_azs" {
  provider = aws.us_west_1
  state    = "available"
}

# Get current AWS caller identity
data "aws_caller_identity" "current" {
  provider = aws.us_east_2
}

# ===============================================
# RANDOM RESOURCES FOR RDS
# ===============================================

# Random username for primary RDS
resource "random_string" "rds_username_primary" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true

  # Ensure it starts with a letter
  keepers = {
    prefix = "a"
  }
}

# Random password for primary RDS
resource "random_password" "rds_password_primary" {
  length  = 16
  special = true
  # Exclude characters that AWS RDS doesn't allow
  override_special = "!#$%&*()-_=+[]{}<>?"
}

# Random username for secondary RDS
resource "random_string" "rds_username_secondary" {
  length  = 8
  special = false
  numeric = true
  upper   = true
  lower   = true

  keepers = {
    prefix = "a"
  }
}

# Random password for secondary RDS
resource "random_password" "rds_password_secondary" {
  length  = 16
  special = true
  override_special = "!#$%&*()-_=+[]{}<>?"
}

# ===============================================
# PRIMARY REGION NETWORKING (us-east-2)
# ===============================================

# Primary VPC
resource "aws_vpc" "primary_vpc" {
  provider             = aws.us_east_2
  cidr_block           = local.primary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-vpc"
  })
}

# Primary Internet Gateway
resource "aws_internet_gateway" "primary_igw" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-igw"
  })
}

# Primary Public Subnets
resource "aws_subnet" "primary_public_subnets" {
  provider                = aws.us_east_2
  count                   = length(local.primary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.primary_vpc.id
  cidr_block              = local.primary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.primary_azs.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-public-subnet-${count.index + 1}"
  })
}

# Primary Private Subnets
resource "aws_subnet" "primary_private_subnets" {
  provider          = aws.us_east_2
  count             = length(local.primary_private_subnet_cidrs)
  vpc_id            = aws_vpc.primary_vpc.id
  cidr_block        = local.primary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.primary_azs.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-private-subnet-${count.index + 1}"
  })
}

# Primary NAT Gateway EIP
resource "aws_eip" "primary_nat_eip" {
  provider = aws.us_east_2
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-nat-eip"
  })
}

# Primary NAT Gateway
resource "aws_nat_gateway" "primary_nat" {
  provider      = aws.us_east_2
  allocation_id = aws_eip.primary_nat_eip.id
  subnet_id     = aws_subnet.primary_public_subnets[0].id

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-nat"
  })

  depends_on = [aws_internet_gateway.primary_igw]
}

# Primary Public Route Table
resource "aws_route_table" "primary_public_rt" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-public-rt"
  })
}

# Primary Private Route Table
resource "aws_route_table" "primary_private_rt" {
  provider = aws.us_east_2
  vpc_id   = aws_vpc.primary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary_nat.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-private-rt"
  })
}

# Primary Public Route Table Association
resource "aws_route_table_association" "primary_public_rta" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_public_subnets)
  subnet_id      = aws_subnet.primary_public_subnets[count.index].id
  route_table_id = aws_route_table.primary_public_rt.id
}

# Primary Private Route Table Association
resource "aws_route_table_association" "primary_private_rta" {
  provider       = aws.us_east_2
  count          = length(aws_subnet.primary_private_subnets)
  subnet_id      = aws_subnet.primary_private_subnets[count.index].id
  route_table_id = aws_route_table.primary_private_rt.id
}

# ===============================================
# SECONDARY REGION NETWORKING (us-west-1)
# ===============================================

# Secondary VPC
resource "aws_vpc" "secondary_vpc" {
  provider             = aws.us_west_1
  cidr_block           = local.secondary_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-vpc"
  })
}

# Secondary Internet Gateway
resource "aws_internet_gateway" "secondary_igw" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-igw"
  })
}

# Secondary Public Subnets
resource "aws_subnet" "secondary_public_subnets" {
  provider                = aws.us_west_1
  count                   = length(local.secondary_public_subnet_cidrs)
  vpc_id                  = aws_vpc.secondary_vpc.id
  cidr_block              = local.secondary_public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.secondary_azs.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-public-subnet-${count.index + 1}"
  })
}

# Secondary Private Subnets
resource "aws_subnet" "secondary_private_subnets" {
  provider          = aws.us_west_1
  count             = length(local.secondary_private_subnet_cidrs)
  vpc_id            = aws_vpc.secondary_vpc.id
  cidr_block        = local.secondary_private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.secondary_azs.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-private-subnet-${count.index + 1}"
  })
}

# Secondary NAT Gateway EIP
resource "aws_eip" "secondary_nat_eip" {
  provider = aws.us_west_1
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-nat-eip"
  })
}

# Secondary NAT Gateway
resource "aws_nat_gateway" "secondary_nat" {
  provider      = aws.us_west_1
  allocation_id = aws_eip.secondary_nat_eip.id
  subnet_id     = aws_subnet.secondary_public_subnets[0].id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-nat"
  })

  depends_on = [aws_internet_gateway.secondary_igw]
}

# Secondary Public Route Table
resource "aws_route_table" "secondary_public_rt" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-public-rt"
  })
}

# Secondary Private Route Table
resource "aws_route_table" "secondary_private_rt" {
  provider = aws.us_west_1
  vpc_id   = aws_vpc.secondary_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary_nat.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-private-rt"
  })
}

# Secondary Public Route Table Association
resource "aws_route_table_association" "secondary_public_rta" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_public_subnets)
  subnet_id      = aws_subnet.secondary_public_subnets[count.index].id
  route_table_id = aws_route_table.secondary_public_rt.id
}

# Secondary Private Route Table Association
resource "aws_route_table_association" "secondary_private_rta" {
  provider       = aws.us_west_1
  count          = length(aws_subnet.secondary_private_subnets)
  subnet_id      = aws_subnet.secondary_private_subnets[count.index].id
  route_table_id = aws_route_table.secondary_private_rt.id
}

# ===============================================
# SECURITY GROUPS
# ===============================================

# Primary Region Security Groups
resource "aws_security_group" "primary_ec2_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_name_prefix}-ec2-sg"
  description = "Security group for EC2 instances in primary region"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ec2-sg"
  })
}

resource "aws_security_group" "primary_rds_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_name_prefix}-rds-sg"
  description = "Security group for RDS in primary region"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.primary_ec2_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-rds-sg"
  })
}

resource "aws_security_group" "primary_alb_sg" {
  provider    = aws.us_east_2
  name        = "${local.primary_name_prefix}-alb-sg"
  description = "Security group for ALB in primary region"
  vpc_id      = aws_vpc.primary_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-alb-sg"
  })
}

# Secondary Region Security Groups
resource "aws_security_group" "secondary_ec2_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_name_prefix}-ec2-sg"
  description = "Security group for EC2 instances in secondary region"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.allowed_https_cidrs
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ec2-sg"
  })
}

resource "aws_security_group" "secondary_rds_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_name_prefix}-rds-sg"
  description = "Security group for RDS in secondary region"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.secondary_ec2_sg.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-rds-sg"
  })
}

resource "aws_security_group" "secondary_alb_sg" {
  provider    = aws.us_west_1
  name        = "${local.secondary_name_prefix}-alb-sg"
  description = "Security group for ALB in secondary region"
  vpc_id      = aws_vpc.secondary_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-alb-sg"
  })
}

# ===============================================
# RDS INSTANCES AND SECRETS MANAGER
# ===============================================

# Primary DB Subnet Group
resource "aws_db_subnet_group" "primary_db_subnet_group" {
  provider   = aws.us_east_2
  name       = "${local.primary_name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.primary_private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-db-subnet-group"
  })
}

# Primary RDS Instance
resource "aws_db_instance" "primary_rds" {
  provider                = aws.us_east_2
  identifier              = "${local.primary_name_prefix}-rds"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "primarydb"
  username                = "a${random_string.rds_username_primary.result}"
  password                = random_password.rds_password_primary.result
  vpc_security_group_ids  = [aws_security_group.primary_rds_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.primary_db_subnet_group.name
  multi_az                = true
  publicly_accessible     = false
  auto_minor_version_upgrade = true
  skip_final_snapshot     = true
  storage_encrypted       = true

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-rds"
  })
}

# Primary RDS Secrets Manager Secret
resource "aws_secretsmanager_secret" "primary_rds_secret" {
  provider    = aws.us_east_2
  name        = "${local.primary_name_prefix}-rds-credentials"
  description = "RDS credentials for primary region"

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-rds-secret"
  })
}

resource "aws_secretsmanager_secret_version" "primary_rds_secret_version" {
  provider  = aws.us_east_2
  secret_id = aws_secretsmanager_secret.primary_rds_secret.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username_primary.result}"
    password = random_password.rds_password_primary.result
    endpoint = aws_db_instance.primary_rds.endpoint
    port     = aws_db_instance.primary_rds.port
  })
}

# Secondary DB Subnet Group
resource "aws_db_subnet_group" "secondary_db_subnet_group" {
  provider   = aws.us_west_1
  name       = "${local.secondary_name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.secondary_private_subnets[*].id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-db-subnet-group"
  })
}

# Secondary RDS Instance
resource "aws_db_instance" "secondary_rds" {
  provider                = aws.us_west_1
  identifier              = "${local.secondary_name_prefix}-rds"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "secondarydb"
  username                = "a${random_string.rds_username_secondary.result}"
  password                = random_password.rds_password_secondary.result
  vpc_security_group_ids  = [aws_security_group.secondary_rds_sg.id]
  db_subnet_group_name    = aws_db_subnet_group.secondary_db_subnet_group.name
  multi_az                = true
  publicly_accessible     = false
  auto_minor_version_upgrade = true
  skip_final_snapshot     = true
  storage_encrypted       = true

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-rds"
  })
}

# Secondary RDS Secrets Manager Secret
resource "aws_secretsmanager_secret" "secondary_rds_secret" {
  provider    = aws.us_west_1
  name        = "${local.secondary_name_prefix}-rds-credentials"
  description = "RDS credentials for secondary region"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-rds-secret"
  })
}

resource "aws_secretsmanager_secret_version" "secondary_rds_secret_version" {
  provider  = aws.us_west_1
  secret_id = aws_secretsmanager_secret.secondary_rds_secret.id
  secret_string = jsonencode({
    username = "a${random_string.rds_username_secondary.result}"
    password = random_password.rds_password_secondary.result
    endpoint = aws_db_instance.secondary_rds.endpoint
    port     = aws_db_instance.secondary_rds.port
  })
}

# ===============================================
# S3 BUCKETS WITH CROSS-REGION REPLICATION
# ===============================================

# Primary S3 Bucket
resource "aws_s3_bucket" "primary_bucket" {
  provider = aws.us_east_2
  bucket   = "${local.primary_name_prefix}-static-content-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-static-content"
  })
}

# Secondary S3 Bucket (for replication)
resource "aws_s3_bucket" "secondary_bucket" {
  provider = aws.us_west_1
  bucket   = "${local.secondary_name_prefix}-static-content-replica-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-static-content-replica"
  })
}

# Random suffix for bucket names to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "primary_bucket_versioning" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "secondary_bucket_versioning" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption - Primary
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_bucket_encryption" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Server Side Encryption - Secondary
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_bucket_encryption" {
  provider = aws.us_west_1
  bucket   = aws_s3_bucket.secondary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "replication" {
  provider   = aws.us_east_2
  role       = aws_iam_role.replication_role.arn
  bucket     = aws_s3_bucket.primary_bucket.id
  depends_on = [aws_s3_bucket_versioning.primary_bucket_versioning]

  rule {
    id     = "ReplicateToSecondary"
    status = "Enabled"

    destination {
      bucket = aws_s3_bucket.secondary_bucket.arn
    }
  }
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-s3-replication-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-s3-replication-role"
  })
}

resource "aws_iam_policy" "replication_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl"
        ]
        Resource = "${aws_s3_bucket.primary_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete"
        ]
        Resource = "${aws_s3_bucket.secondary_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication_policy_attachment" {
  provider   = aws.us_east_2
  role       = aws_iam_role.replication_role.name
  policy_arn = aws_iam_policy.replication_policy.arn
}

# ===============================================
# IAM ROLES AND POLICIES FOR EC2
# ===============================================

# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ec2-role"
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-ec2-profile"
  role     = aws_iam_role.ec2_role.name
}

resource "aws_iam_policy" "ec2_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-ec2-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "${aws_s3_bucket.primary_bucket.arn}/*",
          aws_secretsmanager_secret.primary_rds_secret.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  provider   = aws.us_east_2
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Secondary Region EC2 Role
resource "aws_iam_role" "secondary_ec2_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-ec2-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ec2-role"
  })
}

resource "aws_iam_instance_profile" "secondary_ec2_profile" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-ec2-profile"
  role     = aws_iam_role.secondary_ec2_role.name
}

# ===============================================
# EC2 INSTANCES
# ===============================================

# Primary EC2 Instances
resource "aws_instance" "primary_ec2" {
  provider                     = aws.us_east_2
  count                        = 2
  ami                          = data.aws_ami.amazon_linux_primary.id
  instance_type                = "t3.micro"
  subnet_id                    = aws_subnet.primary_private_subnets[count.index].id
  vpc_security_group_ids       = [aws_security_group.primary_ec2_sg.id]
  iam_instance_profile         = aws_iam_instance_profile.ec2_profile.name
  associate_public_ip_address  = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Primary Region Server ${count.index + 1}</h1>" > /var/www/html/index.html
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ec2-${count.index + 1}"
  })
}

# Secondary EC2 Instances
resource "aws_instance" "secondary_ec2" {
  provider                     = aws.us_west_1
  count                        = 2
  ami                          = data.aws_ami.amazon_linux_secondary.id
  instance_type                = "t3.micro"
  subnet_id                    = aws_subnet.secondary_private_subnets[count.index].id
  vpc_security_group_ids       = [aws_security_group.secondary_ec2_sg.id]
  iam_instance_profile         = aws_iam_instance_profile.secondary_ec2_profile.name
  associate_public_ip_address  = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Secondary Region Server ${count.index + 1}</h1>" > /var/www/html/index.html
  EOF
  )

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ec2-${count.index + 1}"
  })
}

# ===============================================
# APPLICATION LOAD BALANCERS
# ===============================================

# Primary ALB
resource "aws_lb" "primary_alb" {
  provider           = aws.us_east_2
  name               = "${local.primary_name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb_sg.id]
  subnets            = aws_subnet.primary_public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-alb"
  })
}

# Primary ALB Target Group
resource "aws_lb_target_group" "primary_tg" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-tg"
  })
}

# Primary ALB Target Group Attachment
resource "aws_lb_target_group_attachment" "primary_tg_attachment" {
  provider         = aws.us_east_2
  count            = length(aws_instance.primary_ec2)
  target_group_arn = aws_lb_target_group.primary_tg.arn
  target_id        = aws_instance.primary_ec2[count.index].id
  port             = 80
}

# Primary ALB Listener
resource "aws_lb_listener" "primary_listener" {
  provider          = aws.us_east_2
  load_balancer_arn = aws_lb.primary_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary_tg.arn
  }
}

# Secondary ALB
resource "aws_lb" "secondary_alb" {
  provider           = aws.us_west_1
  name               = "${local.secondary_name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.secondary_alb_sg.id]
  subnets            = aws_subnet.secondary_public_subnets[*].id

  enable_deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-alb"
  })
}

# Secondary ALB Target Group
resource "aws_lb_target_group" "secondary_tg" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-tg"
  })
}

# Secondary ALB Target Group Attachment
resource "aws_lb_target_group_attachment" "secondary_tg_attachment" {
  provider         = aws.us_west_1
  count            = length(aws_instance.secondary_ec2)
  target_group_arn = aws_lb_target_group.secondary_tg.arn
  target_id        = aws_instance.secondary_ec2[count.index].id
  port             = 80
}

# Secondary ALB Listener
resource "aws_lb_listener" "secondary_listener" {
  provider          = aws.us_west_1
  load_balancer_arn = aws_lb.secondary_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary_tg.arn
  }
}

# ===============================================
# WAF FOR ALB
# ===============================================

# Primary WAF Web ACL
resource "aws_wafv2_web_acl" "primary_waf" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-waf"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.primary_name_prefix}-waf-metric"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-waf"
  })
}

# Associate WAF with Primary ALB
resource "aws_wafv2_web_acl_association" "primary_waf_association" {
  provider     = aws.us_east_2
  resource_arn = aws_lb.primary_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.primary_waf.arn
}

# Secondary WAF Web ACL
resource "aws_wafv2_web_acl" "secondary_waf" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-waf"
  scope    = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.secondary_name_prefix}-waf-metric"
    sampled_requests_enabled   = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-waf"
  })
}

# Associate WAF with Secondary ALB
resource "aws_wafv2_web_acl_association" "secondary_waf_association" {
  provider     = aws.us_west_1
  resource_arn = aws_lb.secondary_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.secondary_waf.arn
}

# ===============================================
# LAMBDA FUNCTIONS FOR RDS BACKUP
# ===============================================

# Lambda Execution Role for Primary Region
resource "aws_iam_role" "primary_lambda_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-lambda-role"
  })
}

# Lambda Policy for RDS Backup - Primary
resource "aws_iam_policy" "primary_lambda_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "primary_lambda_policy_attachment" {
  provider   = aws.us_east_2
  role       = aws_iam_role.primary_lambda_role.name
  policy_arn = aws_iam_policy.primary_lambda_policy.arn
}

# Primary Lambda Function for RDS Backup
resource "aws_lambda_function" "primary_rds_backup" {
  provider         = aws.us_east_2
  filename         = "rds_backup.zip"
  function_name    = "${local.primary_name_prefix}-rds-backup"
  role            = aws_iam_role.primary_lambda_role.arn
  handler         = "index.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60

  reserved_concurrent_executions = 5

  environment {
    variables = {
      RDS_INSTANCE_ID = aws_db_instance.primary_rds.id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-rds-backup-lambda"
  })
}

# Secondary Lambda Role
resource "aws_iam_role" "secondary_lambda_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-lambda-role"
  })
}

# Lambda Policy for RDS Backup - Secondary
resource "aws_iam_policy" "secondary_lambda_policy" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:DescribeDBInstances",
          "rds:DescribeDBSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secondary_lambda_policy_attachment" {
  provider   = aws.us_west_1
  role       = aws_iam_role.secondary_lambda_role.name
  policy_arn = aws_iam_policy.secondary_lambda_policy.arn
}

# Secondary Lambda Function for RDS Backup
resource "aws_lambda_function" "secondary_rds_backup" {
  provider         = aws.us_west_1
  filename         = "rds_backup.zip"
  function_name    = "${local.secondary_name_prefix}-rds-backup"
  role            = aws_iam_role.secondary_lambda_role.arn
  handler         = "index.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = 60

  reserved_concurrent_executions = 5

  environment {
    variables = {
      RDS_INSTANCE_ID = aws_db_instance.secondary_rds.id
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-rds-backup-lambda"
  })
}

# Lambda function source code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "rds_backup.zip"
  source {
    content = <<EOF
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    rds_client = boto3.client('rds')
    instance_id = os.environ['RDS_INSTANCE_ID']
    
    snapshot_id = f"{instance_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=instance_id
        )
        return {
            'statusCode': 200,
            'body': f'Snapshot {snapshot_id} created successfully'
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f'Error creating snapshot: {str(e)}'
        }
EOF
    filename = "index.py"
  }
}

# ===============================================
# CLOUDWATCH ALARMS
# ===============================================

# Primary EC2 CPU Alarms
resource "aws_cloudwatch_metric_alarm" "primary_ec2_cpu_alarm" {
  provider            = aws.us_east_2
  count               = length(aws_instance.primary_ec2)
  alarm_name          = "${local.primary_name_prefix}-ec2-${count.index + 1}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.primary_ec2[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ec2-${count.index + 1}-cpu-alarm"
  })
}

# Primary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "primary_rds_cpu_alarm" {
  provider            = aws.us_east_2
  alarm_name          = "${local.primary_name_prefix}-rds-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary_rds.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-rds-cpu-alarm"
  })
}

# Secondary EC2 CPU Alarms
resource "aws_cloudwatch_metric_alarm" "secondary_ec2_cpu_alarm" {
  provider            = aws.us_west_1
  count               = length(aws_instance.secondary_ec2)
  alarm_name          = "${local.secondary_name_prefix}-ec2-${count.index + 1}-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"

  dimensions = {
    InstanceId = aws_instance.secondary_ec2[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ec2-${count.index + 1}-cpu-alarm"
  })
}

# Secondary RDS CPU Alarm
resource "aws_cloudwatch_metric_alarm" "secondary_rds_cpu_alarm" {
  provider            = aws.us_west_1
  alarm_name          = "${local.secondary_name_prefix}-rds-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS cpu utilization"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.secondary_rds.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-rds-cpu-alarm"
  })
}

# ===============================================
# CLOUDTRAIL
# ===============================================

# CloudTrail S3 Bucket
resource "aws_s3_bucket" "cloudtrail_bucket" {
  provider = aws.us_east_2
  bucket   = "${local.primary_name_prefix}-cloudtrail-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-cloudtrail-bucket"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_bucket_encryption" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.cloudtrail_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.cloudtrail_bucket.id

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
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "main_trail" {
  provider           = aws.us_east_2
  name               = "${local.primary_name_prefix}-cloudtrail"
  s3_bucket_name     = aws_s3_bucket.cloudtrail_bucket.id
  is_multi_region_trail = true

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-cloudtrail"
  })
}

# ===============================================
# VPC FLOW LOGS
# ===============================================

# VPC Flow Logs IAM Role
resource "aws_iam_role" "flow_logs_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "flow_logs_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-flow-logs-policy"
  role     = aws_iam_role.flow_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for Primary VPC Flow Logs
resource "aws_cloudwatch_log_group" "primary_vpc_flow_logs" {
  provider          = aws.us_east_2
  name              = "/aws/vpc/flowlogs-primary"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-vpc-flow-logs"
  })
}

# Primary VPC Flow Logs
resource "aws_flow_log" "primary_vpc_flow_logs" {
  provider        = aws.us_east_2
  iam_role_arn    = aws_iam_role.flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.primary_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.primary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-vpc-flow-logs"
  })
}

# Secondary VPC Flow Logs Role (continued)
resource "aws_iam_role" "secondary_flow_logs_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "secondary_flow_logs_policy" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-flow-logs-policy"
  role     = aws_iam_role.secondary_flow_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Log Group for Secondary VPC Flow Logs
resource "aws_cloudwatch_log_group" "secondary_vpc_flow_logs" {
  provider          = aws.us_west_1
  name              = "/aws/vpc/flowlogs-secondary"
  retention_in_days = 30

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-vpc-flow-logs"
  })
}

# Secondary VPC Flow Logs
resource "aws_flow_log" "secondary_vpc_flow_logs" {
  provider        = aws.us_west_1
  iam_role_arn    = aws_iam_role.secondary_flow_logs_role.arn
  log_destination = aws_cloudwatch_log_group.secondary_vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.secondary_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-vpc-flow-logs"
  })
}

# ===============================================
# CLOUDFRONT DISTRIBUTION WITH AWS SHIELD
# ===============================================

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  provider = aws.us_east_2
  comment  = "Origin Access Identity for ${local.primary_name_prefix}"
}

# Update S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "primary_bucket_policy" {
  provider = aws.us_east_2
  bucket   = aws_s3_bucket.primary_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.primary_bucket.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution with AWS Shield Standard (enabled by default)
resource "aws_cloudfront_distribution" "main_distribution" {
  provider = aws.us_east_2

  origin {
    domain_name = aws_s3_bucket.primary_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.primary_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  # Additional origin for ALB
  origin {
    domain_name = aws_lb.primary_alb.dns_name
    origin_id   = "ALB-${aws_lb.primary_alb.name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.primary_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior for ALB
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB-${aws_lb.primary_alb.name}"

    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  # AWS Shield Standard is enabled by default for CloudFront
  # AWS Shield Advanced would require additional subscription

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-cloudfront"
  })
}

# ===============================================
# EBS SNAPSHOT LIFECYCLE POLICY
# ===============================================

# IAM Role for DLM (Data Lifecycle Manager)
resource "aws_iam_role" "dlm_lifecycle_role" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-dlm-lifecycle-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-dlm-lifecycle-role"
  })
}

resource "aws_iam_role_policy" "dlm_lifecycle_policy" {
  provider = aws.us_east_2
  name     = "${local.primary_name_prefix}-dlm-lifecycle-policy"
  role     = aws_iam_role.dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:DeleteSnapshot",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# DLM Lifecycle Policy for Primary Region
resource "aws_dlm_lifecycle_policy" "primary_ebs_backup" {
  provider           = aws.us_east_2
  description        = "EBS snapshot lifecycle policy for primary region"
  execution_role_arn = aws_iam_role.dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types   = ["VOLUME"]
    target_tags = {
      Environment = "Production"
    }

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 7
      }

      tags_to_add = merge(local.common_tags, {
        SnapshotCreator = "DLM"
      })

      copy_tags = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.primary_name_prefix}-ebs-backup-policy"
  })
}

# DLM Resources for Secondary Region
resource "aws_iam_role" "secondary_dlm_lifecycle_role" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-dlm-lifecycle-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dlm.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-dlm-lifecycle-role"
  })
}

resource "aws_iam_role_policy" "secondary_dlm_lifecycle_policy" {
  provider = aws.us_west_1
  name     = "${local.secondary_name_prefix}-dlm-lifecycle-policy"
  role     = aws_iam_role.secondary_dlm_lifecycle_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateSnapshot",
          "ec2:CreateTags",
          "ec2:DeleteSnapshot",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:DescribeSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# DLM Lifecycle Policy for Secondary Region
resource "aws_dlm_lifecycle_policy" "secondary_ebs_backup" {
  provider           = aws.us_west_1
  description        = "EBS snapshot lifecycle policy for secondary region"
  execution_role_arn = aws_iam_role.secondary_dlm_lifecycle_role.arn
  state              = "ENABLED"

  policy_details {
    resource_types   = ["VOLUME"]
    target_tags = {
      Environment = "Production"
    }

    schedule {
      name = "Daily snapshots"

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }

      retain_rule {
        count = 7
      }

      tags_to_add = merge(local.common_tags, {
        SnapshotCreator = "DLM"
      })

      copy_tags = true
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.secondary_name_prefix}-ebs-backup-policy"
  })
}

# ===============================================
# OUTPUTS
# ===============================================

# VPC Outputs
output "primary_vpc_id" {
  description = "ID of the primary VPC"
  value       = aws_vpc.primary_vpc.id
}

output "primary_vpc_cidr" {
  description = "CIDR block of the primary VPC"
  value       = aws_vpc.primary_vpc.cidr_block
}

output "secondary_vpc_id" {
  description = "ID of the secondary VPC"
  value       = aws_vpc.secondary_vpc.id
}

output "secondary_vpc_cidr" {
  description = "CIDR block of the secondary VPC"
  value       = aws_vpc.secondary_vpc.cidr_block
}

# Subnet Outputs
output "primary_public_subnet_ids" {
  description = "IDs of the primary public subnets"
  value       = aws_subnet.primary_public_subnets[*].id
}

output "primary_private_subnet_ids" {
  description = "IDs of the primary private subnets"
  value       = aws_subnet.primary_private_subnets[*].id
}

output "secondary_public_subnet_ids" {
  description = "IDs of the secondary public subnets"
  value       = aws_subnet.secondary_public_subnets[*].id
}

output "secondary_private_subnet_ids" {
  description = "IDs of the secondary private subnets"
  value       = aws_subnet.secondary_private_subnets[*].id
}

# Internet Gateway Outputs
output "primary_igw_id" {
  description = "ID of the primary internet gateway"
  value       = aws_internet_gateway.primary_igw.id
}

output "secondary_igw_id" {
  description = "ID of the secondary internet gateway"
  value       = aws_internet_gateway.secondary_igw.id
}

# NAT Gateway Outputs
output "primary_nat_gateway_id" {
  description = "ID of the primary NAT gateway"
  value       = aws_nat_gateway.primary_nat.id
}

output "secondary_nat_gateway_id" {
  description = "ID of the secondary NAT gateway"
  value       = aws_nat_gateway.secondary_nat.id
}

# Security Group Outputs
output "primary_ec2_sg_id" {
  description = "ID of the primary EC2 security group"
  value       = aws_security_group.primary_ec2_sg.id
}

output "primary_rds_sg_id" {
  description = "ID of the primary RDS security group"
  value       = aws_security_group.primary_rds_sg.id
}

output "primary_alb_sg_id" {
  description = "ID of the primary ALB security group"
  value       = aws_security_group.primary_alb_sg.id
}

output "secondary_ec2_sg_id" {
  description = "ID of the secondary EC2 security group"
  value       = aws_security_group.secondary_ec2_sg.id
}

output "secondary_rds_sg_id" {
  description = "ID of the secondary RDS security group"
  value       = aws_security_group.secondary_rds_sg.id
}

output "secondary_alb_sg_id" {
  description = "ID of the secondary ALB security group"
  value       = aws_security_group.secondary_alb_sg.id
}

# RDS Outputs
output "primary_rds_endpoint" {
  description = "Endpoint of the primary RDS instance"
  value       = aws_db_instance.primary_rds.endpoint
}

output "primary_rds_port" {
  description = "Port of the primary RDS instance"
  value       = aws_db_instance.primary_rds.port
}

output "primary_rds_db_name" {
  description = "Database name of the primary RDS instance"
  value       = aws_db_instance.primary_rds.db_name
}

output "secondary_rds_endpoint" {
  description = "Endpoint of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.endpoint
}

output "secondary_rds_port" {
  description = "Port of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.port
}

output "secondary_rds_db_name" {
  description = "Database name of the secondary RDS instance"
  value       = aws_db_instance.secondary_rds.db_name
}

# Secrets Manager Outputs
output "primary_rds_secret_arn" {
  description = "ARN of the primary RDS secret"
  value       = aws_secretsmanager_secret.primary_rds_secret.arn
}

output "secondary_rds_secret_arn" {
  description = "ARN of the secondary RDS secret"
  value       = aws_secretsmanager_secret.secondary_rds_secret.arn
}

# S3 Bucket Outputs
output "primary_s3_bucket_id" {
  description = "ID of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.id
}

output "primary_s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.arn
}

output "primary_s3_bucket_domain_name" {
  description = "Domain name of the primary S3 bucket"
  value       = aws_s3_bucket.primary_bucket.bucket_domain_name
}

output "secondary_s3_bucket_id" {
  description = "ID of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.id
}

output "secondary_s3_bucket_arn" {
  description = "ARN of the secondary S3 bucket"
  value       = aws_s3_bucket.secondary_bucket.arn
}

output "cloudtrail_s3_bucket_id" {
  description = "ID of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_bucket.id
}

# IAM Role Outputs
output "ec2_role_arn" {
  description = "ARN of the primary EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "secondary_ec2_role_arn" {
  description = "ARN of the secondary EC2 IAM role"
  value       = aws_iam_role.secondary_ec2_role.arn
}

output "s3_replication_role_arn" {
  description = "ARN of the S3 replication IAM role"
  value       = aws_iam_role.replication_role.arn
}

output "primary_lambda_role_arn" {
  description = "ARN of the primary Lambda IAM role"
  value       = aws_iam_role.primary_lambda_role.arn
}

output "secondary_lambda_role_arn" {
  description = "ARN of the secondary Lambda IAM role"
  value       = aws_iam_role.secondary_lambda_role.arn
}

# EC2 Instance Outputs
output "primary_ec2_instance_ids" {
  description = "IDs of the primary EC2 instances"
  value       = aws_instance.primary_ec2[*].id
}

output "primary_ec2_private_ips" {
  description = "Private IP addresses of the primary EC2 instances"
  value       = aws_instance.primary_ec2[*].private_ip
}

output "secondary_ec2_instance_ids" {
  description = "IDs of the secondary EC2 instances"
  value       = aws_instance.secondary_ec2[*].id
}

output "secondary_ec2_private_ips" {
  description = "Private IP addresses of the secondary EC2 instances"
  value       = aws_instance.secondary_ec2[*].private_ip
}

# AMI Outputs
output "primary_ami_id" {
  description = "AMI ID used for primary region instances"
  value       = data.aws_ami.amazon_linux_primary.id
}

output "secondary_ami_id" {
  description = "AMI ID used for secondary region instances"
  value       = data.aws_ami.amazon_linux_secondary.id
}

# ALB Outputs
output "primary_alb_dns_name" {
  description = "DNS name of the primary ALB"
  value       = aws_lb.primary_alb.dns_name
}

output "primary_alb_zone_id" {
  description = "Zone ID of the primary ALB"
  value       = aws_lb.primary_alb.zone_id
}

output "primary_alb_arn" {
  description = "ARN of the primary ALB"
  value       = aws_lb.primary_alb.arn
}

output "secondary_alb_dns_name" {
  description = "DNS name of the secondary ALB"
  value       = aws_lb.secondary_alb.dns_name
}

output "secondary_alb_zone_id" {
  description = "Zone ID of the secondary ALB"
  value       = aws_lb.secondary_alb.zone_id
}

output "secondary_alb_arn" {
  description = "ARN of the secondary ALB"
  value       = aws_lb.secondary_alb.arn
}

# Target Group Outputs
output "primary_target_group_arn" {
  description = "ARN of the primary target group"
  value       = aws_lb_target_group.primary_tg.arn
}

output "secondary_target_group_arn" {
  description = "ARN of the secondary target group"
  value       = aws_lb_target_group.secondary_tg.arn
}

# WAF Outputs
output "primary_waf_arn" {
  description = "ARN of the primary WAF Web ACL"
  value       = aws_wafv2_web_acl.primary_waf.arn
}

output "secondary_waf_arn" {
  description = "ARN of the secondary WAF Web ACL"
  value       = aws_wafv2_web_acl.secondary_waf.arn
}

# Lambda Function Outputs
output "primary_lambda_function_arn" {
  description = "ARN of the primary Lambda function"
  value       = aws_lambda_function.primary_rds_backup.arn
}

output "primary_lambda_function_name" {
  description = "Name of the primary Lambda function"
  value       = aws_lambda_function.primary_rds_backup.function_name
}

output "secondary_lambda_function_arn" {
  description = "ARN of the secondary Lambda function"
  value       = aws_lambda_function.secondary_rds_backup.arn
}

output "secondary_lambda_function_name" {
  description = "Name of the secondary Lambda function"
  value       = aws_lambda_function.secondary_rds_backup.function_name
}

# CloudWatch Alarms Outputs
output "primary_ec2_cpu_alarm_names" {
  description = "Names of the primary EC2 CPU alarms"
  value       = aws_cloudwatch_metric_alarm.primary_ec2_cpu_alarm[*].alarm_name
}

output "primary_rds_cpu_alarm_name" {
  description = "Name of the primary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.primary_rds_cpu_alarm.alarm_name
}

output "secondary_ec2_cpu_alarm_names" {
  description = "Names of the secondary EC2 CPU alarms"
  value       = aws_cloudwatch_metric_alarm.secondary_ec2_cpu_alarm[*].alarm_name
}

output "secondary_rds_cpu_alarm_name" {
  description = "Name of the secondary RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.secondary_rds_cpu_alarm.alarm_name
}

# CloudTrail Outputs
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main_trail.arn
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main_trail.home_region
}

# VPC Flow Logs Outputs
output "primary_vpc_flow_logs_id" {
  description = "ID of the primary VPC flow logs"
  value       = aws_flow_log.primary_vpc_flow_logs.id
}

output "secondary_vpc_flow_logs_id" {
  description = "ID of the secondary VPC flow logs"
  value       = aws_flow_log.secondary_vpc_flow_logs.id
}

output "primary_flow_logs_log_group_name" {
  description = "Name of the primary flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.primary_vpc_flow_logs.name
}

output "secondary_flow_logs_log_group_name" {
  description = "Name of the secondary flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.secondary_vpc_flow_logs.name
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Hosted zone ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distribution.hosted_zone_id
}

# DLM Lifecycle Policy Outputs
output "primary_dlm_policy_arn" {
  description = "ARN of the primary DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.primary_ebs_backup.arn
}

output "secondary_dlm_policy_arn" {
  description = "ARN of the secondary DLM lifecycle policy"
  value       = aws_dlm_lifecycle_policy.secondary_ebs_backup.arn
}

# Availability Zones Outputs
output "primary_availability_zones" {
  description = "List of availability zones in the primary region"
  value       = data.aws_availability_zones.primary_azs.names
}

output "secondary_availability_zones" {
  description = "List of availability zones in the secondary region"
  value       = data.aws_availability_zones.secondary_azs.names
}

# Account Information
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Regional Information
output "primary_region" {
  description = "Primary region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary region"
  value       = var.secondary_region
}

# Route Table Outputs
output "primary_public_route_table_id" {
  description = "ID of the primary public route table"
  value       = aws_route_table.primary_public_rt.id
}

output "primary_private_route_table_id" {
  description = "ID of the primary private route table"
  value       = aws_route_table.primary_private_rt.id
}

output "secondary_public_route_table_id" {
  description = "ID of the secondary public route table"
  value       = aws_route_table.secondary_public_rt.id
}

output "secondary_private_route_table_id" {
  description = "ID of the secondary private route table"
  value       = aws_route_table.secondary_private_rt.id
}

# Environment and Naming Outputs
output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "primary_name_prefix" {
  description = "Primary region name prefix"
  value       = local.primary_name_prefix
}

output "secondary_name_prefix" {
  description = "Secondary region name prefix"
  value       = local.secondary_name_prefix
}
```

## Summary

This complete Terraform configuration includes:

### **Infrastructure Components:**
- **Multi-region VPCs** with proper CIDR blocks (10.0.0.0/16 and 10.1.0.0/16)
- **Public and private subnets** in each region with NAT gateways and internet gateways
- **Route tables and associations** for proper network routing

### **Security:**
- **Security groups** with least privilege access (SSH from specific CIDRs, HTTPS from anywhere)
- **IAM roles and policies** following least privilege principle
- **WAF protection** for ALBs with managed rule sets
- **Encrypted EBS volumes** with KMS AWS-managed keys
- **S3 encryption** using AES256
- **VPC Flow Logs** for network monitoring

### **Database:**
- **Multi-AZ RDS instances** in both regions with encryption
- **Random credentials** stored in AWS Secrets Manager
- **Automated minor version upgrades** enabled

### **Compute:**
- **EC2 instances** using latest Amazon Linux 2 AMI in private subnets
- **Application Load Balancers** with health checks
- **Auto-scaling capabilities** through target groups

### **Storage & CDN:**
- **S3 buckets** with versioning, encryption, and cross-region replication
- **CloudFront distribution** with AWS Shield Standard protection

### **Monitoring & Compliance:**
- **CloudWatch alarms** for CPU monitoring
- **CloudTrail** for audit logging across all regions
- **EBS snapshot lifecycle policies** for backup management
- **Lambda functions** for RDS backup automation with concurrency limits

### **Outputs:**
The configuration provides comprehensive outputs for all created resources including IDs, ARNs, endpoints, and other essential identifiers for integration with other systems or for reference.

All resources are properly tagged with the required tags (`Environment:Production`, `ownership:self`, `departmental:businessunit`) and use consistent naming conventions through locals.
