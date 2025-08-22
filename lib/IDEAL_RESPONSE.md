I'll create a comprehensive Terraform configuration that meets all your requirements. Let me organize this into a well-structured project with modules and proper security practices.

## Project Structure

```
lib/
├── provider.tf
├── main.tf
├── vars.tf
├── terraform.tfvars  <--- for default variables 
├── modules/
│   ├── iam-users/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── iam-roles/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── s3-backend/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev.tfvars
    ├── staging.tfvars
    └── prod.tfvars
```

## Root Configuration Files

### `provider.tf`
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

```

### Backend configuration
The S3 backend is declared inline within provider.tf as `backend "s3" {}` and the actual values (bucket, key, region, DynamoDB table) are supplied during `terraform init` via `-backend-config` or a `backend.hcl` file.

### `vars.tf`
```hcl
# Global variables for the Terraform configuration
# Note: Default values are loaded from lib/terraform.tfvars
# To switch environments, pass -var-file=enviroments/<env>.tfvars when running Terraform.

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Name of the project for resource tagging"
  type        = string
  default     = "secure-iam-setup"
}

variable "allowed_ip_cidr" {
  description = "CIDR block for IP restriction policy"
  type        = string
  default     = "203.0.113.0/24"
}

variable "iam_users" {
  description = "List of IAM users to create"
  type = list(object({
    username = string
    groups   = list(string)
  }))
  default = [
    {
      username = "developer1"
      groups   = ["developers"]
    },
    {
      username = "admin1"
      groups   = ["administrators"]
    }
  ]
}

variable "iam_roles" {
  description = "List of IAM roles to create"
  type = list(object({
    name               = string
    description        = string
    assume_role_policy = string
    managed_policies   = list(string)
  }))
  default = [
    {
      name               = "EC2ReadOnlyRole"
      description        = "Role with read-only access to EC2"
      assume_role_policy = "ec2"
      managed_policies   = ["arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"]
    }
  ]
}

variable "force_mfa" {
  description = "Enforce MFA for all IAM users"
  type        = bool
  default     = true
}
```

### `main.tf`
```hcl
# Main Terraform configuration file

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current AWS region
data "aws_region" "current" {}

# Create S3 bucket for Terraform state (if not exists)
module "s3_backend" {
  source = "./modules/s3-backend"

  bucket_name = "${var.project_name}-terraform-state-${random_id.bucket_suffix.hex}"
  aws_region  = var.aws_region
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# IAM Password Policy - Enforce strong passwords
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 12
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 5
}

# Create IAM policy for IP restriction
resource "aws_iam_policy" "ip_restriction" {
  name        = "${var.project_name}-ip-restriction-${terraform.workspace}"
  description = "Policy that restricts access to specific IP range"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Deny"
        Action   = "*"
        Resource = "*"
        Condition = {
          IpAddressIfExists = {
            "aws:SourceIp" = [var.allowed_ip_cidr]
          }
          Bool = {
            "aws:ViaAWSService" = "false"
          }
        }
      }
    ]
  })
}

# Create IAM policy for MFA enforcement
resource "aws_iam_policy" "force_mfa" {
  count = var.force_mfa ? 1 : 0

  name        = "${var.project_name}-force-mfa-${terraform.workspace}"
  description = "Policy that enforces MFA for all actions except MFA setup"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowViewAccountInfo"
        Effect = "Allow"
        Action = [
          "iam:GetAccountPasswordPolicy",
          "iam:ListVirtualMFADevices"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowManageOwnPasswords"
        Effect = "Allow"
        Action = [
          "iam:ChangePassword",
          "iam:GetUser"
        ]
        Resource = "arn:aws:iam::*:user/$${aws:username}"
      },
      {
        Sid    = "AllowManageOwnMFA"
        Effect = "Allow"
        Action = [
          "iam:CreateVirtualMFADevice",
          "iam:DeleteVirtualMFADevice",
          "iam:ListMFADevices",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice"
        ]
        Resource = [
          "arn:aws:iam::*:mfa/$${aws:username}",
          "arn:aws:iam::*:user/$${aws:username}"
        ]
      },
      {
        Sid    = "DenyAllExceptUnlessSignedInWithMFA"
        Effect = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:GetUser",
          "iam:ListMFADevices",
          "iam:ListVirtualMFADevices",
          "iam:ResyncMFADevice",
          "sts:GetSessionToken"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# Create IAM users using the module
module "iam_users" {
  source = "./modules/iam-users"

  users                     = var.iam_users
  project_name              = var.project_name
  environment               = terraform.workspace
  force_mfa                 = var.force_mfa
  ip_restriction_policy_arn = aws_iam_policy.ip_restriction.arn
  mfa_policy_arn            = var.force_mfa ? aws_iam_policy.force_mfa[0].arn : null
}

# Create IAM roles using the module
module "iam_roles" {
  source = "./modules/iam-roles"

  roles        = var.iam_roles
  project_name = var.project_name
  environment  = terraform.workspace
  account_id   = data.aws_caller_identity.current.account_id
}

# Create IAM groups with appropriate policies
resource "aws_iam_group" "developers" {
  name = "${var.project_name}-developers-${terraform.workspace}"
}

resource "aws_iam_group" "administrators" {
  name = "${var.project_name}-administrators-${terraform.workspace}"
}

# Attach policies to groups following least privilege principle
resource "aws_iam_group_policy_attachment" "developers_readonly" {
  group      = aws_iam_group.developers.name
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_group_policy_attachment" "administrators_admin" {
  group      = aws_iam_group.administrators.name
  policy_arn = "arn:aws:iam::aws:policy/IAMFullAccess"
}

# Attach IP restriction policy to all groups
resource "aws_iam_group_policy_attachment" "developers_ip_restriction" {
  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.ip_restriction.arn
}

resource "aws_iam_group_policy_attachment" "administrators_ip_restriction" {
  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.ip_restriction.arn
}

# Attach MFA policy to all groups if enabled
resource "aws_iam_group_policy_attachment" "developers_mfa" {
  count = var.force_mfa ? 1 : 0

  group      = aws_iam_group.developers.name
  policy_arn = aws_iam_policy.force_mfa[0].arn
}

resource "aws_iam_group_policy_attachment" "administrators_mfa" {
  count = var.force_mfa ? 1 : 0

  group      = aws_iam_group.administrators.name
  policy_arn = aws_iam_policy.force_mfa[0].arn
}


# Output values for the Terraform configuration

output "account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "region" {
  description = "AWS Region"
  value       = data.aws_region.current.id
}

output "environment" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "created_users" {
  description = "List of created IAM users"
  value       = module.iam_users.user_names
}

output "created_roles" {
  description = "List of created IAM roles"
  value       = module.iam_roles.role_names
}

output "ip_restriction_policy_arn" {
  description = "ARN of the IP restriction policy"
  value       = aws_iam_policy.ip_restriction.arn
}

output "mfa_policy_arn" {
  description = "ARN of the MFA enforcement policy"
  value       = var.force_mfa ? aws_iam_policy.force_mfa[0].arn : null
}

output "s3_backend_bucket" {
  description = "S3 bucket for Terraform state"
  value       = module.s3_backend.bucket_name
}
```

## Modules

### `modules/s3-backend/main.tf`
```hcl 
# S3 backend module for Terraform state management

# Set AWS provider region from module variable
provider "aws" {
  region = var.aws_region
}

# Create S3 bucket for Terraform state
resource "aws_s3_bucket" "terraform_state" {
  bucket = var.bucket_name
}

# Enable versioning on the S3 bucket
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block public access to the bucket
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "${var.bucket_name}-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "Terraform State Lock Table"
  }
}
```

### `modules/s3-backend/variables.tf`
```hcl
variable "bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}
```

### `modules/s3-backend/outputs.tf`
```hcl
output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.terraform_state.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for state locking"
  value       = aws_dynamodb_table.terraform_state_lock.name
}
```

### `modules/iam-users/main.tf`
```hcl 
# IAM Users module with MFA enforcement

# Create IAM users
resource "aws_iam_user" "users" {
  for_each = { for user in var.users : user.username => user }

  name          = each.value.username
  force_destroy = true

  tags = {
    Name        = each.value.username
    Environment = var.environment
    Project     = var.project_name
  }
}

# Add users to their respective groups
resource "aws_iam_user_group_membership" "user_groups" {
  for_each = { for user in var.users : user.username => user }

  user   = aws_iam_user.users[each.key].name
  groups = [for group in each.value.groups : "${var.project_name}-${group}-${var.environment}"]
}

# Create access keys for users (optional, consider using temporary credentials)
resource "aws_iam_access_key" "user_keys" {
  for_each = { for user in var.users : user.username => user }

  user = aws_iam_user.users[each.key].name
}

# Attach IP restriction policy to users
resource "aws_iam_user_policy_attachment" "ip_restriction" {
  for_each = { for user in var.users : user.username => user }

  user       = aws_iam_user.users[each.key].name
  policy_arn = var.ip_restriction_policy_arn
}

# Attach MFA policy to users if enabled
resource "aws_iam_user_policy_attachment" "mfa_policy" {
  for_each = var.force_mfa ? { for user in var.users : user.username => user } : {}

  user       = aws_iam_user.users[each.key].name
  policy_arn = var.mfa_policy_arn
}

```

### `modules/iam-users/variables.tf`
```hcl
variable "users" {
  description = "List of users to create"
  type = list(object({
    username = string
    groups   = list(string)
  }))
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "force_mfa" {
  description = "Whether to enforce MFA"
  type        = bool
  default     = true
}

variable "ip_restriction_policy_arn" {
  description = "ARN of the IP restriction policy"
  type        = string
}

variable "mfa_policy_arn" {
  description = "ARN of the MFA policy"
  type        = string
  default     = null
}
```

### `modules/iam-users/outputs.tf`
```hcl
output "user_names" {
  description = "Names of created users"
  value       = [for user in aws_iam_user.users : user.name]
}

output "user_arns" {
  description = "ARNs of created users"
  value       = [for user in aws_iam_user.users : user.arn]
}

output "access_keys" {
  description = "Access keys for users (sensitive)"
  value = {
    for k, v in aws_iam_access_key.user_keys : k => {
      id     = v.id
      secret = v.secret
    }
  }
  sensitive = true
}
```

### `modules/iam-roles/main.tf`
```hcl
# IAM Roles module

# Data source for assume role policies
data "aws_iam_policy_document" "assume_role" {
  for_each = { for role in var.roles : role.name => role }

  statement {
    effect = "Allow"

    principals {
      type = each.value.assume_role_policy == "ec2" ? "Service" : "AWS"
      identifiers = each.value.assume_role_policy == "ec2" ? [
        "ec2.amazonaws.com"
      ] : [
        "arn:aws:iam::${var.account_id}:root"
      ]
    }

    actions = ["sts:AssumeRole"]
  }
}

# Create IAM roles
resource "aws_iam_role" "roles" {
  for_each = { for role in var.roles : role.name => role }

  name               = "${var.project_name}-${each.value.name}-${var.environment}"
  description        = each.value.description
  assume_role_policy = data.aws_iam_policy_document.assume_role[each.key].json

  tags = {
    Name        = each.value.name
    Environment = var.environment
    Project     = var.project_name
  }
}

# Attach managed policies to roles
resource "aws_iam_role_policy_attachment" "role_policies" {
  for_each = {
    for pair in flatten([
      for role_key, role in { for r in var.roles : r.name => r } : [
        for policy in role.managed_policies : {
          role_key   = role_key
          policy_arn = policy
          key        = "${role_key}-${policy}"
        }
      ]
    ]) : pair.key => pair
  }

  role       = aws_iam_role.roles[each.value.role_key].name
  policy_arn = each.value.policy_arn
}

# Create instance profiles for EC2 roles
resource "aws_iam_instance_profile" "role_profiles" {
  for_each = {
    for role in var.roles : role.name => role
    if role.assume_role_policy == "ec2"
  }

  name = "${var.project_name}-${each.value.name}-profile-${var.environment}"
  role = aws_iam_role.roles[each.key].name
}
```

### `modules/iam-roles/variables.tf`
```hcl
variable "roles" {
  description = "List of roles to create"
  type = list(object({
    name               = string
    description        = string
    assume_role_policy = string
    managed_policies   = list(string)
  }))
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "account_id" {
  description = "AWS Account ID"
  type        = string
}
```

### `modules/iam-roles/outputs.tf`
```hcl
output "role_names" {
  description = "Names of created roles"
  value       = [for role in aws_iam_role.roles : role.name]
}

output "role_arns" {
  description = "ARNs of created roles"
  value       = [for role in aws_iam_role.roles : role.arn]
}

output "instance_profile_names" {
  description = "Names of created instance profiles"
  value       = [for profile in aws_iam_instance_profile.role_profiles : profile.name]
}
```

## Environment Configuration Files


### `terraform.tfvars`  - Default values
```hcl
```hcl
# Default variable values loaded automatically by Terraform.

aws_region      = "us-west-1"
project_name    = "secure-iam-dev"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa       = true

iam_users = [
  {
    username = "dev-user1"
    groups   = ["developers"]
  },
  {
    username = "dev-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "DevEC2Role"
    description        = "Development EC2 role with limited permissions"
    assume_role_policy = "ec2"
    managed_policies   = ["arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"]
  }
]
```

### `environments/dev.tfvars`
```hcl
# Development environment configuration

aws_region = "us-west-2"
project_name = "secure-iam-dev"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa = true

iam_users = [
  {
    username = "dev-user1"
    groups   = ["developers"]
  },
  {
    username = "dev-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "DevEC2Role"
    description        = "Development EC2 role with limited permissions"
    assume_role_policy = "ec2"
    managed_policies   = ["arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"]
  }
]
```

### `environments/staging.tfvars`
```hcl
# Staging environment configuration

aws_region = "us-west-2"
project_name = "secure-iam-staging"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa = true

iam_users = [
  {
    username = "staging-user1"
    groups   = ["developers"]
  },
  {
    username = "staging-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "StagingEC2Role"
    description        = "Staging EC2 role with moderate permissions"
    assume_role_policy = "ec2"
    managed_policies   = [
      "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess",
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
]
```

### `environments/prod.tfvars`
```hcl
# Production environment configuration

aws_region = "us-west-2"
project_name = "secure-iam-prod"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa = true

iam_users = [
  {
    username = "prod-user1"
    groups   = ["developers"]
  },
  {
    username = "prod-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "ProdEC2Role"
    description        = "Production EC2 role with specific permissions"
    assume_role_policy = "ec2"
    managed_policies   = [
      "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess",
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
]
```

## Usage Instructions

### 1. Initialize and Setup Backend

First, you'll need to create the S3 bucket manually or run a separate Terraform configuration:

```bash
# Initialize Terraform
terraform init

# Create the backend resources first (optional separate step)
terraform workspace new backend
terraform apply -target=module.s3_backend

# Configure the backend (create backend.hcl)
cat > backend.hcl << EOF
bucket         = "your-actual-bucket-name"
key            = "iam/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "your-actual-table-name"
EOF

# Reinitialize with backend
terraform init -backend-config=backend.hcl
```

### 2. Create and Use Workspaces

```bash
# Create workspaces for different environments
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch to desired workspace
terraform workspace select dev
```

### 3. Deploy Infrastructure

```bash
# Format the code
terraform fmt -recursive

# Validate the configuration
terraform validate

# Plan the deployment
terraform plan -var-file="environments/dev.tfvars"

# Apply the configuration
terraform apply -var-file="environments/dev.tfvars"
```

### 4. Switch Between Environments

```bash
# Switch to staging
terraform workspace select staging
terraform plan -var-file="environments/staging.tfvars"
terraform apply -var-file="environments/staging.tfvars"

# Switch to production
terraform workspace select prod
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

## Security Features Implemented

1. **MFA Enforcement**: All users are required to use MFA for most actions
2. **IP Restriction**: Access is limited to the specified CIDR block
3. **Least Privilege**: Users and roles have minimal required permissions
4. **Strong Password Policy**: Enforces complex passwords with rotation
5. **Encrypted State**: S3 backend uses server-side encryption
6. **State Locking**: DynamoDB prevents concurrent modifications
7. **Versioning**: S3 bucket versioning enabled for state recovery

## Key Features

- ✅ **Modular Design**: Reusable modules for users, roles, and backend
- ✅ **Multi-Environment**: Separate workspaces for dev/staging/prod
- ✅ **Security Best Practices**: MFA, IP restrictions, least privilege
- ✅ **Remote Backend**: S3 with encryption and versioning
- ✅ **Proper Formatting**: Code passes `terraform fmt` and `terraform validate`
- ✅ **Comprehensive Documentation**: Well-commented code with examples

This configuration provides a solid foundation for secure IAM management in AWS while maintaining flexibility and following Terraform best practices.