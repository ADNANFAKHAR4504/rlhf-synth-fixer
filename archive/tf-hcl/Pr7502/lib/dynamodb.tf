# DynamoDB table for storing processed events
resource "aws_dynamodb_table" "processed_events" {
  name         = "${var.project_name}-${var.dynamodb_table_name}-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "timestamp"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "payment_provider"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "PaymentProviderIndex"
    hash_key        = "payment_provider"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    enabled        = false
    attribute_name = ""
  }

  tags = {
    Name = "${var.project_name}-${var.dynamodb_table_name}-${var.environment_suffix}"
  }
}
