########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}
variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# S3 Bucket
########################

/* resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

########################
# Outputs
########################

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
*/
# main.tf
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

  backend "remote" {
    organization = "<REPLACE_WITH_TFC_ORG>"
    workspaces {
      prefix = "myapp-"
    }
  }
}

provider "aws" {
  alias  = "staging"
  region = var.staging_region
  default_tags {
    tags = {
      environment = "staging"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

provider "aws" {
  alias  = "production"
  region = var.production_region
  default_tags {
    tags = {
      environment = "production"
      project     = "IaC - AWS Nova Model Breaking"
    }
  }
}

locals {
  env = replace(terraform.workspace, "myapp-", "")
}

module "storage" {
  source   = "./modules/storage"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
}

module "network" {
  source   = "./modules/network"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
}

module "iam_role" {
  source   = "./modules/iam_role"
  providers = { aws = local.env == "staging" ? aws.staging : aws.production }
  environment = local.env
  bucket_arn  = module.storage.bucket_arn
}
