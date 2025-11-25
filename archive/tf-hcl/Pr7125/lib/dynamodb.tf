resource "aws_dynamodb_table" "transaction_records" {
  name         = "transaction-records-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "transaction-records-${var.environment_suffix}"
  }
}

resource "aws_dynamodb_table" "reconciliation_results" {
  name         = "reconciliation-results-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "reconciliation_id"
  range_key    = "timestamp"

  attribute {
    name = "reconciliation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "reconciliation-results-${var.environment_suffix}"
  }
}
