resource "aws_dynamodb_table" "subscriptions" {
  name         = "${var.project_name}-subscriptions-${local.env_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subscription_id"
  range_key    = "customer_id"

  attribute {
    name = "subscription_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "renewal_date"
    type = "S"
  }

  global_secondary_index {
    name            = "renewal-date-index"
    hash_key        = "renewal_date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-subscriptions"
    Environment = local.env_suffix
  }
}
