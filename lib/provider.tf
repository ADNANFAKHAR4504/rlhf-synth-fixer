terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Author      = var.author
      Environment = var.environment
      CreatedBy   = "Terraform"
      CreatedAt   = var.created_date
    }
  }
}

resource "null_resource" "s3_bucket_cleanup" {
  depends_on = [module.infra]
  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    always_run     = timestamp()
    s3_bucket_name = var.s3_bucket_name_to_clean
  }

  # This provisioner requires the following IAM permissions:
  # - s3:ListBucket
  # - s3:ListBucketVersions
  # - s3:DeleteObject
  # - s3:DeleteObjectVersion
  # - s3:DeleteBucket
  provisioner "local-exec" {
    when    = destroy
    command = <<EOT
      set -e
      echo "Starting S3 bucket cleanup for: ${self.triggers.s3_bucket_name}"
      
      # Check if the bucket exists before attempting to clean it
      if aws s3api head-bucket --bucket "${self.triggers.s3_bucket_name}" 2>/dev/null; then
        echo "Attempting to empty and delete S3 bucket: ${self.triggers.s3_bucket_name}"
        aws s3 rb "s3://${self.triggers.s3_bucket_name}" --force
        echo "Finished emptying and deleting S3 bucket: ${self.triggers.s3_bucket_name}."
      else
        echo "Bucket ${self.triggers.s3_bucket_name} does not exist. Skipping cleanup."
      fi
    EOT
    interpreter = ["bash", "-c"]
  }
}
