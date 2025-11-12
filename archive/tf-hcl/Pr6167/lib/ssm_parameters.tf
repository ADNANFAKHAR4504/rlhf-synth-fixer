# Application configuration parameters
resource "aws_ssm_parameter" "app_config_database_host" {
  name  = "/trading-app/${var.environment_suffix}/database/host"
  type  = "String"
  value = aws_rds_cluster.main.endpoint

  tags = {
    Name = "app-config-db-host-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_database_port" {
  name  = "/trading-app/${var.environment_suffix}/database/port"
  type  = "String"
  value = "5432"

  tags = {
    Name = "app-config-db-port-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_log_level" {
  name  = "/trading-app/${var.environment_suffix}/logging/level"
  type  = "String"
  value = "INFO"

  tags = {
    Name = "app-config-log-level-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_cache_ttl" {
  name  = "/trading-app/${var.environment_suffix}/cache/ttl"
  type  = "String"
  value = "300"

  tags = {
    Name = "app-config-cache-ttl-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_api_endpoint" {
  name  = "/trading-app/${var.environment_suffix}/api/endpoint"
  type  = "String"
  value = "https://${aws_lb.main.dns_name}"

  tags = {
    Name = "app-config-api-endpoint-${var.environment_suffix}"
  }
}

resource "aws_ssm_parameter" "app_config_max_connections" {
  name  = "/trading-app/${var.environment_suffix}/database/max_connections"
  type  = "String"
  value = "100"

  tags = {
    Name = "app-config-max-connections-${var.environment_suffix}"
  }
}