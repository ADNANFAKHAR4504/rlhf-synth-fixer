# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# VPC Module
module "vpc_module" {
    source = "./modules/vpc_module"
    
    environment = var.environment
    project_name = var.project_name
    vpc_cidr = var.vpc_cidr
    public_subnet_cidrs = var.public_subnet_cidrs
    private_subnet_cidrs = var.private_subnet_cidrs
    enable_nat_gateway = local.current_config.enable_nat_gateway
    enable_flow_logs = local.current_config.enable_flow_logs
    flow_logs_retention_days = var.flow_logs_retention_days
    common_tags = local.common_tags
}

# Security Module
module "security_module" {
    source = "./modules/security_module"

    environment         = var.environment
    project_name        = var.project_name
    vpc_id             = module.vpc_module.vpc_id
    app_port           = var.app_port
    db_port            = var.db_port
    enable_ssh_access  = var.enable_ssh_access
    ssh_allowed_cidrs  = var.ssh_allowed_cidrs
    kms_deletion_window = var.kms_deletion_window
    common_tags        = local.common_tags

    depends_on = [module.vpc_module]
}

# Application Load Balancer Module
module "alb_module" {
    source = "./modules/alb_module"

    environment                = var.environment
    project_name              = var.project_name
    vpc_id                    = module.vpc_module.vpc_id
    public_subnet_ids         = module.vpc_module.public_subnet_ids
    alb_security_group_id     = module.security_module.alb_security_group_id
    target_port               = var.app_port
    target_protocol           = var.target_protocol
    enable_deletion_protection = local.current_config.enable_deletion_protection
    idle_timeout              = var.alb_idle_timeout
    enable_access_logs        = var.enable_alb_access_logs
    access_logs_bucket        = var.alb_access_logs_bucket
    access_logs_prefix        = var.alb_access_logs_prefix
    health_check_path         = var.health_check_path
    health_check_healthy_threshold = var.health_check_healthy_threshold
    health_check_interval     = var.health_check_interval
    health_check_matcher      = var.health_check_matcher
    health_check_timeout      = var.health_check_timeout
    health_check_unhealthy_threshold = var.health_check_unhealthy_threshold
    enable_stickiness         = var.enable_alb_stickiness
    stickiness_duration       = var.alb_stickiness_duration
    enable_cloudwatch_alarms  = var.enable_cloudwatch_alarms
    response_time_threshold   = var.alb_response_time_threshold
    unhealthy_hosts_threshold = var.alb_unhealthy_hosts_threshold
    alarm_actions            = var.alarm_actions
    enable_waf               = var.enable_waf
    waf_web_acl_arn         = var.waf_web_acl_arn
    common_tags             = local.common_tags

    depends_on = [
        module.vpc_module,
        module.security_module
    ]
}

# EC2 Auto Scaling Module
module "ec2_module" {
    source = "./modules/ec2_module"

    environment                = var.environment
    project_name              = var.project_name
    private_subnet_ids        = module.vpc_module.private_subnet_ids
    web_security_group_id     = module.security_module.web_security_group_id
    iam_instance_profile_name = module.security_module.ec2_instance_profile_name
    target_group_arn          = module.alb_module.target_group_arn
    instance_type             = local.current_config.instance_type
    ami_id                    = var.ami_id
    key_pair_name             = var.key_pair_name
    app_port                  = var.app_port
    min_size                  = local.current_config.min_size
    max_size                  = local.current_config.max_size
    desired_capacity          = local.current_config.desired_capacity
    health_check_type         = var.health_check_type
    health_check_grace_period = var.health_check_grace_period
    instance_refresh_min_healthy_percentage = var.instance_refresh_min_healthy_percentage
    instance_warmup           = var.instance_warmup
    termination_policies      = var.termination_policies
    protect_from_scale_in     = var.protect_from_scale_in
    scale_up_adjustment       = var.scale_up_adjustment
    scale_up_cooldown         = var.scale_up_cooldown
    scale_down_adjustment     = var.scale_down_adjustment
    scale_down_cooldown       = var.scale_down_cooldown
    enable_cloudwatch_alarms  = var.enable_cloudwatch_alarms
    cpu_high_threshold        = var.cpu_high_threshold
    cpu_high_evaluation_periods = var.cpu_high_evaluation_periods
    cpu_high_period           = var.cpu_high_period
    cpu_low_threshold         = var.cpu_low_threshold
    cpu_low_evaluation_periods = var.cpu_low_evaluation_periods
    cpu_low_period            = var.cpu_low_period
    alarm_actions             = var.alarm_actions
    ebs_optimized             = var.ebs_optimized
    detailed_monitoring       = var.detailed_monitoring
    block_device_mappings     = var.block_device_mappings
    secrets_manager_secret_name = var.secrets_manager_secret_name
    additional_packages       = var.additional_packages
    log_retention_days        = var.log_retention_days
    enable_notifications      = var.enable_notifications
    notification_emails       = var.notification_emails
    common_tags               = local.common_tags

    depends_on = [module.vpc_module, module.security_module, module.alb_module]
}


# Root Outputs Configuration

# VPC Outputs
output "vpc_id" {
    description = "ID of the VPC"
    value       = module.vpc_module.vpc_id
}

output "vpc_cidr_block" {
    description = "CIDR block of the VPC"
    value       = module.vpc_module.vpc_cidr_block
}

output "public_subnet_ids" {
    description = "IDs of the public subnets"
    value       = module.vpc_module.public_subnet_ids
}

output "private_subnet_ids" {
    description = "IDs of the private subnets"
    value       = module.vpc_module.private_subnet_ids
}

output "availability_zones" {
    description = "List of availability zones used"
    value       = module.vpc_module.availability_zones
}

# Security Outputs
output "alb_security_group_id" {
    description = "ID of the ALB security group"
    value       = module.security_module.alb_security_group_id
}

output "web_security_group_id" {
    description = "ID of the web security group"
    value       = module.security_module.web_security_group_id
}

output "database_security_group_id" {
    description = "ID of the database security group"
    value       = module.security_module.database_security_group_id
}

output "ec2_iam_role_arn" {
    description = "ARN of the EC2 IAM role"
    value       = module.security_module.ec2_iam_role_arn
}

output "kms_key_id" {
    description = "ID of the KMS key"
    value       = module.security_module.kms_key_id
}

# ALB Outputs
output "alb_dns_name" {
    description = "DNS name of the load balancer"
    value       = module.alb_module.alb_dns_name
}

output "alb_zone_id" {
    description = "Canonical hosted zone ID of the load balancer"
    value       = module.alb_module.alb_zone_id
}

output "alb_arn" {
    description = "ARN of the load balancer"
    value       = module.alb_module.alb_arn
}

output "target_group_arn" {
    description = "ARN of the target group"
    value       = module.alb_module.target_group_arn
}

# EC2 Outputs
output "autoscaling_group_name" {
    description = "Name of the Auto Scaling Group"
    value       = module.ec2_module.autoscaling_group_name
}

output "autoscaling_group_arn" {
    description = "ARN of the Auto Scaling Group"
    value       = module.ec2_module.autoscaling_group_arn
}

output "launch_template_id" {
    description = "ID of the launch template"
    value       = module.ec2_module.launch_template_id
}

output "cloudwatch_log_group_name" {
    description = "Name of the CloudWatch log group"
    value       = module.ec2_module.cloudwatch_log_group_name
}

# Application URL
output "application_url" {
    description = "URL to access the application"
    #   value       = var.ssl_certificate_arn != "" ? "https://${module.alb_module.alb_dns_name}" : "http://${module.alb_module.alb_dns_name}"
    value = module.alb_module.alb_dns_name
}

# Environment Information
output "environment" {
    description = "Environment name"
    value       = var.environment
}

output "project_name" {
    description = "Project name"
    value       = var.project_name
}

output "aws_region" {
    description = "AWS region"
    value       = var.aws_region
}