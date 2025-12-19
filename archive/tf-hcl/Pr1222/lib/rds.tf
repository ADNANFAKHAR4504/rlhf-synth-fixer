# DB Subnet Groups
resource "aws_db_subnet_group" "main" {
  for_each = aws_vpc.main

  name       = "${local.project_prefix}-${each.key}-db-subnet-group"
  subnet_ids = [for k, v in aws_subnet.private : v.id if startswith(k, "${each.key}-")]

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-db-subnet-group"
  })
}

# RDS Instances
resource "aws_db_instance" "main" {
  for_each = toset(["dev"]) # Only deploy dev to avoid resource limits

  identifier     = "${local.project_prefix}-${each.key}-database"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds_key.arn

  db_name  = "mydb"
  username = var.db_username
  password = random_password.db_password[each.key].result

  vpc_security_group_ids = [aws_security_group.rds[each.key].id]
  db_subnet_group_name   = aws_db_subnet_group.main[each.key].name

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  skip_final_snapshot = true
  deletion_protection = false

  tags = merge(local.env_tags[each.key], {
    Name = "${local.project_prefix}-${each.key}-database"
  })
}

# Random passwords for RDS
resource "random_password" "db_password" {
  for_each = toset(["dev"])

  length  = 16
  special = true
}