# AWS Region Migration - Terraform Implementation

## Implementation Overview

This implementation provides a complete Terraform HCL solution for migrating an AWS application from us-west-1 to us-west-2. The solution includes infrastructure code, state migration procedures, resource ID mapping, and operational runbooks.

## Architecture Approach

The migration strategy uses Terraform workspaces to manage separate state files for source and target regions. This allows for:

1. Parallel infrastructure definitions for both regions
2. Safe state migration without data loss
3. Gradual cutover with rollback capability
4. Resource ID mapping tracking

## Key Design Decisions

1. **Workspace-Based Organization**: Use Terraform workspaces (us-west-1 and us-west-2) to maintain separate state files while using the same configuration code.

2. **Parameterized Configuration**: All region-specific values are parameterized through variables, making it easy to switch between regions.

3. **Resource Naming**: All resources include an environment suffix variable for uniqueness and to support multiple environments.

4. **No Retention Policies**: All resources are configured without deletion protection or retain policies to ensure clean teardown capability.

5. **Modular Structure**: Infrastructure is organized logically with providers, networking, compute, and storage resources clearly separated.

## Files Generated

1. **main.tf** - Core infrastructure definitions including VPC, subnets, security groups, EC2 instances, and RDS databases
2. **variables.tf** - All configurable parameters with descriptions and defaults
3. **backend.tf** - S3 backend configuration for state management
4. **state-migration.md** - Step-by-step CLI commands for migration
5. **id-mapping.csv** - Sample resource ID mapping template
6. **runbook.md** - Complete operational runbook with cutover and rollback procedures

## Resource Coverage

The implementation includes:
- VPC with public and private subnets across availability zones
- Security groups for web, application, and database tiers
- EC2 instances for application hosting
- RDS database instances (non-serverless for simplicity)
- S3 buckets for storage
- IAM roles and policies

## Migration Strategy

The migration follows a blue-green approach:
1. Create infrastructure in target region (us-west-2)
2. Replicate data from source to target
3. Validate target environment
4. DNS cutover with low TTL
5. Monitor and verify
6. Decommission source region resources

## Code Structure

All code is written in Terraform HCL and follows these conventions:
- Snake_case for resource names
- Environment suffix included in all resource identifiers
- Variables for all configurable values
- Comments explaining complex logic
- AWS provider version 5.x compatibility

---

## File: lib/main.tf

```hcl
# AWS Region Migration - Main Infrastructure Configuration
# Platform: Terraform with HCL
# This configuration supports infrastructure in both us-west-1 and us-west-2

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider configuration - region is parameterized
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment     = var.environment
      ManagedBy       = "Terraform"
      Project         = "RegionMigration"
      EnvironmentSuffix = var.environment_suffix
    }
  }
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier = "Private"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "nat-eip-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateway (optional, for cost optimization)
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "nat-gateway-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[0].id
    }
  }

  tags = {
    Name = "private-rt-${var.environment_suffix}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# Security Group - Web Tier
resource "aws_security_group" "web" {
  name_prefix = "web-sg-${var.environment_suffix}-"
  description = "Security group for web tier"
  vpc_id      = aws_vpc.main.id

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
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - Application Tier
resource "aws_security_group" "app" {
  name_prefix = "app-sg-${var.environment_suffix}-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Application port from web tier"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "app-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group - Database Tier
resource "aws_security_group" "database" {
  name_prefix = "db-sg-${var.environment_suffix}-"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "db-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for EC2 Instances
resource "aws_iam_role" "ec2_role" {
  name_prefix = "ec2-role-${var.environment_suffix}-"

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
    Name = "ec2-role-${var.environment_suffix}"
  }
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name_prefix = "ec2-profile-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.name

  tags = {
    Name = "ec2-profile-${var.environment_suffix}"
  }
}

# IAM Policy for S3 Access
resource "aws_iam_role_policy" "s3_access" {
  name_prefix = "s3-access-${var.environment_suffix}-"
  role        = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.app_data.arn,
          "${aws_s3_bucket.app_data.arn}/*"
        ]
      }
    ]
  })
}

# EC2 Instances - Web Tier
resource "aws_instance" "web" {
  count                  = var.web_instance_count
  ami                    = var.web_ami_id
  instance_type          = var.web_instance_type
  subnet_id              = aws_subnet.public[count.index % length(aws_subnet.public)].id
  vpc_security_group_ids = [aws_security_group.web.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  user_data = <<-EOF
              #!/bin/bash
              echo "Web server instance in ${var.aws_region}" > /var/www/html/index.html
              EOF

  tags = {
    Name = "web-server-${count.index + 1}-${var.environment_suffix}"
    Tier = "Web"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true

    tags = {
      Name = "web-server-root-${count.index + 1}-${var.environment_suffix}"
    }
  }
}

# EC2 Instances - Application Tier
resource "aws_instance" "app" {
  count                  = var.app_instance_count
  ami                    = var.app_ami_id
  instance_type          = var.app_instance_type
  subnet_id              = aws_subnet.private[count.index % length(aws_subnet.private)].id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  tags = {
    Name = "app-server-${count.index + 1}-${var.environment_suffix}"
    Tier = "Application"
  }

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true

    tags = {
      Name = "app-server-root-${count.index + 1}-${var.environment_suffix}"
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name_prefix = "db-subnet-group-${var.environment_suffix}-"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "db-subnet-group-${var.environment_suffix}"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier_prefix      = "db-${var.environment_suffix}-"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = var.db_instance_class
  allocated_storage      = 20
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  skip_final_snapshot    = true
  deletion_protection    = false
  backup_retention_period = 7

  tags = {
    Name = "database-${var.environment_suffix}"
  }
}

# S3 Bucket for Application Data
resource "aws_s3_bucket" "app_data" {
  bucket_prefix = "app-data-${var.environment_suffix}-"

  tags = {
    Name = "app-data-${var.environment_suffix}"
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "web_instance_ids" {
  description = "Web server instance IDs"
  value       = aws_instance.web[*].id
}

output "app_instance_ids" {
  description = "Application server instance IDs"
  value       = aws_instance.app[*].id
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.app_data.id
}

output "web_security_group_id" {
  description = "Web tier security group ID"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "Application tier security group ID"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Database tier security group ID"
  value       = aws_security_group.database.id
}
```

## File: lib/variables.tf

```hcl
# AWS Region Migration - Variables Configuration
# Platform: Terraform with HCL

# Region Configuration
variable "aws_region" {
  description = "AWS region for infrastructure deployment (us-west-1 for source, us-west-2 for target)"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming to ensure uniqueness across environments"
  type        = string
}

# Network Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones for the region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnet internet access (set to false to reduce costs)"
  type        = bool
  default     = false
}

# Web Tier Configuration
variable "web_instance_count" {
  description = "Number of web tier EC2 instances"
  type        = number
  default     = 2
}

variable "web_instance_type" {
  description = "EC2 instance type for web tier"
  type        = string
  default     = "t3.small"
}

variable "web_ami_id" {
  description = "AMI ID for web tier instances (must be region-specific)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

# Application Tier Configuration
variable "app_instance_count" {
  description = "Number of application tier EC2 instances"
  type        = number
  default     = 2
}

variable "app_instance_type" {
  description = "EC2 instance type for application tier"
  type        = string
  default     = "t3.medium"
}

variable "app_ami_id" {
  description = "AMI ID for application tier instances (must be region-specific)"
  type        = string
  default     = "ami-0c55b159cbfafe1f0"
}

# Database Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

## File: lib/backend.tf

```hcl
# AWS Region Migration - Backend Configuration
# Platform: Terraform with HCL
# This configuration uses S3 for state storage with DynamoDB for state locking

terraform {
  backend "s3" {
    # Replace these placeholder values with your actual S3 bucket and DynamoDB table
    bucket         = "terraform-state-bucket-REPLACE_ME"
    key            = "region-migration/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terraform-state-lock-REPLACE_ME"

    # Workspace configuration allows separate state files per region
    # Workspace names: us-west-1 (source) and us-west-2 (target)
    workspace_key_prefix = "workspaces"
  }
}

# Backend Configuration Notes:
#
# 1. Create S3 bucket for state storage:
#    aws s3api create-bucket \
#      --bucket terraform-state-bucket-YOUR-SUFFIX \
#      --region us-west-2 \
#      --create-bucket-configuration LocationConstraint=us-west-2
#
# 2. Enable versioning on the bucket:
#    aws s3api put-bucket-versioning \
#      --bucket terraform-state-bucket-YOUR-SUFFIX \
#      --versioning-configuration Status=Enabled
#
# 3. Enable encryption:
#    aws s3api put-bucket-encryption \
#      --bucket terraform-state-bucket-YOUR-SUFFIX \
#      --server-side-encryption-configuration \
#      '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
#
# 4. Create DynamoDB table for state locking:
#    aws dynamodb create-table \
#      --table-name terraform-state-lock-YOUR-SUFFIX \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST \
#      --region us-west-2
#
# 5. Replace REPLACE_ME values in this file with your actual resource names
```

## File: lib/state-migration.md

```markdown
# Terraform State Migration Guide

## Overview

This guide provides step-by-step instructions for migrating AWS infrastructure from us-west-1 to us-west-2 using Terraform workspaces and state management.

## Prerequisites

- Terraform 1.0+ installed
- AWS CLI configured with appropriate credentials
- Access to both us-west-1 (source) and us-west-2 (target) regions
- S3 bucket and DynamoDB table for backend created
- backend.tf configured with actual bucket and table names

## Migration Strategy

The migration uses Terraform workspaces to maintain separate state files for each region. This allows:
- Independent management of source and target infrastructure
- Safe state operations without affecting live resources
- Easy rollback capability
- Resource ID tracking and mapping

## Step 1: Initialize Terraform Backend

```bash
# Initialize Terraform with the S3 backend
terraform init

# Verify backend configuration
terraform version
terraform workspace list
```

## Step 2: Create Workspaces for Each Region

```bash
# Create workspace for source region (us-west-1)
terraform workspace new us-west-1

# Create workspace for target region (us-west-2)
terraform workspace new us-west-2

# List all workspaces to verify
terraform workspace list
```

## Step 3: Import Existing Resources (Source Region)

If you have existing infrastructure in us-west-1 that's not yet managed by Terraform:

```bash
# Switch to us-west-1 workspace
terraform workspace select us-west-1

# Import VPC
terraform import aws_vpc.main vpc-XXXXXXXX

# Import subnets
terraform import 'aws_subnet.public[0]' subnet-XXXXXXXX
terraform import 'aws_subnet.public[1]' subnet-YYYYYYYY
terraform import 'aws_subnet.private[0]' subnet-ZZZZZZZZ
terraform import 'aws_subnet.private[1]' subnet-AAAAAAAA

# Import Internet Gateway
terraform import aws_internet_gateway.main igw-XXXXXXXX

# Import route tables
terraform import aws_route_table.public rtb-XXXXXXXX
terraform import aws_route_table.private rtb-YYYYYYYY

# Import security groups
terraform import aws_security_group.web sg-XXXXXXXX
terraform import aws_security_group.app sg-YYYYYYYY
terraform import aws_security_group.database sg-ZZZZZZZZ

# Import EC2 instances
terraform import 'aws_instance.web[0]' i-XXXXXXXX
terraform import 'aws_instance.web[1]' i-YYYYYYYY
terraform import 'aws_instance.app[0]' i-ZZZZZZZZ
terraform import 'aws_instance.app[1]' i-AAAAAAAA

# Import RDS instance
terraform import aws_db_instance.main db-identifier

# Import S3 bucket
terraform import aws_s3_bucket.app_data bucket-name

# Import IAM resources
terraform import aws_iam_role.ec2_role role-name
terraform import aws_iam_instance_profile.ec2_profile profile-name
```

## Step 4: Verify Source Region State

```bash
# Ensure workspace is us-west-1
terraform workspace select us-west-1

# Validate configuration
terraform validate

# Check current state
terraform state list

# Create plan to verify no changes (state matches reality)
terraform plan

# Expected output: "No changes. Infrastructure is up-to-date."
```

## Step 5: Backup Source State

```bash
# Pull current state to local file
terraform state pull > state-us-west-1-backup.json

# Store backup securely
aws s3 cp state-us-west-1-backup.json s3://your-backup-bucket/terraform-states/us-west-1-$(date +%Y%m%d-%H%M%S).json
```

## Step 6: Deploy Target Region Infrastructure

```bash
# Switch to target region workspace
terraform workspace select us-west-2

# Create terraform.tfvars for us-west-2
cat > terraform.tfvars <<EOF
aws_region = "us-west-2"
environment = "prod"
environment_suffix = "prod-usw2"
availability_zones = ["us-west-2a", "us-west-2b"]
vpc_cidr = "10.0.0.0/16"
web_instance_count = 2
app_instance_count = 2
db_instance_class = "db.t3.small"
db_name = "appdb"
db_username = "dbadmin"
db_password = "${DB_PASSWORD}"
enable_nat_gateway = false
EOF

# Validate configuration
terraform validate

# Review plan
terraform plan -out=us-west-2.tfplan

# Apply configuration to create resources in us-west-2
terraform apply us-west-2.tfplan

# Save outputs
terraform output > us-west-2-outputs.txt
```

## Step 7: Verify Target Region Deployment

```bash
# Check state of target region
terraform state list

# Verify all resources created
terraform show

# Test connectivity to new resources
# (Application-specific testing should be performed here)
```

## Step 8: Resource ID Mapping

After deployment, document the mapping between old and new resource IDs:

```bash
# Extract resource IDs from both regions
terraform workspace select us-west-1
terraform state show aws_vpc.main | grep "^id" > us-west-1-ids.txt

terraform workspace select us-west-2
terraform state show aws_vpc.main | grep "^id" > us-west-2-ids.txt

# Compare and update id-mapping.csv with actual values
```

## Step 9: State Verification Commands

```bash
# Verify state integrity for us-west-1
terraform workspace select us-west-1
terraform state list
terraform plan

# Verify state integrity for us-west-2
terraform workspace select us-west-2
terraform state list
terraform plan

# Check for drift
terraform refresh
terraform plan
```

## Step 10: State Migration Validation

```bash
# Validate workspace separation
terraform workspace list
# Should show: default, us-west-1, us-west-2

# Verify backend storage
aws s3 ls s3://terraform-state-bucket-YOUR-SUFFIX/workspaces/ --recursive

# Check state lock table
aws dynamodb scan --table-name terraform-state-lock-YOUR-SUFFIX --region us-west-2
```

## Rollback Procedures

If issues occur during migration:

### Rollback Step 1: Restore from Backup

```bash
# Switch to affected workspace
terraform workspace select us-west-2

# Restore state from backup
terraform state push state-us-west-2-backup.json
```

### Rollback Step 2: Destroy Target Resources

```bash
# If new region has issues, destroy it
terraform workspace select us-west-2
terraform destroy -auto-approve

# Switch back to source region
terraform workspace select us-west-1
```

### Rollback Step 3: Verify Source Region

```bash
# Ensure source region is still operational
terraform workspace select us-west-1
terraform plan
# Should show no changes
```

## Common Issues and Solutions

### Issue: Import command fails with "resource already managed"
**Solution**: Check if resource is already in state with `terraform state list`

### Issue: Plan shows unexpected changes after import
**Solution**: Adjust configuration to match actual resource attributes

### Issue: State lock error
**Solution**: Force unlock with `terraform force-unlock LOCK_ID`

### Issue: Backend initialization fails
**Solution**: Verify S3 bucket and DynamoDB table exist and are accessible

## State Management Best Practices

1. Always backup state before major operations
2. Use workspaces to isolate environments
3. Enable versioning on S3 backend bucket
4. Regularly run `terraform plan` to check for drift
5. Document all manual changes to infrastructure
6. Keep state files secure (they may contain sensitive data)
7. Use state locking to prevent concurrent modifications

## Next Steps

After successful state migration:
1. Proceed with data migration (see runbook.md)
2. Configure DNS cutover (see runbook.md)
3. Monitor both regions during transition
4. Update documentation with actual resource IDs
5. Decommission source region after validation period
```

## File: lib/id-mapping.csv

```csv
resource,address,old_id,new_id,notes
vpc,aws_vpc.main,vpc-0a1b2c3d4e5f6g7h8,vpc-9i8h7g6f5e4d3c2b1,Main VPC migrated from us-west-1 to us-west-2
subnet,aws_subnet.public[0],subnet-0a1b2c3d,subnet-9i8h7g6f,Public subnet 1 in AZ a
subnet,aws_subnet.public[1],subnet-4e5f6g7h,subnet-5e4d3c2b,Public subnet 2 in AZ b
subnet,aws_subnet.private[0],subnet-0x1y2z3a,subnet-9x8y7z6a,Private subnet 1 in AZ a
subnet,aws_subnet.private[1],subnet-4b5c6d7e,subnet-5b4c3d2e,Private subnet 2 in AZ b
internet_gateway,aws_internet_gateway.main,igw-0a1b2c3d,igw-9i8h7g6f,Internet gateway for VPC
nat_gateway,aws_nat_gateway.main[0],nat-0a1b2c3d4e5f6g7h,nat-9i8h7g6f5e4d3c2b,NAT gateway in public subnet (if enabled)
route_table,aws_route_table.public,rtb-0a1b2c3d,rtb-9i8h7g6f,Public route table
route_table,aws_route_table.private,rtb-4e5f6g7h,rtb-5e4d3c2b,Private route table
security_group,aws_security_group.web,sg-0a1b2c3d4e5f6g7h,sg-9i8h7g6f5e4d3c2b,Web tier security group
security_group,aws_security_group.app,sg-0x1y2z3a4b5c6d7e,sg-9x8y7z6a5b4c3d2e,Application tier security group
security_group,aws_security_group.database,sg-0p1q2r3s4t5u6v7w,sg-9p8q7r6s5t4u3v2w,Database tier security group
ec2_instance,aws_instance.web[0],i-0a1b2c3d4e5f6g7h,i-9i8h7g6f5e4d3c2b,Web server instance 1
ec2_instance,aws_instance.web[1],i-0x1y2z3a4b5c6d7e,i-9x8y7z6a5b4c3d2e,Web server instance 2
ec2_instance,aws_instance.app[0],i-0p1q2r3s4t5u6v7w,i-9p8q7r6s5t4u3v2w,Application server instance 1
ec2_instance,aws_instance.app[1],i-0m1n2o3p4q5r6s7t,i-9m8n7o6p5q4r3s2t,Application server instance 2
rds_instance,aws_db_instance.main,db-instance-usw1,db-instance-usw2,PostgreSQL RDS instance
db_subnet_group,aws_db_subnet_group.main,db-subnet-group-usw1,db-subnet-group-usw2,RDS subnet group
s3_bucket,aws_s3_bucket.app_data,app-data-prod-usw1-a1b2c3d4,app-data-prod-usw2-e5f6g7h8,Application data bucket
iam_role,aws_iam_role.ec2_role,ec2-role-prod-usw1,ec2-role-prod-usw2,IAM role for EC2 instances
iam_instance_profile,aws_iam_instance_profile.ec2_profile,ec2-profile-prod-usw1,ec2-profile-prod-usw2,Instance profile for EC2
eip,aws_eip.nat[0],eipalloc-0a1b2c3d4e5f6g7h,eipalloc-9i8h7g6f5e4d3c2b,Elastic IP for NAT gateway (if enabled)
```

## File: lib/runbook.md

```markdown
# AWS Region Migration Runbook

## Executive Summary

This runbook provides detailed procedures for migrating AWS infrastructure from us-west-1 to us-west-2 with zero data loss and minimal downtime. The migration follows a blue-green deployment strategy.

## Migration Team Roles

- **Migration Lead**: Overall coordination and go/no-go decisions
- **Infrastructure Engineer**: Terraform execution and resource provisioning
- **Database Administrator**: Data replication and validation
- **Application Engineer**: Application deployment and testing
- **Network Engineer**: DNS cutover and traffic management
- **Security Engineer**: Security validation and compliance checks

## Pre-Migration Checklist

### 1 Week Before Migration

- [ ] Review and approve migration plan with stakeholders
- [ ] Create S3 backend bucket and DynamoDB table for Terraform state
- [ ] Configure backend.tf with actual resource names
- [ ] Set up monitoring and alerting for both regions
- [ ] Create rollback procedures and test them
- [ ] Schedule maintenance window with stakeholders
- [ ] Prepare communication templates for status updates

### 3 Days Before Migration

- [ ] Verify AWS credentials and permissions for both regions
- [ ] Test Terraform configuration in non-production environment
- [ ] Backup all critical data from source region
- [ ] Document current state of all resources
- [ ] Create AMIs of all EC2 instances in us-west-1
- [ ] Export RDS snapshot for data migration
- [ ] Verify S3 bucket replication is configured
- [ ] Test application failover procedures

### 1 Day Before Migration

- [ ] Reduce DNS TTL to 300 seconds (5 minutes)
- [ ] Notify users of upcoming maintenance window
- [ ] Verify backup integrity
- [ ] Confirm team availability during migration window
- [ ] Review rollback criteria and procedures
- [ ] Test communication channels
- [ ] Prepare monitoring dashboards for both regions

### Migration Day (Morning of)

- [ ] Final backup of all data in source region
- [ ] Verify all team members are available
- [ ] Set up war room (physical or virtual)
- [ ] Configure logging for all migration activities
- [ ] Verify rollback resources are ready

## Migration Execution Timeline

### Phase 1: Infrastructure Provisioning (T+0 to T+2 hours)

**T+0: Maintenance Window Begins**

```bash
# Send notification
echo "Migration starting at $(date)"

# Initialize Terraform
cd /path/to/terraform/config
terraform init

# Create workspaces
terraform workspace new us-west-1
terraform workspace new us-west-2
```

**T+0:15: Import Source Infrastructure**

```bash
# Switch to us-west-1 workspace
terraform workspace select us-west-1

# Import all existing resources (see state-migration.md for complete list)
# Example:
terraform import aws_vpc.main vpc-XXXXXXXX

# Verify import
terraform plan
# Should show no changes
```

**T+0:30: Deploy Target Infrastructure**

```bash
# Switch to us-west-2 workspace
terraform workspace select us-west-2

# Set variables
export TF_VAR_environment_suffix="prod-usw2"
export TF_VAR_aws_region="us-west-2"
export TF_VAR_db_password="SECURE_PASSWORD"

# Plan deployment
terraform plan -out=us-west-2.tfplan

# Review plan carefully
terraform show us-west-2.tfplan

# Apply with approval
terraform apply us-west-2.tfplan
```

**T+1:00: Verify Infrastructure Creation**

```bash
# Check all resources created
terraform state list

# Verify outputs
terraform output

# Test network connectivity
# SSH to instances and verify they can reach each other

# Verify security groups
aws ec2 describe-security-groups --region us-west-2 --filters "Name=tag:EnvironmentSuffix,Values=prod-usw2"
```

**T+1:30: Update ID Mapping**

```bash
# Document all resource IDs
terraform workspace select us-west-1
terraform state list > us-west-1-resources.txt
terraform show > us-west-1-state.txt

terraform workspace select us-west-2
terraform state list > us-west-2-resources.txt
terraform show > us-west-2-state.txt

# Update id-mapping.csv with actual values
```

### Phase 2: Data Migration (T+2 to T+4 hours)

**T+2:00: Database Migration**

```bash
# Create final snapshot in us-west-1
aws rds create-db-snapshot \
  --db-instance-identifier db-prod-usw1 \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-1

# Wait for snapshot to complete
aws rds wait db-snapshot-completed \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-1

# Copy snapshot to us-west-2
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-west-1:ACCOUNT:snapshot:migration-final-snapshot-$(date +%Y%m%d) \
  --target-db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-2

# Restore snapshot to new RDS instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier db-prod-usw2 \
  --db-snapshot-identifier migration-final-snapshot-$(date +%Y%m%d) \
  --region us-west-2

# Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier db-prod-usw2 \
  --region us-west-2
```

**T+2:30: S3 Data Synchronization**

```bash
# Sync S3 data from us-west-1 to us-west-2
aws s3 sync \
  s3://app-data-prod-usw1-SUFFIX \
  s3://app-data-prod-usw2-SUFFIX \
  --source-region us-west-1 \
  --region us-west-2

# Verify sync
aws s3 ls s3://app-data-prod-usw2-SUFFIX --recursive | wc -l
```

**T+3:00: Application Deployment**

```bash
# Deploy application to new EC2 instances
# Use configuration management tool (Ansible, Chef, etc.)
# or run deployment scripts

# Example with Ansible
ansible-playbook -i inventory/us-west-2 deploy-app.yml

# Verify application is running
curl http://INSTANCE-IP:8080/health
```

**T+3:30: Data Validation**

```bash
# Verify database data integrity
# Run application-specific validation queries

# Verify S3 object count matches
SOURCE_COUNT=$(aws s3 ls s3://app-data-prod-usw1-SUFFIX --recursive | wc -l)
TARGET_COUNT=$(aws s3 ls s3://app-data-prod-usw2-SUFFIX --recursive | wc -l)

if [ "$SOURCE_COUNT" -eq "$TARGET_COUNT" ]; then
  echo "S3 data validation: PASSED"
else
  echo "S3 data validation: FAILED - counts do not match"
fi
```

### Phase 3: Application Testing (T+4 to T+5 hours)

**T+4:00: Smoke Tests**

- [ ] Verify application health endpoints respond
- [ ] Test database connectivity
- [ ] Verify S3 read/write operations
- [ ] Check security group rules
- [ ] Test internal service communication
- [ ] Verify logging and monitoring

**T+4:30: Integration Tests**

- [ ] Run automated test suite against us-west-2 environment
- [ ] Perform manual testing of critical user journeys
- [ ] Verify external integrations work correctly
- [ ] Test authentication and authorization
- [ ] Validate data consistency

### Phase 4: DNS Cutover (T+5 to T+5:30)

**T+5:00: DNS Configuration**

```bash
# Update Route53 records to point to us-west-2
# Example: Update A record for application
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "NEW_IP_ADDRESS"}]
      }
    }]
  }'

# Verify DNS propagation
dig app.example.com +short

# Monitor DNS queries
watch -n 5 'dig app.example.com +short'
```

**T+5:10: Traffic Monitoring**

- [ ] Monitor application logs in us-west-2
- [ ] Verify traffic is being received
- [ ] Check error rates
- [ ] Monitor response times
- [ ] Verify no traffic to us-west-1

### Phase 5: Validation and Monitoring (T+5:30 to T+6:00)

**T+5:30: Final Validation**

- [ ] Verify all users are connecting to us-west-2
- [ ] Check application metrics and dashboards
- [ ] Verify no errors in logs
- [ ] Test all critical functionality
- [ ] Confirm data is being written to us-west-2 resources

**T+6:00: Migration Complete**

```bash
# Send completion notification
echo "Migration completed successfully at $(date)"

# Document final state
terraform workspace select us-west-2
terraform output > final-outputs.txt

# Set DNS TTL back to normal (e.g., 3600)
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 3600,
        "ResourceRecords": [{"Value": "NEW_IP_ADDRESS"}]
      }
    }]
  }'
```

## Post-Migration Activities

### Day 1 After Migration

- [ ] Monitor application performance and errors
- [ ] Verify all integrations working correctly
- [ ] Review monitoring alerts
- [ ] Collect feedback from users
- [ ] Document any issues encountered

### Week 1 After Migration

- [ ] Continue monitoring for anomalies
- [ ] Verify billing is as expected
- [ ] Update documentation with actual resource IDs
- [ ] Conduct post-migration review meeting
- [ ] Identify lessons learned

### Week 2-4 After Migration

- [ ] Prepare to decommission us-west-1 resources
- [ ] Verify no dependencies on old region
- [ ] Archive data from us-west-1
- [ ] Update disaster recovery plans

## Rollback Procedures

### Rollback Decision Criteria

Execute rollback if:
- Critical functionality is broken in us-west-2
- Data integrity issues detected
- Performance degradation exceeds acceptable thresholds
- Security vulnerabilities discovered
- More than 15 minutes past scheduled cutover window without success

### Rollback Step 1: DNS Revert (5 minutes)

```bash
# Immediately revert DNS to us-west-1
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "TTL": 60,
        "ResourceRecords": [{"Value": "OLD_IP_ADDRESS"}]
      }
    }]
  }'

# Verify DNS change
dig app.example.com +short
```

### Rollback Step 2: Verify Source Region (5 minutes)

```bash
# Verify us-west-1 is still operational
terraform workspace select us-west-1
terraform plan
# Should show no changes

# Test application in us-west-1
curl http://OLD_IP_ADDRESS/health

# Verify database is accessible
psql -h OLD_DB_ENDPOINT -U dbadmin -d appdb -c "SELECT 1;"
```

### Rollback Step 3: Data Synchronization (if needed) (15 minutes)

```bash
# If any data was written to us-west-2, sync back to us-west-1
aws s3 sync \
  s3://app-data-prod-usw2-SUFFIX \
  s3://app-data-prod-usw1-SUFFIX \
  --source-region us-west-2 \
  --region us-west-1 \
  --exclude "*" \
  --include "DATA_PATTERN_FROM_CUTOVER_TIME*"
```

### Rollback Step 4: Communication

```bash
# Notify stakeholders of rollback
echo "Migration rolled back at $(date). Application running on us-west-1."

# Document rollback reason
cat > rollback-report.txt <<EOF
Rollback executed at $(date)
Reason: [SPECIFIC REASON]
Duration of cutover: [DURATION]
Status: Application operational on us-west-1
Next steps: [ACTION ITEMS]
EOF
```

## Validation Checks

### Infrastructure Validation

```bash
# VPC validation
terraform workspace select us-west-2
VPC_ID=$(terraform output -raw vpc_id)
aws ec2 describe-vpcs --vpc-ids $VPC_ID --region us-west-2

# Subnet validation
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region us-west-2

# Security group validation
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --region us-west-2

# Instance validation
aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" "Name=instance-state-name,Values=running" --region us-west-2

# RDS validation
aws rds describe-db-instances --region us-west-2 | grep DBInstanceIdentifier
```

### Application Validation

```bash
# Health check endpoints
curl -f http://NEW_IP_ADDRESS/health || echo "Health check failed"

# API endpoints
curl -f http://NEW_IP_ADDRESS/api/v1/status || echo "API check failed"

# Database connectivity
psql -h NEW_DB_ENDPOINT -U dbadmin -d appdb -c "SELECT version();" || echo "DB check failed"

# S3 connectivity
aws s3 ls s3://app-data-prod-usw2-SUFFIX || echo "S3 check failed"
```

### Performance Validation

```bash
# Response time check
curl -w "@curl-format.txt" -o /dev/null -s http://NEW_IP_ADDRESS/

# Load test (if applicable)
ab -n 1000 -c 10 http://NEW_IP_ADDRESS/

# Database query performance
psql -h NEW_DB_ENDPOINT -U dbadmin -d appdb -c "EXPLAIN ANALYZE SELECT * FROM critical_table LIMIT 100;"
```

## Monitoring and Alerts

### Critical Metrics to Monitor

1. **Application Metrics**
   - HTTP response codes (target: <1% 5xx errors)
   - Response time (target: p95 < 200ms)
   - Request rate
   - Active connections

2. **Infrastructure Metrics**
   - CPU utilization (target: <70%)
   - Memory utilization (target: <80%)
   - Disk I/O
   - Network throughput

3. **Database Metrics**
   - Connection count
   - Query latency
   - Replication lag (if applicable)
   - Disk usage

4. **AWS Service Metrics**
   - EC2 instance status checks
   - RDS availability
   - S3 request rate
   - CloudWatch alarms

### Alert Thresholds

- **Critical**: Immediate action required, page on-call engineer
  - Application down
  - Database unavailable
  - Error rate >5%

- **Warning**: Investigation needed within 15 minutes
  - Error rate 2-5%
  - Response time >500ms
  - CPU >80%

- **Info**: Monitor but no immediate action
  - Response time 200-500ms
  - CPU 70-80%

## Decommissioning Source Region

### After 30 Days of Stable Operation

```bash
# Verify no traffic to us-west-1
# Check monitoring dashboards and logs

# Take final backup
aws rds create-db-snapshot \
  --db-instance-identifier db-prod-usw1 \
  --db-snapshot-identifier final-backup-before-decomm-$(date +%Y%m%d) \
  --region us-west-1

# Backup S3 data
aws s3 sync s3://app-data-prod-usw1-SUFFIX s3://archive-bucket/us-west-1-$(date +%Y%m%d)/ --region us-west-1

# Destroy infrastructure with Terraform
terraform workspace select us-west-1
terraform destroy -auto-approve

# Delete workspace
terraform workspace select default
terraform workspace delete us-west-1

# Archive state file
aws s3 cp .terraform/terraform.tfstate s3://archive-bucket/terraform-states/us-west-1-final.json
```

## Contact Information

- **Migration Lead**: [Name, Phone, Email]
- **Infrastructure Team**: [Team Channel, Email]
- **Database Team**: [Team Channel, Email]
- **Application Team**: [Team Channel, Email]
- **Network Team**: [Team Channel, Email]
- **Security Team**: [Team Channel, Email]

## Emergency Escalation

1. **Level 1**: Team leads (immediate)
2. **Level 2**: Engineering managers (15 minutes)
3. **Level 3**: VP Engineering (30 minutes)
4. **Level 4**: CTO (45 minutes)

## Document Revision History

- **v1.0**: Initial runbook creation
- **v1.1**: Add actual resource IDs after migration
- **v1.2**: Update with lessons learned
```
