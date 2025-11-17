# KMS key for application data
resource "aws_kms_key" "application_data" {
  description             = "KMS key for application data encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "application-data-key-${var.environment_suffix}"
      Purpose = "ApplicationData"
    }
  )
}

resource "aws_kms_alias" "application_data" {
  name          = "alias/application-data-${var.environment_suffix}"
  target_key_id = aws_kms_key.application_data.key_id
}

# KMS key for infrastructure secrets
resource "aws_kms_key" "infrastructure_secrets" {
  description             = "KMS key for infrastructure secrets-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "infrastructure-secrets-key-${var.environment_suffix}"
      Purpose = "InfrastructureSecrets"
    }
  )
}

resource "aws_kms_alias" "infrastructure_secrets" {
  name          = "alias/infrastructure-secrets-${var.environment_suffix}"
  target_key_id = aws_kms_key.infrastructure_secrets.key_id
}

# KMS key for Terraform state encryption
resource "aws_kms_key" "terraform_state" {
  description             = "KMS key for Terraform state encryption-${var.environment_suffix}"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name    = "terraform-state-key-${var.environment_suffix}"
      Purpose = "TerraformState"
    }
  )
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/terraform-state-${var.environment_suffix}"
  target_key_id = aws_kms_key.terraform_state.key_id
}
