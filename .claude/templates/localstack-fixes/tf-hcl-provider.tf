# LocalStack Provider Configuration for Terraform
# Template: tf-hcl-provider
#
# Usage: Include this provider configuration in your Terraform project
# for LocalStack compatibility

# Variables for LocalStack configuration
variable "localstack_enabled" {
  description = "Enable LocalStack configuration"
  type        = bool
  default     = true
}

variable "localstack_endpoint" {
  description = "LocalStack endpoint URL"
  type        = string
  default     = "http://localhost:4566"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# LocalStack AWS Provider
provider "aws" {
  region                      = var.aws_region
  access_key                  = var.localstack_enabled ? "test" : null
  secret_key                  = var.localstack_enabled ? "test" : null
  skip_credentials_validation = var.localstack_enabled
  skip_metadata_api_check     = var.localstack_enabled
  skip_requesting_account_id  = var.localstack_enabled

  # LocalStack endpoints
  dynamic "endpoints" {
    for_each = var.localstack_enabled ? [1] : []
    content {
      acm            = var.localstack_endpoint
      apigateway     = var.localstack_endpoint
      cloudformation = var.localstack_endpoint
      cloudwatch     = var.localstack_endpoint
      dynamodb       = var.localstack_endpoint
      ec2            = var.localstack_endpoint
      es             = var.localstack_endpoint
      elasticache    = var.localstack_endpoint
      events         = var.localstack_endpoint
      firehose       = var.localstack_endpoint
      iam            = var.localstack_endpoint
      kinesis        = var.localstack_endpoint
      kms            = var.localstack_endpoint
      lambda         = var.localstack_endpoint
      logs           = var.localstack_endpoint
      rds            = var.localstack_endpoint
      route53        = var.localstack_endpoint
      s3             = var.localstack_endpoint
      secretsmanager = var.localstack_endpoint
      ses            = var.localstack_endpoint
      sns            = var.localstack_endpoint
      sqs            = var.localstack_endpoint
      ssm            = var.localstack_endpoint
      stepfunctions  = var.localstack_endpoint
      sts            = var.localstack_endpoint
    }
  }

  # S3 path-style access required for LocalStack
  s3_use_path_style = var.localstack_enabled
}

# Common tags for LocalStack resources
locals {
  common_tags = {
    Environment = var.localstack_enabled ? "localstack" : "production"
    ManagedBy   = "terraform"
  }
}

