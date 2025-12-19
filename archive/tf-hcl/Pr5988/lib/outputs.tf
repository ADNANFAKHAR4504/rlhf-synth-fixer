output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

output "flow_logs_group" {
  description = "VPC Flow Logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "alb_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "migration_commands" {
  description = "Commands for managing the migration"
  value       = <<-EOT
    # Switch to legacy workspace
    terraform workspace select legacy

    # Switch to production workspace
    terraform workspace select production

    # Start DMS replication task
    aws dms start-replication-task --replication-task-arn <task-arn> --start-replication-task-type start-replication

    # Stop DMS replication task
    aws dms stop-replication-task --replication-task-arn <task-arn>
  EOT
}

output "traffic_shifting_instructions" {
  description = "Instructions for shifting traffic between environments"
  value       = <<-EOT
    # Shift 25% traffic to production
    terraform apply -var="legacy_traffic_weight=75" -var="production_traffic_weight=25"

    # Shift 50% traffic to production
    terraform apply -var="legacy_traffic_weight=50" -var="production_traffic_weight=50"

    # Shift 100% traffic to production
    terraform apply -var="legacy_traffic_weight=0" -var="production_traffic_weight=100"

    # Rollback to legacy
    terraform apply -var="legacy_traffic_weight=100" -var="production_traffic_weight=0"
  EOT
}

output "parameter_store_paths" {
  description = "Parameter Store paths for configuration"
  value = {
    database_endpoint = "/${terraform.workspace}/database/endpoint"
    application_url   = "/${terraform.workspace}/application/url"
    migration_status  = "/${terraform.workspace}/migration/status"
  }
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=migration-dashboard-${var.environment_suffix}"
}
