output "api_url" {
  value       = "${aws_api_gateway_stage.api_stage.invoke_url}"
  description = "API Gateway URL"
}

output "dynamodb_table_name" {
  value       = aws_dynamodb_table.search_data.name
  description = "DynamoDB table name"
}

output "redis_endpoint" {
  value       = aws_elasticache_cluster.redis_cache.cache_nodes[0].address
  description = "ElastiCache Redis endpoint"
}

output "dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.main_dashboard.dashboard_name}"
  description = "CloudWatch Dashboard URL"
}

output "event_bus_name" {
  value       = aws_cloudwatch_event_bus.notification_bus.name
  description = "EventBridge Event Bus Name"
}