# dynamodb.tf

resource "aws_dynamodb_table" "transactions" {
  name         = local.dynamodb_table_name
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "provider"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  # Global Secondary Index for querying by provider and timestamp
  global_secondary_index {
    name            = "ProviderTimestampIndex"
    hash_key        = "provider"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Global Secondary Index for querying by customer
  global_secondary_index {
    name            = "CustomerIndex"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.dynamodb_point_in_time_recovery
  }

  # DynamoDB Streams for audit logging and analytics
  stream_enabled   = var.dynamodb_stream_enabled
  stream_view_type = var.dynamodb_stream_enabled ? "NEW_AND_OLD_IMAGES" : null

  # Server-side encryption with AWS managed keys
  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = local.dynamodb_table_name
    }
  )
}
