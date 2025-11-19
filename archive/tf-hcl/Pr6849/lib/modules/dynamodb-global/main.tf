resource "aws_dynamodb_table" "main" {
  provider = aws.primary

  name         = var.table_name
  billing_mode = var.billing_mode
  hash_key     = var.hash_key

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  dynamic "attribute" {
    for_each = var.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  replica {
    region_name = "us-west-2"
  }

  tags = {
    Name = var.table_name
  }

  lifecycle {
    ignore_changes = [replica]
  }
}
