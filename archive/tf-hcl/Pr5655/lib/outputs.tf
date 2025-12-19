# outputs.tf - Infrastructure outputs with environment context

# ================================
# NETWORKING OUTPUTS
# ================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets" 
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
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

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "target_group_blue_arn" {
  description = "ARN of the blue target group for blue-green deployments"
  value       = aws_lb_target_group.blue.arn
}

output "target_group_green_arn" {
  description = "ARN of the green target group for blue-green deployments"
  value       = aws_lb_target_group.green.arn
}

# ================================
# ECS OUTPUTS
# ================================

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.main.id
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.app.arn
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "ecs_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

# ================================
# DATABASE OUTPUTS
# ================================

output "rds_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = false
}

output "rds_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = false
}

output "rds_cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "rds_cluster_arn" {
  description = "Aurora cluster ARN"
  value       = aws_rds_cluster.main.arn
}

output "rds_cluster_port" {
  description = "Aurora cluster port"
  value       = aws_rds_cluster.main.port
}

output "rds_cluster_database_name" {
  description = "Aurora cluster database name"
  value       = aws_rds_cluster.main.database_name
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "db_subnet_group_name" {
  description = "Name of the RDS subnet group"
  value       = aws_db_subnet_group.main.name
}

# ================================
# SECRETS OUTPUTS
# ================================

output "db_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "db_credentials_secret_name" {
  description = "Name of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
  sensitive   = false
}

# ================================
# CONTAINER REGISTRY OUTPUTS
# ================================

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.main.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.main.arn
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.main.name
}

# ================================
# ENCRYPTION OUTPUTS
# ================================

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.main.arn
}

output "kms_alias_name" {
  description = "Name of the KMS alias"
  value       = aws_kms_alias.main.name
}

# ================================
# MONITORING OUTPUTS
# ================================

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}

# ================================
# AUTO SCALING OUTPUTS
# ================================

output "autoscaling_target_resource_id" {
  description = "Resource ID of the auto scaling target"
  value       = aws_appautoscaling_target.ecs_target.resource_id
}

output "cpu_autoscaling_policy_arn" {
  description = "ARN of the CPU auto scaling policy"
  value       = aws_appautoscaling_policy.ecs_cpu_policy.arn
}

output "memory_autoscaling_policy_arn" {
  description = "ARN of the memory auto scaling policy"
  value       = aws_appautoscaling_policy.ecs_memory_policy.arn
}

# ================================
# DEPLOYMENT OUTPUTS
# ================================

output "deployment_instructions" {
  description = "Instructions for deploying and updating the application"
  value = {
    ecr_login_command = "aws ecr get-login-password --region ${data.aws_region.current.id} | docker login --username AWS --password-stdin ${aws_ecr_repository.main.repository_url}"
    
    build_and_push = [
      "docker build -t ${aws_ecr_repository.main.name} .",
      "docker tag ${aws_ecr_repository.main.name}:latest ${aws_ecr_repository.main.repository_url}:latest",
      "docker push ${aws_ecr_repository.main.repository_url}:latest"
    ]
    
    update_service = "aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.main.name} --force-new-deployment"
    
    blue_green_deployment = {
      target_group_blue  = aws_lb_target_group.blue.arn
      target_group_green = aws_lb_target_group.green.arn
      listener_arn       = aws_lb_listener.main.arn
    }
    
    monitoring_dashboards = {
      ecs_cluster_url = "https://${data.aws_region.current.id}.console.aws.amazon.com/ecs/home?region=${data.aws_region.current.id}#/clusters/${aws_ecs_cluster.main.name}"
      rds_cluster_url = "https://${data.aws_region.current.id}.console.aws.amazon.com/rds/home?region=${data.aws_region.current.id}#database:id=${aws_rds_cluster.main.cluster_identifier}"
      cloudwatch_url  = "https://${data.aws_region.current.id}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.id}"
    }
  }
}

# ================================
# ENVIRONMENT SUMMARY
# ================================

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    environment        = var.environment
    project_name      = var.project_name
    region            = data.aws_region.current.id
    vpc_cidr          = aws_vpc.main.cidr_block
    availability_zones = data.aws_availability_zones.available.names
    
    ecs_configuration = {
      cluster_name   = aws_ecs_cluster.main.name
      service_name   = aws_ecs_service.main.name
      cpu           = local.current_config.ecs_cpu
      memory        = local.current_config.ecs_memory
      desired_count = local.current_config.ecs_desired_count
      min_capacity  = local.current_config.ecs_min_capacity
      max_capacity  = local.current_config.ecs_max_capacity
    }
    
    database_configuration = {
      cluster_identifier = aws_rds_cluster.main.cluster_identifier
      engine            = aws_rds_cluster.main.engine
      engine_version    = aws_rds_cluster.main.engine_version
      instance_class    = local.current_config.db_instance_class
      backup_retention  = local.current_config.backup_retention
      multi_az          = local.current_config.multi_az
      encryption        = aws_rds_cluster.main.storage_encrypted
    }
    
    security_features = {
      vpc_isolation          = true
      kms_encryption        = true
      secrets_manager       = true
      security_groups       = "least-privilege"
      container_insights    = true
      xray_tracing         = true
      enhanced_monitoring   = true
      deletion_protection   = local.current_config.deletion_protection
    }
    
    high_availability = {
      multi_az_deployment    = true
      auto_scaling_enabled   = true
      blue_green_deployment  = true
      health_checks         = true
      backup_strategy       = "automated"
    }
  }
}