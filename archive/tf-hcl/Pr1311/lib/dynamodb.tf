resource "aws_dynamodb_table" "users" {
  name         = "${var.project_name}-${var.environment_suffix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-users-table"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "orders" {
  name         = "${var.project_name}-${var.environment_suffix}-orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user-id-index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-orders-table"
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "notifications" {
  name         = "${var.project_name}-${var.environment_suffix}-notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notification_id"

  attribute {
    name = "notification_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.pipeline_key.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-notifications-table"
    Environment = var.environment
  }
}