output "endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "reader_endpoint" {
  description = "Redis reader endpoint"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.redis.port
}

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.redis.id
}
