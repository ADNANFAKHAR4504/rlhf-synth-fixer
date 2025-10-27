# ElastiCache Redis Multi-AZ Cluster with Automatic Failover

## Overview

Production-ready Terraform infrastructure deploying AWS ElastiCache Redis replication group with automatic failover, Multi-AZ deployment, encryption in-transit and at-rest, CloudWatch monitoring, and automatic backup configuration across multiple availability zones in ap-south-1.

## Architecture

- **Primary Node**: Redis master node in ap-south-1a
- **Replica Nodes**: 2 read replicas distributed across ap-south-1a and ap-south-1b
- **High Availability**: Automatic failover enabled with Multi-AZ deployment
- **Security**: VPC isolation, security group restrictions, encryption everywhere
- **Monitoring**: CloudWatch logs and alarms for CPU and memory utilization
- **Backup**: Daily automated backups with 7-day retention

---

```
# main.tf
# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Variables
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for tagging and identification"
  type        = string
  default     = "myproject"
}

variable "owner" {
  description = "Owner of the resources for tagging"
  type        = string
  default     = "devops-team"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "internal_cidr_block" {
  description = "Internal network CIDR block allowed to access Redis"
  type        = string
  default     = "10.0.0.0/16"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"  # Latest stable version as of configuration
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (primary + replicas)"
  type        = number
  default     = 3  # 1 primary + 2 replicas
}

variable "backup_retention_days" {
  description = "Number of days to retain automatic backups"
  type        = number
  default     = 7
}

# =============================================================================
# Locals
# =============================================================================

locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    ManagedBy   = "terraform"
    CreatedAt   = timestamp()
  }
  
  cluster_name = "${var.project_name}-${var.environment}-redis-${random_string.suffix.result}"
  
  # Maintenance window configuration
  maintenance_window = "sun:03:00-sun:04:00"  # Sunday 3:00-4:00 AM UTC
  
  # Backup window (1 hour before maintenance)
  backup_window = "02:00-03:00"  # 2:00-3:00 AM UTC
  
  # Select first 3 AZs for high availability
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# =============================================================================
# Random String for Unique Naming
# =============================================================================

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# =============================================================================
# VPC Resources
# =============================================================================

resource "aws_vpc" "redis" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc-${random_string.suffix.result}"
    }
  )
}

# =============================================================================
# Subnet Resources (Multi-AZ for High Availability)
# =============================================================================

resource "aws_subnet" "redis" {
  count             = 3
  vpc_id            = aws_vpc.redis.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = local.azs[count.index]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-subnet-${count.index + 1}-${random_string.suffix.result}"
      AZ   = local.azs[count.index]
    }
  )
}

# =============================================================================
# Internet Gateway
# =============================================================================

resource "aws_internet_gateway" "redis" {
  vpc_id = aws_vpc.redis.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-igw-${random_string.suffix.result}"
    }
  )
}

# =============================================================================
# Route Table
# =============================================================================

resource "aws_route_table" "redis" {
  vpc_id = aws_vpc.redis.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-rt-${random_string.suffix.result}"
    }
  )
}

# =============================================================================
# Route Table Associations
# =============================================================================

resource "aws_route_table_association" "redis" {
  count          = 3
  subnet_id      = aws_subnet.redis[count.index].id
  route_table_id = aws_route_table.redis.id
}

# =============================================================================
# Security Group
# =============================================================================

resource "aws_security_group" "redis" {
  name        = "${local.cluster_name}-sg"
  description = "Security group for ElastiCache Redis cluster"
  vpc_id      = aws_vpc.redis.id

  ingress {
    description = "Redis port from internal network"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.internal_cidr_block]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-sg"
    }
  )
}

# =============================================================================
# ElastiCache Subnet Group
# =============================================================================

resource "aws_elasticache_subnet_group" "redis" {
  name        = "${local.cluster_name}-subnet-group"
  description = "Subnet group for ElastiCache Redis cluster spanning multiple AZs"
  subnet_ids  = aws_subnet.redis[*].id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-subnet-group"
    }
  )
}

# =============================================================================
# ElastiCache Parameter Group
# =============================================================================

resource "aws_elasticache_parameter_group" "redis" {
  family      = "redis7"
  name        = "${local.cluster_name}-params"
  description = "Custom parameter group for Redis cluster with enhanced security"

  # Set timeout for idle connections (5 minutes)
  parameter {
    name  = "timeout"
    value = "300"
  }

  # Enable TCP keepalive
  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-params"
    }
  )
}

# =============================================================================
# CloudWatch Log Groups for Redis Logs
# =============================================================================

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/${local.cluster_name}/slow-log"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.cluster_name}-slow-log"
      LogType  = "redis-slow-log"
    }
  )
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name              = "/aws/elasticache/${local.cluster_name}/engine-log"
  retention_in_days = 7

  tags = merge(
    local.common_tags,
    {
      Name     = "${local.cluster_name}-engine-log"
      LogType  = "redis-engine-log"
    }
  )
}

# =============================================================================
# ElastiCache Replication Group
# =============================================================================

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = local.cluster_name
  description               = "Redis cluster with automatic failover for ${var.project_name}"
  
  # Engine configuration
  engine                    = "redis"
  engine_version           = var.redis_engine_version
  node_type                = var.node_type
  parameter_group_name     = aws_elasticache_parameter_group.redis.name
  port                     = 6379

  # High availability configuration
  num_cache_clusters       = var.num_cache_clusters
  automatic_failover_enabled = true
  multi_az_enabled         = true

  # Network configuration
  subnet_group_name        = aws_elasticache_subnet_group.redis.name
  security_group_ids       = [aws_security_group.redis.id]

  # Security configuration
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  # Backup configuration
  snapshot_retention_limit = var.backup_retention_days
  snapshot_window         = local.backup_window
  final_snapshot_identifier = "${local.cluster_name}-final-snapshot"

  # Maintenance configuration
  maintenance_window      = local.maintenance_window
  auto_minor_version_upgrade = true

  # Log configuration
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "engine-log"
  }

  tags = merge(
    local.common_tags,
    {
      Name              = local.cluster_name
      Type              = "redis-replication-group"
      BackupRetention   = var.backup_retention_days
      HighAvailability  = "enabled"
    }
  )

  apply_immediately = true
  
  depends_on = [
    aws_elasticache_parameter_group.redis,
    aws_elasticache_subnet_group.redis,
    aws_security_group.redis
  ]
}

# =============================================================================
# CloudWatch Alarms for Monitoring
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${local.cluster_name}-cpu-utilization"
  alarm_description   = "Alert when Redis CPU exceeds 75%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-cpu-alarm"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "memory_utilization" {
  alarm_name          = "${local.cluster_name}-memory-utilization"
  alarm_description   = "Alert when Redis memory exceeds 85%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  
  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.cluster_name}-memory-alarm"
    }
  )
}

# =============================================================================
# Outputs
# =============================================================================

output "redis_primary_endpoint_address" {
  description = "Address of the primary endpoint for the Redis replication group"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "redis_reader_endpoint_address" {
  description = "Address of the reader endpoint for the Redis replication group"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "redis_configuration_endpoint" {
  description = "Configuration endpoint for the Redis replication group"
  value       = aws_elasticache_replication_group.redis.configuration_endpoint_address
}

output "redis_security_group_id" {
  description = "ID of the security group attached to the Redis cluster"
  value       = aws_security_group.redis.id
}

output "redis_replication_group_id" {
  description = "ID of the Redis replication group"
  value       = aws_elasticache_replication_group.redis.id
}

output "redis_parameter_group_name" {
  description = "Name of the parameter group used by the Redis cluster"
  value       = aws_elasticache_parameter_group.redis.name
}

output "redis_subnet_group_name" {
  description = "Name of the subnet group used by the Redis cluster"
  value       = aws_elasticache_subnet_group.redis.name
}

output "redis_cluster_name" {
  description = "Generated name of the Redis cluster"
  value       = local.cluster_name
}

output "vpc_id" {
  description = "VPC ID where Redis cluster is deployed"
  value       = aws_vpc.redis.id
}

output "subnet_ids" {
  description = "Subnet IDs used by the Redis cluster"
  value       = aws_subnet.redis[*].id
}

output "availability_zones" {
  description = "Availability zones used by the Redis cluster"
  value       = aws_subnet.redis[*].availability_zone
}

output "aws_account_id" {
  description = "AWS Account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_region" {
  description = "AWS Region where resources are deployed"
  value       = data.aws_region.current.name
}

```

---

## Outputs

- `redis_primary_endpoint_address`: Primary endpoint for write operations
- `redis_reader_endpoint_address`: Reader endpoint for read operations
- `redis_configuration_endpoint`: Configuration endpoint for cluster discovery
- `redis_security_group_id`: Security group ID for network access control
- `redis_replication_group_id`: Replication group identifier
- `redis_parameter_group_name`: Parameter group name
- `redis_subnet_group_name`: Subnet group name
- `redis_cluster_name`: Generated unique cluster name
- `aws_account_id`: AWS account ID
- `aws_region`: AWS region (ap-south-1)

---

## Deployment

```
terraform init
terraform plan
terraform apply
terraform destroy  # Creates final snapshot before deletion
```