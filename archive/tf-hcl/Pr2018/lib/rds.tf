resource "aws_db_subnet_group" "main" {
  name       = "${lower(var.environment_tag)}-db-subnet-group-${random_id.deployment.hex}"
  subnet_ids = aws_subnet.database[*].id
  tags = {
    Name        = "${var.environment_tag}-db-subnet-group-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}

resource "aws_db_instance" "main" {
  identifier              = "${lower(var.environment_tag)}-database-${random_id.deployment.hex}"
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp2"
  storage_encrypted       = true
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = "db.t3.micro"
  db_name                 = "appdb"
  username                = var.db_username
  password                = var.db_password
  vpc_security_group_ids  = [aws_security_group.db.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"
  skip_final_snapshot     = true
  deletion_protection     = false
  tags = {
    Name        = "${var.environment_tag}-database-${random_id.deployment.hex}"
    Environment = var.environment_tag
  }
}