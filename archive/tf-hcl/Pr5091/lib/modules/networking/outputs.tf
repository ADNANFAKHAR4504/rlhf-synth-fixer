output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "lambda_sg_id" {
  description = "Lambda security group ID"
  value       = aws_security_group.lambda.id
}

output "elasticache_sg_id" {
  description = "ElastiCache security group ID"
  value       = aws_security_group.elasticache.id
}

output "opensearch_sg_id" {
  description = "OpenSearch security group ID"
  value       = aws_security_group.opensearch.id
}
