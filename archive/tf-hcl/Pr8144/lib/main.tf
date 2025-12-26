# ============================================================================
# DYNAMODB TABLE - Payment Transactions
# ============================================================================

resource "aws_dynamodb_table" "payment_transactions" {
  name         = "payment-transaction"
  billing_mode = "PAY_PER_REQUEST" # On-demand billing mode

  # Primary key configuration
  hash_key  = "transaction_id"
  range_key = "timestamp"

  # Attribute definitions for all keys used in table and indexes
  attribute {
    name = "transaction_id"
    type = "S" # String
  }

  attribute {
    name = "timestamp"
    type = "N" # Number
  }

  attribute {
    name = "date"
    type = "S" # String
  }

  attribute {
    name = "amount"
    type = "N" # Number
  }

  # Global Secondary Index for date-based queries
  global_secondary_index {
    name            = "date-index"
    hash_key        = "date"
    range_key       = "amount"
    projection_type = "ALL" # Project all attributes to the index
  }

  # Enable point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption using AWS managed keys
  server_side_encryption {
    enabled = true
  }

  # Time to Live configuration for automatic data expiration
  ttl {
    enabled        = true
    attribute_name = "expiration_time"
  }

  # Required tags for cost allocation and access control
  tags = {
    Environment = "prod"
    Department  = "finance"
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

# Output the table ARN for IAM policies and application configuration
output "payment_transactions_table_arn" {
  description = "The ARN of the payment transactions DynamoDB table"
  value       = aws_dynamodb_table.payment_transactions.arn
}

# Output the GSI name for reporting Lambda functions
output "date_index_name" {
  description = "The name of the global secondary index for date-based queries"
  value       = "date-index"
}