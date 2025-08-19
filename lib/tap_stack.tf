######################
# Data
######################
# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

######################
# Infrastructure Module
######################

module "infra" {
  source = "./modules"

  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = data.aws_availability_zones.available.names
  account_id           = data.aws_caller_identity.current.account_id
  caller_arn           = data.aws_caller_identity.current.arn
}

variable "backup_vault_name_to_clean" {
  description = "The name of the AWS Backup vault to clean recovery points from."
  type        = string
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
        --backup-vault-name ${var.backup_vault_name_to_clean} \
        --query 'RecoveryPoints[].RecoveryPointArn' \
        --output text)

      if [ -z "$RECOVERY_POINT_ARNS" ]; then
        echo "No recovery points found in ${var.backup_vault_name_to_clean}."
      else
        for arn in $RECOVERY_POINT_ARNS; do
          echo "Deleting recovery point: $arn"
          aws backup delete-recovery-point --recovery-point-arn $arn
        done
        echo "Finished deleting recovery points from ${var.backup_vault_name_to_clean}."
      fi
    EOT
    interpreter = ["bash", "-c"]
  }
}
######################
# Outputs
######################

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.infra.vpc_id
}

output "s3_data_bucket_name" {
  description = "Name of the S3 data bucket"
  value       = module.infra.s3_data_bucket_name
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = module.infra.nat_gateway_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = module.infra.kms_key_arn
}

output "instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = module.infra.ec2_instance_profile_name
}
