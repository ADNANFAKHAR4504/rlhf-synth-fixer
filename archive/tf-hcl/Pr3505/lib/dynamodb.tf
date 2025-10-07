resource "aws_dynamodb_table" "webhook_logs" {
  name         = "${local.resource_prefix}-webhook-logs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "webhook_id"
  range_key    = "timestamp"

  attribute {
    name = "webhook_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "source"
    type = "S"
  }

  global_secondary_index {
    name            = "status-timestamp-index"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "source-timestamp-index"
    hash_key        = "source"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = local.common_tags
}