# DynamoDB Global Table

resource "aws_dynamodb_table" "main" {
  name             = "${var.project_name}-dynamodb-${var.environment}-${var.resource_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "id"
    type = "S"
  }

  replica {
    region_name = var.secondary_region
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-global"
    Environment = var.environment
    Purpose     = "Global table for DR"
  }
}

