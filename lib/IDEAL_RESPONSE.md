# Ideal Terraform Infrastructure Solution

Below are the ideal, fully named and formatted Terraform files for lib/. Each code block is labeled with its filepath so you can copy/replace exactly. These files match the repo intent: secure defaults, CI-friendly backend handling, conditional SSH vs SSM, generated DB password fallback, encrypted RDS for new instances, unique S3 naming, and outputs expected by the integration tests.

## backend (backend.tf)

```hcl
terraform {
  backend "s3" {}
}
```

## ec2.tf

```hcl
data "aws_ami" "amazon_linux_2" {
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

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg-${var.resource_suffix}"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # No SSH ingress here; SSH rule is added conditionally below
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "ec2-sg-${var.resource_suffix}"
  }
}

# Conditional SSH rule: created only if use_ssm is false
resource "aws_security_group_rule" "ssh" {
  count        = var.use_ssm ? 0 : 1
  type         = "ingress"
  from_port    = 22
  to_port      = 22
  protocol     = "tcp"
  security_group_id = aws_security_group.ec2_sg.id
  cidr_blocks  = var.ssh_cidr_blocks
  description  = "SSH access (only when use_ssm = false)"
}

# Key pair created only if use_ssm is false
resource "aws_key_pair" "deployer" {
  count      = var.use_ssm ? 0 : 1
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = var.ssh_public_key
}

# IAM role / instance profile for SSM (created always; attachment harmless)
resource "aws_iam_role" "ssm" {
  name = "ssm-role-${var.resource_suffix}"

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
}

resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ssm.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "ssm-profile-${var.resource_suffix}"
  role = aws_iam_role.ssm.name
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  # if using SSH, key will be created; if using SSM, key_name is null
  key_name = var.use_ssm ? null : try(aws_key_pair.deployer[0].key_name, null)

  # attach instance profile for SSM
  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  tags = {
    Name = "web-instance-${var.resource_suffix}"
  }
}
```

## main.tf

```hcl
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      iac-rlhf-amazon = var.iac_rlhf_tag_value
    }
  }
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration should be in a separate backend.tf file
  # after the S3 bucket has been created
}
```

## networking.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "vpc-${var.resource_suffix}"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-west-2a"

  tags = {
    Name = "public-subnet-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "private-subnet-1-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-west-2c"

  tags = {
    Name = "private-subnet-2-${var.resource_suffix}"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.resource_suffix}"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-route-table-${var.resource_suffix}"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

## outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.mysql.endpoint
}


output "s3_app_bucket_name" {
  description = "Name of the application S3 bucket (NOT the terraform backend)"
  value       = aws_s3_bucket.app_bucket.bucket
}

output "rds_password_secret_arn" {
  description = "ARN of Secrets Manager secret containing generated DB password (sensitive). Empty if password provided via TF_VAR_db_password."
  value       = length(aws_secretsmanager_secret.rds_password) > 0 ? aws_secretsmanager_secret.rds_password[0].arn : ""
  sensitive   = true
}
```

## rds.tf

```hcl
resource "aws_db_subnet_group" "default" {
  name       = "db-subnet-group-${var.resource_suffix}"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "db-subnet-group-${var.resource_suffix}"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-sg-${var.resource_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
    description     = "MySQL access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name = "rds-sg-${var.resource_suffix}"
  }
}

# Generate a secure password only when none provided
resource "random_password" "db" {
  count  = var.db_password == "" ? 1 : 0
  length = 32

  # Keep character-class controls; do not use unsupported override_characters
  special = true
  upper   = true
  lower   = true
  numeric  = true
}

# Optionally store generated password in Secrets Manager (created only if we generated it)
resource "aws_secretsmanager_secret" "rds_password" {
  count       = var.db_password == "" ? 1 : 0
  name        = "rds-password-${var.resource_suffix}"
  description = "RDS password for ${var.resource_suffix} (generated by Terraform)"
}

resource "aws_secretsmanager_secret_version" "rds_password_version" {
  count        = var.db_password == "" ? 1 : 0
  secret_id    = aws_secretsmanager_secret.rds_password[0].id
  secret_string = jsonencode({
    password = random_password.db[0].result
  })
}

resource "aws_db_instance" "mysql" {
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.db_instance_class
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password != "" ? var.db_password : random_password.db[0].result

  # Ensure encryption at rest
  storage_encrypted = true

  # Optional: provide a KMS key id if you want CMK encryption
  # kms_key_id = var.rds_kms_key_id   # add variable if you want CMK

  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  skip_final_snapshot     = true
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  identifier              = "mysql-db-${var.resource_suffix}"
  tags = {
    Name = "mysql-db-${var.resource_suffix}"
  }
}
```

## s3.tf

```hcl
data "aws_caller_identity" "current" {}

resource "random_id" "bucket" {
  byte_length = 4
}

locals {
  raw_name   = format("app-storage-%s-%s-%s", data.aws_caller_identity.current.account_id, lower(var.resource_suffix), random_id.bucket.hex)
  bucket_name = substr(local.raw_name, 0, 63)  # S3 bucket name max length 63
}

resource "aws_s3_bucket" "app_bucket" {
  bucket = local.bucket_name
  acl    = "private"

  tags = {
    Name = "app-storage-${var.resource_suffix}"
  }
}

resource "aws_s3_bucket_versioning" "app_bucket_versioning" {
  bucket = aws_s3_bucket.app_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_bucket_encryption" {
  bucket = aws_s3_bucket.app_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_bucket_public_access" {
  bucket                  = aws_s3_bucket.app_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
```

## variables.tf

```hcl
variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.resource_suffix) > 0
    error_message = "resource_suffix must not be empty"
  }
}

variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the RDS database. If empty, a secure password will be generated."
  type        = string
  sensitive   = true
  default     = ""
}

variable "db_name" {
  description = "Name of the database to create"
  type        = string
  default     = "mydb"
}

variable "db_instance_class" {
  description = "RDS instance type"
  type        = string
  default     = "db.t3.micro"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access (REQUIRED when use_ssm = false; prefer a single /32)"
  type        = list(string)
  default     = []   # not required when use_ssm = true

  validation {
    condition     = var.use_ssm ? true : length(var.ssh_cidr_blocks) > 0
    error_message = "ssh_cidr_blocks must be provided and should be restricted (e.g. [\"1.2.3.4/32\"]) when use_ssm = false"
  }
}

variable "ssh_public_key" {
  description = "SSH public key (single-line, contents of <key>.pub). Do NOT commit private keys."
  type        = string
  default     = ""

  validation {
    condition     = var.use_ssm ? true : length(var.ssh_public_key) > 0
    error_message = "ssh_public_key is required (paste the public key string or use a non-tracked file) when use_ssm = false"
  }
}

variable "use_ssm" {
  description = "If true, enable AWS SSM Session Manager on the instance (recommended). If false, provision SSH key + security group rule."
  type        = bool
  default     = true
}

variable "region" {
  description = "AWS region for resources. Override with TF_VAR_region or set AWS_REGION in the environment."
  type        = string
  default     = "us-west-2" # sensible default; TF_VAR_region will override in CI/deploy
}

variable "iac_rlhf_tag_value" {
  description = "Value for the iac-rlhf-amazon tag (set to identify resources created by this IaC)"
  type        = string
  default     = "true"
}
```

## terraform.tfvars

```hcl
resource_suffix    = "dev"
db_username        = "dbadmin"
# db_password must be injected by the pipeline (as TF_VAR_db_password or via secret file) — DO NOT commit it here
# db_password        = "REPLACE_ME"
db_name            = "application_db"
db_instance_class  = "db.t3.micro"
ec2_instance_type  = "t3.micro"
use_ssm            = true   # recommended for CI-only pipelines (no SSH required)
# If you set use_ssm = false, you MUST provide:
# ssh_cidr_blocks = ["YOUR_PIPELINE_IP/32"]
# ssh_public_key  = "ssh-rsa AAAA... user@host"
```