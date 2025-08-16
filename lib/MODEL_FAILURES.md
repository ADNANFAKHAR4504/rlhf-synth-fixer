*** Flaw 1 ***

incomplete replica code for production environment

# Read Replica (Production only)
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0

  identifier = "${var.name_prefix}-db-