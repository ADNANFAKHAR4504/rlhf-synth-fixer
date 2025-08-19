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
    backup_vault_name = var.backup_vault_name_to_clean
  }

  provisioner "local-exec" {
    when       = destroy
    command    = <<EOT
      set -e
      echo "Starting backup vault cleanup for: ${self.triggers.backup_vault_name}" 
      
      while true; do
        echo "Listing recovery points in ${self.triggers.backup_vault_name}..."
        RECOVERY_POINT_ARNS=$(aws backup list-recovery-points-by-backup-vault \
          --backup-vault-name ${self.triggers.backup_vault_name} \
          --query 'RecoveryPoints[].RecoveryPointArn' \
          --output text)

        if [ -z "$RECOVERY_POINT_ARNS" ]; then
          echo "No recovery points found in ${self.triggers.backup_vault_name}. Exiting loop."
          break
        else
          echo "Found recovery points: $RECOVERY_POINT_ARNS"
          for arn in $RECOVERY_POINT_ARNS;
          do
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
    EOT
    interpreter = ["bash", "-c"]
  }
}


resource "null_resource" "s3_bucket_cleanup" {
  triggers = {
    always_run = timestamp()
    s3_bucket_name = var.s3_bucket_name_to_clean
  }

  provisioner "local-exec" {
    when       = destroy
    command    = <<EOT
      set -e
      echo "Starting S3 bucket cleanup for: ${self.triggers.s3_bucket_name}"
      
      # Check if the bucket exists before attempting to clean it
      if aws s3 ls "s3://${self.triggers.s3_bucket_name}" 2>&1 | grep -q 'NoSuchBucket'; then
        echo "Bucket ${self.triggers.s3_bucket_name} does not exist. Skipping cleanup."
      else
        echo "Attempting to empty and delete S3 bucket: ${self.triggers.s3_bucket_name}"
        # Delete all object versions
        aws s3api list-object-versions --bucket "${self.triggers.s3_bucket_name}" --query 'Versions[].{Key:Key,VersionId:VersionId}' --output json | \
        jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
        xargs -L 10 -r aws s3api delete-object --bucket "${self.triggers.s3_bucket_name}"

        # Delete all delete markers
        aws s3api list-object-versions --bucket "${self.triggers.s3_bucket_name}" --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output json | \
        jq -r '.[] | "--key \(.Key) --version-id \(.VersionId)"' | \
        xargs -L 10 -r aws s3api delete-object --bucket "${self.triggers.s3_bucket_name}"

        # Finally, remove the bucket
        aws s3 rb s3://${self.triggers.s3_bucket_name} --force
        echo "Finished emptying and deleting S3 bucket: ${self.triggers.s3_bucket_name}".
      fi
    EOT
    interpreter = ["bash", "-c"]
  }
}
