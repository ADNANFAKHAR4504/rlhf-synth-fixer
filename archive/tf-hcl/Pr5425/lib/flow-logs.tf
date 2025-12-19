# IAM role for VPC Flow Logs
resource "aws_iam_role" "flow_logs" {
  provider = aws.hub
  name     = "${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

# IAM policy for Flow Logs to write to S3 (least privilege)
resource "aws_iam_role_policy" "flow_logs" {
  provider = aws.hub
  name     = "${var.project_name}-vpc-flow-logs-policy"
  role     = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.flow_logs.arn
      }
    ]
  })
}

# Flow Logs for Hub VPC
resource "aws_flow_log" "hub" {
  provider                 = aws.hub
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/hub-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.hub_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "hub-vpc-flow-logs"
  })
}

# Flow Logs for AP-Northeast-1 Spoke VPC
resource "aws_flow_log" "us_west_spoke" {
  provider                 = aws.us_west
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/ap-northeast-1-spoke-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.us_west_spoke_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "ap-northeast-1-spoke-vpc-flow-logs"
  })
}

# Flow Logs for US-West-1 Spoke VPC
resource "aws_flow_log" "eu_west_spoke" {
  provider                 = aws.eu_west
  log_destination_type     = "s3"
  log_destination          = "${aws_s3_bucket.flow_logs.arn}/ap-southeast-2-spoke-vpc/"
  log_format               = var.flow_log_format
  traffic_type             = "ALL"
  vpc_id                   = module.eu_west_spoke_vpc.vpc_id
  max_aggregation_interval = 60 # 1 minute (minimum for S3 destination)

  destination_options {
    file_format                = "parquet"
    hive_compatible_partitions = true
    per_hour_partition         = true
  }

  tags = merge(var.common_tags, {
    Name = "ap-southeast-2-spoke-vpc-flow-logs"
  })
}

# S3 bucket policy to allow Flow Logs from all regions
resource "aws_s3_bucket_policy" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

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