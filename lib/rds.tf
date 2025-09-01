resource "aws_db_instance" "main" {
  identifier             = "main-database"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.rds_encryption.arn
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  db_name  = "maindb"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(var.common_tags, {
    Name = "main-database"
  })
}