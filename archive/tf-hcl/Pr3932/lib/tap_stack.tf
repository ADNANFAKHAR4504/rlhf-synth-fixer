terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "us_east_1"
}

provider "aws" {
  region = "us-west-2"
  alias  = "us_west_2"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_kms_key" "us_east_1" {
  provider                = aws.us_east_1
  description             = "KMS key for us-east-1"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "us_east_1" {
  provider      = aws.us_east_1
  name          = "alias/main-key-us-east-1"
  target_key_id = aws_kms_key.us_east_1.key_id
}

resource "aws_kms_key" "us_west_2" {
  provider                = aws.us_west_2
  description             = "KMS key for us-west-2"
  deletion_window_in_days = 10
  enable_key_rotation     = true
}

resource "aws_kms_alias" "us_west_2" {
  provider      = aws.us_west_2
  name          = "alias/main-key-us-west-2"
  target_key_id = aws_kms_key.us_west_2.key_id
}

resource "aws_vpc" "us_east_1" {
  provider             = aws.us_east_1
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-us-east-1"
  }
}

resource "aws_vpc" "us_west_2" {
  provider             = aws.us_west_2
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-us-west-2"
  }
}

resource "aws_subnet" "us_east_1_public_1" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-1-us-east-1"
  }
}

resource "aws_subnet" "us_east_1_public_2" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.us_east_1.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-2-us-east-1"
  }
}

resource "aws_subnet" "us_east_1_private_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private-subnet-1-us-east-1"
  }
}

resource "aws_subnet" "us_east_1_private_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.us_east_1.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "private-subnet-2-us-east-1"
  }
}

resource "aws_subnet" "us_west_2_public_1" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = "us-west-2a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-1-us-west-2"
  }
}

resource "aws_subnet" "us_west_2_public_2" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.us_west_2.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = "us-west-2b"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-2-us-west-2"
  }
}

resource "aws_subnet" "us_west_2_private_1" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = "10.1.3.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "private-subnet-1-us-west-2"
  }
}

resource "aws_subnet" "us_west_2_private_2" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.us_west_2.id
  cidr_block        = "10.1.4.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "private-subnet-2-us-west-2"
  }
}

resource "aws_internet_gateway" "us_east_1" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  tags = {
    Name = "igw-us-east-1"
  }
}

resource "aws_internet_gateway" "us_west_2" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  tags = {
    Name = "igw-us-west-2"
  }
}

resource "aws_eip" "nat_us_east_1" {
  provider = aws.us_east_1
  domain   = "vpc"

  tags = {
    Name = "nat-eip-us-east-1"
  }
}

resource "aws_eip" "nat_us_west_2" {
  provider = aws.us_west_2
  domain   = "vpc"

  tags = {
    Name = "nat-eip-us-west-2"
  }
}

resource "aws_nat_gateway" "us_east_1" {
  provider      = aws.us_east_1
  allocation_id = aws_eip.nat_us_east_1.id
  subnet_id     = aws_subnet.us_east_1_public_1.id

  tags = {
    Name = "nat-gateway-us-east-1"
  }
}

resource "aws_nat_gateway" "us_west_2" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.nat_us_west_2.id
  subnet_id     = aws_subnet.us_west_2_public_1.id

  tags = {
    Name = "nat-gateway-us-west-2"
  }
}

resource "aws_route_table" "us_east_1_public" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_east_1.id
  }

  tags = {
    Name = "public-rt-us-east-1"
  }
}

resource "aws_route_table" "us_east_1_private" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.us_east_1.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_east_1.id
  }

  tags = {
    Name = "private-rt-us-east-1"
  }
}

resource "aws_route_table" "us_west_2_public" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.us_west_2.id
  }

  tags = {
    Name = "public-rt-us-west-2"
  }
}

resource "aws_route_table" "us_west_2_private" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.us_west_2.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.us_west_2.id
  }

  tags = {
    Name = "private-rt-us-west-2"
  }
}

resource "aws_route_table_association" "us_east_1_public_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_public_1.id
  route_table_id = aws_route_table.us_east_1_public.id
}

resource "aws_route_table_association" "us_east_1_public_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_public_2.id
  route_table_id = aws_route_table.us_east_1_public.id
}

resource "aws_route_table_association" "us_east_1_private_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_private_1.id
  route_table_id = aws_route_table.us_east_1_private.id
}

resource "aws_route_table_association" "us_east_1_private_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.us_east_1_private_2.id
  route_table_id = aws_route_table.us_east_1_private.id
}

resource "aws_route_table_association" "us_west_2_public_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.us_west_2_public_1.id
  route_table_id = aws_route_table.us_west_2_public.id
}

resource "aws_route_table_association" "us_west_2_public_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.us_west_2_public_2.id
  route_table_id = aws_route_table.us_west_2_public.id
}

resource "aws_route_table_association" "us_west_2_private_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.us_west_2_private_1.id
  route_table_id = aws_route_table.us_west_2_private.id
}

resource "aws_route_table_association" "us_west_2_private_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.us_west_2_private_2.id
  route_table_id = aws_route_table.us_west_2_private.id
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/vpc/flowlogs/us-east-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.us_east_1.arn

  tags = {
    Name = "vpc-flow-logs-us-east-1"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/vpc/flowlogs/us-west-2"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.us_west_2.arn

  tags = {
    Name = "vpc-flow-logs-us-west-2"
  }
}

resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "us_east_1" {
  provider                 = aws.us_east_1
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs_us_east_1.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.us_east_1.id
  max_aggregation_interval = 60

  tags = {
    Name = "vpc-flow-log-us-east-1"
  }
}

resource "aws_flow_log" "us_west_2" {
  provider                 = aws.us_west_2
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs_us_west_2.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.us_west_2.id
  max_aggregation_interval = 60

  tags = {
    Name = "vpc-flow-log-us-west-2"
  }
}

resource "aws_s3_bucket" "main_us_east_1" {
  provider = aws.us_east_1
  bucket   = "secure-bucket-us-east-1-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "main-bucket-us-east-1"
  }
}

resource "aws_s3_bucket" "main_us_west_2" {
  provider = aws.us_west_2
  bucket   = "secure-bucket-us-west-2-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "main-bucket-us-west-2"
  }
}

resource "aws_s3_bucket" "cloudtrail_us_east_1" {
  provider = aws.us_east_1
  bucket   = "cloudtrail-bucket-us-east-1-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "cloudtrail-bucket-us-east-1"
  }
}

resource "aws_s3_bucket_versioning" "main_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.main_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "main_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.main_us_west_2.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "cloudtrail_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_us_east_1.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.main_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.main_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.us_west_2.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.us_east_1.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "main_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.main_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "main_us_west_2" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.main_us_west_2.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.cloudtrail_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "main_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.main_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main_us_east_1.arn,
          "${aws_s3_bucket.main_us_east_1.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "main_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.main_us_west_2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.main_us_west_2.arn,
          "${aws_s3_bucket.main_us_west_2.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "cloudtrail_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.cloudtrail_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_us_east_1.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_us_east_1.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption"                = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.us_east_1.arn
          }
        }
      },
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.cloudtrail_us_east_1.arn,
          "${aws_s3_bucket.cloudtrail_us_east_1.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "replication" {
  provider = aws.us_east_1
  name     = "s3-bucket-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "replication" {
  provider = aws.us_east_1
  name     = "s3-bucket-replication-policy"
  role     = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          aws_s3_bucket.main_us_east_1.arn
        ]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.main_us_east_1.arn}/*"
        ]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = [
          "${aws_s3_bucket.main_us_west_2.arn}/*"
        ]
      },
      {
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.us_east_1.arn,
          aws_kms_key.us_west_2.arn
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_replication_configuration" "main" {
  provider = aws.us_east_1
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.main_us_east_1.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.main_us_west_2.arn
      storage_class = "STANDARD"

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.us_west_2.arn
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.main_us_east_1]
}

resource "aws_iam_role" "application" {
  name = "application-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "application" {
  name = "application-policy"
  role = aws_iam_role.application.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "${aws_s3_bucket.main_us_east_1.arn}/app/*",
          "${aws_s3_bucket.main_us_west_2.arn}/app/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/application/*"
      }
    ]
  })
}

resource "aws_iam_role" "database" {
  name = "database-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "database" {
  name = "database-policy"
  role = aws_iam_role.database.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [
          aws_kms_key.us_east_1.arn,
          aws_kms_key.us_west_2.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role" "logging" {
  name = "logging-audit-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "cloudtrail.amazonaws.com",
            "config.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "logging" {
  name = "logging-audit-policy"
  role = aws_iam_role.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.cloudtrail_us_east_1.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.cloudtrail_us_east_1.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "application_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/application/us-east-1"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.us_east_1.arn
}

resource "aws_cloudwatch_log_group" "application_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/application/us-west-2"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.us_west_2.arn
}

resource "aws_cloudwatch_log_group" "cloudtrail_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/cloudtrail/us-east-1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.us_east_1.arn
}

resource "aws_cloudwatch_log_group" "cloudtrail_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/cloudtrail/us-west-2"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.us_west_2.arn
}

resource "aws_cloudwatch_log_group" "config_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/config/us-east-1"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.us_east_1.arn
}

resource "aws_cloudwatch_log_group" "config_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/config/us-west-2"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.us_west_2.arn
}

resource "aws_security_group" "web_us_east_1" {
  provider    = aws.us_east_1
  name        = "web-sg-us-east-1"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-sg-us-east-1"
  }
}

resource "aws_security_group" "web_us_west_2" {
  provider    = aws.us_west_2
  name        = "web-sg-us-west-2"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.us_west_2.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-sg-us-west-2"
  }
}

resource "aws_security_group" "database_us_east_1" {
  provider    = aws.us_east_1
  name        = "database-sg-us-east-1"
  description = "Security group for databases"
  vpc_id      = aws_vpc.us_east_1.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_us_east_1.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "database-sg-us-east-1"
  }
}

resource "aws_security_group" "database_us_west_2" {
  provider    = aws.us_west_2
  name        = "database-sg-us-west-2"
  description = "Security group for databases"
  vpc_id      = aws_vpc.us_west_2.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web_us_west_2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "database-sg-us-west-2"
  }
}

resource "aws_config_configuration_recorder" "us_east_1" {
  provider = aws.us_east_1
  name     = "main-config-recorder-us-east-1"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_configuration_recorder" "us_west_2" {
  provider = aws.us_west_2
  name     = "main-config-recorder-us-west-2"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_iam_role" "config" {
  name = "aws-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

resource "aws_s3_bucket" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = "aws-config-bucket-us-east-1-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = "aws-config-bucket-us-west-2-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "config_us_east_1" {
  provider                = aws.us_east_1
  bucket                  = aws_s3_bucket.config_us_east_1.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "config_us_west_2" {
  provider                = aws.us_west_2
  bucket                  = aws_s3_bucket.config_us_west_2.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_east_1.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_east_1.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_east_1.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_west_2.arn
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_west_2.arn
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_west_2.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_config_delivery_channel" "us_east_1" {
  provider       = aws.us_east_1
  name           = "main-config-delivery-channel-us-east-1"
  s3_bucket_name = aws_s3_bucket.config_us_east_1.bucket

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

resource "aws_config_delivery_channel" "us_west_2" {
  provider       = aws.us_west_2
  name           = "main-config-delivery-channel-us-west-2"
  s3_bucket_name = aws_s3_bucket.config_us_west_2.bucket

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

resource "aws_config_configuration_recorder_status" "us_east_1" {
  provider   = aws.us_east_1
  name       = aws_config_configuration_recorder.us_east_1.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_east_1]
}

resource "aws_config_configuration_recorder_status" "us_west_2" {
  provider   = aws.us_west_2
  name       = aws_config_configuration_recorder.us_west_2.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.us_west_2]
}

resource "aws_config_config_rule" "s3_bucket_encryption_us_east_1" {
  provider = aws.us_east_1
  name     = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

resource "aws_config_config_rule" "s3_bucket_encryption_us_west_2" {
  provider = aws.us_west_2
  name     = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

resource "aws_config_config_rule" "sg_ssh_restricted_us_east_1" {
  provider = aws.us_east_1
  name     = "restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

resource "aws_config_config_rule" "sg_ssh_restricted_us_west_2" {
  provider = aws.us_west_2
  name     = "restricted-ssh"

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

resource "aws_config_config_rule" "required_tags_us_east_1" {
  provider = aws.us_east_1
  name     = "required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Name"
  })

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

resource "aws_config_config_rule" "required_tags_us_west_2" {
  provider = aws.us_west_2
  name     = "required-tags"

  source {
    owner             = "AWS"
    source_identifier = "REQUIRED_TAGS"
  }

  input_parameters = jsonencode({
    tag1Key = "Name"
  })

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

resource "aws_config_config_rule" "cloudtrail_enabled_us_east_1" {
  provider = aws.us_east_1
  name     = "cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_east_1]
}

resource "aws_config_config_rule" "cloudtrail_enabled_us_west_2" {
  provider = aws.us_west_2
  name     = "cloudtrail-enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.us_west_2]
}

resource "aws_db_subnet_group" "us_east_1" {
  provider    = aws.us_east_1
  name        = "db-subnet-group-us-east-1"
  subnet_ids  = [aws_subnet.us_east_1_private_1.id, aws_subnet.us_east_1_private_2.id]
  description = "Database subnet group for us-east-1"

  tags = {
    Name = "db-subnet-group-us-east-1"
  }
}

resource "aws_db_subnet_group" "us_west_2" {
  provider    = aws.us_west_2
  name        = "db-subnet-group-us-west-2"
  subnet_ids  = [aws_subnet.us_west_2_private_1.id, aws_subnet.us_west_2_private_2.id]
  description = "Database subnet group for us-west-2"

  tags = {
    Name = "db-subnet-group-us-west-2"
  }
}

resource "aws_db_instance" "us_east_1" {
  provider                        = aws.us_east_1
  identifier                      = "main-db-us-east-1"
  engine                          = "mysql"
  engine_version                  = "8.0"
  instance_class                  = "db.t3.micro"
  allocated_storage               = 20
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.us_east_1.arn
  db_name                         = "maindb"
  username                        = "admin"
  password                        = "ChangeMe123!"
  db_subnet_group_name            = aws_db_subnet_group.us_east_1.name
  vpc_security_group_ids          = [aws_security_group.database_us_east_1.id]
  publicly_accessible             = false
  backup_retention_period         = 7
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  deletion_protection             = false
  skip_final_snapshot             = true

  tags = {
    Name = "main-db-us-east-1"
  }
}

resource "aws_db_instance" "us_west_2" {
  provider                        = aws.us_west_2
  identifier                      = "main-db-us-west-2"
  engine                          = "mysql"
  engine_version                  = "8.0"
  instance_class                  = "db.t3.micro"
  allocated_storage               = 20
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.us_west_2.arn
  db_name                         = "maindb"
  username                        = "admin"
  password                        = "ChangeMe123!"
  db_subnet_group_name            = aws_db_subnet_group.us_west_2.name
  vpc_security_group_ids          = [aws_security_group.database_us_west_2.id]
  publicly_accessible             = false
  backup_retention_period         = 7
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  deletion_protection             = false
  skip_final_snapshot             = true

  tags = {
    Name = "main-db-us-west-2"
  }
}

resource "aws_acm_certificate" "us_east_1" {
  provider                  = aws.us_east_1
  domain_name               = "example-us-east-1.com"
  subject_alternative_names = ["*.example-us-east-1.com"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "acm-cert-us-east-1"
  }
}

resource "aws_acm_certificate" "us_west_2" {
  provider                  = aws.us_west_2
  domain_name               = "example-us-west-2.com"
  subject_alternative_names = ["*.example-us-west-2.com"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "acm-cert-us-west-2"
  }
}

resource "aws_lb" "us_east_1" {
  provider                   = aws.us_east_1
  name                       = "main-alb-us-east-1"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.web_us_east_1.id]
  subnets                    = [aws_subnet.us_east_1_public_1.id, aws_subnet.us_east_1_public_2.id]
  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.main_us_east_1.id
    prefix  = "alb-logs"
    enabled = false
  }

  tags = {
    Name = "main-alb-us-east-1"
  }
}

resource "aws_lb" "us_west_2" {
  provider                   = aws.us_west_2
  name                       = "main-alb-us-west-2"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.web_us_west_2.id]
  subnets                    = [aws_subnet.us_west_2_public_1.id, aws_subnet.us_west_2_public_2.id]
  enable_deletion_protection = false
  enable_http2               = true

  access_logs {
    bucket  = aws_s3_bucket.main_us_west_2.id
    prefix  = "alb-logs"
    enabled = false
  }

  tags = {
    Name = "main-alb-us-west-2"
  }
}

resource "aws_cloudtrail" "main" {
  provider                      = aws.us_east_1
  name                          = "main-cloudtrail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_us_east_1.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.us_east_1.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_us_east_1.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_us_east_1]
}

resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:log-group:/aws/cloudtrail/*"
      }
    ]
  })
}

resource "aws_kms_key_policy" "us_east_1" {
  provider = aws.us_east_1
  key_id   = aws_kms_key.us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "logs.amazonaws.com",
            "s3.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_kms_key_policy" "us_west_2" {
  provider = aws.us_west_2
  key_id   = aws_kms_key.us_west_2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "logs.amazonaws.com",
            "s3.amazonaws.com"
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}