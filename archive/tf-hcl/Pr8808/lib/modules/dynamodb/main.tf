terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = "~> 5.0"
      configuration_aliases = [aws.primary, aws.dr]
    }
  }
}

variable "environment_suffix" { type = string }
variable "primary_region" { type = string }
variable "dr_region" { type = string }

resource "aws_dynamodb_table" "sessions" {
  provider         = aws.primary
  name             = "transaction-sessions-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "session_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "session_id"
    type = "S"
  }

  replica {
    region_name = var.dr_region
  }

  tags = {
    Name = "transaction-sessions-${var.environment_suffix}"
  }
}

output "table_name" { value = aws_dynamodb_table.sessions.name }
output "table_arn" { value = aws_dynamodb_table.sessions.arn }
