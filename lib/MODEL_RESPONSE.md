# Terraform Infrastructure for Legacy Application Migration

This implementation provides a modular Terraform configuration for migrating a legacy on-premises application to AWS, with support for workspace management, resource imports, state backend configuration, and blue-green deployment patterns.

## File: backend.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "terraform-state-migration"
    key            = "legacy-migration/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"

    workspace_key_prefix = "workspaces"
  }
}
```

## File: provider.tf

```hcl
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project         = "LegacyMigration"
      ManagedBy       = "Terraform"
      Environment     = terraform.workspace
      MigrationPhase  = var.migration_phase
    }
  }
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to prevent conflicts"
  type        = string
}

variable "migration_phase" {
  description = "Current phase of migration (planning, transition, completed)"
  type        = string
  default     = "transition"
}

variable "vpc_id" {
  description = "ID of existing VPC (will be fetched via data source)"
  type        = string
  default     = "vpc-0a1b2c3d4e5f"
}

variable "subnet_ids" {
  description = "List of subnet IDs for multi-AZ deployment"
  type        = list(string)
  default     = ["subnet-1a2b3c4d", "subnet-5e6f7g8h"]
}

variable "availability_zones" {
  description = "Availability zones for resource deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.large"
}

variable "ebs_volume_size" {
  description = "Size of EBS volumes in GB"
  type        = number
  default     = 100
}

variable "on_premises_nfs_server" {
  description = "IP address of on-premises NFS server for DataSync"
  type        = string
  default     = "10.0.0.100"
}

variable "nfs_mount_path" {
  description = "Mount path for NFS share"
  type        = string
  default     = "/data/legacy-app"
}
```

## File: data.tf

```hcl
# Reference existing VPC
data "aws_vpc" "existing" {
  id = var.vpc_id
}

# Reference existing subnets
data "aws_subnet" "existing" {
  for_each = toset(var.subnet_ids)
  id       = each.value
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
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
```

## File: imports.tf

```hcl
# Import existing Security Group
# Run: terraform import aws_security_group.imported_sg sg-0123456789abcdef
resource "aws_security_group" "imported_sg" {
  name        = "legacy-app-sg-${var.environment_suffix}"
  description = "Imported security group for legacy application"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTP from VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
  }

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.existing.cidr_block]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "legacy-app-sg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    ImportedResource = "true"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Import existing S3 Bucket
# Run: terraform import aws_s3_bucket.imported_bucket legacy-app-data-bucket
resource "aws_s3_bucket" "imported_bucket" {
  bucket = "legacy-app-data-bucket-${var.environment_suffix}"

  tags = {
    Name            = "legacy-app-data-bucket-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    ImportedResource = "true"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "imported_bucket" {
  bucket = aws_s3_bucket.imported_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "imported_bucket" {
  bucket = aws_s3_bucket.imported_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Import existing IAM Role
# Run: terraform import aws_iam_role.imported_role LegacyAppRole
resource "aws_iam_role" "imported_role" {
  name = "LegacyAppRole-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name            = "LegacyAppRole-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    ImportedResource = "true"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_iam_role_policy_attachment" "imported_role_s3_access" {
  role       = aws_iam_role.imported_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

resource "aws_iam_instance_profile" "imported_role_profile" {
  name = "LegacyAppRole-profile-${var.environment_suffix}"
  role = aws_iam_role.imported_role.name

  tags = {
    Name            = "LegacyAppRole-profile-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}
```

## File: state-backend-resources.tf

```hcl
# S3 bucket for Terraform state (to be created before initializing backend)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "terraform-state-migration-${var.environment_suffix}"

  tags = {
    Name            = "terraform-state-migration-${var.environment_suffix}"
    Purpose         = "TerraformStateStorage"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "terraform-state-lock-${var.environment_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name            = "terraform-state-lock-${var.environment_suffix}"
    Purpose         = "TerraformStateLocking"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }

  lifecycle {
    prevent_destroy = true
  }
}
```

## File: compute.tf

```hcl
# EC2 instances across multiple availability zones using for_each
resource "aws_instance" "app_server" {
  for_each = toset(var.availability_zones)

  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type

  subnet_id              = element(var.subnet_ids, index(var.availability_zones, each.key))
  vpc_security_group_ids = [aws_security_group.imported_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.imported_role_profile.name

  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl enable httpd
              systemctl start httpd
              echo "Application server in ${terraform.workspace} environment" > /var/www/html/index.html
              EOF

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  tags = {
    Name            = "app-server-${each.key}-${var.environment_suffix}"
    AvailabilityZone = each.key
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

# EBS volumes for application data
resource "aws_ebs_volume" "app_data" {
  for_each = toset(var.availability_zones)

  availability_zone = each.key
  size              = var.ebs_volume_size
  type              = "gp3"
  encrypted         = true

  tags = {
    Name            = "app-data-volume-${each.key}-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

# Attach EBS volumes to EC2 instances
resource "aws_volume_attachment" "app_data" {
  for_each = toset(var.availability_zones)

  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.app_data[each.key].id
  instance_id = aws_instance.app_server[each.key].id
}
```

## File: datasync.tf

```hcl
# IAM role for DataSync S3 access
resource "aws_iam_role" "datasync_s3_access" {
  name = "datasync-s3-access-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "datasync.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name            = "datasync-s3-access-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

resource "aws_iam_role_policy" "datasync_s3_access" {
  name = "datasync-s3-access-policy"
  role = aws_iam_role.datasync_s3_access.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads"
        ]
        Resource = aws_s3_bucket.imported_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:DeleteObject",
          "s3:GetObject",
          "s3:ListMultipartUploadParts",
          "s3:PutObject",
          "s3:GetObjectTagging",
          "s3:PutObjectTagging"
        ]
        Resource = "${aws_s3_bucket.imported_bucket.arn}/*"
      }
    ]
  })
}

# DataSync location for S3
resource "aws_datasync_location_s3" "target" {
  s3_bucket_arn = aws_s3_bucket.imported_bucket.arn
  subdirectory  = "/migrated-data"

  s3_config {
    bucket_access_role_arn = aws_iam_role.datasync_s3_access.arn
  }

  tags = {
    Name            = "s3-target-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

# Note: DataSync agent and NFS location require manual setup
# Agent must be activated before creating the task
# This is a placeholder configuration showing the required structure
```

## File: alb.tf

```hcl
# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "alb-sg-${var.environment_suffix}"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.existing.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from Internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name            = "alb-sg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

# Application Load Balancer
resource "aws_lb" "app" {
  name               = "app-alb-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.subnet_ids

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name            = "app-alb-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}

# Target group for blue environment
resource "aws_lb_target_group" "blue" {
  name     = "blue-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name            = "blue-tg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    DeploymentColor = "blue"
  }
}

# Target group for green environment
resource "aws_lb_target_group" "green" {
  name     = "green-tg-${var.environment_suffix}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.existing.id

  health_check {
    enabled             = true
    healthy_threshold   = 3
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name            = "green-tg-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
    DeploymentColor = "green"
  }
}

# Register instances with blue target group (active)
resource "aws_lb_target_group_attachment" "blue" {
  for_each = aws_instance.app_server

  target_group_arn = aws_lb_target_group.blue.arn
  target_id        = each.value.id
  port             = 80
}

# HTTP listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }

  tags = {
    Name            = "http-listener-${var.environment_suffix}"
    Environment     = terraform.workspace
    MigrationPhase  = var.migration_phase
  }
}
```

## File: outputs.tf

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.app.arn
}

output "s3_bucket_arn" {
  description = "ARN of the imported S3 bucket for data storage"
  value       = aws_s3_bucket.imported_bucket.arn
}

output "s3_bucket_name" {
  description = "Name of the imported S3 bucket"
  value       = aws_s3_bucket.imported_bucket.id
}

output "datasync_s3_location_arn" {
  description = "ARN of the DataSync S3 location"
  value       = aws_datasync_location_s3.target.arn
}

output "instance_ids" {
  description = "Map of availability zones to EC2 instance IDs"
  value       = { for k, v in aws_instance.app_server : k => v.id }
}

output "instance_private_ips" {
  description = "Map of availability zones to private IP addresses"
  value       = { for k, v in aws_instance.app_server : k => v.private_ip }
}

output "blue_target_group_arn" {
  description = "ARN of the blue target group for blue-green deployments"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "ARN of the green target group for blue-green deployments"
  value       = aws_lb_target_group.green.arn
}

output "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state storage"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table" {
  description = "DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}
```

## File: terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and adjust values as needed

aws_region         = "us-east-1"
environment_suffix = "dev001"
migration_phase    = "transition"

vpc_id     = "vpc-0a1b2c3d4e5f"
subnet_ids = ["subnet-1a2b3c4d", "subnet-5e6f7g8h"]

availability_zones = ["us-east-1a", "us-east-1b"]

instance_type    = "t3.large"
ebs_volume_size  = 100

on_premises_nfs_server = "10.0.0.100"
nfs_mount_path         = "/data/legacy-app"
```

## Implementation Notes

### Key Features

1. **Workspace Management**: Separate `legacy` and `cloud` workspaces for managing both environments
2. **Resource Imports**: Configuration for importing Security Group, S3 bucket, and IAM Role
3. **State Backend**: S3 with DynamoDB locking for secure state management
4. **Multi-AZ Deployment**: EC2 instances and EBS volumes across 2 AZs using `for_each`
5. **DataSync Integration**: S3 location configured for data migration
6. **Lifecycle Protection**: Critical resources protected with `prevent_destroy = true`
7. **Blue-Green Support**: Two target groups for zero-downtime deployments
8. **Data Sources**: VPC and subnets referenced dynamically
9. **Comprehensive Tagging**: Environment and MigrationPhase tags on all resources
10. **Security Best Practices**: Encryption, IMDSv2, least-privilege IAM

### Environment Suffix Usage

All resource names include `var.environment_suffix`:
- S3 buckets: `legacy-app-data-bucket-${var.environment_suffix}`
- EC2 instances: `app-server-${each.key}-${var.environment_suffix}`
- Load balancer: `app-alb-${var.environment_suffix}`
- Target groups: `blue-tg-${var.environment_suffix}`, `green-tg-${var.environment_suffix}`

### Workspace Setup

1. Create workspaces: `terraform workspace new legacy` and `terraform workspace new cloud`
2. Switch workspaces: `terraform workspace select <workspace-name>`
3. Import existing resources in each workspace before applying

### Import Commands

Run these in the appropriate workspace:

```bash
terraform import aws_security_group.imported_sg sg-0123456789abcdef
terraform import aws_s3_bucket.imported_bucket legacy-app-data-bucket
terraform import aws_iam_role.imported_role LegacyAppRole
```

### Deployment Order

1. Create state backend resources first (comment out backend block initially)
2. Initialize backend: `terraform init -migrate-state`
3. Create workspaces
4. Import existing resources
5. Apply main configuration
6. Configure DataSync agent manually
7. Validate ALB health checks

