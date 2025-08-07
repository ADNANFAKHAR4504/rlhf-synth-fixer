terraform {
  /**
 * ⚠️ Important:
 * You must create a globally unique Amazon S3 bucket to store your Terraform state files.
 * 
 * Terraform uses this bucket to manage and persist the infrastructure state across deployments.
 * Ensure that the bucket name is globally unique (i.e., it does not conflict with existing S3 bucket names across all AWS accounts).
 *
 * 🔑 Key:
 * You can define any key (path within the bucket) to organize your Terraform state files.
 * For example: `envs/dev/terraform.tfstate` or `states/project-name.tfstate`.
 *
 * 💡 Best Practices:
 * - Enable versioning on the S3 bucket to maintain a history of your state files.
 * - Use server-side encryption (SSE-S3 or SSE-KMS) for data security.
 * - Restrict access to the bucket using IAM policies.
 * - Consider using a DynamoDB table for state locking and consistency (especially in team environments).
 */

  # npm run tf:init -backend-config=backend.conf
  backend "s3" {
    use_lockfile = true
  }

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
}

provider "aws" {
  region = var.aws_region
}
module "vpc" {
  source = "../lib/modules/vpc"
  environment = var.environment
  vpc_cidr = var.vpc_cidr
  public_subnets = var.public_subnets
  private_subnets = var.private_subnets
}

/** module "s3" {
 * source       = "../lib/modules"
  * bucket_name  = var.s3_bucket_name
  * environment  = var.environment_suffix
  * project_name = var.stack_name
  * tags         = var.default_tags
* } */
