resource "aws_dynamodb_table" "search_data" {
  name           = "${var.app_name}-search-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "query"
    type = "S"
  }

  global_secondary_index {
    name               = "QueryIndex"
    hash_key           = "query"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  tags = {
    Name        = "${var.app_name}-search-data"
    Environment = var.environment
  }
}