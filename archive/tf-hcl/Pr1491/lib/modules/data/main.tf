# Generate password if not provided
resource "random_password" "db" {
  length      = 16
  special     = false
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
}

locals {
  effective_db_password = var.db_password != "" ? var.db_password : random_password.db.result
}

# DynamoDB Tables (primary and secondary)
resource "aws_dynamodb_table" "primary" {
  name             = "tap-stack-table-${var.resource_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "primary-dynamodb-table"
  })
}

resource "aws_dynamodb_table" "secondary" {
  provider         = aws.eu_central_1
  name             = "tap-stack-table-${var.resource_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(var.tags, {
    Name = "secondary-dynamodb-table"
  })
}

# RDS Subnet Groups (conditional)
resource "aws_db_subnet_group" "primary" {
  count      = var.create_vpcs ? 1 : 0
  name       = "primary-subnet-group-${var.resource_suffix}"
  subnet_ids = [var.primary_public_subnet_id, var.primary_private_subnet_id]

  tags = {
    Name = "primary-db-subnet-group"
  }
}

resource "aws_db_subnet_group" "secondary" {
  count      = var.create_vpcs ? 1 : 0
  provider   = aws.eu_central_1
  name       = "secondary-subnet-group-${var.resource_suffix}"
  subnet_ids = [var.secondary_public_subnet_id, var.secondary_private_subnet_id]

  tags = {
    Name = "secondary-db-subnet-group"
  }
}

# RDS Instances (conditional)
resource "aws_db_instance" "primary" {
  count                  = var.create_vpcs ? 1 : 0
  identifier             = "primary-database-${var.resource_suffix}"
  allocated_storage      = 20
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = var.primary_kms_key_arn
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = "primarydb"
  username               = "admin"
  password               = local.effective_db_password
  multi_az               = true
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.primary[0].name
  vpc_security_group_ids = [var.primary_security_group_id]
  skip_final_snapshot    = true

  tags = merge(var.tags, {
    Name = "primary-rds-instance"
  })
}

resource "aws_db_instance" "secondary" {
  count                  = var.create_vpcs ? 1 : 0
  provider               = aws.eu_central_1
  identifier             = "secondary-database-${var.resource_suffix}"
  allocated_storage      = 20
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = var.secondary_kms_key_arn
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.micro"
  db_name                = "secondarydb"
  username               = "admin"
  password               = local.effective_db_password
  multi_az               = true
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.secondary[0].name
  vpc_security_group_ids = [var.secondary_security_group_id]
  skip_final_snapshot    = true

  tags = merge(var.tags, {
    Name = "secondary-rds-instance"
  })
}
