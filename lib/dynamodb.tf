# dynamodb.tf - DynamoDB Global Table configuration

# DynamoDB Table for user profiles with Global Tables
resource "aws_dynamodb_table" "user_profiles" {
  name             = "${var.environment_suffix}-user-profiles"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "userId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Primary key
  attribute {
    name = "userId"
    type = "S"
  }

  # GSI attribute for email lookup
  attribute {
    name = "email"
    type = "S"
  }

  # Global Secondary Index for email lookup
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  # Point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # TTL configuration (optional, for auto-cleanup)
  ttl {
    enabled        = false
    attribute_name = "expiresAt"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.environment_suffix}-user-profiles"
    }
  )
}
