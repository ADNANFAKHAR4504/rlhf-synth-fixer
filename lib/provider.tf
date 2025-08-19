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
    always_run        = timestamp()
    backup_vault_name = var.backup_vault_name_to_clean
  }

  lifecycle {
    create_before_destroy = true
  }
  
  provisioner "local-exec" {
    when    = destroy
    command = <<EOT
      set -e
      echo "Starting backup vault cleanup for: ${self.triggers.backup_vault_name}"

      # Check if the backup vault exists before attempting to clean it
      if aws backup describe-backup-vault --backup-vault-name "${self.triggers.backup_vault_name}" >/dev/null 2>&1; then
        echo "Backup vault ${self.triggers.backup_vault_name} exists. Proceeding with cleanup."
        
        while true; do
          echo "Listing recovery points in ${self.triggers.backup_vault_name}..."
          RECOVERY_POINT_ARNS=$(aws backup list-recovery-points-by-backup-vault \
            --backup-vault-name "${self.triggers.backup_vault_name}" \
            --query 'RecoveryPoints[].RecoveryPointArn' \
            --output text)

          if [ -z "$RECOVERY_POINT_ARNS" ]; then
            echo "No recovery points found in ${self.triggers.backup_vault_name}. Exiting loop."
            break
          else
            echo "Found recovery points: $RECOVERY_POINT_ARNS"
            for arn in $RECOVERY_POINT_ARNS; do
              echo "Attempting to delete recovery point: $arn"
              aws backup delete-recovery-point --recovery-point-arn "$arn"
              echo "Successfully deleted recovery point: $arn"
              sleep 1 # Small delay to avoid hitting API rate limits
            done
            echo "Finished a pass of deleting recovery points from ${self.triggers.backup_vault_name}. Checking for more..."
            sleep 5 # Wait a bit before checking for more recovery points
          fi
        done
        echo "Finished backup vault cleanup for: ${self.triggers.backup_vault_name}."
      else
        echo "Backup vault ${self.triggers.backup_vault_name} does not exist. Skipping cleanup."
      fi
    EOT
    interpreter = ["bash", "-c"]
  }
}


resource "null_resource" "s3_bucket_cleanup" {
  lifecycle {
  create_before_destroy = true
  }

  triggers = {
    always_run     = timestamp()
    s3_bucket_name = var.s3_bucket_name_to_clean
  }

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
