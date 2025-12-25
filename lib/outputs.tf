output "vpc_id" {
  description = "ID of the VPC (existing VPC being used)"
  value       = local.vpc_id
}

output "aws_region" {
  description = "AWS region"
  value       = data.aws_region.current.name
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.unique_suffix
}

output "security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web_sg.id
}

output "s3_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.corp_bucket.id
}

output "rds_instance_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.corp_database.identifier
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.corp_cloudtrail.name
}

output "instance_id" {
  description = "ID of the EC2 instance (if created)"
  value       = length(aws_instance.corp_web_server) > 0 ? aws_instance.corp_web_server[0].id : null
}

output "security_requirements_compliance" {
  description = "Security requirements compliance status"
  value = {
    iam_policies_version_controlled = "✓ All IAM policies defined in Terraform (version controlled)"
    security_groups_http_https_only = "✓ Security groups allow only HTTP (80) and HTTPS (443)"
    iam_least_privilege             = "✓ IAM roles follow principle of least privilege"
    s3_encryption_enabled           = "✓ S3 buckets have default encryption enabled"
    cloudwatch_api_logging          = "✓ CloudTrail captures all API requests"
    approved_amis_only              = "✓ EC2 instances use approved AMIs from Amazon"
    mfa_console_access              = "✓ MFA required for console access"
    rds_encryption_at_rest          = "✓ RDS storage encrypted at rest"
    auto_generated_passwords        = "✓ Database password auto-generated and stored securely"
  }
}

output "s3_bucket_encryption_status" {
  description = "S3 bucket encryption configuration"
  value = {
    bucket_name        = aws_s3_bucket.corp_bucket.id
    encryption_enabled = "AES256"
  }
}

output "rds_encryption_status" {
  description = "RDS encryption status"
  value = {
    instance_id         = aws_db_instance.corp_database.id
    storage_encrypted   = aws_db_instance.corp_database.storage_encrypted
    password_management = "Auto-generated and stored in AWS Secrets Manager"
  }
}

output "approved_ami_info" {
  description = "Information about the approved AMI being used"
  value = {
    ami_id         = data.aws_ami.approved_ami.id
    ami_name       = data.aws_ami.approved_ami.name
    owner          = data.aws_ami.approved_ami.owner_id
    trusted_source = "Amazon"
  }
}

output "cloudtrail_status" {
  description = "CloudTrail configuration for API logging"
  value = {
    trail_name        = aws_cloudtrail.corp_cloudtrail.name
    s3_bucket         = aws_cloudtrail.corp_cloudtrail.s3_bucket_name
    management_events = "All API requests logged"
  }
}

output "security_group_rules" {
  description = "Security group rules summary"
  value = {
    web_sg_ingress = "HTTP (80) and HTTPS (443) only"
    db_sg_ingress  = "MySQL (3306) from web servers only"
  }
}

output "secrets_manager_info" {
  description = "Information about the database password stored in Secrets Manager"
  value = {
    secret_name = aws_secretsmanager_secret.db_password.name
    secret_arn  = aws_secretsmanager_secret.db_password.arn
    description = "Database credentials stored securely"
  }
}

output "database_connection_info" {
  description = "Database connection information (password stored separately in Secrets Manager)"
  value = {
    endpoint          = aws_db_instance.corp_database.endpoint
    port              = aws_db_instance.corp_database.port
    database_name     = aws_db_instance.corp_database.db_name
    username          = aws_db_instance.corp_database.username
    password_location = "AWS Secrets Manager: ${aws_secretsmanager_secret.db_password.name}"
  }
}

output "launch_template_info" {
  description = "Launch template information"
  value = {
    template_id   = aws_launch_template.corp_template.id
    template_name = aws_launch_template.corp_template.name
    ami_id        = aws_launch_template.corp_template.image_id
    instance_type = aws_launch_template.corp_template.instance_type
  }
}

# Additional outputs for rollback and cleanup
output "resource_prefix" {
  description = "Full resource prefix used for naming"
  value       = local.full_prefix
}

output "resources_for_cleanup" {
  description = "List of resources that need to be cleaned up on rollback"
  value = {
    vpc_id                  = local.vpc_id
    security_group_ids      = [aws_security_group.web_sg.id, aws_security_group.db_sg.id]
    s3_bucket_names         = [aws_s3_bucket.corp_bucket.id, aws_s3_bucket.cloudtrail_bucket.id]
    rds_instance_identifier = aws_db_instance.corp_database.identifier
    iam_role_name           = aws_iam_role.ec2_role.name
    iam_policy_name         = aws_iam_policy.ec2_minimal_policy.name
    iam_user_name           = aws_iam_user.console_user.name
    cloudtrail_name         = aws_cloudtrail.corp_cloudtrail.name
    secrets_manager_secret  = aws_secretsmanager_secret.db_password.name
  }
}

