output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.main.invoke_url}"
}

output "health_check_endpoint" {
  description = "Health check endpoint"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/health"
}

output "data_processor_endpoint" {
  description = "Data processor endpoint"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/process"
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
  sensitive   = true
}

output "rds_cluster_reader_endpoint" {
  description = "RDS cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
  sensitive   = true
}

output "lambda_function_names" {
  description = "Names of deployed Lambda functions"
  value = [
    aws_lambda_function.health_check.function_name,
    aws_lambda_function.data_processor.function_name
  ]
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = data.aws_availability_zones.available.names
}