# DynamoDB table for Lambda in current region
resource "aws_dynamodb_table" "transactions" {
  provider         = aws.primary
  name             = "${local.resource_prefix}-transactions-${local.current_region}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transaction_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-transactions-${local.current_region}"
    }
  )
}
