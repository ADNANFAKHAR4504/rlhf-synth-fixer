resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/${terraform.workspace}/database/endpoint"
  type  = "String"
  value = terraform.workspace == "production" ? aws_rds_cluster.aurora[0].endpoint : "legacy-db.internal"

  tags = merge(local.common_tags, {
    Name = "db-endpoint-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_ssm_parameter" "alb_dns" {
  name  = "/${terraform.workspace}/application/url"
  type  = "String"
  value = aws_lb.main.dns_name

  tags = merge(local.common_tags, {
    Name = "alb-dns-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_ssm_parameter" "migration_status" {
  name  = "/${terraform.workspace}/migration/status"
  type  = "String"
  value = terraform.workspace == "production" ? "in-progress" : "pending"

  tags = merge(local.common_tags, {
    Name = "migration-status-${terraform.workspace}-${var.environment_suffix}"
  })
}
