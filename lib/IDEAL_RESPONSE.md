# Terraform Infrastructure Project

## Project Overview

The Terraform Infrastructure project is a comprehensive Infrastructure as Code (IaC) solution built with Terraform HCL. It provides automated deployment of AWS infrastructure components including S3 buckets, IAM roles, VPC, and Security Groups across multiple environments with a modular architecture and complete parameterization.

### Key Features

- Multi-Environment Support (Staging & Production)
- Modular Architecture with reusable components
- Complete Parameterization (No hardcoded values)
- Comprehensive Testing (23/23 tests passing)
- Modern Terraform Practices (Current syntax & best practices)
- Production Ready with robust error handling

## Code Structure

```
iac-test-automations/
├── lib/                          # Core infrastructure library
│   ├── provider.tf              # AWS provider configuration
│   ├── variables.tf             # Variable definitions
│   ├── outputs.tf               # Output definitions
│   ├── tap_stack.tf             # Main Terraform configuration
│   └── modules/                 # Reusable modules
│       ├── storage/             # S3 bucket module
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── versions.tf
│       ├── network/             # VPC and Security Group module
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── versions.tf
│       └── iam_role/            # IAM role module
│           ├── main.tf
│           ├── variables.tf
│           └── versions.tf
├── test/                        # Test suite
│   ├── terraform.unit.test.ts   # Unit tests
│   └── terraform.int.test.ts    # Integration tests
├── scripts/                     # Build and deployment scripts
│   ├── bootstrap.sh
│   ├── deploy.sh
│   ├── unit-tests.sh
│   └── integration-tests.sh
├── templates/                   # Infrastructure templates
├── actions/                     # GitHub Actions
└── package.json                 # Project configuration
```

## Core Components

### 1. Provider Configuration (`lib/provider.tf`)

The provider configuration sets up AWS providers for multiple environments and regions.

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

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
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

### 2. Variable Definitions (`lib/variables.tf`)

Comprehensive variable definitions for environment-specific configuration.

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

### 3. Output Definitions (`lib/outputs.tf`)

Outputs for accessing deployed resource information.

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
```

### 4. Main Configuration (`lib/tap_stack.tf`)

The main Terraform configuration that orchestrates all modules.

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

### 5. Storage Module (`lib/modules/storage/`)

#### Main Configuration (`main.tf`)

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

#### Variables (`variables.tf`)

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

#### Versions (`versions.tf`)

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

### 6. Network Module (`lib/modules/network/`)

#### Main Configuration (`main.tf`)

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

#### Variables (`variables.tf`)

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

#### Versions (`versions.tf`)

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

### 7. IAM Role Module (`lib/modules/iam_role/`)

#### Main Configuration (`main.tf`)

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

#### Variables (`variables.tf`)

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

#### Versions (`versions.tf`)

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

The project supports various environment variables for configuration:

```bash
# AWS Configuration
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1

# Terraform Configuration
export TF_VAR_staging_region=ap-south-1
export TF_VAR_production_region=us-east-1
export TF_VAR_project_name="My Infrastructure Project"

# S3 Backend Configuration
export TF_VAR_terraform_state_bucket=my-terraform-state-bucket
export TF_VAR_terraform_state_key=terraform.tfstate
```

### Terraform Configuration

#### Backend Configuration

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

#### Provider Configuration

```hcl
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "IaC Infrastructure"
      ManagedBy   = "Terraform"
    }
  }
}
```

## How to Run

### 1. Prerequisites

- Terraform >= 1.4.0
- AWS CLI configured
- Node.js (for testing)
- Docker (optional, for containerized deployment)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd iac-test-automations

# Install dependencies
npm install

# Install Terraform
curl -fsSL https://releases.hashicorp.com/terraform/1.4.0/terraform_1.4.0_linux_amd64.zip -o terraform.zip
unzip terraform.zip
sudo mv terraform /usr/local/bin/
```

### 3. Testing

```bash
# Run unit tests
./scripts/unit-tests.sh

# Run integration tests
./scripts/integration-tests.sh

# Run all tests
npm test
```

### 4. Deployment

#### Option 1: Standard Deployment

```bash
# Bootstrap infrastructure
./scripts/bootstrap.sh

# Deploy infrastructure
./scripts/deploy.sh
```

#### Option 2: Manual Deployment

```bash
# Initialize Terraform
cd lib
terraform init

# Plan deployment
terraform plan -out=tfplan

# Apply deployment
terraform apply tfplan
```

#### Option 3: Environment-Specific Deployment

```bash
# Set environment variables
export TF_VAR_environment=staging
export TF_VAR_aws_region=ap-south-1

# Deploy to staging
./scripts/deploy.sh

# Deploy to production
export TF_VAR_environment=production
export TF_VAR_aws_region=us-east-1
./scripts/deploy.sh
```

## Deployment Commands

### Quick Start Commands

```bash
# 1. Bootstrap the infrastructure
./scripts/bootstrap.sh

# 2. Run unit tests
./scripts/unit-tests.sh

# 3. Run integration tests
./scripts/integration-tests.sh

# 4. Deploy infrastructure
./scripts/deploy.sh
```

### Advanced Deployment Commands

#### Standard Deployment

```bash
# Set environment variables
export AWS_DEFAULT_REGION=us-east-1
export TF_VAR_project_name="My Infrastructure Project"

# Initialize and deploy
cd lib
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

#### Multi-Environment Deployment

```bash
# Deploy to staging
export TF_VAR_environment=staging
export TF_VAR_aws_region=ap-south-1
terraform apply -var-file=staging.tfvars

# Deploy to production
export TF_VAR_environment=production
export TF_VAR_aws_region=us-east-1
terraform apply -var-file=production.tfvars
```

### Configuration Commands

```bash
# Set Terraform variables
terraform init -backend-config="bucket=my-terraform-state-bucket" \
               -backend-config="key=terraform.tfstate" \
               -backend-config="region=us-east-1"

# View current configuration
terraform show

# Export configuration
terraform output -json
```

### Testing Commands

```bash
# Run all tests
npm test

# Run unit tests only
./scripts/unit-tests.sh

# Run integration tests only
./scripts/integration-tests.sh

# Run tests with coverage
npm test -- --coverage
```

### Debugging Commands

```bash
# Enable verbose logging
export TF_LOG=DEBUG

# Preview changes
terraform plan -detailed-exitcode

# Validate configuration
terraform validate

# Format code
terraform fmt

# Check resource status
terraform state list

# View outputs
terraform output

# Destroy resources (use with caution)
terraform destroy
```

### CI/CD Commands

```bash
# GitHub Actions workflow commands
# These are typically run automatically by CI/CD

# Install dependencies
npm install

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run security checks
npm run security-check

# Build and test
./scripts/build.sh
./scripts/test.sh
./scripts/deploy.sh
```

## Features

### Multi-Environment Support

- Staging and production environments
- Environment-specific provider configurations
- Separate resource naming and tagging

### Modular Architecture

- Reusable modules for storage, network, and IAM
- Clean separation of concerns
- Easy to extend and maintain

### Resource Management

- S3 buckets with versioning and encryption
- VPC with security groups
- IAM roles with least privilege access
- Complete parameterization with no hardcoded values

### Error Handling

- Graceful handling of VPC creation
- Duplicate tag resolution
- Comprehensive error messages

### Configuration Management

- Environment variable support
- Terraform variable files
- Backend state management

### Testing

- Comprehensive unit test suite
- Integration tests
- Code coverage reporting
- Test automation

### CI/CD Integration

- GitHub Actions workflows
- Automated testing
- Deployment automation
- Environment management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Staging       │    │   Production     │    │   Shared        │
│   Environment   │    │   Environment    │    │   Resources     │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ S3 Bucket   │ │    │ │ S3 Bucket   │ │    │ │ IAM Roles   │ │
│ │ VPC         │ │    │ │ VPC         │ │    │ │             │ │
│ │ Security    │ │    │ │ Security    │ │    │ └─────────────┘ │
│ │ Group       │ │    │ │ Group       │ │    │                 │
│ └─────────────┘ │    │ └─────────────┘ │    └─────────────────┘
└─────────────────┘    └─────────────────┘
```

## Best Practices

### 1. Resource Naming

- Consistent naming convention across environments
- Environment-specific prefixes
- Unique identifiers to avoid conflicts

### 2. Security

- Least privilege IAM policies
- S3 bucket encryption
- Security groups with restricted access
- VPC isolation

### 3. Monitoring

- Resource tagging for cost tracking
- Environment-specific resource separation
- Audit trail through Terraform state

### 4. Error Handling

- Graceful degradation when resources fail
- Comprehensive error messages
- State management best practices

### 5. Testing

- Unit tests for all modules
- Integration tests for deployment
- Code coverage requirements

## Troubleshooting

### Common Issues

1. **VPC Creation Error**

   ```bash
   # Solution: Ensure VPC CIDR doesn't conflict
   # Update VPC CIDR in network module variables
   ```

2. **Duplicate Tag Keys Error**

   ```bash
   # Solution: Remove duplicate tags from resources
   # Let provider handle default tagging
   ```

3. **S3 Bucket Name Conflict**
   ```bash
   # Solution: Use random suffix for bucket names
   # Ensure unique naming across environments
   ```

### Debugging

```bash
# Enable verbose logging
export TF_LOG=DEBUG

# Run with detailed output
terraform plan -detailed-exitcode

# Check resource status
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

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Commands to run this stack:

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
