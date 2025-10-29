# outputs.tf - Output Values with Environment Context

# ================================
# VPC OUTPUTS
# ================================

output "${var.environment}_vpc_id" {
  description = "ID of the VPC for ${var.environment} environment"
  value       = aws_vpc.main.id
}

output "${var.environment}_vpc_cidr_block" {
  description = "CIDR block of the VPC for ${var.environment} environment"
  value       = aws_vpc.main.cidr_block
}

output "${var.environment}_availability_zones" {
  description = "List of availability zones used in ${var.environment} environment"
  value       = data.aws_availability_zones.available.names
}

# ================================
# SUBNET OUTPUTS
# ================================

output "${var.environment}_public_subnet_ids" {
  description = "IDs of public subnets in ${var.environment} environment"
  value       = aws_subnet.public[*].id
}

output "${var.environment}_private_subnet_ids" {
  description = "IDs of private subnets in ${var.environment} environment"
  value       = aws_subnet.private[*].id
}

output "${var.environment}_database_subnet_ids" {
  description = "IDs of database subnets in ${var.environment} environment"
  value       = aws_subnet.database[*].id
}

# ================================
# LOAD BALANCER OUTPUTS
# ================================

output "${var.environment}_alb_dns_name" {
  description = "DNS name of the Application Load Balancer in ${var.environment} environment"
  value       = aws_lb.main.dns_name
}

output "${var.environment}_alb_zone_id" {
  description = "Zone ID of the Application Load Balancer in ${var.environment} environment"
  value       = aws_lb.main.zone_id
}

output "${var.environment}_alb_arn" {
  description = "ARN of the Application Load Balancer in ${var.environment} environment"
  value       = aws_lb.main.arn
}

output "${var.environment}_target_group_arn" {
  description = "ARN of the target group in ${var.environment} environment"
  value       = aws_lb_target_group.main.arn
}

# ================================
# APPLICATION URL
# ================================

output "${var.environment}_application_url" {
  description = "URL to access the healthcare application in ${var.environment} environment"
  value       = "http://${aws_lb.main.dns_name}"
}

# ================================
# DATABASE OUTPUTS
# ================================

output "${var.environment}_rds_endpoint" {
  description = "RDS instance endpoint in ${var.environment} environment"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "${var.environment}_rds_port" {
  description = "RDS instance port in ${var.environment} environment"
  value       = aws_db_instance.main.port
}

output "${var.environment}_database_name" {
  description = "Name of the database in ${var.environment} environment"
  value       = aws_db_instance.main.db_name
}

output "${var.environment}_database_username" {
  description = "Database username in ${var.environment} environment"
  value       = aws_db_instance.main.username
  sensitive   = true
}

# ================================
# SECURITY GROUP OUTPUTS
# ================================

output "${var.environment}_alb_security_group_id" {
  description = "ID of the ALB security group in ${var.environment} environment"
  value       = aws_security_group.alb.id
}

output "${var.environment}_ec2_security_group_id" {
  description = "ID of the EC2 security group in ${var.environment} environment"
  value       = aws_security_group.ec2.id
}

output "${var.environment}_rds_security_group_id" {
  description = "ID of the RDS security group in ${var.environment} environment"
  value       = aws_security_group.rds.id
}

# ================================
# AUTO SCALING OUTPUTS
# ================================

output "${var.environment}_autoscaling_group_name" {
  description = "Name of the Auto Scaling Group in ${var.environment} environment"
  value       = aws_autoscaling_group.main.name
}

output "${var.environment}_launch_template_id" {
  description = "ID of the launch template in ${var.environment} environment"
  value       = aws_launch_template.main.id
}

# ================================
# KMS OUTPUTS
# ================================

output "${var.environment}_kms_key_id" {
  description = "ID of the KMS key for RDS encryption in ${var.environment} environment"
  value       = aws_kms_key.rds_encryption.key_id
  sensitive   = true
}

output "${var.environment}_kms_key_arn" {
  description = "ARN of the KMS key for RDS encryption in ${var.environment} environment"
  value       = aws_kms_key.rds_encryption.arn
  sensitive   = true
}

# ================================
# MONITORING OUTPUTS
# ================================

output "${var.environment}_cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group in ${var.environment} environment"
  value       = aws_cloudwatch_log_group.app_logs.name
}

# ================================
# ENVIRONMENT CONFIGURATION SUMMARY
# ================================

output "${var.environment}_environment_config" {
  description = "Configuration summary for ${var.environment} environment"
  value = {
    environment         = var.environment
    vpc_cidr           = local.current_config.vpc_cidr
    instance_type      = local.current_config.instance_type
    backup_retention   = local.current_config.backup_retention
    deletion_protection = local.current_config.deletion_protection
    workspace          = terraform.workspace
  }
}