resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.environment}/db/host"
  type  = "String"
  value = aws_db_instance.main.address

  tags = {
    Name    = "${var.environment}-db-host"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_port" {
  name  = "/${var.environment}/db/port"
  type  = "String"
  value = aws_db_instance.main.port

  tags = {
    Name    = "${var.environment}-db-port"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.environment}/db/username"
  type  = "String"
  value = var.db_username

  tags = {
    Name    = "${var.environment}-db-username"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.environment}/db/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name    = "${var.environment}-db-password"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.environment}/db/name"
  type  = "String"
  value = aws_db_instance.main.db_name

  tags = {
    Name    = "${var.environment}-db-name"
    Project = "ProjectX"
  }
}


