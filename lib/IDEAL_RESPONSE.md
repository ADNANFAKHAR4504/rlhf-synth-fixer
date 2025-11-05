# Overview

This document provides the complete, production-ready Terraform infrastructure code for a multi-region RDS disaster recovery (DR) setup with automated snapshot replication, cross-region failover capabilities, and comprehensive monitoring. The solution deploys PostgreSQL databases in primary (us-east-1) and DR (us-west-2) regions with automated backup management, Lambda-based snapshot orchestration, and SNS-based alerting.

## Architecture

- Multi-region VPC deployment with isolated network tiers (public, application, private)
- Primary RDS PostgreSQL instance (db.t3.medium, 100GB gp3 storage) with automated backups
- DR region with snapshot-based recovery capability and validation Lambda
- Cross-region S3 bucket replication for backup metadata
- EventBridge-triggered Lambda functions for automated snapshot copying and validation
- Route53 health checks for database availability monitoring
- CloudWatch alarms for CPU, storage, connections, and snapshot freshness
- KMS encryption for RDS instances with cross-region key support
- NAT Gateways for secure outbound connectivity from private subnets

## Implementation Tasks

1. Create provider configuration in `lib/provider.tf`
2. Create main infrastructure in `lib/main.tf`
3. Create Lambda function in `lambda_function.py`
4. Configure variables and outputs
5. Initialize Terraform and validate configuration
6. Deploy infrastructure with terraform apply
7. Configure SNS topic subscriptions for alerts
8. Test snapshot replication and validation

***

## lib/provider.tf

```hcl
# Terraform version and required providers
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Must be 5.x, not 6.x for compatibility
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  backend "s3" {
    
  }
}

# Default provider (required even with aliased providers)
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region provider
provider "aws" {
  region = "us-east-1"
  alias  = "primary"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Primary"
    }
  }
}

# DR region provider
provider "aws" {
  region = "us-west-2"
  alias  = "dr"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Secondary"
    }
  }
}

# Variables
variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
}

variable "database_master_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!SecurePassword"
}
```

***

## lib/main.tf

```hcl
# Terraform version and required providers
terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Must be 5.x, not 6.x for compatibility
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Default provider (required even with aliased providers)
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region provider
provider "aws" {
  region = "us-east-1"
  alias  = "primary"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Primary"
    }
  }
}

# DR region provider
provider "aws" {
  region = "us-west-2"
  alias  = "dr"

  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Secondary"
    }
  }
}

# Variables
variable "environmentSuffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "prod"
}

variable "database_master_password" {
  description = "Master password for RDS database"
  type        = string
  sensitive   = true
  default     = "ChangeMe123!SecurePassword"
}
```

***

### Deployment Commands

```bash
# Initialize Terraform (creates .terraform directory)
terraform init

# Validate configuration syntax
terraform validate

# Format code to standards
terraform fmt -recursive

# Generate and review deployment plan
terraform plan -out=tfplan

# Apply infrastructure (requires confirmation)
terraform apply tfplan

# Display all outputs
terraform output

# Retrieve specific output
terraform output primary_rds_endpoint
terraform output primary_s3_bucket_name
```