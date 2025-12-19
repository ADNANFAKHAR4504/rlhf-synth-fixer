# ===========================================
# COMPREHENSIVE TERRAFORM OUTPUTS
# ===========================================
# This file contains all outputs for testing and integration purposes

# ===========================================
# ENVIRONMENT INFORMATION
# ===========================================

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.id
}

output "project_name" {
  description = "Project name"
  value       = local.project_name
}

# ===========================================
# VPC AND NETWORKING
# ===========================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "availability_zones" {
  description = "Availability zones used"
  value       = module.vpc.availability_zones
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = module.vpc.internet_gateway_id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = module.vpc.nat_gateway_id
}

output "nat_gateway_ip" {
  description = "NAT Gateway public IP"
  value       = module.vpc.nat_gateway_ip
}

# ===========================================
# LOAD BALANCER
# ===========================================

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "alb_zone_id" {
  description = "ALB Zone ID for Route53 alias records"
  value       = module.alb.alb_zone_id
}

output "alb_target_group_arn" {
  description = "ALB Target Group ARN"
  value       = module.alb.target_group_arn
}

output "alb_url" {
  description = "Complete ALB URL"
  value       = "http://${module.alb.alb_dns_name}"
}

# ===========================================
# AUTO SCALING GROUP
# ===========================================

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = module.asg.asg_name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = module.asg.asg_arn
}

output "launch_template_id" {
  description = "Launch Template ID"
  value       = module.asg.launch_template_id
}

output "asg_min_size" {
  description = "ASG minimum size"
  value       = var.asg_min
}

output "asg_max_size" {
  description = "ASG maximum size"
  value       = var.asg_max
}

# ===========================================
# RDS DATABASE
# ===========================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.endpoint
}

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = module.rds.instance_id
}

output "rds_arn" {
  description = "RDS instance ARN"
  value       = module.rds.instance_arn
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.port
}

output "rds_engine" {
  description = "RDS engine type"
  value       = module.rds.engine
}

output "rds_engine_version" {
  description = "RDS engine version"
  value       = module.rds.engine_version
}

output "rds_db_name" {
  description = "RDS database name"
  value       = module.rds.db_name
}

output "db_subnet_group_name" {
  description = "RDS DB subnet group name"
  value       = module.rds.db_subnet_group_name
}

# ===========================================
# S3 STORAGE
# ===========================================

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = module.s3.bucket_domain_name
}

output "s3_bucket_region" {
  description = "S3 bucket region"
  value       = module.s3.bucket_region
}

# ===========================================
# SECURITY
# ===========================================

output "security_group_ids" {
  description = "Security Group IDs"
  value = {
    alb_sg_id = module.security_groups.alb_sg_id
    ec2_sg_id = module.security_groups.ec2_sg_id
    rds_sg_id = module.security_groups.rds_sg_id
  }
}

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.kms.key_arn
}

output "kms_key_alias_arn" {
  description = "KMS key alias ARN"
  value       = module.kms.key_alias_arn
}

# ===========================================
# TESTING AND INTEGRATION HELPERS
# ===========================================

output "ssh_bastion_info" {
  description = "Information for connecting to instances (if needed)"
  value = {
    security_group_id = module.security_groups.ec2_sg_id
    subnets           = module.vpc.private_subnet_ids
    instance_type     = var.instance_type
  }
}

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure for testing"
  value = {
    environment  = var.environment
    region       = data.aws_region.current.id
    vpc_id       = module.vpc.vpc_id
    alb_url      = "http://${module.alb.alb_dns_name}"
    rds_endpoint = module.rds.endpoint
    s3_bucket    = module.s3.bucket_name
    asg_name     = module.asg.asg_name
  }
}

# ===========================================
# TESTING ENDPOINTS
# ===========================================

output "test_endpoints" {
  description = "Key endpoints for testing the deployed infrastructure"
  value = {
    web_application = "http://${module.alb.alb_dns_name}"
    health_check    = "http://${module.alb.alb_dns_name}/health"
    api_endpoint    = "http://${module.alb.alb_dns_name}/api"
    rds_connection  = "${module.rds.endpoint}:${module.rds.port}"
  }
}

output "aws_cli_commands" {
  description = "Useful AWS CLI commands for testing"
  value = {
    describe_instances = "aws ec2 describe-instances --filters 'Name=tag:Name,Values=dev-payments-ec2' --region ${data.aws_region.current.id}"
    check_rds_status   = "aws rds describe-db-instances --db-instance-identifier ${module.rds.instance_id} --region ${data.aws_region.current.id}"
    list_s3_objects    = "aws s3 ls s3://${module.s3.bucket_name}/ --region ${data.aws_region.current.id}"
    check_alb_health   = "aws elbv2 describe-target-health --target-group-arn ${module.alb.target_group_arn} --region ${data.aws_region.current.id}"
  }
}
