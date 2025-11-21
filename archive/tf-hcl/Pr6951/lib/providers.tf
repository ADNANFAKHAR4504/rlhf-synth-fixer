terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Terraform state stored in S3 with DynamoDB state locking (Constraint 4)
  # Note: Backend configuration cannot use variables. For production, use:
  # terraform init -backend-config="bucket=terraform-state-migration-${env}"
  # For testing/demo, using local state
  # backend "s3" {
  #   bucket         = "terraform-state-migration-dev"
  #   key            = "document-processing/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock-dev"
  # }
}

# Source region provider (us-east-1)
provider "aws" {
  alias  = "source"
  region = var.source_region

  default_tags {
    tags = {
      ManagedBy      = "Terraform"
      Project        = "DocumentProcessingMigration"
      Environment    = var.environment_suffix
      MigrationPhase = var.migration_phase
      CutoverDate    = var.cutover_date
    }
  }
}

# Target region provider (eu-west-1)
provider "aws" {
  alias  = "target"
  region = var.target_region

  default_tags {
    tags = {
      ManagedBy      = "Terraform"
      Project        = "DocumentProcessingMigration"
      Environment    = var.environment_suffix
      MigrationPhase = var.migration_phase
      CutoverDate    = var.cutover_date
    }
  }
}
