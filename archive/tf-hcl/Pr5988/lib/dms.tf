resource "aws_dms_replication_subnet_group" "main" {
  count                                = terraform.workspace == "production" ? 1 : 0
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "dms-subnet-group-${var.environment_suffix}"
  })
}

resource "aws_dms_replication_instance" "main" {
  count                       = terraform.workspace == "production" ? 1 : 0
  replication_instance_id     = "dms-instance-${var.environment_suffix}"
  replication_instance_class  = "dms.t3.medium"
  allocated_storage           = 50
  vpc_security_group_ids      = [aws_security_group.dms[0].id]
  replication_subnet_group_id = aws_dms_replication_subnet_group.main[0].id
  publicly_accessible         = false
  engine_version              = "3.4.7"

  tags = merge(local.common_tags, {
    Name = "dms-instance-${var.environment_suffix}"
  })
}

resource "aws_dms_endpoint" "source" {
  count         = terraform.workspace == "production" ? 1 : 0
  endpoint_id   = "dms-source-${var.environment_suffix}"
  endpoint_type = "source"
  engine_name   = "postgres"
  username      = var.db_username
  password      = var.db_password
  server_name   = "legacy-db.internal"
  port          = 5432
  database_name = "appdb"
  ssl_mode      = "require"

  tags = merge(local.common_tags, {
    Name = "dms-source-${var.environment_suffix}"
  })
}

resource "aws_dms_endpoint" "target" {
  count         = terraform.workspace == "production" ? 1 : 0
  endpoint_id   = "dms-target-${var.environment_suffix}"
  endpoint_type = "target"
  engine_name   = "aurora-postgresql"
  username      = var.db_username
  password      = var.db_password
  server_name   = aws_rds_cluster.aurora[0].endpoint
  port          = 5432
  database_name = "appdb"
  ssl_mode      = "require"

  tags = merge(local.common_tags, {
    Name = "dms-target-${var.environment_suffix}"
  })
}

resource "aws_dms_replication_task" "main" {
  count                    = terraform.workspace == "production" ? 1 : 0
  replication_task_id      = "dms-task-${var.environment_suffix}"
  migration_type           = "full-load-and-cdc"
  replication_instance_arn = aws_dms_replication_instance.main[0].replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source[0].endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target[0].endpoint_arn
  table_mappings = jsonencode({
    rules = [{
      rule-type = "selection"
      rule-id   = "1"
      rule-name = "1"
      object-locator = {
        schema-name = "public"
        table-name  = "%"
      }
      rule-action = "include"
    }]
  })

  tags = merge(local.common_tags, {
    Name = "dms-task-${var.environment_suffix}"
  })
}

resource "aws_rds_cluster" "aurora" {
  count                  = terraform.workspace == "production" ? 1 : 0
  cluster_identifier     = "aurora-cluster-${var.environment_suffix}"
  engine                 = "aurora-postgresql"
  engine_mode            = "provisioned"
  engine_version         = "15.3"
  database_name          = "appdb"
  master_username        = var.db_username
  master_password        = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.aurora[0].name
  vpc_security_group_ids = [aws_security_group.app.id]
  skip_final_snapshot    = true

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  tags = merge(local.common_tags, {
    Name = "aurora-cluster-${var.environment_suffix}"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = terraform.workspace == "production" ? 1 : 0
  identifier         = "aurora-instance-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora[0].id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora[0].engine
  engine_version     = aws_rds_cluster.aurora[0].engine_version

  tags = merge(local.common_tags, {
    Name = "aurora-instance-${var.environment_suffix}"
  })
}

resource "aws_db_subnet_group" "aurora" {
  count      = terraform.workspace == "production" ? 1 : 0
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  })
}
