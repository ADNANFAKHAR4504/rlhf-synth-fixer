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

resource "null_resource" "backup_recovery_point_cleanup" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    when       = destroy
    command    = <<EOT
      echo "Attempting to delete recovery points from backup vault: ${var.backup_vault_name_to_clean}"
      RECOVERY_POINT_ARNS=$(aws backup list-recovery-points-by-backup-vault \
        --backup-vault-name ${var.backup_vault_name_to_clean}
        --query 'RecoveryPoints[].RecoveryPointArn'
        --output text)

      if [ -z "$RECOVERY_POINT_ARNS" ]; then
        echo "No recovery points found in ${var.backup_vault_name_to_clean}."
      else
        for arn in $RECOVERY_POINT_ARNS;
        do
          echo "Deleting recovery point: $arn"
          aws backup delete-recovery-point --recovery-point-arn $arn
        done
        echo "Finished deleting recovery points from ${var.backup_vault_name_to_clean}."
      fi
    EOT
    interpreter = ["bash", "-c"]
  }
}

variable "s3_bucket_name_to_clean" {
  description = "The name of the S3 bucket to empty before deletion."
  type        = string
}

resource "null_resource" "s3_bucket_cleanup" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    when       = destroy
    command    = <<EOT
      echo "Attempting to empty S3 bucket: ${var.s3_bucket_name_to_clean}"
      aws s3 rm s3://${var.s3_bucket_name_to_clean} --recursive

      # Check if versioning is enabled and delete object versions
      BUCKET_VERSIONING=$(aws s3api get-bucket-versioning --bucket ${var.s3_bucket_name_to_clean} --query 'Status' --output text)
      if [ "$BUCKET_VERSIONING" == "Enabled" ]; then
        echo "Versioning is enabled for ${var.s3_bucket_name_to_clean}. Deleting object versions..."
        aws s3api list-object-versions --bucket ${var.s3_bucket_name_to_clean} \
          --query 'Versions[*].{Key:Key,VersionId:VersionId}' --output json | \
          jq -c '.[]' | while read -r item; do
            KEY=$(echo $item | jq -r '.Key')
            VERSION_ID=$(echo $item | jq -r '.VersionId')
            echo "Deleting version: $KEY (VersionId: $VERSION_ID)"
            aws s3api delete-object --bucket ${var.s3_bucket_name_to_clean} --key "$KEY" --version-id "$VERSION_ID"
          done
        aws s3api list-object-versions --bucket ${var.s3_bucket_name_to_clean} \
          --query 'DeleteMarkers[*].{Key:Key,VersionId:VersionId}' --output json | \
          jq -c '.[]' | while read -r item; do
            KEY=$(echo $item | jq -r '.Key')
            VERSION_ID=$(echo $item | jq -r '.VersionId')
            echo "Deleting delete marker: $KEY (VersionId: $VERSION_ID)"
            aws s3api delete-object --bucket ${var.s3_bucket_name_to_clean} --key "$KEY" --version-id "$VERSION_ID"
          done
        echo "Finished deleting object versions from ${var.s3_bucket_name_to_clean}."
      fi
      echo "Finished emptying S3 bucket: ${var.s3_bucket_name_to_clean}."
    EOT
    interpreter = ["bash", "-c"]
  }
}