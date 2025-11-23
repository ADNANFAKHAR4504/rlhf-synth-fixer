# Main orchestration and hub VPC resources

# Data source for availability zones in hub region
data "aws_availability_zones" "hub" {
  provider = aws.hub
  state    = "available"
}

# Hub VPC Module
module "hub_vpc" {
  source = "./modules/vpc"
  providers = {
    aws = aws.hub
  }

  vpc_name             = "hub-vpc"
  vpc_cidr             = var.hub_vpc_cidr
  azs                  = slice(data.aws_availability_zones.hub.names, 0, 3)
  public_subnet_cidrs  = [for i in range(3) : cidrsubnet(var.hub_vpc_cidr, 4, i)]
  private_subnet_cidrs = [for i in range(3) : cidrsubnet(var.hub_vpc_cidr, 4, i + 8)]
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "hub-vpc"
    Type = "hub"
  })
}

# S3 bucket for VPC Flow Logs (centralized in hub region)
resource "aws_s3_bucket" "flow_logs" {
  provider = aws.hub
  bucket   = "${var.project_name}-vpc-flow-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "VPC Flow Logs Bucket"
    Purpose = "Compliance"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

data "aws_caller_identity" "current" {
  provider = aws.hub
}

# S3 bucket versioning for compliance
resource "aws_s3_bucket_versioning" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  provider = aws.hub
  bucket   = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}