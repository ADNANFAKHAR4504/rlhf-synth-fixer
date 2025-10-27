resource "aws_dynamodb_table" "feature_flags" {
  name             = "${var.name_prefix}-flags"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "flag_id"
  range_key        = "version"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "flag_id"
    type = "S"
  }

  attribute {
    name = "version"
    type = "N"
  }

  attribute {
    name = "service_name"
    type = "S"
  }

  global_secondary_index {
    name            = "service-index"
    hash_key        = "service_name"
    range_key       = "version"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.is_production
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  dynamic "replica" {
    for_each = var.replica_regions
    content {
      region_name            = replica.value
      kms_key_arn            = var.replica_kms_keys[replica.value]
      point_in_time_recovery = var.is_production
      propagate_tags         = true
    }
  }

  ttl {
    attribute_name = "ttl"
    enabled        = !var.is_production
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-feature-flags"
    }
  )

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "stream_processor" {
  name_prefix = "${var.name_prefix}-stream-processor-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "stream_processor" {
  role = aws_iam_role.stream_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams"
        ]
        Resource = [
          aws_dynamodb_table.feature_flags.stream_arn,
          "${aws_dynamodb_table.feature_flags.stream_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.feature_flags.arn
      }
    ]
  })
}
