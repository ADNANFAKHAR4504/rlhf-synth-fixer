resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.name_prefix}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${local.name_prefix}-redis-subnet-group"
    Environment = var.environment
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.name_prefix}-redis"
  description                = "Redis cluster for blogging platform cache-aside pattern"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = 2
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false
  snapshot_retention_limit   = 5
  snapshot_window            = "03:00-05:00"

  tags = {
    Name        = "${local.name_prefix}-redis"
    Environment = var.environment
  }
}
