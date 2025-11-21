# Generate random password for RDS
resource "random_password" "db_password" {
  length  = 16
  special = true
  # Exclude characters that might cause issues in connection strings
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# AWS Secrets Manager for secure credential storage
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "rds-credentials-${local.secret_suffix}-${var.resource_suffix}"
  description             = "RDS database credentials"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

resource "aws_db_subnet_group" "default" {
  name       = "main-${var.resource_suffix}"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name            = "DB subnet group-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-sg-${var.resource_suffix}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_sg.id]
    description     = "MySQL access from EC2 instances"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name            = "rds-sg-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}

resource "aws_db_instance" "default" {
  allocated_storage       = 20
  storage_type            = "gp2"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.db_instance_class
  db_name                 = var.db_name
  username                = var.db_username
  password                = random_password.db_password.result
  parameter_group_name    = "default.mysql8.0"
  db_subnet_group_name    = aws_db_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.rds_sg.id]
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"         # UTC
  maintenance_window      = "Mon:04:00-Mon:05:00" # UTC
  identifier              = "mysql-db-${var.resource_suffix}"
  storage_encrypted       = true # Enable encryption at rest

  tags = {
    Name            = "mysql-db-${var.resource_suffix}"
    iac-rlhf-amazon = "true"
  }
}