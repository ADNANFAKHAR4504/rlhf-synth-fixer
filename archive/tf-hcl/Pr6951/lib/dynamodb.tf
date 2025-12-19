# DynamoDB Global Tables for Metadata Tracking (Requirements 2, 5)

# DynamoDB table in source region (us-east-1)
resource "aws_dynamodb_table" "metadata" {
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST" # On-demand autoscaling (Requirement 5)
  hash_key         = "DocumentId"
  range_key        = "Timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Enable point-in-time recovery (Requirement 5)
  point_in_time_recovery {
    enabled = true
  }

  # Disable deletion protection for testing/demo
  deletion_protection_enabled = false

  attribute {
    name = "DocumentId"
    type = "S"
  }

  attribute {
    name = "Timestamp"
    type = "N"
  }

  attribute {
    name = "Status"
    type = "S"
  }

  # Global secondary index for status queries
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "Status"
    range_key       = "Timestamp"
    projection_type = "ALL"
  }

  # Replica in target region (eu-west-1) for global table (Requirement 2)
  replica {
    region_name = var.target_region

    point_in_time_recovery = true
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-dynamodb-metadata-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# DynamoDB table for migration tracking
resource "aws_dynamodb_table" "migration_state" {
  provider         = aws.source
  name             = "doc-proc-${var.source_region}-dynamodb-migration-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "MigrationId"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  attribute {
    name = "MigrationId"
    type = "S"
  }

  attribute {
    name = "Phase"
    type = "S"
  }

  global_secondary_index {
    name            = "PhaseIndex"
    hash_key        = "Phase"
    projection_type = "ALL"
  }

  # Replica for global table
  replica {
    region_name = var.target_region

    point_in_time_recovery = true
  }

  tags = {
    Name           = "doc-proc-${var.source_region}-dynamodb-migration-${var.environment_suffix}"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}

# DynamoDB table for Terraform state locking (Constraint 4)
resource "aws_dynamodb_table" "terraform_state_lock" {
  provider     = aws.source
  name         = "terraform-state-lock-${var.environment_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  deletion_protection_enabled = false

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name           = "terraform-state-lock-${var.environment_suffix}"
    Purpose        = "TerraformStateLocking"
    MigrationPhase = var.migration_phase
    CutoverDate    = var.cutover_date
  }
}
