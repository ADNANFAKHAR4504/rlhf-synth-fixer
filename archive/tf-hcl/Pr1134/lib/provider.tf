terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # backend "s3" {
  #   # Configure this with your actual backend bucket
  #   # Uncomment and configure after initial deployment
  #   # bucket         = "s3-myproject-terraform-state"
  #   # key            = "staging/terraform.tfstate"
  #   # region         = "us-east-1"
  #   # dynamodb_table = "dynamodb-myproject-terraform-locks"
  #   # encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Owner       = "devops-team"
      CostCenter  = "engineering"
      CreatedBy   = "terraform-pipeline"
    }
  }
}

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}

# Data source to get current AWS region
data "aws_region" "current" {}

# Random ID for unique resource naming when environment_suffix is not provided
resource "random_id" "suffix" {
  byte_length = 4
}

# Local values for consistent naming
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name

  # Environment suffix for unique resource naming (supports randomness)
  # Generate random suffix if not provided to avoid resource conflicts
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "${var.environment}${random_id.suffix.hex}"

  # Common naming prefix with environment suffix for uniqueness
  name_prefix = "${var.project_name}-${local.environment_suffix}"

  # Resource naming convention with environment suffix: <resource-type>-<project>-<identifier>-<suffix>
  s3_artifacts_name   = "s3-${var.project_name}-artifacts-${local.environment_suffix}"
  s3_terraform_state  = "s3-${var.project_name}-terraform-state-${local.environment_suffix}"
  iam_circleci_role   = "iam-${var.project_name}-circleci-role-${local.environment_suffix}"
  iam_circleci_policy = "iam-${var.project_name}-circleci-policy-${local.environment_suffix}"
  logs_app_group      = "logs-${var.project_name}-${var.environment}-${local.environment_suffix}"
  dynamodb_tf_locks   = "dynamodb-${var.project_name}-terraform-locks-${local.environment_suffix}"

  # Common tags
  common_tags = {
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    Project           = var.project_name
    ManagedBy         = "terraform"
    CreatedAt         = timestamp()
  }
}
