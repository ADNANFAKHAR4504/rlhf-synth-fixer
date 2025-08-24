# lib/modules/cloudtrail/tap_stack.tf

## Variables

```terraform
variable "cloudtrail_name" {
  description = "Name of the CloudTrail"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "cloudtrail_kms_key_arn" {
  description = "ARN of the KMS key for CloudTrail encryption"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## CloudTrail

```terraform
resource "aws_cloudtrail" "main" {
  name           = var.cloudtrail_name
  s3_bucket_name = var.s3_bucket_name

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  kms_key_id                    = var.cloudtrail_kms_key_arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  tags = merge(var.common_tags, {
    Name = var.cloudtrail_name
  })
}
```

## Outputs

```terraform
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_home_region" {
  description = "Home region of the CloudTrail"
  value       = aws_cloudtrail.main.home_region
}
```

# lib/modules/ec2/tap_stack.tf

## Variables

```terraform
variable "vpc_id" {
  description = "VPC ID where EC2 instances will be deployed"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "ec2_instance_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  type        = string
}

variable "random_prefix" {
  description = "Random prefix for unique resource naming"
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name (optional)"
  type        = string
  default     = null
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## Security Group for EC2

```terraform
resource "aws_security_group" "ec2_sg" {
  name_prefix = var.random_prefix != "" ? "${var.random_prefix}-ec2-sg" : "${var.common_tags.Environment}-ec2-sg"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "SSH from VPC"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "HTTP from VPC"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-ec2-sg" : "${var.common_tags.Environment}-ec2-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

## Get latest Amazon Linux 2 AMI

```terraform
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
```

## EC2 Instance in Private Subnet

```terraform
resource "aws_instance" "main" {
  count = length(var.private_subnet_ids)

  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name != null ? var.key_pair_name : null
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  subnet_id              = var.private_subnet_ids[count.index]
  iam_instance_profile   = var.instance_profile_name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent

    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "logs": {
        "logs_collected": {
          "files": {
            "collect_list": [
              {
                "file_path": "/var/log/messages",
                "log_group_name": "${var.random_prefix != "" ? var.random_prefix : var.common_tags.Environment}-ec2-logs",
                "log_stream_name": "{instance_id}/messages"
              }
            ]
          }
        }
      }
    }
    EOL

    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
  EOF

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-ec2-${count.index + 1}"
  })
}
```

## Outputs

```terraform
output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_instance.main[*].id
}

output "instance_private_ips" {
  description = "Private IP addresses of the EC2 instances"
  value       = aws_instance.main[*].private_ip
}

output "security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2_sg.id
}
```

# lib/modules/iam/tap_stack.tf

```terraform
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}

variable "random_prefix" {
  description = "Random prefix for unique resource naming"
  type        = string
  default     = ""
}
```

## EC2 Instance Role

```terraform
resource "aws_iam_role" "ec2_role" {
  name = var.random_prefix != "" ? "${var.random_prefix}-ec2-role" : "${var.common_tags.Environment}-ec2-role"

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

  tags = var.common_tags
}
```

## EC2 Instance Policy

```terraform
resource "aws_iam_policy" "ec2_policy" {
  name        = var.random_prefix != "" ? "${var.random_prefix}-ec2-policy" : "${var.common_tags.Environment}-ec2-policy"
  description = "Policy for EC2 instances with least privilege access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.common_tags.Environment}-*",
          "arn:aws:s3:::${var.common_tags.Environment}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:*:*:secret:${var.common_tags.Environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = var.common_tags
}
```

## Attach policy to role

```terraform
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}
```

## Instance Profile

```terraform
resource "aws_iam_instance_profile" "ec2_profile" {
  name = var.random_prefix != "" ? "${var.random_prefix}-ec2-profile" : "${var.common_tags.Environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.common_tags
}
```

## CloudTrail Role

```terraform
resource "aws_iam_role" "cloudtrail_role" {
  name = var.random_prefix != "" ? "${var.random_prefix}-cloudtrail-role" : "${var.common_tags.Environment}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = var.common_tags
}
```

## CloudTrail Policy

```terraform
resource "aws_iam_policy" "cloudtrail_policy" {
  name        = var.random_prefix != "" ? "${var.random_prefix}-cloudtrail-policy" : "${var.common_tags.Environment}-cloudtrail-policy"
  description = "Policy for CloudTrail logging"

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
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "cloudtrail_policy_attachment" {
  role       = aws_iam_role.cloudtrail_role.name
  policy_arn = aws_iam_policy.cloudtrail_policy.arn
}
```

## Outputs

```terraform
output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance role"
  value       = aws_iam_role.ec2_role.arn
}

output "ec2_instance_role_name" {
  description = "Name of the EC2 instance role"
  value       = aws_iam_role.ec2_role.name
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "cloudtrail_role_arn" {
  description = "ARN of the CloudTrail role"
  value       = aws_iam_role.cloudtrail_role.arn
}
```

# lib/modules/rds/tap_stack.tf

## Variables

```terraform
variable "vpc_id" {
  description = "VPC ID where RDS will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS subnet group"
  type        = list(string)
}

variable "random_prefix" {
  description = "Random prefix for unique resource naming"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## RDS Subnet Group

```terraform
resource "aws_db_subnet_group" "main" {
  # Use a stable name for the DB subnet group to avoid Terraform creating
  # a new group during updates which can trigger AWS errors when modifying
  # the DB instance's subnet group. RDS subnet groups are tied to a VPC
  # and moving instances is not allowed in this workflow.
  name       = var.random_prefix != "" ? "${var.random_prefix}-db-subnet-group" : "${var.common_tags.Environment}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-db-subnet-group" : "${var.common_tags.Environment}-db-subnet-group"
  })

  lifecycle {
    # Do not create a replacement subnet group before destroying the old one
    # – keep operations in-place to avoid AWS rejecting moves between groups.
    create_before_destroy = false
  }
}
```

## Security Group for RDS

```terraform
resource "aws_security_group" "rds_sg" {
  name_prefix = var.random_prefix != "" ? "${var.random_prefix}-rds-sg" : "${var.common_tags.Environment}-rds-sg"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
    description = "MySQL from VPC"
  }

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-rds-sg" : "${var.common_tags.Environment}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}
```

## Generate random password for RDS

```terraform
resource "random_password" "db_password" {
  length  = 16
  special = true
}
```

## Store password in AWS Secrets Manager

```terraform
resource "aws_secretsmanager_secret" "db_password" {
  name                    = var.random_prefix != "" ? "${var.random_prefix}/rds/password" : "${var.common_tags.Environment}/rds/password"
  description             = "RDS database password"
  recovery_window_in_days = 7

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.db_password.result
  })
}
```

## RDS Instance

```terraform
resource "aws_db_instance" "main" {
  identifier_prefix = var.random_prefix != "" ? "${var.random_prefix}-database-" : "${var.common_tags.Environment}-database-"

  engine         = "mysql"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "${replace(var.common_tags.Environment, "-", "")}db"
  username = "admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = var.enable_deletion_protection

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = merge(var.common_tags, {
    Name = var.random_prefix != "" ? "${var.random_prefix}-database" : "${var.common_tags.Environment}-database"
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes = [
      password,            # Ignore password changes to prevent unnecessary updates
      db_subnet_group_name # Prevent Terraform from attempting to change subnet group on the DB instance
    ]
  }

  depends_on = [aws_db_subnet_group.main]
}
```

## Outputs

```terraform
output "db_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds_sg.id
}

output "db_secrets_manager_arn" {
  description = "ARN of the Secrets Manager secret for RDS password"
  value       = aws_secretsmanager_secret.db_password.arn
}
```

# lib/modules/s3/tap_stack.tf

```terraform
variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## KMS Key for S3 Encryption

```terraform
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for S3 bucket encryption"
  deletion_window_in_days = 7

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
      },
      {
        Sid    = "Allow CloudTrail to encrypt logs"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${var.common_tags.Environment}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}
```

## CloudTrail S3 Bucket

```terraform
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.cloudtrail_bucket_name}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = merge(var.common_tags, {
    Name = "CloudTrail Logs Bucket"
  })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}
```

## S3 Bucket Versioning

```terraform
resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

## S3 Bucket Server Side Encryption

```terraform
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}
```

## S3 Bucket Public Access Block

```terraform
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## S3 Bucket Policy for CloudTrail

```terraform
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${var.common_tags.Environment}-trail"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:us-east-1:${data.aws_caller_identity.current.account_id}:trail/${var.common_tags.Environment}-trail"
          }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
```

## Outputs

```terraform
output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}

output "cloudtrail_bucket_arn" {
  description = "ARN of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail_logs.arn
}

output "cloudtrail_kms_key_arn" {
  description = "ARN of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.s3_key.arn
}

output "cloudtrail_kms_key_id" {
  description = "ID of the KMS key for CloudTrail encryption"
  value       = aws_kms_key.s3_key.key_id
}
```

# lib/modules/vpc/tap_stack.tf

```terraform
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones (if empty, will use available AZs from the region)"
  type        = list(string)
  default     = []
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
}
```

## Data source to get available AZs

```terraform
data "aws_availability_zones" "available" {
  state = "available"
}
```

## VPC

```terraform
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-vpc"
  })
}
```

## Internet Gateway

```terraform
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-igw"
  })
}
```

## Public Subnets

```terraform
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = length(var.availability_zones) > count.index ? var.availability_zones[count.index] : data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}
```

## Private Subnets

```terraform
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = length(var.availability_zones) > count.index ? var.availability_zones[count.index] : data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}
```

## NAT Gateway

```terraform
resource "aws_eip" "nat" {
  count  = length(var.public_subnet_cidrs)
  domain = "vpc"

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}
```

## Route Tables

```terraform
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = length(var.private_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = merge(var.common_tags, {
    Name = "${var.common_tags.Environment}-private-rt-${count.index + 1}"
  })
}
```

## Route Table Associations

```terraform
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

## Outputs

```terraform
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}
```

# lib/tap_stack.tf

## Variables

```terraform
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "infrastructure-team"
}

variable "purpose" {
  description = "Purpose of the infrastructure"
  type        = string
  default     = "secure-aws-infrastructure"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = []
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "cloudtrail_bucket_name" {
  description = "S3 bucket name for CloudTrail logs"
  type        = string
  default     = "secure-cloudtrail-logs-bucket"
}

variable "cloudtrail_name" {
  description = "CloudTrail name"
  type        = string
  default     = "secure-infrastructure-trail"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name (optional - if not provided, instances will be accessible via Session Manager)"
  type        = string
  default     = null
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS instance"
  type        = bool
  default     = false
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail creation (disable if hitting account limits)"
  type        = bool
  default     = false
}
```

## VPC Module

```terraform
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  common_tags = local.common_tags
}
```

## IAM Module

```terraform
module "iam" {
  source = "./modules/iam"

  random_prefix = local.random_prefix
  common_tags   = local.common_tags
}
```

## S3 Module

```terraform
module "s3" {
  source = "./modules/s3"

  cloudtrail_bucket_name = local.cloudtrail_bucket_name
  common_tags            = local.common_tags
}
```

## CloudTrail Module (conditional)

```terraform
module "cloudtrail" {
  count  = var.enable_cloudtrail ? 1 : 0
  source = "./modules/cloudtrail"

  cloudtrail_name        = local.cloudtrail_name
  s3_bucket_name         = module.s3.cloudtrail_bucket_name
  cloudtrail_kms_key_arn = module.s3.cloudtrail_kms_key_arn

  common_tags = local.common_tags

  depends_on = [module.s3]
}
```

## EC2 Module

```terraform
module "ec2" {
  source = "./modules/ec2"

  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  ec2_instance_role_arn = module.iam.ec2_instance_role_arn
  instance_profile_name = module.iam.ec2_instance_profile_name
  random_prefix         = local.random_prefix

  instance_type = var.ec2_instance_type
  key_pair_name = var.key_pair_name

  common_tags = local.common_tags

  depends_on = [module.vpc, module.iam]
}
```

## RDS Module

```terraform
module "rds" {
  source = "./modules/rds"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  random_prefix      = local.random_prefix

  db_instance_class          = var.db_instance_class
  db_allocated_storage       = var.db_allocated_storage
  db_engine_version          = var.db_engine_version
  enable_deletion_protection = var.enable_deletion_protection

  common_tags = local.common_tags

  depends_on = [module.vpc, module.ec2]
}
```

## Random naming resources to avoid conflicts

```terraform
resource "random_id" "unique_suffix" {
  byte_length = 4
}

resource "random_string" "prefix" {
  length  = 6
  special = false
  upper   = false
}
```

## Local values for consistent tagging and naming

```terraform
locals {
  # Random naming prefix for unique resource names
  random_prefix = "${random_string.prefix.result}-${random_id.unique_suffix.hex}"

  # Unique resource names
  cloudtrail_bucket_name = "${local.random_prefix}-${var.cloudtrail_bucket_name}"
  cloudtrail_name        = "${local.random_prefix}-${var.cloudtrail_name}"

  common_tags = {
    Environment  = var.environment
    Owner        = var.owner
    Purpose      = var.purpose
    RandomPrefix = local.random_prefix
  }
}
```

```terraform
output "random_prefix" {
  description = "Random prefix used for resource naming to avoid conflicts"
  value       = local.random_prefix
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.vpc.private_subnet_ids
}

output "ec2_instance_ids" {
  description = "IDs of the EC2 instances"
  value       = module.ec2.instance_ids
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = var.enable_cloudtrail ? module.cloudtrail[0].cloudtrail_arn : ""
}

output "s3_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = module.s3.cloudtrail_bucket_name
}
```
