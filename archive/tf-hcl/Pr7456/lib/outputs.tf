# outputs.tf - Infrastructure Outputs

# ================================
# RDS OUTPUTS
# ================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = false
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_identifier" {
  description = "RDS instance identifier"
  value       = aws_db_instance.main.identifier
}

# ================================
# APPLICATION LOAD BALANCER OUTPUTS
# ================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

# ================================
# S3 OUTPUTS
# ================================

output "s3_bucket_name" {
  description = "Name of the S3 bucket for application assets"
  value       = aws_s3_bucket.assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.assets.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.assets.bucket_domain_name
}

# ================================
# ENVIRONMENT SUMMARY
# ================================

output "environment_summary" {
  description = "Summary of deployed environment"
  value = {
    environment       = var.environment_suffix
    project_name      = var.project_name
    region            = var.aws_region
    vpc_id            = aws_vpc.main.id
    vpc_cidr          = aws_vpc.main.cidr_block
    database_endpoint = aws_db_instance.main.endpoint
    alb_dns_name      = aws_lb.main.dns_name
    s3_bucket_name    = aws_s3_bucket.assets.bucket
  }
}

# ================================
# SECURITY OUTPUTS
# ================================

output "security_group_ids" {
  description = "IDs of created security groups"
  value = {
    alb_sg         = aws_security_group.alb.id
    application_sg = aws_security_group.application.id
    rds_sg         = aws_security_group.rds.id
  }
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_key_arns" {
  description = "ARNs of KMS keys for encryption"
  value = {
    rds_kms_key = aws_kms_key.rds_encryption.arn
    s3_kms_key  = aws_kms_key.s3_encryption.arn
  }
}

# ================================
# NETWORKING OUTPUTS
# ================================

output "subnet_ids" {
  description = "IDs of created subnets"
  value = {
    public_subnets   = aws_subnet.public[*].id
    private_subnets  = aws_subnet.private[*].id
    database_subnets = aws_subnet.database[*].id
  }
}

output "nat_gateway_ips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# ================================
# IAM OUTPUTS
# ================================

output "iam_role_arn" {
  description = "ARN of the application IAM role"
  value       = aws_iam_role.app_role.arn
}

output "instance_profile_name" {
  description = "Name of the instance profile"
  value       = aws_iam_instance_profile.app_profile.name
}