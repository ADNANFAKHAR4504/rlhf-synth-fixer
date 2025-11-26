# outputs.tf - Output values for all resources

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

# Aurora Outputs
output "aurora_cluster_id" {
  description = "The ID of the Aurora cluster"
  value       = aws_rds_cluster.aurora.id
}

output "aurora_cluster_endpoint" {
  description = "The cluster endpoint for Aurora"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "The reader endpoint for Aurora"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_cluster_port" {
  description = "The port of the Aurora cluster"
  value       = aws_rds_cluster.aurora.port
}

output "aurora_cluster_database_name" {
  description = "The database name of the Aurora cluster"
  value       = aws_rds_cluster.aurora.database_name
}

output "aurora_secret_arn" {
  description = "The ARN of the Aurora credentials secret"
  value       = aws_secretsmanager_secret.aurora_credentials.arn
  sensitive   = true
}

# DMS Outputs
output "dms_replication_instance_arn" {
  description = "The ARN of the DMS replication instance"
  value       = aws_dms_replication_instance.main.replication_instance_arn
}

output "dms_replication_task_arn" {
  description = "The ARN of the DMS replication task"
  value       = aws_dms_replication_task.migration.replication_task_arn
}

output "dms_source_endpoint_arn" {
  description = "The ARN of the DMS source endpoint"
  value       = aws_dms_endpoint.source.endpoint_arn
}

output "dms_target_endpoint_arn" {
  description = "The ARN of the DMS target endpoint"
  value       = aws_dms_endpoint.target.endpoint_arn
}

# Lambda Outputs
output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.data_transformation.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.data_transformation.arn
}

output "lambda_function_invoke_arn" {
  description = "The invoke ARN of the Lambda function"
  value       = aws_lambda_function.data_transformation.invoke_arn
}

# ALB Outputs
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "The ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_zone_id" {
  description = "The zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "blue_target_group_arn" {
  description = "The ARN of the blue target group"
  value       = aws_lb_target_group.blue.arn
}

output "green_target_group_arn" {
  description = "The ARN of the green target group"
  value       = aws_lb_target_group.green.arn
}

# DynamoDB Outputs
output "session_state_table_name" {
  description = "The name of the session state DynamoDB table"
  value       = aws_dynamodb_table.session_state.name
}

output "session_state_table_arn" {
  description = "The ARN of the session state DynamoDB table"
  value       = aws_dynamodb_table.session_state.arn
}

output "migration_state_table_name" {
  description = "The name of the migration state DynamoDB table"
  value       = aws_dynamodb_table.migration_state.name
}

output "migration_state_table_arn" {
  description = "The ARN of the migration state DynamoDB table"
  value       = aws_dynamodb_table.migration_state.arn
}

# S3 Outputs
output "migration_logs_bucket_name" {
  description = "The name of the migration logs S3 bucket"
  value       = aws_s3_bucket.migration_logs.id
}

output "migration_logs_bucket_arn" {
  description = "The ARN of the migration logs S3 bucket"
  value       = aws_s3_bucket.migration_logs.arn
}

output "alb_logs_bucket_name" {
  description = "The name of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.id
}

output "alb_logs_bucket_arn" {
  description = "The ARN of the ALB logs S3 bucket"
  value       = aws_s3_bucket.alb_logs.arn
}

# Route53 Outputs (only if hosted zone exists)
output "route53_zone_id" {
  description = "The ID of the Route53 hosted zone"
  value       = try(aws_route53_zone.main[0].zone_id, null)
}

output "route53_name_servers" {
  description = "The name servers of the Route53 hosted zone"
  value       = try(aws_route53_zone.main[0].name_servers, null)
}

output "route53_health_check_blue_id" {
  description = "The ID of the Route53 health check for blue environment"
  value       = aws_route53_health_check.blue.id
}

output "route53_health_check_green_id" {
  description = "The ID of the Route53 health check for green environment"
  value       = aws_route53_health_check.green.id
}

# CloudWatch Outputs
output "sns_topic_arn" {
  description = "The ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard_name" {
  description = "The name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.migration.dashboard_name
}

# IAM Outputs (only if roles exist)
output "cross_account_blue_role_arn" {
  description = "The ARN of the cross-account role for blue environment"
  value       = try(aws_iam_role.cross_account_blue[0].arn, null)
}

output "cross_account_green_role_arn" {
  description = "The ARN of the cross-account role for green environment"
  value       = try(aws_iam_role.cross_account_green[0].arn, null)
}

output "lambda_role_arn" {
  description = "The ARN of the Lambda execution role"
  value       = aws_iam_role.lambda.arn
}

output "dms_service_role_arn" {
  description = "The ARN of the DMS service role"
  value       = aws_iam_role.dms_service.arn
}

# Transit Gateway Outputs (only if attachment exists)
output "transit_gateway_attachment_id" {
  description = "The ID of the Transit Gateway VPC attachment"
  value       = try(aws_ec2_transit_gateway_vpc_attachment.main[0].id, null)
}

# VPC Endpoint Outputs
output "vpc_endpoint_s3_id" {
  description = "The ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_dynamodb_id" {
  description = "The ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

# Certificate Outputs
output "acm_certificate_arn" {
  description = "The ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "lambda_security_group_id" {
  description = "The ID of the Lambda security group"
  value       = aws_security_group.lambda.id
}

output "aurora_security_group_id" {
  description = "The ID of the Aurora security group"
  value       = aws_security_group.aurora.id
}

output "dms_security_group_id" {
  description = "The ID of the DMS security group"
  value       = aws_security_group.dms.id
}

# Environment Information
output "environment_suffix" {
  description = "The environment suffix used for resource naming"
  value       = var.environment_suffix
}

output "aws_region" {
  description = "The AWS region where resources are deployed"
  value       = var.aws_region
}

output "project_name" {
  description = "The project name"
  value       = var.project_name
}
