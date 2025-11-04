resource "aws_s3_bucket" "flow_logs" {
  provider = aws.hub

  bucket = "shared-us-east-1-s3-flowlogs-${local.env_suffix}"

  tags = merge(
    local.common_tags,
    {
      Name    = "flow-logs-bucket-${local.env_suffix}"
      Purpose = "logging"
    }
  )
}

resource "aws_s3_bucket_public_access_block" "flow_logs" {
  provider = aws.hub

  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "flow_logs" {
  provider = aws.hub

  bucket = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.hub

  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.hub

  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.flow_logs_retention_days
    }
  }
}

resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.hub

  bucket = aws_s3_bucket.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.flow_logs.arn
      }
    ]
  })
}

module "hub_flow_logs" {
  source = "./modules/flow-logs"

  providers = {
    aws = aws.hub
  }

  vpc_id             = module.hub_vpc.vpc_id
  s3_bucket_arn      = aws_s3_bucket.flow_logs.arn
  log_prefix         = "us-east-1/hub"
  flow_log_name      = "hub-vpc-flow-logs"
  environment_suffix = local.env_suffix
  project_tags       = local.common_tags

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

module "uswest_flow_logs" {
  source = "./modules/flow-logs"

  providers = {
    aws = aws.us_west
  }

  vpc_id             = module.uswest_vpc.vpc_id
  s3_bucket_arn      = aws_s3_bucket.flow_logs.arn
  log_prefix         = "us-west-2/spoke"
  flow_log_name      = "uswest-spoke-vpc-flow-logs"
  environment_suffix = local.env_suffix
  project_tags       = local.common_tags

  depends_on = [aws_s3_bucket_policy.flow_logs]
}

module "europe_flow_logs" {
  source = "./modules/flow-logs"

  providers = {
    aws = aws.europe
  }

  vpc_id             = module.europe_vpc.vpc_id
  s3_bucket_arn      = aws_s3_bucket.flow_logs.arn
  log_prefix         = "eu-west-1/spoke"
  flow_log_name      = "europe-spoke-vpc-flow-logs"
  environment_suffix = local.env_suffix
  project_tags       = local.common_tags

  depends_on = [aws_s3_bucket_policy.flow_logs]
}
