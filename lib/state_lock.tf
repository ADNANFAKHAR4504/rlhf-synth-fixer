resource "aws_dynamodb_table" "terraform_state_locks" {
  name           = "tap-terraform-locks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"
  stream_enabled = true

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "Terraform State Lock Table"
    Environment = var.environment
    Purpose     = "Infrastructure State Management"
  }

  lifecycle {
    prevent_destroy = true
  }

  timeouts {
    create = "30m"
    update = "30m"
    delete = "30m"
  }

  # Add TTL for cleaning up old locks automatically
  ttl {
    attribute_name = "TimeToExist"
    enabled        = true
  }
}
