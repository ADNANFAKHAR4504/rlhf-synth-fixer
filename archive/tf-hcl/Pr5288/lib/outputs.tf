# outputs.tf - Output Values (Environment Context via Workspaces)

# ================================
# VPC OUTPUTS
# ================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}

# ================================
# SUBNET OUTPUTS
# ================================

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# ================================
# LOAD BALANCER OUTPUTS
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

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

# ================================
# APPLICATION URL
# ================================

output "application_url" {
  description = "URL to access the healthcare application"
  value       = "http://${aws_lb.main.dns_name}"
}

# ================================
# DATABASE OUTPUTS
# ================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Name of the database"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ec2_security_group_id" {
  description = "ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# ================================
# AUTO SCALING OUTPUTS
# ================================

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.main.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.main.id
}

# ================================
# KMS OUTPUTS
# ================================

output "kms_key_id" {
  description = "ID of the KMS key for RDS encryption"
  value       = aws_kms_key.rds_encryption.key_id
  sensitive   = true
}

output "kms_key_arn" {
  description = "ARN of the KMS key for RDS encryption"
  value       = aws_kms_key.rds_encryption.arn
  sensitive   = true
}

# ================================
# MONITORING OUTPUTS
# ================================

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

# ================================
# ENVIRONMENT CONFIGURATION SUMMARY
# ================================

output "environment_config" {
  description = "Configuration summary for current environment"
  value = {
    environment         = var.environment
    vpc_cidr           = local.current_config.vpc_cidr
    instance_type      = local.current_config.instance_type
    backup_retention   = local.current_config.backup_retention
    deletion_protection = local.current_config.deletion_protection
    workspace          = terraform.workspace
  }
}