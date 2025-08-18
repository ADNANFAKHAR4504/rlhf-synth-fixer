############################################################
# Variables
############################################################
variable "projectname" {
  description = "Project name for resource naming"
  type        = string
}

############################################################
# Provider block removed to avoid duplicate configuration
############################################################

############################################################
# S3 Bucket (versioning enabled, us-east-1)
############################################################
resource "aws_s3_bucket" "main" {
  bucket = "${var.projectname}-s3"
  tags = {
    Name        = "${var.projectname}-s3"
    Project     = var.projectname
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "main" {
  bucket                  = aws_s3_bucket.main.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

############################################################
# DynamoDB Table (on-demand, partition key 'id')
############################################################
resource "aws_dynamodb_table" "main" {
  name         = "${var.projectname}-dynamodb"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  attribute {
    name = "id"
    type = "S"
  }
  tags = {
    Name        = "${var.projectname}-dynamodb"
    Project     = var.projectname
    ManagedBy   = "terraform"
  }
}

############################################################
# Outputs
############################################################
output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

############################################################
# Documentation
# - All resource names follow 'projectname-resource' pattern
# - S3 bucket is in us-east-1 with versioning enabled
# - DynamoDB table uses on-demand capacity and partition key 'id'
# - Outputs are provided for key resources
# - Easily replicable and extensible for future resources
############################################################

########################
# S3 Bucket
########################

/* resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

########################
# Outputs
########################

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
*/
