resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "${var.app_name}-redis-subnet-group"
  subnet_ids = aws_subnet.private_subnets[*].id
}

resource "aws_security_group" "redis_sg" {
  name        = "${var.app_name}-redis-sg"
  description = "Security group for Redis ElastiCache"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-redis-sg"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "redis_cache" {
  cluster_id           = "${var.app_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis6.x"
  engine_version       = "6.x"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name        = "${var.app_name}-redis"
    Environment = var.environment
  }
}