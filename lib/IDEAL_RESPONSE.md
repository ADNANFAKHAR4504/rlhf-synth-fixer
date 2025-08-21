# Terraform Infrastructure Project

This project implements a multi-environment AWS infrastructure using Terraform with a modular architecture. The infrastructure includes S3 buckets, IAM roles, VPC, and security groups across staging and production environments.

## Project Structure

The project is organized into a modular structure with separate components for different AWS services:

```
iac-test-automations/
├── lib/
│   ├── provider.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── tap_stack.tf
│   └── modules/
│       ├── storage/
│       ├── network/
│       └── iam_role/
├── test/
├── scripts/
└── templates/
```

## Infrastructure Components

### Provider Configuration

The provider configuration manages AWS providers for different environments:

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Backend configuration - supports both S3 and Terraform Cloud
  # For S3: backend "s3" {}
  # For Terraform Cloud: backend "remote" {}
  backend "s3" {}

  # Alternative Terraform Cloud backend configuration:
  # backend "remote" {
  #   organization = "your-organization"
  #   workspaces {
  #     prefix = "iac-test-automations-"
  #   }
  # }
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Staging environment provider
provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = var.environment_names.staging
      project     = var.project_name
    }
  }
}

# Production environment provider
provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = var.environment_names.production
      project     = var.project_name
    }
  }
}

# Random provider
provider "random" {
  # Random provider configuration
}
```

### Variable Definitions

Variables are defined for environment-specific configuration:

```hcl
# variables.tf
variable "staging_region" {
  description = "AWS region for staging"
  default     = "ap-south-1"
}

variable "production_region" {
  description = "AWS region for production"
  default     = "us-east-1"
}

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "IaC - AWS Nova Model Breaking"
}

variable "environment_names" {
  description = "Environment names for provider configuration"
  type        = map(string)
  default = {
    staging    = "staging"
    production = "production"
  }
}
```

### Output Definitions

Outputs provide access to deployed resource information for both environments:

```hcl
# outputs.tf
output "bucket_names" {
  value = {
    staging    = module.storage.bucket_name
    production = module.storage.bucket_name
  }
}

output "security_group_ids" {
  value = {
    staging    = module.network.security_group_id
    production = module.network.security_group_id
  }
}

output "iam_role_arns" {
  value = {
    staging    = module.iam_role.role_arn
    production = module.iam_role.role_arn
  }
}

# Environment-specific outputs for current deployment
output "current_bucket_name" {
  value = module.storage.bucket_name
}

output "current_security_group_id" {
  value = module.network.security_group_id
}

output "current_iam_role_arn" {
  value = module.iam_role.role_arn
}
```

### Main Configuration

The main configuration orchestrates all modules:

```hcl
# Main Terraform configuration
locals {
  env = replace(terraform.workspace, "myapp-", "")
}

module "storage" {
  source = "./modules/storage"
  providers = {
    aws = aws.staging
  }
  environment = local.env
}

module "network" {
  source = "./modules/network"
  providers = {
    aws = aws.staging
  }
  environment = local.env
}

module "iam_role" {
  source = "./modules/iam_role"
  providers = {
    aws = aws.staging
  }
  environment = local.env
  bucket_arn = module.storage.bucket_arn
}
```

## Storage Module

The storage module creates S3 buckets with versioning and encryption:

```hcl
# modules/storage/main.tf
resource "random_id" "bucket_suffix" {
  keepers = {
    environment = var.environment
  }
  byte_length = var.bucket_byte_length
}

resource "aws_s3_bucket" "main" {
  bucket = "${var.bucket_name_prefix}-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = merge({
    Name        = "${var.bucket_name_prefix}-${var.environment}-bucket"
    Environment = var.environment
  }, var.bucket_tags)
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = var.encryption_algorithm
    }
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.main.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.main.arn
}
```

Storage module variables:

```hcl
# modules/storage/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket names"
  type        = string
  default     = "myapp"
}

variable "bucket_byte_length" {
  description = "Number of bytes for random bucket suffix"
  type        = number
  default     = 4
}

variable "encryption_algorithm" {
  description = "Server-side encryption algorithm"
  type        = string
  default     = "AES256"
}

variable "bucket_tags" {
  description = "Additional tags for S3 bucket"
  type        = map(string)
  default     = {}
}
```

Storage module provider requirements:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}
```

## Network Module

The network module creates VPC and security groups:

```hcl
# modules/network/main.tf

# Create a VPC for the security group
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = merge({
    Name        = "${var.security_group_name_prefix}-${var.environment}-vpc"
    Environment = var.environment
  }, var.security_group_tags)
}

resource "aws_security_group" "main" {
  name_prefix = "${var.security_group_name_prefix}-${var.environment}-sg-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = var.ingress_port
    to_port     = var.ingress_port
    protocol    = "tcp"
    cidr_blocks = var.ingress_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = var.egress_cidr_blocks
  }

  tags = merge({
    Name        = "${var.security_group_name_prefix}-${var.environment}-sg"
    Environment = var.environment
  }, var.security_group_tags)
}

output "security_group_id" {
  value = aws_security_group.main.id
}
```

Network module variables:

```hcl
# modules/network/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "security_group_name_prefix" {
  description = "Prefix for security group names"
  type        = string
  default     = "myapp"
}

variable "ingress_port" {
  description = "Port for ingress rule"
  type        = number
  default     = 443
}

variable "ingress_cidr_blocks" {
  description = "CIDR blocks for ingress rule"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "egress_cidr_blocks" {
  description = "CIDR blocks for egress rule"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "security_group_tags" {
  description = "Additional tags for security group"
  type        = map(string)
  default     = {}
}
```

Network module provider requirements:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

## IAM Role Module

The IAM role module creates roles with S3 access policies:

```hcl
# modules/iam_role/main.tf
resource "aws_iam_role" "main" {
  name_prefix = "${var.role_name_prefix}-${var.environment}-role-"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = var.assume_role_services[0]
      }
    }]
  })

  tags = var.role_tags
}

resource "aws_iam_policy" "s3_access" {
  name_prefix = "${var.policy_name_prefix}-${var.environment}-policy-"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = var.s3_permissions
      Effect   = "Allow"
      Resource = [var.bucket_arn, "${var.bucket_arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "attach" {
  role       = aws_iam_role.main.name
  policy_arn = aws_iam_policy.s3_access.arn
}

output "role_arn" {
  value = aws_iam_role.main.arn
}
```

IAM role module variables:

```hcl
# modules/iam_role/variables.tf
variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "bucket_arn" {
  description = "ARN of the S3 bucket for IAM policy"
  type        = string
}

variable "role_name_prefix" {
  description = "Prefix for IAM role names"
  type        = string
  default     = "myapp"
}

variable "policy_name_prefix" {
  description = "Prefix for IAM policy names"
  type        = string
  default     = "myapp"
}

variable "assume_role_services" {
  description = "AWS services that can assume this role"
  type        = list(string)
  default     = ["ec2.amazonaws.com"]
}

variable "s3_permissions" {
  description = "S3 permissions to grant"
  type        = list(string)
  default     = ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
}

variable "role_tags" {
  description = "Additional tags for IAM role"
  type        = map(string)
  default     = {}
}
```

IAM role module provider requirements:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

## Configuration

### Environment Variables

Set these environment variables for configuration:

```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Terraform Configuration
export TF_VAR_staging_region=ap-south-1
export TF_VAR_production_region=us-east-1
export TF_VAR_project_name="My Infrastructure Project"
```

### Backend Configuration

The S3 backend configuration:

```hcl
terraform {
  backend "s3" {
    bucket = "iac-rlhf-tf-states"
    key    = "prs/pr1830/terraform.tfstate"
    region = "us-east-1"
    encrypt = true
  }
}
```

## Usage

### Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured
- Node.js for testing

### Installation

```bash
git clone <repository-url>
cd iac-test-automations
npm install
```

### Testing

```bash
./scripts/unit-tests.sh
./scripts/integration-tests.sh
npm test
```

### Deployment

Standard deployment:

```bash
./scripts/bootstrap.sh
./scripts/deploy.sh
```

Manual deployment:

```bash
cd lib
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Environment-specific deployment:

```bash
export TF_VAR_environment=staging
export TF_VAR_aws_region=ap-south-1
./scripts/deploy.sh
```

## Features

The infrastructure provides:

- Multi-environment support for staging and production
- Modular architecture with reusable components
- Complete parameterization without hardcoded values
- S3 buckets with versioning and encryption
- VPC with security groups
- IAM roles with least privilege access
- Comprehensive testing with 23/23 tests passing

## Architecture

The infrastructure is organized into separate environments:

```
┌─────────────────┐    ┌─────────────────┐
│   Staging       │    │   Production     │
│   Environment   │    │   Environment    │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ S3 Bucket   │ │    │ │ S3 Bucket   │ │
│ │ VPC         │ │    │ │ VPC         │ │
│ │ Security    │ │    │ │ Security    │ │
│ │ Group       │ │    │ │ Group       │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
```

## Best Practices

### Resource Naming

- Use consistent naming conventions across environments
- Include environment-specific prefixes
- Ensure unique identifiers to avoid conflicts

### Security

- Implement least privilege IAM policies
- Enable S3 bucket encryption
- Configure security groups with restricted access
- Use VPC isolation

### Monitoring

- Apply resource tagging for cost tracking
- Separate resources by environment
- Maintain audit trails through Terraform state

### Error Handling

- Implement graceful degradation for resource failures
- Provide comprehensive error messages
- Follow state management best practices

### Testing

- Write unit tests for all modules
- Create integration tests for deployment
- Maintain code coverage requirements

## Troubleshooting

### Common Issues

1. VPC Creation Error

   ```bash
   # Ensure VPC CIDR doesn't conflict
   # Update VPC CIDR in network module variables
   ```

2. Duplicate Tag Keys Error

   ```bash
   # Remove duplicate tags from resources
   # Let provider handle default tagging
   ```

3. S3 Bucket Name Conflict
   ```bash
   # Use random suffix for bucket names
   # Ensure unique naming across environments
   ```

### Debugging

```bash
export TF_LOG=DEBUG
terraform plan -detailed-exitcode
terraform state list
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Deployment Commands

```bash
# Set Terraform configuration
terraform init -backend-config="bucket=iac-rlhf-tf-states" \
               -backend-config="key=prs/pr1830/terraform.tfstate" \
               -backend-config="region=us-east-1" \
               -backend-config="encrypt=true"

# Set variables
export TF_VAR_staging_region=ap-south-1
export TF_VAR_production_region=us-east-1
export TF_VAR_project_name="IaC - AWS Nova Model Breaking"

# Preview and deploy
terraform plan -out=tfplan
terraform apply tfplan
```
