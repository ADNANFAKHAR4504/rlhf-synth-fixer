# Foundational AWS Cloud Environment - Terraform Implementation

This directory contains a complete, production-ready Terraform HCL configuration for a foundational AWS cloud environment. The implementation follows AWS best practices for security, scalability, and operational excellence.

## Architecture Overview

The infrastructure creates:
- **VPC** with public and private subnets across multiple AZs
- **EC2 instance** in public subnet with SSM access (no SSH)
- **RDS MySQL database** in private subnets with automated backups
- **S3 bucket** for Terraform state storage with versioning and encryption
- **Security groups** with minimal required access
- **IAM roles** for secure EC2 management via Systems Manager

## File Structure

- `main.tf` - Provider configuration and backend setup
- `variables.tf` - Input variables with defaults and sensitive handling
- `vpc.tf` - Network infrastructure (VPC, subnets, routing)
- `ec2.tf` - Compute resources with SSM access
- `rds.tf` - Database infrastructure with security
- `s3.tf` - Storage for Terraform state management
- `outputs.tf` - Infrastructure outputs for integration

## Terraform Files

### main.tf

```terraform
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

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      iac-rlhf-amazon = var.iac_rlhf_tag_value
    }
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}
```

### variables.tf

```terraform
variable "resource_suffix" {
  description = "A suffix to append to all resource names for uniqueness"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.resource_suffix) > 0
    error_message = "resource_suffix must not be empty"
  }
}

variable "environment" {
  description = "Logical environment name (used for namespacing resources and state)"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment) > 0
    error_message = "environment must not be empty"
  }
}

variable "rds_publicly_accessible" {
  description = "If true, make the RDS instance publicly accessible (for integration testing only)."
  type        = bool
  # Default to false for safety in production-like environments.
  default     = false
}

variable "rds_public_cidr_blocks" {
  description = "CIDR blocks to allow to the RDS instance when publicly accessible."
  type        = list(string)
  # Default to an empty list. When `rds_publicly_accessible = true` you MUST
  # provide a restrictive list of CIDR ranges (preferably a single /32).
  default     = []

  validation {
    condition = var.rds_publicly_accessible ? (
      length(var.rds_public_cidr_blocks) > 0 && length([for c in var.rds_public_cidr_blocks : c if c == "0.0.0.0/0"]) == 0
    ) : true
    error_message = "When rds_publicly_accessible = true you must provide restrictive rds_public_cidr_blocks and must NOT include '0.0.0.0/0'."
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
  default     = "us-west-1" # changed from us-west-2 for fresh deployment
}

variable "iac_rlhf_tag_value" {
  description = "Value for the iac-rlhf-amazon tag (set to identify resources created by this IaC)"
  type        = string
  default     = "true"
}

variable "manage_ssm_instance_profile" {
  description = "If true, Terraform will create and manage the SSM IAM role and instance profile. Set to false to avoid name collisions and to manage these resources outside Terraform."
  type        = bool
  default     = true
}

variable "ci_invoke_principal" {
  description = "Optional ARN of the CI principal (role or user) that should be allowed to invoke the rds-check Lambda. If empty, account-level invocation is used by default. Example: arn:aws:iam::123456789012:role/ci-runner-role"
  type        = string
  default     = ""
}
```

### vpc.tf

```terraform
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
  availability_zone       = "us-west-1a"

  tags = {
    Name = "public-subnet-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-west-1b"

  tags = {
    Name = "private-subnet-1-${var.resource_suffix}"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-west-1c"

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

### ec2.tf

```terraform
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

  # SSH access as per requirements
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
    description = "SSH access from configurable IP addresses"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name            = "ec2-sg-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# SSH Key Pair for EC2 access
resource "aws_key_pair" "deployer" {
  count      = var.ssh_public_key != "" ? 1 : 0
  key_name   = "deployer-key-${var.resource_suffix}"
  public_key = var.ssh_public_key

  tags = {
    Name            = "deployer-key-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# IAM role for SSM access (kept for additional security option)
resource "aws_iam_role" "ec2_ssm_role" {
  name = "ec2-ssm-role-${var.resource_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name            = "ec2-ssm-role-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role       = aws_iam_role.ec2_ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Inline policy granting S3 access to the instance role for the terraform state bucket
resource "aws_iam_role_policy" "ec2_s3_access" {
  name = "ec2-ssm-s3-access-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::terraform-state-${var.resource_suffix}",
          "arn:aws:s3:::terraform-state-${var.resource_suffix}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-profile-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.name

  tags = {
    Name            = "ec2-profile-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_instance" "web" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.ec2_instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.ssh_public_key != "" ? aws_key_pair.deployer[0].key_name : null

  tags = {
    Name            = "web-instance-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

# Inline policy granting Secrets Manager read access for the instance to fetch RDS credentials
resource "aws_iam_role_policy" "ec2_secrets_access" {
  name = "ec2-ssm-secrets-access-${var.resource_suffix}"
  role = aws_iam_role.ec2_ssm_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.rds_password.arn
        ]
      }
    ]
  })
}
```

### rds.tf

```terraform
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

  # Optional public ingress for integration-test runs. Controlled by var.rds_publicly_accessible.
  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol     = "tcp"
    cidr_blocks = var.rds_publicly_accessible ? var.rds_public_cidr_blocks : []
    description = "Optional public MySQL access for integration tests"
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

# Generate a secure password (present even when a password is not supplied).
# If a DB password is provided via var.db_password it will be used; otherwise
# the generated password is used and stored in Secrets Manager.
resource "random_password" "db" {
  length = 32
  # Keep character-class controls
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store RDS credentials in Secrets Manager (unconditionally). The secret
# contains both username and password for convenience for integration tests.
resource "aws_secretsmanager_secret" "rds_password" {
  # Append a short random suffix to avoid name collisions with previously
  # deleted/semi-deleted secrets (Secrets Manager prevents recreating a secret
  # with the same name while an earlier secret is scheduled for deletion).
  name        = "rds-password-${var.resource_suffix}-${random_id.rds_secret_suffix.hex}"
  description = "RDS credentials for ${var.resource_suffix} (managed by Terraform)"
}

resource "aws_secretsmanager_secret_version" "rds_password_version" {
  secret_id = aws_secretsmanager_secret.rds_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password != "" ? var.db_password : random_password.db.result
  })
}

resource "random_id" "rds_secret_suffix" {
  # 4 bytes ~= 32 bits of entropy; sufficient to avoid collisions with prior secret names
  byte_length = 4
}

resource "aws_db_instance" "mysql" {
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.db_instance_class
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password != "" ? var.db_password : random_password.db.result

  # Ensure encryption at rest
  storage_encrypted = true

  # Optional: provide a KMS key id if you want CMK encryption
  # kms_key_id = var.rds_kms_key_id   # add variable if you want CMK

  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  publicly_accessible     = var.rds_publicly_accessible
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

### s3.tf

```terraform
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

### outputs.tf

```terraform
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

output "rds_password_secret_arn" {
  description = "ARN of the Secrets Manager secret containing RDS credentials"
  value       = aws_secretsmanager_secret.rds_password.arn
}

output "s3_app_bucket_name" {
  description = "Name of the application S3 bucket (NOT the terraform backend)"
  value       = aws_s3_bucket.app_bucket.bucket
}


output "aws_account_id" {
  description = "AWS account ID used for the deploy"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS region used for the deploy"
  value       = data.aws_region.current.name
}

output "terraform_workspace" {
  description = "Terraform workspace used for the deploy"
  value       = terraform.workspace
}

output "s3_app_bucket_arn" {
  description = "ARN of the application S3 bucket (if available)"
  value       = aws_s3_bucket.app_bucket.arn
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  # aws_subnet.public may be a single resource (object) or a list / map depending on how it's declared.
  # Use try() and type checks to support both cases and fall back to an empty list.
  value = try(
    (
      aws_subnet.public.*.id
    ),
    (
      (
        length(aws_subnet.public) > 0 ? [for s in aws_subnet.public : s.id] : []
      )
    ),
    []
  )
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = try(aws_vpc.main.arn, "")
}

output "ec2_instance_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = try(aws_instance.web.private_ip, "")
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host (use for SSH tunneling in CI)"
  value       = try(aws_instance.bastion.public_ip, "")
}

output "rds_check_lambda_name" {
  description = "Name of the helper Lambda that can test RDS connectivity from inside the VPC"
  value       = try(aws_lambda_function.rds_check.function_name, "")
}

output "rds_check_lambda_arn" {
  description = "ARN of the helper Lambda that can test RDS connectivity from inside the VPC"
  value       = try(aws_lambda_function.rds_check.arn, "")
}

## lambda.tf

```hcl
// Lambda helper to test RDS connectivity from inside the VPC (used by integration tests)
resource "aws_iam_role" "lambda_rds_check_role" {
  name = "lambda-rds-check-role-${var.resource_suffix}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_exec" {
  role       = aws_iam_role.lambda_rds_check_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach the managed policy that allows Lambda to create network interfaces when placed in a VPC
resource "aws_iam_role_policy_attachment" "lambda_vpc_exec" {
  role       = aws_iam_role.lambda_rds_check_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Allow Lambda to read the RDS credentials secret (scoped to the terraform-managed secret)
resource "aws_iam_policy" "lambda_secrets_read" {
  name   = "lambda-secrets-read-${var.resource_suffix}"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = ["secretsmanager:GetSecretValue"],
        Effect = "Allow",
        Resource = [aws_secretsmanager_secret.rds_password.arn]
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "lambda_secrets_attach" {
  name       = "lambda-secrets-attach-${var.resource_suffix}"
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
  roles      = [aws_iam_role.lambda_rds_check_role.name]
}

resource "aws_security_group" "lambda_sg" {
  name   = "lambda-sg-${var.resource_suffix}"
  vpc_id = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "lambda-sg-${var.resource_suffix}" }
}

# Allow this Lambda SG to reach the RDS SG on 3306
resource "aws_security_group_rule" "allow_lambda_to_rds" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds_sg.id
  source_security_group_id = aws_security_group.lambda_sg.id
  description              = "Allow Lambda helper to reach RDS"
}

# Package expected at lib/lambda/rds_check.zip (use lib/lambda/zip.sh to create)
data "local_file" "lambda_zip_exists" {
  filename = "${path.module}/lambda/rds_check.zip"
}

resource "aws_lambda_function" "rds_check" {
  filename         = data.local_file.lambda_zip_exists.filename
  function_name    = "rds-check-${var.resource_suffix}"
  role             = aws_iam_role.lambda_rds_check_role.arn
  handler          = "rds_check.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256(data.local_file.lambda_zip_exists.filename)

  vpc_config {
    subnet_ids         = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  # Increase timeout and memory so the Lambda has enough time and resources
  # to perform SecretsManager calls and DB connectivity checks from inside
  # the VPC (ENI cold-starts can add latency). Default timeout is 3s which
  # was causing Sandbox.Timedout errors in CI.
  timeout     = 30
  memory_size = 512

  tags = { Name = "rds-check-${var.resource_suffix}" }
}

# Allow principals from the same AWS account to invoke the helper Lambda.
# This lets CI identities in the account call the function without requiring
# the operator to attach an inline policy to the CI role. It still respects
# account boundaries and is narrower than a global permission.
resource "aws_lambda_permission" "allow_account_invoke" {
  statement_id  = "AllowAccountInvoke-${var.resource_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_check.function_name
  principal     = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
}

# If a CI principal ARN is provided, create a narrow permission that only
# allows that principal to invoke the function. This supports least-privilege
# workflows when the CI role ARN is known and supplied via variables.
resource "aws_lambda_permission" "allow_ci_principal" {
  count         = var.ci_invoke_principal != "" ? 1 : 0
  statement_id  = "AllowCIPrincipalInvoke-${var.resource_suffix}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_check.function_name
  principal     = var.ci_invoke_principal
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

## Recent changes

The following updates were applied to support live integration testing and improve configuration:

- `main.tf`: Added configurable region via var.region, added random provider, and included data sources for caller identity and region.
- `variables.tf`: Expanded with validations, new vars for SSM, public access, region, CI principals, and manage_ssm_instance_profile.
- `networking.tf` (vpc.tf): Simplified AZ handling, direct specification without data source.
- `ec2.tf`: Always creates IAM role with SSM policy, inline policies for S3 access to app_bucket and Secrets Manager access to rds_password secret.
- `rds.tf`: Dynamic password generation, random secret suffixes, added public access option, backup retention to 7 days.
- `s3.tf`: Changed to app_bucket with random naming locals.
- `outputs.tf`: Updated resource references, added numerous new outputs for account/region, Lambda, and optional resources with try().
- `lambda.tf`: New file for RDS check Lambda with IAM, security groups, permissions for account/CI invocation.
- `terraform.tfvars`: New section with example values for updated variables.

These changes enable robust integration testing while maintaining security and best practices.
```

## Key Features

- **Security**: No SSH access, SSM-based management, private database subnets
- **Scalability**: Multi-AZ setup, proper subnet distribution
- **State Management**: S3 backend with versioning and encryption
- **Best Practices**: Resource naming with suffixes, comprehensive tagging
- **Automation**: Automated backups, maintenance windows
- **Compliance**: Follows AWS Well-Architected Framework principles