output "kms_primary_key_id" {
  description = "Primary KMS key ID in us-east-1"
  value       = aws_kms_key.primary.id
}

output "kms_primary_key_arn" {
  description = "Primary KMS key ARN"
  value       = aws_kms_key.primary.arn
}

output "kms_replica_eu_west_1_id" {
  description = "KMS replica key ID in eu-west-1"
  value       = aws_kms_replica_key.eu_west_1.id
}

output "kms_replica_ap_southeast_1_id" {
  description = "KMS replica key ID in ap-southeast-1"
  value       = aws_kms_replica_key.ap_southeast_1.id
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.database_credentials.arn
}

output "lambda_rotation_function_name" {
  description = "Lambda rotation function name"
  value       = aws_lambda_function.secret_rotation.function_name
}

output "admin_role_arn" {
  description = "Admin role ARN (requires MFA)"
  value       = aws_iam_role.admin_with_mfa.arn
}

output "config_bucket_name" {
  description = "AWS Config S3 bucket name"
  value       = aws_s3_bucket.config_bucket.id
}

output "vpc_endpoint_secretsmanager_id" {
  description = "VPC endpoint ID for Secrets Manager"
  value       = aws_vpc_endpoint.secretsmanager.id
}

output "vpc_endpoint_kms_id" {
  description = "VPC endpoint ID for KMS"
  value       = aws_vpc_endpoint.kms.id
}

output "environment_suffix" {
  description = "Environment suffix used for resource names"
  value       = local.suffix
}

output "validation_commands" {
  description = "AWS CLI commands to validate security controls"
  value       = <<-EOT
    # Validate KMS key rotation
    aws kms describe-key --key-id ${aws_kms_key.primary.id} --query 'KeyMetadata.KeyRotationEnabled'

    # Validate secret rotation configuration
    aws secretsmanager describe-secret --secret-id ${aws_secretsmanager_secret.database_credentials.id} --query 'RotationEnabled'

    # Validate KMS key policy denies root decrypt
    aws kms get-key-policy --key-id ${aws_kms_key.primary.id} --policy-name default --query 'Policy' --output text | jq '.Statement[] | select(.Sid == "DenyRootAccountDecrypt")'

    # Validate CloudWatch log group encryption
    aws logs describe-log-groups --log-group-name-prefix '/aws/' --query 'logGroups[*].[logGroupName,kmsKeyId]' --output table

    # Validate AWS Config is enabled
    aws configservice describe-configuration-recorders --query 'ConfigurationRecorders[*].name'

    # Validate Config rules
    aws configservice describe-config-rules --query 'ConfigRules[*].[ConfigRuleName,ConfigRuleState]' --output table

    # Validate VPC endpoints
    aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=${local.vpc_id}" --query 'VpcEndpoints[*].[ServiceName,State]' --output table

    # Validate IAM role session duration
    aws iam get-role --role-name ${aws_iam_role.admin_with_mfa.name} --query 'Role.MaxSessionDuration'

    # Validate S3 bucket encryption
    aws s3api get-bucket-encryption --bucket ${aws_s3_bucket.config_bucket.id}

    # Test secret retrieval (requires proper IAM permissions)
    aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.database_credentials.id} --query 'SecretString'
  EOT
}

output "resource_summary" {
  description = "Summary of deployed resources"
  value = {
    kms_keys = {
      primary = aws_kms_key.primary.id
      replicas = [
        aws_kms_replica_key.eu_west_1.id,
        aws_kms_replica_key.ap_southeast_1.id
      ]
    }
    secrets = [
      aws_secretsmanager_secret.database_credentials.name
    ]
    iam_roles = [
      aws_iam_role.secrets_rotation.name,
      aws_iam_role.admin_with_mfa.name,
      aws_iam_role.config_role.name
    ]
    vpc_endpoints = [
      aws_vpc_endpoint.secretsmanager.id,
      aws_vpc_endpoint.kms.id,
      aws_vpc_endpoint.ec2.id
    ]
    config_rules = [
      aws_config_config_rule.kms_rotation_enabled.name,
      aws_config_config_rule.secrets_encrypted.name,
      aws_config_config_rule.cloudwatch_logs_encrypted.name,
      aws_config_config_rule.s3_bucket_encrypted.name,
      aws_config_config_rule.iam_mfa_required.name,
      aws_config_config_rule.vpc_endpoint_service_enabled.name,
      aws_config_config_rule.required_tags.name
    ]
  }
}
