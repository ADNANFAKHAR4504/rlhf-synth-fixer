# rds.tf - RDS PostgreSQL with encryption and SSL enforcement

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "payment-db-subnet-group-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "payment-db-subnet-group-${var.environment_suffix}-${substr(random_id.suffix.hex, 0, 8)}"
  }
}

# DB Parameter Group with SSL Enforcement
resource "aws_db_parameter_group" "postgres" {
  name   = "payment-postgres-params-${var.environment_suffix}"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "payment-postgres-params-${var.environment_suffix}"
  }
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name_prefix = "rds-${var.environment_suffix}-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Deny all outbound by default"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "rds-sg-${var.environment_suffix}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Security Group Rule for RDS to accept Lambda connections
resource "aws_security_group_rule" "rds_from_lambda" {
  type                     = "ingress"
  description              = "PostgreSQL from Lambda"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.lambda.id
  security_group_id        = aws_security_group.rds.id
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier     = "payment-db-${var.environment_suffix}"
  engine         = "postgres"
  engine_version = "15.15"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = "paymentdb"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az                = true
  publicly_accessible     = false
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "payment-db-${var.environment_suffix}"
  }
}
