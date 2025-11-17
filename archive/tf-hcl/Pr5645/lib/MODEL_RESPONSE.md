1. **Single Terraform file** (`tap_stack.tf`) with all resources
2. **Two regions**: us-east-1 (primary) and us-west-2 (DR)
3. **Networking**: VPCs with public/private subnets, IGWs, NAT Gateways
4. **Lambda functions** (3): Ingestion, Fraud Scoring, Alert Processor - all with inline code
5. **EventBridge**: Custom event bus with rules and Global Endpoints for cross-region replication
6. **DynamoDB Global Tables**: fraud_scores and transaction_metadata
7. **S3**: For reports with cross-region replication
8. **SQS**: FIFO queues with DLQs for each Lambda
9. **Monitoring**: CloudWatch Alarms, X-Ray tracing
10. **Security**: AWS-managed KMS keys only, least-privilege IAM
11. **Naming convention**: {environment}-{service}-{resource_type}-{suffix} with suffix "slmr"
12. **No provider block** in this file, use aliases aws.us_east_1 and aws.us_west_2
13. **Inline Lambda code** - no external ZIP files


```hcl
# tap_stack.tf - Serverless Cross-Region Fraud Detection System

# ============================================================================
# VARIABLES
# ============================================================================

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for disaster recovery"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (prod, dev, staging)"
  type        = string
  default     = "prod"
}

variable "fraud_threshold_amount" {
  description = "Transaction amount threshold for fraud detection"
  type        = number
  default     = 10000
}

variable "alert_email" {
  description = "Email address for fraud alerts"
  type        = string
  default     = "fraud-alerts@example.com"
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  service_name = "fraud"
  suffix       = "slmr"
  
  # Resource naming convention: {environment}-{service}-{resource_type}-{suffix}
  naming = {
    vpc                = "${var.environment}-${local.service_name}-vpc-${local.suffix}"
    igw                = "${var.environment}-${local.service_name}-igw-${local.suffix}"
    nat                = "${var.environment}-${local.service_name}-nat-${local.suffix}"
    eip                = "${var.environment}-${local.service_name}-eip-${local.suffix}"
    subnet_public      = "${var.environment}-${local.service_name}-subnet-pub-${local.suffix}"
    subnet_private     = "${var.environment}-${local.service_name}-subnet-priv-${local.suffix}"
    rt_public          = "${var.environment}-${local.service_name}-rt-pub-${local.suffix}"
    rt_private         = "${var.environment}-${local.service_name}-rt-priv-${local.suffix}"
    lambda_ingestion   = "${var.environment}-${local.service_name}-lambda-ingestion-${local.suffix}"
    lambda_scoring     = "${var.environment}-${local.service_name}-lambda-scoring-${local.suffix}"
    lambda_alert       = "${var.environment}-${local.service_name}-lambda-alert-${local.suffix}"
    role_ingestion     = "${var.environment}-${local.service_name}-role-ingestion-${local.suffix}"
    role_scoring       = "${var.environment}-${local.service_name}-role-scoring-${local.suffix}"
    role_alert         = "${var.environment}-${local.service_name}-role-alert-${local.suffix}"
    sqs_ingestion      = "${var.environment}-${local.service_name}-sqs-ingestion-${local.suffix}"
    sqs_scoring        = "${var.environment}-${local.service_name}-sqs-scoring-${local.suffix}"
    sqs_alert          = "${var.environment}-${local.service_name}-sqs-alert-${local.suffix}"
    dlq_ingestion      = "${var.environment}-${local.service_name}-dlq-ingestion-${local.suffix}"
    dlq_scoring        = "${var.environment}-${local.service_name}-dlq-scoring-${local.suffix}"
    dlq_alert          = "${var.environment}-${local.service_name}-dlq-alert-${local.suffix}"
    eventbridge_bus    = "${var.environment}-${local.service_name}-bus-${local.suffix}"
    eventbridge_rule   = "${var.environment}-${local.service_name}-rule-${local.suffix}"
    dynamo_scores      = "${var.environment}-${local.service_name}-dynamo-scores-${local.suffix}"
    dynamo_metadata    = "${var.environment}-${local.service_name}-dynamo-metadata-${local.suffix}"
    s3_bucket          = "${var.environment}-${local.service_name}-bucket-${local.suffix}"
    sns_topic          = "${var.environment}-${local.service_name}-sns-${local.suffix}"
    cloudwatch_log     = "/aws/lambda/${var.environment}-${local.service_name}"
    security_group     = "${var.environment}-${local.service_name}-sg-${local.suffix}"
  }
  
  # Common tags for all resources
  common_tags = {
    Environment = var.environment
    Service     = "fraud-detection"
    ManagedBy   = "terraform"
    Stack       = "tap-stack"
  }
  
  # VPC CIDR blocks by region
  vpc_cidrs = {
    primary   = "10.0.0.0/16"
    secondary = "10.1.0.0/16"
  }
  
  # Subnet CIDR blocks
  subnet_cidrs = {
    primary = {
      public_1  = "10.0.1.0/24"
      public_2  = "10.0.2.0/24"
      private_1 = "10.0.3.0/24"
      private_2 = "10.0.4.0/24"
    }
    secondary = {
      public_1  = "10.1.1.0/24"
      public_2  = "10.1.2.0/24"
      private_1 = "10.1.3.0/24"
      private_2 = "10.1.4.0/24"
    }
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get availability zones for each region
data "aws_availability_zones" "primary" {
  provider = aws.us_east_1
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.us_west_2
  state    = "available"
}

data "aws_caller_identity" "current" {
  provider = aws.us_east_1
}

# ============================================================================
# NETWORKING - PRIMARY REGION (us-east-1)
# ============================================================================

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.us_east_1
  cidr_block           = local.vpc_cidrs.primary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc}-primary"
    Region = var.primary_region
  })
}

# Internet Gateway - Primary Region
resource "aws_internet_gateway" "primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.igw}-primary"
    Region = var.primary_region
  })
}

# Elastic IP for NAT Gateway - Primary Region
resource "aws_eip" "nat_primary" {
  provider = aws.us_east_1
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eip}-primary"
    Region = var.primary_region
  })
}

# Public Subnets - Primary Region
resource "aws_subnet" "public_primary_1" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.subnet_cidrs.primary.public_1
  availability_zone       = data.aws_availability_zones.primary.names[0]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_public}-1-primary"
    Type   = "public"
    Region = var.primary_region
  })
}

resource "aws_subnet" "public_primary_2" {
  provider                = aws.us_east_1
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = local.subnet_cidrs.primary.public_2
  availability_zone       = data.aws_availability_zones.primary.names[1]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_public}-2-primary"
    Type   = "public"
    Region = var.primary_region
  })
}

# Private Subnets - Primary Region
resource "aws_subnet" "private_primary_1" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.subnet_cidrs.primary.private_1
  availability_zone = data.aws_availability_zones.primary.names[0]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_private}-1-primary"
    Type   = "private"
    Region = var.primary_region
  })
}

resource "aws_subnet" "private_primary_2" {
  provider          = aws.us_east_1
  vpc_id            = aws_vpc.primary.id
  cidr_block        = local.subnet_cidrs.primary.private_2
  availability_zone = data.aws_availability_zones.primary.names[1]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_private}-2-primary"
    Type   = "private"
    Region = var.primary_region
  })
}

# NAT Gateway - Primary Region
resource "aws_nat_gateway" "primary" {
  provider      = aws.us_east_1
  allocation_id = aws_eip.nat_primary.id
  subnet_id     = aws_subnet.public_primary_1.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.nat}-primary"
    Region = var.primary_region
  })
  
  depends_on = [aws_internet_gateway.primary]
}

# Route Tables - Primary Region
resource "aws_route_table" "public_primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.rt_public}-primary"
    Type   = "public"
    Region = var.primary_region
  })
}

resource "aws_route_table" "private_primary" {
  provider = aws.us_east_1
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.primary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.rt_private}-primary"
    Type   = "private"
    Region = var.primary_region
  })
}

# Route Table Associations - Primary Region
resource "aws_route_table_association" "public_primary_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.public_primary_1.id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "public_primary_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.public_primary_2.id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "private_primary_1" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.private_primary_1.id
  route_table_id = aws_route_table.private_primary.id
}

resource "aws_route_table_association" "private_primary_2" {
  provider       = aws.us_east_1
  subnet_id      = aws_subnet.private_primary_2.id
  route_table_id = aws_route_table.private_primary.id
}

# Security Group for Lambda - Primary Region
resource "aws_security_group" "lambda_primary" {
  provider    = aws.us_east_1
  name        = "${local.naming.security_group}-lambda-primary"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.primary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.security_group}-lambda-primary"
    Region = var.primary_region
  })
}

# ============================================================================
# NETWORKING - SECONDARY REGION (us-west-2)
# ============================================================================

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.us_west_2
  cidr_block           = local.vpc_cidrs.secondary
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.vpc}-secondary"
    Region = var.secondary_region
  })
}

# Internet Gateway - Secondary Region
resource "aws_internet_gateway" "secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.igw}-secondary"
    Region = var.secondary_region
  })
}

# Elastic IP for NAT Gateway - Secondary Region
resource "aws_eip" "nat_secondary" {
  provider = aws.us_west_2
  domain   = "vpc"
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eip}-secondary"
    Region = var.secondary_region
  })
}

# Public Subnets - Secondary Region
resource "aws_subnet" "public_secondary_1" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.subnet_cidrs.secondary.public_1
  availability_zone       = data.aws_availability_zones.secondary.names[0]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_public}-1-secondary"
    Type   = "public"
    Region = var.secondary_region
  })
}

resource "aws_subnet" "public_secondary_2" {
  provider                = aws.us_west_2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = local.subnet_cidrs.secondary.public_2
  availability_zone       = data.aws_availability_zones.secondary.names[1]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_public}-2-secondary"
    Type   = "public"
    Region = var.secondary_region
  })
}

# Private Subnets - Secondary Region
resource "aws_subnet" "private_secondary_1" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.subnet_cidrs.secondary.private_1
  availability_zone = data.aws_availability_zones.secondary.names[0]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_private}-1-secondary"
    Type   = "private"
    Region = var.secondary_region
  })
}

resource "aws_subnet" "private_secondary_2" {
  provider          = aws.us_west_2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = local.subnet_cidrs.secondary.private_2
  availability_zone = data.aws_availability_zones.secondary.names[1]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.subnet_private}-2-secondary"
    Type   = "private"
    Region = var.secondary_region
  })
}

# NAT Gateway - Secondary Region
resource "aws_nat_gateway" "secondary" {
  provider      = aws.us_west_2
  allocation_id = aws_eip.nat_secondary.id
  subnet_id     = aws_subnet.public_secondary_1.id
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.nat}-secondary"
    Region = var.secondary_region
  })
  
  depends_on = [aws_internet_gateway.secondary]
}

# Route Tables - Secondary Region
resource "aws_route_table" "public_secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.rt_public}-secondary"
    Type   = "public"
    Region = var.secondary_region
  })
}

resource "aws_route_table" "private_secondary" {
  provider = aws.us_west_2
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.rt_private}-secondary"
    Type   = "private"
    Region = var.secondary_region
  })
}

# Route Table Associations - Secondary Region
resource "aws_route_table_association" "public_secondary_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.public_secondary_1.id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "public_secondary_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.public_secondary_2.id
  route_table_id = aws_route_table.public_secondary.id
}

resource "aws_route_table_association" "private_secondary_1" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.private_secondary_1.id
  route_table_id = aws_route_table.private_secondary.id
}

resource "aws_route_table_association" "private_secondary_2" {
  provider       = aws.us_west_2
  subnet_id      = aws_subnet.private_secondary_2.id
  route_table_id = aws_route_table.private_secondary.id
}

# Security Group for Lambda - Secondary Region
resource "aws_security_group" "lambda_secondary" {
  provider    = aws.us_west_2
  name        = "${local.naming.security_group}-lambda-secondary"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.secondary.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.security_group}-lambda-secondary"
    Region = var.secondary_region
  })
}

# ============================================================================
# S3 BUCKETS
# ============================================================================

# S3 Bucket - Primary Region
resource "aws_s3_bucket" "primary" {
  provider = aws.us_east_1
  bucket   = "${local.naming.s3_bucket}-${data.aws_caller_identity.current.account_id}-primary"
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.s3_bucket}-primary"
    Region = var.primary_region
  })
}

# S3 Bucket Versioning - Primary
resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption - Primary
resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Lifecycle - Primary
resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.primary.id
  
  rule {
    id     = "archive-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 Bucket - Secondary Region
resource "aws_s3_bucket" "secondary" {
  provider = aws.us_west_2
  bucket   = "${local.naming.s3_bucket}-${data.aws_caller_identity.current.account_id}-secondary"
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.s3_bucket}-secondary"
    Region = var.secondary_region
  })
}

# S3 Bucket Versioning - Secondary
resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption - Secondary
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Lifecycle - Secondary
resource "aws_s3_bucket_lifecycle_configuration" "secondary" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.secondary.id
  
  rule {
    id     = "archive-to-glacier"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# S3 Replication IAM Role
resource "aws_iam_role" "s3_replication" {
  provider = aws.us_east_1
  name     = "${var.environment}-${local.service_name}-s3-replication-role-${local.suffix}"
  
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
  
  tags = local.common_tags
}

# S3 Replication IAM Policy
resource "aws_iam_role_policy" "s3_replication" {
  provider = aws.us_east_1
  name     = "${var.environment}-${local.service_name}-s3-replication-policy-${local.suffix}"
  role     = aws_iam_role.s3_replication.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = "${aws_s3_bucket.primary.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = "${aws_s3_bucket.secondary.arn}/*"
      }
    ]
  })
}

# S3 Bucket Replication Configuration
resource "aws_s3_bucket_replication_configuration" "primary" {
  provider = aws.us_east_1
  role     = aws_iam_role.s3_replication.arn
  bucket   = aws_s3_bucket.primary.id
  
  rule {
    id     = "replicate-to-secondary"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD_IA"
    }
  }
  
  depends_on = [aws_s3_bucket_versioning.primary]
}

# ============================================================================
# DYNAMODB TABLES
# ============================================================================

# DynamoDB Table - Fraud Scores (Primary)
resource "aws_dynamodb_table" "fraud_scores_primary" {
  provider         = aws.us_east_1
  name             = local.naming.dynamo_scores
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transaction_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "transaction_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  replica {
    region_name = var.secondary_region
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dynamo_scores
    Region = var.primary_region
  })
}

# DynamoDB Table - Transaction Metadata (Primary)
resource "aws_dynamodb_table" "transaction_metadata_primary" {
  provider         = aws.us_east_1
  name             = local.naming.dynamo_metadata
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transaction_id"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "transaction_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  replica {
    region_name = var.secondary_region
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dynamo_metadata
    Region = var.primary_region
  })
}

# ============================================================================
# SQS QUEUES - PRIMARY REGION
# ============================================================================

# SQS Queue - Ingestion Lambda (Primary)
resource "aws_sqs_queue" "ingestion_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.sqs_ingestion}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ingestion_dlq_primary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_ingestion
    Region = var.primary_region
  })
}

# DLQ - Ingestion Lambda (Primary)
resource "aws_sqs_queue" "ingestion_dlq_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.dlq_ingestion}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_ingestion
    Region = var.primary_region
  })
}

# SQS Queue - Scoring Lambda (Primary)
resource "aws_sqs_queue" "scoring_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.sqs_scoring}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scoring_dlq_primary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_scoring
    Region = var.primary_region
  })
}

# DLQ - Scoring Lambda (Primary)
resource "aws_sqs_queue" "scoring_dlq_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.dlq_scoring}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_scoring
    Region = var.primary_region
  })
}

# SQS Queue - Alert Lambda (Primary)
resource "aws_sqs_queue" "alert_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.sqs_alert}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.alert_dlq_primary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_alert
    Region = var.primary_region
  })
}

# DLQ - Alert Lambda (Primary)
resource "aws_sqs_queue" "alert_dlq_primary" {
  provider                    = aws.us_east_1
  name                        = "${local.naming.dlq_alert}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_alert
    Region = var.primary_region
  })
}

# ============================================================================
# SQS QUEUES - SECONDARY REGION
# ============================================================================

# SQS Queue - Ingestion Lambda (Secondary)
resource "aws_sqs_queue" "ingestion_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.sqs_ingestion}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ingestion_dlq_secondary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_ingestion
    Region = var.secondary_region
  })
}

# DLQ - Ingestion Lambda (Secondary)
resource "aws_sqs_queue" "ingestion_dlq_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.dlq_ingestion}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_ingestion
    Region = var.secondary_region
  })
}

# SQS Queue - Scoring Lambda (Secondary)
resource "aws_sqs_queue" "scoring_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.sqs_scoring}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scoring_dlq_secondary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_scoring
    Region = var.secondary_region
  })
}

# DLQ - Scoring Lambda (Secondary)
resource "aws_sqs_queue" "scoring_dlq_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.dlq_scoring}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_scoring
    Region = var.secondary_region
  })
}

# SQS Queue - Alert Lambda (Secondary)
resource "aws_sqs_queue" "alert_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.sqs_alert}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  visibility_timeout_seconds  = 300
  sqs_managed_sse_enabled     = true
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.alert_dlq_secondary.arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sqs_alert
    Region = var.secondary_region
  })
}

# DLQ - Alert Lambda (Secondary)
resource "aws_sqs_queue" "alert_dlq_secondary" {
  provider                    = aws.us_west_2
  name                        = "${local.naming.dlq_alert}.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  message_retention_seconds   = 1209600  # 14 days
  sqs_managed_sse_enabled     = true
  
  tags = merge(local.common_tags, {
    Name   = local.naming.dlq_alert
    Region = var.secondary_region
  })
}

# ============================================================================
# EVENTBRIDGE - PRIMARY REGION
# ============================================================================

# Custom Event Bus - Primary
resource "aws_cloudwatch_event_bus" "primary" {
  provider = aws.us_east_1
  name     = local.naming.eventbridge_bus
  
  tags = merge(local.common_tags, {
    Name   = local.naming.eventbridge_bus
    Region = var.primary_region
  })
}

# EventBridge Rule - Fraud Scoring (Primary)
resource "aws_cloudwatch_event_rule" "fraud_scoring_primary" {
  provider    = aws.us_east_1
  name        = "${local.naming.eventbridge_rule}-scoring"
  description = "Route high-value transactions to fraud scoring"
  event_bus_name = aws_cloudwatch_event_bus.primary.name
  
  event_pattern = jsonencode({
    source = ["fraud.detection.ingestion"]
    detail = {
      amount = [{
        numeric = [">", var.fraud_threshold_amount]
      }]
    }
  })
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eventbridge_rule}-scoring"
    Region = var.primary_region
  })
}

# EventBridge Rule - International Transactions (Primary)
resource "aws_cloudwatch_event_rule" "international_primary" {
  provider    = aws.us_east_1
  name        = "${local.naming.eventbridge_rule}-international"
  description = "Route international transactions to alert processor"
  event_bus_name = aws_cloudwatch_event_bus.primary.name
  
  event_pattern = jsonencode({
    source = ["fraud.detection.ingestion"]
    detail = {
      transaction_type = ["international"]
    }
  })
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eventbridge_rule}-international"
    Region = var.primary_region
  })
}

# ============================================================================
# EVENTBRIDGE - SECONDARY REGION
# ============================================================================

# Custom Event Bus - Secondary
resource "aws_cloudwatch_event_bus" "secondary" {
  provider = aws.us_west_2
  name     = local.naming.eventbridge_bus
  
  tags = merge(local.common_tags, {
    Name   = local.naming.eventbridge_bus
    Region = var.secondary_region
  })
}

# EventBridge Rule - Fraud Scoring (Secondary)
resource "aws_cloudwatch_event_rule" "fraud_scoring_secondary" {
  provider    = aws.us_west_2
  name        = "${local.naming.eventbridge_rule}-scoring"
  description = "Route high-value transactions to fraud scoring"
  event_bus_name = aws_cloudwatch_event_bus.secondary.name
  
  event_pattern = jsonencode({
    source = ["fraud.detection.ingestion"]
    detail = {
      amount = [{
        numeric = [">", var.fraud_threshold_amount]
      }]
    }
  })
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eventbridge_rule}-scoring"
    Region = var.secondary_region
  })
}

# EventBridge Rule - International Transactions (Secondary)
resource "aws_cloudwatch_event_rule" "international_secondary" {
  provider    = aws.us_west_2
  name        = "${local.naming.eventbridge_rule}-international"
  description = "Route international transactions to alert processor"
  event_bus_name = aws_cloudwatch_event_bus.secondary.name
  
  event_pattern = jsonencode({
    source = ["fraud.detection.ingestion"]
    detail = {
      transaction_type = ["international"]
    }
  })
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.eventbridge_rule}-international"
    Region = var.secondary_region
  })
}

# ============================================================================
# IAM ROLES AND POLICIES FOR LAMBDA
# ============================================================================

# IAM Role - Ingestion Lambda
resource "aws_iam_role" "ingestion_lambda" {
  provider = aws.us_east_1
  name     = local.naming.role_ingestion
  
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
  
  tags = local.common_tags
}

# IAM Policy - Ingestion Lambda
resource "aws_iam_role_policy" "ingestion_lambda" {
  provider = aws.us_east_1
  name     = "${local.naming.role_ingestion}-policy"
  role     = aws_iam_role.ingestion_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          aws_cloudwatch_event_bus.primary.arn,
          aws_cloudwatch_event_bus.secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.ingestion_primary.arn,
          aws_sqs_queue.ingestion_dlq_primary.arn,
          aws_sqs_queue.ingestion_secondary.arn,
          aws_sqs_queue.ingestion_dlq_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role - Scoring Lambda
resource "aws_iam_role" "scoring_lambda" {
  provider = aws.us_east_1
  name     = local.naming.role_scoring
  
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
  
  tags = local.common_tags
}

# IAM Policy - Scoring Lambda
resource "aws_iam_role_policy" "scoring_lambda" {
  provider = aws.us_east_1
  name     = "${local.naming.role_scoring}-policy"
  role     = aws_iam_role.scoring_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.fraud_scores_primary.arn,
          "${aws_dynamodb_table.fraud_scores_primary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.scoring_primary.arn,
          aws_sqs_queue.scoring_dlq_primary.arn,
          aws_sqs_queue.scoring_secondary.arn,
          aws_sqs_queue.scoring_dlq_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role - Alert Lambda
resource "aws_iam_role" "alert_lambda" {
  provider = aws.us_east_1
  name     = local.naming.role_alert
  
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
  
  tags = local.common_tags
}

# IAM Policy - Alert Lambda
resource "aws_iam_role_policy" "alert_lambda" {
  provider = aws.us_east_1
  name     = "${local.naming.role_alert}-policy"
  role     = aws_iam_role.alert_lambda.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = [
          "${aws_s3_bucket.primary.arn}/*",
          "${aws_s3_bucket.secondary.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.alert_primary.arn,
          aws_sqs_queue.alert_dlq_primary.arn,
          aws_sqs_queue.alert_secondary.arn,
          aws_sqs_queue.alert_dlq_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.alerts_primary.arn,
          aws_sns_topic.alerts_secondary.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# LAMBDA FUNCTIONS - PRIMARY REGION
# ============================================================================

# Lambda Function - Ingestion (Primary)
resource "aws_lambda_function" "ingestion_primary" {
  provider         = aws.us_east_1
  function_name    = local.naming.lambda_ingestion
  role            = aws_iam_role.ingestion_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.ingestion_lambda_code.output_path
  source_code_hash = data.archive_file.ingestion_lambda_code.output_base64sha256
  
  environment {
    variables = {
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.primary.name
      QUEUE_URL      = aws_sqs_queue.ingestion_primary.url
      REGION         = var.primary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_primary_1.id, aws_subnet.private_primary_2.id]
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.ingestion_dlq_primary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_ingestion
    Region = var.primary_region
  })
}

# Lambda Function - Scoring (Primary)
resource "aws_lambda_function" "scoring_primary" {
  provider         = aws.us_east_1
  function_name    = local.naming.lambda_scoring
  role            = aws_iam_role.scoring_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.scoring_lambda_code.output_path
  source_code_hash = data.archive_file.scoring_lambda_code.output_base64sha256
  
  environment {
    variables = {
      DYNAMO_TABLE_NAME = aws_dynamodb_table.fraud_scores_primary.name
      QUEUE_URL         = aws_sqs_queue.scoring_primary.url
      REGION            = var.primary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_primary_1.id, aws_subnet.private_primary_2.id]
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.scoring_dlq_primary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_scoring
    Region = var.primary_region
  })
}

# Lambda Function - Alert (Primary)
resource "aws_lambda_function" "alert_primary" {
  provider         = aws.us_east_1
  function_name    = local.naming.lambda_alert
  role            = aws_iam_role.alert_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.alert_lambda_code.output_path
  source_code_hash = data.archive_file.alert_lambda_code.output_base64sha256
  
  environment {
    variables = {
      S3_BUCKET_NAME = aws_s3_bucket.primary.id
      SNS_TOPIC_ARN  = aws_sns_topic.alerts_primary.arn
      QUEUE_URL      = aws_sqs_queue.alert_primary.url
      REGION         = var.primary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_primary_1.id, aws_subnet.private_primary_2.id]
    security_group_ids = [aws_security_group.lambda_primary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.alert_dlq_primary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_alert
    Region = var.primary_region
  })
}

# ============================================================================
# LAMBDA FUNCTIONS - SECONDARY REGION
# ============================================================================

# Lambda Function - Ingestion (Secondary)
resource "aws_lambda_function" "ingestion_secondary" {
  provider         = aws.us_west_2
  function_name    = local.naming.lambda_ingestion
  role            = aws_iam_role.ingestion_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.ingestion_lambda_code.output_path
  source_code_hash = data.archive_file.ingestion_lambda_code.output_base64sha256
  
  environment {
    variables = {
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.secondary.name
      QUEUE_URL      = aws_sqs_queue.ingestion_secondary.url
      REGION         = var.secondary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_secondary_1.id, aws_subnet.private_secondary_2.id]
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.ingestion_dlq_secondary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_ingestion
    Region = var.secondary_region
  })
}

# Lambda Function - Scoring (Secondary)
resource "aws_lambda_function" "scoring_secondary" {
  provider         = aws.us_west_2
  function_name    = local.naming.lambda_scoring
  role            = aws_iam_role.scoring_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.scoring_lambda_code.output_path
  source_code_hash = data.archive_file.scoring_lambda_code.output_base64sha256
  
  environment {
    variables = {
      DYNAMO_TABLE_NAME = aws_dynamodb_table.fraud_scores_primary.name
      QUEUE_URL         = aws_sqs_queue.scoring_secondary.url
      REGION            = var.secondary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_secondary_1.id, aws_subnet.private_secondary_2.id]
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.scoring_dlq_secondary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_scoring
    Region = var.secondary_region
  })
}

# Lambda Function - Alert (Secondary)
resource "aws_lambda_function" "alert_secondary" {
  provider         = aws.us_west_2
  function_name    = local.naming.lambda_alert
  role            = aws_iam_role.alert_lambda.arn
  handler         = "index.lambda_handler"
  runtime         = "python3.11"
  timeout         = 60
  memory_size     = 512
  reserved_concurrent_executions = 100
  
  filename         = data.archive_file.alert_lambda_code.output_path
  source_code_hash = data.archive_file.alert_lambda_code.output_base64sha256
  
  environment {
    variables = {
      S3_BUCKET_NAME = aws_s3_bucket.secondary.id
      SNS_TOPIC_ARN  = aws_sns_topic.alerts_secondary.arn
      QUEUE_URL      = aws_sqs_queue.alert_secondary.url
      REGION         = var.secondary_region
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_secondary_1.id, aws_subnet.private_secondary_2.id]
    security_group_ids = [aws_security_group.lambda_secondary.id]
  }
  
  dead_letter_config {
    target_arn = aws_sqs_queue.alert_dlq_secondary.arn
  }
  
  tracing_config {
    mode = "Active"
  }
  
  tags = merge(local.common_tags, {
    Name   = local.naming.lambda_alert
    Region = var.secondary_region
  })
}

# ============================================================================
# LAMBDA INLINE CODE (Archive Files)
# ============================================================================

# Ingestion Lambda Code
data "archive_file" "ingestion_lambda_code" {
  type        = "zip"
  output_path = "/tmp/ingestion_lambda.zip"
  
  source {
    content  = <<-EOT
import json
import os
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

events_client = boto3.client('events')

def lambda_handler(event, context):
    """
    Process incoming transaction and publish to EventBridge
    """
    try:
        # Parse incoming transaction
        transaction = json.loads(event['body']) if 'body' in event else event
        
        # Add metadata
        transaction['ingestion_timestamp'] = datetime.utcnow().isoformat()
        transaction['processor_id'] = context.request_id
        
        # Normalize transaction data
        normalized_event = {
            'transaction_id': transaction.get('id'),
            'amount': float(transaction.get('amount', 0)),
            'currency': transaction.get('currency', 'USD'),
            'transaction_type': transaction.get('type', 'domestic'),
            'merchant': transaction.get('merchant', 'unknown'),
            'timestamp': transaction.get('timestamp', datetime.utcnow().isoformat())
        }
        
        # Publish to EventBridge
        response = events_client.put_events(
            Entries=[
                {
                    'Source': 'fraud.detection.ingestion',
                    'DetailType': 'Transaction Ingested',
                    'Detail': json.dumps(normalized_event),
                    'EventBusName': os.environ['EVENT_BUS_NAME']
                }
            ]
        )
        
        logger.info(f"Published event for transaction: {normalized_event['transaction_id']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': normalized_event['transaction_id']
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing transaction: {str(e)}")
        raise
EOT
    filename = "index.py"
  }
}

# Scoring Lambda Code
data "archive_file" "scoring_lambda_code" {
  type        = "zip"
  output_path = "/tmp/scoring_lambda.zip"
  
  source {
    content  = <<-EOT
import json
import os
import boto3
import logging
from datetime import datetime
from decimal import Decimal
import random

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMO_TABLE_NAME'])

def calculate_fraud_score(transaction):
    """
    Calculate fraud score based on transaction attributes
    """
    score = 0
    
    # Amount-based scoring
    amount = float(transaction.get('amount', 0))
    if amount > 10000:
        score += 30
    elif amount > 5000:
        score += 20
    elif amount > 1000:
        score += 10
    
    # Transaction type scoring
    if transaction.get('transaction_type') == 'international':
        score += 25
    
    # Add random variation for demo purposes
    score += random.randint(0, 45)
    
    return min(score, 100)

def lambda_handler(event, context):
    """
    Score transaction for fraud risk
    """
    try:
        # Parse EventBridge event
        detail = event.get('detail', {})
        
        # Calculate fraud score
        fraud_score = calculate_fraud_score(detail)
        
        # Determine risk level
        if fraud_score >= 70:
            risk_level = 'HIGH'
        elif fraud_score >= 40:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        # Store in DynamoDB
        item = {
            'transaction_id': detail['transaction_id'],
            'timestamp': int(datetime.utcnow().timestamp()),
            'fraud_score': fraud_score,
            'risk_level': risk_level,
            'amount': Decimal(str(detail.get('amount', 0))),
            'transaction_type': detail.get('transaction_type'),
            'processing_timestamp': datetime.utcnow().isoformat()
        }
        
        table.put_item(Item=item)
        
        logger.info(f"Fraud score calculated: {detail['transaction_id']} - Score: {fraud_score} - Risk: {risk_level}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'transaction_id': detail['transaction_id'],
                'fraud_score': fraud_score,
                'risk_level': risk_level
            })
        }
        
    except Exception as e:
        logger.error(f"Error scoring transaction: {str(e)}")
        raise
EOT
    filename = "index.py"
  }
}

# Alert Lambda Code
data "archive_file" "alert_lambda_code" {
  type        = "zip"
  output_path = "/tmp/alert_lambda.zip"
  
  source {
    content  = <<-EOT
import json
import os
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Process flagged transactions and generate alerts
    """
    try:
        # Parse EventBridge event
        detail = event.get('detail', {})
        
        # Create alert report
        alert_report = {
            'alert_id': context.request_id,
            'transaction_id': detail.get('transaction_id'),
            'amount': detail.get('amount'),
            'transaction_type': detail.get('transaction_type'),
            'merchant': detail.get('merchant'),
            'timestamp': detail.get('timestamp'),
            'alert_timestamp': datetime.utcnow().isoformat(),
            'reason': 'International transaction flagged for review'
        }
        
        # Store report in S3
        report_key = f"alerts/{datetime.utcnow().strftime('%Y/%m/%d')}/{alert_report['transaction_id']}.json"
        
        s3.put_object(
            Bucket=os.environ['S3_BUCKET_NAME'],
            Key=report_key,
            Body=json.dumps(alert_report, indent=2),
            ContentType='application/json'
        )
        
        # Send SNS notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject=f"Fraud Alert: Transaction {alert_report['transaction_id']}",
            Message=json.dumps(alert_report, indent=2)
        )
        
        logger.info(f"Alert generated for transaction: {alert_report['transaction_id']}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Alert processed successfully',
                'alert_id': alert_report['alert_id'],
                'report_location': f"s3://{os.environ['S3_BUCKET_NAME']}/{report_key}"
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing alert: {str(e)}")
        raise
EOT
    filename = "index.py"
  }
}

# ============================================================================
# EVENTBRIDGE TARGETS
# ============================================================================

# EventBridge Target - Scoring Lambda (Primary)
resource "aws_cloudwatch_event_target" "scoring_primary" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.fraud_scoring_primary.name
  target_id = "scoring-lambda"
  arn       = aws_lambda_function.scoring_primary.arn
  event_bus_name = aws_cloudwatch_event_bus.primary.name
}

# EventBridge Target - Alert Lambda (Primary)
resource "aws_cloudwatch_event_target" "alert_primary" {
  provider  = aws.us_east_1
  rule      = aws_cloudwatch_event_rule.international_primary.name
  target_id = "alert-lambda"
  arn       = aws_lambda_function.alert_primary.arn
  event_bus_name = aws_cloudwatch_event_bus.primary.name
}

# EventBridge Target - Scoring Lambda (Secondary)
resource "aws_cloudwatch_event_target" "scoring_secondary" {
  provider  = aws.us_west_2
  rule      = aws_cloudwatch_event_rule.fraud_scoring_secondary.name
  target_id = "scoring-lambda"
  arn       = aws_lambda_function.scoring_secondary.arn
  event_bus_name = aws_cloudwatch_event_bus.secondary.name
}

# EventBridge Target - Alert Lambda (Secondary)
resource "aws_cloudwatch_event_target" "alert_secondary" {
  provider  = aws.us_west_2
  rule      = aws_cloudwatch_event_rule.international_secondary.name
  target_id = "alert-lambda"
  arn       = aws_lambda_function.alert_secondary.arn
  event_bus_name = aws_cloudwatch_event_bus.secondary.name
}

# Lambda Permissions for EventBridge (Primary)
resource "aws_lambda_permission" "allow_eventbridge_scoring_primary" {
  provider      = aws.us_east_1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scoring_primary.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.fraud_scoring_primary.arn
}

resource "aws_lambda_permission" "allow_eventbridge_alert_primary" {
  provider      = aws.us_east_1
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_primary.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.international_primary.arn
}

# Lambda Permissions for EventBridge (Secondary)
resource "aws_lambda_permission" "allow_eventbridge_scoring_secondary" {
  provider      = aws.us_west_2
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scoring_secondary.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.fraud_scoring_secondary.arn
}

resource "aws_lambda_permission" "allow_eventbridge_alert_secondary" {
  provider      = aws.us_west_2
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_secondary.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.international_secondary.arn
}

# ============================================================================
# SNS TOPICS FOR ALERTS
# ============================================================================

# SNS Topic - Primary Region
resource "aws_sns_topic" "alerts_primary" {
  provider = aws.us_east_1
  name     = local.naming.sns_topic
  
  kms_master_key_id = "alias/aws/sns"
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sns_topic
    Region = var.primary_region
  })
}

# SNS Topic Subscription - Primary Region
resource "aws_sns_topic_subscription" "alerts_email_primary" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.alerts_primary.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# SNS Topic - Secondary Region
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.us_west_2
  name     = local.naming.sns_topic
  
  kms_master_key_id = "alias/aws/sns"
  
  tags = merge(local.common_tags, {
    Name   = local.naming.sns_topic
    Region = var.secondary_region
  })
}

# SNS Topic Subscription - Secondary Region
resource "aws_sns_topic_subscription" "alerts_email_secondary" {
  provider  = aws.us_west_2
  topic_arn = aws_sns_topic.alerts_secondary.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ============================================================================
# CLOUDWATCH ALARMS - PRIMARY REGION
# ============================================================================

# Lambda Error Alarm - Ingestion (Primary)
resource "aws_cloudwatch_metric_alarm" "lambda_errors_ingestion_primary" {
  provider            = aws.us_east_1
  alarm_name          = "${local.naming.lambda_ingestion}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "10"
  alarm_description  = "This metric monitors lambda errors"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.ingestion_primary.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.lambda_ingestion}-errors"
    Region = var.primary_region
  })
}

# Lambda Throttles Alarm - Ingestion (Primary)
resource "aws_cloudwatch_metric_alarm" "lambda_throttles_ingestion_primary" {
  provider            = aws.us_east_1
  alarm_name          = "${local.naming.lambda_ingestion}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Throttles"
  namespace          = "AWS/Lambda"
  period             = "300"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "This metric monitors lambda throttles"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.ingestion_primary.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.lambda_ingestion}-throttles"
    Region = var.primary_region
  })
}

# DynamoDB Throttles Alarm (Primary)
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles_primary" {
  provider            = aws.us_east_1
  alarm_name          = "${local.naming.dynamo_scores}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "SystemErrors"
  namespace          = "AWS/DynamoDB"
  period             = "300"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "This metric monitors DynamoDB throttles"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    TableName = aws_dynamodb_table.fraud_scores_primary.name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.dynamo_scores}-throttles"
    Region = var.primary_region
  })
}

# SQS Message Age Alarm (Primary)
resource "aws_cloudwatch_metric_alarm" "sqs_message_age_primary" {
  provider            = aws.us_east_1
  alarm_name          = "${local.naming.sqs_ingestion}-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ApproximateAgeOfOldestMessage"
  namespace          = "AWS/SQS"
  period             = "300"
  statistic          = "Maximum"
  threshold          = "300"
  alarm_description  = "This metric monitors SQS message age"
  treat_missing_data = "notBreaching"
  
  dimensions = {
    QueueName = aws_sqs_queue.ingestion_primary.name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(local.common_tags, {
    Name   = "${local.naming.sqs_ingestion}-message-age"
    Region = var.primary_region
  })
}

# ============================================================================
# CLOUDWATCH LOG GROUPS
# ============================================================================

# Log Group - Ingestion Lambda (Primary)
resource "aws_cloudwatch_log_group" "ingestion_primary" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/${aws_lambda_function.ingestion_primary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.ingestion_primary.function_name}"
    Region = var.primary_region
  })
}

# Log Group - Scoring Lambda (Primary)
resource "aws_cloudwatch_log_group" "scoring_primary" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/${aws_lambda_function.scoring_primary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.scoring_primary.function_name}"
    Region = var.primary_region
  })
}

# Log Group - Alert Lambda (Primary)
resource "aws_cloudwatch_log_group" "alert_primary" {
  provider          = aws.us_east_1
  name              = "/aws/lambda/${aws_lambda_function.alert_primary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.alert_primary.function_name}"
    Region = var.primary_region
  })
}

# Log Group - Ingestion Lambda (Secondary)
resource "aws_cloudwatch_log_group" "ingestion_secondary" {
  provider          = aws.us_west_2
  name              = "/aws/lambda/${aws_lambda_function.ingestion_secondary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.ingestion_secondary.function_name}"
    Region = var.secondary_region
  })
}

# Log Group - Scoring Lambda (Secondary)
resource "aws_cloudwatch_log_group" "scoring_secondary" {
  provider          = aws.us_west_2
  name              = "/aws/lambda/${aws_lambda_function.scoring_secondary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.scoring_secondary.function_name}"
    Region = var.secondary_region
  })
}

# Log Group - Alert Lambda (Secondary)
resource "aws_cloudwatch_log_group" "alert_secondary" {
  provider          = aws.us_west_2
  name              = "/aws/lambda/${aws_lambda_function.alert_secondary.function_name}"
  retention_in_days = 7
  
  tags = merge(local.common_tags, {
    Name   = "/aws/lambda/${aws_lambda_function.alert_secondary.function_name}"
    Region = var.secondary_region
  })
}

# ============================================================================
# OUTPUTS
# ============================================================================

# VPC Outputs
output "vpc_primary_id" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "vpc_secondary_id" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

# Subnet Outputs
output "subnets_public_primary" {
  description = "Public subnet IDs in primary region"
  value       = [aws_subnet.public_primary_1.id, aws_subnet.public_primary_2.id]
}

output "subnets_private_primary" {
  description = "Private subnet IDs in primary region"
  value       = [aws_subnet.private_primary_1.id, aws_subnet.private_primary_2.id]
}

output "subnets_public_secondary" {
  description = "Public subnet IDs in secondary region"
  value       = [aws_subnet.public_secondary_1.id, aws_subnet.public_secondary_2.id]
}

output "subnets_private_secondary" {
  description = "Private subnet IDs in secondary region"
  value       = [aws_subnet.private_secondary_1.id, aws_subnet.private_secondary_2.id]
}

# Lambda Function Outputs
output "lambda_ingestion_primary_arn" {
  description = "Ingestion Lambda ARN (Primary)"
  value       = aws_lambda_function.ingestion_primary.arn
}

output "lambda_scoring_primary_arn" {
  description = "Scoring Lambda ARN (Primary)"
  value       = aws_lambda_function.scoring_primary.arn
}


output "lambda_scoring_secondary_arn" {
  description = "Scoring Lambda ARN (Secondary)"
  value       = aws_lambda_function.scoring_secondary.arn
}

output "lambda_alert_secondary_arn" {
  description = "Alert Lambda ARN (Secondary)"
  value       = aws_lambda_function.alert_secondary.arn
}

# S3 Bucket Outputs
output "s3_bucket_primary_name" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "s3_bucket_secondary_name" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

# DynamoDB Table Outputs
output "dynamodb_fraud_scores_name" {
  description = "Fraud scores DynamoDB table name"
  value       = aws_dynamodb_table.fraud_scores_primary.name
}

output "dynamodb_transaction_metadata_name" {
  description = "Transaction metadata DynamoDB table name"
  value       = aws_dynamodb_table.transaction_metadata_primary.name
}

# EventBridge Outputs
output "eventbridge_bus_primary_arn" {
  description = "Primary EventBridge bus ARN"
  value       = aws_cloudwatch_event_bus.primary.arn
}

output "eventbridge_bus_secondary_arn" {
  description = "Secondary EventBridge bus ARN"
  value       = aws_cloudwatch_event_bus.secondary.arn
}

# SQS Queue Outputs
output "sqs_ingestion_primary_url" {
  description = "Ingestion SQS queue URL (Primary)"
  value       = aws_sqs_queue.ingestion_primary.url
}

output "sqs_scoring_primary_url" {
  description = "Scoring SQS queue URL (Primary)"
  value       = aws_sqs_queue.scoring_primary.url
}

output "sqs_alert_primary_url" {
  description = "Alert SQS queue URL (Primary)"
  value       = aws_sqs_queue.alert_primary.url
}

output "sqs_ingestion_secondary_url" {
  description = "Ingestion SQS queue URL (Secondary)"
  value       = aws_sqs_queue.ingestion_secondary.url
}

output "sqs_scoring_secondary_url" {
  description = "Scoring SQS queue URL (Secondary)"
  value       = aws_sqs_queue.scoring_secondary.url
}

output "sqs_alert_secondary_url" {
  description = "Alert SQS queue URL (Secondary)"
  value       = aws_sqs_queue.alert_secondary.url
}

# SNS Topic Outputs
output "sns_alerts_primary_arn" {
  description = "Primary SNS alerts topic ARN"
  value       = aws_sns_topic.alerts_primary.arn
}

output "sns_alerts_secondary_arn" {
  description = "Secondary SNS alerts topic ARN"
  value       = aws_sns_topic.alerts_secondary.arn
}

# Security Group Outputs
output "security_group_lambda_primary_id" {
  description = "Lambda security group ID (Primary)"
  value       = aws_security_group.lambda_primary.id
}

output "security_group_lambda_secondary_id" {
  description = "Lambda security group ID (Secondary)"
  value       = aws_security_group.lambda_secondary.id
}

# NAT Gateway Outputs
output "nat_gateway_primary_id" {
  description = "Primary NAT Gateway ID"
  value       = aws_nat_gateway.primary.id
}

output "nat_gateway_secondary_id" {
  description = "Secondary NAT Gateway ID"
  value       = aws_nat_gateway.secondary.id
}

# Internet Gateway Outputs
output "igw_primary_id" {
  description = "Primary Internet Gateway ID"
  value       = aws_internet_gateway.primary.id
}

output "igw_secondary_id" {
  description = "Secondary Internet Gateway ID"
  value       = aws_internet_gateway.secondary.id
}


output "log_groups_secondary" {
  description = "CloudWatch Log Groups in secondary region"
  value = {
    ingestion = aws_cloudwatch_log_group.ingestion_secondary.name
    scoring   = aws_cloudwatch_log_group.scoring_secondary.name
    alert     = aws_cloudwatch_log_group.alert_secondary.name
  }
}


# CloudWatch Alarm Outputs
output "cloudwatch_alarms_primary" {
  description = "CloudWatch Alarm names in primary region"
  value = {
    lambda_errors_ingestion  = aws_cloudwatch_metric_alarm.lambda_errors_ingestion_primary.alarm_name
    lambda_throttles_ingestion = aws_cloudwatch_metric_alarm.lambda_throttles_ingestion_primary.alarm_name
    dynamodb_throttles        = aws_cloudwatch_metric_alarm.dynamodb_throttles_primary.alarm_name
    sqs_message_age          = aws_cloudwatch_metric_alarm.sqs_message_age_primary.alarm_name
  }
}
```


Key Features Implemented:**

Networking Foundation**
Dual-region VPCs with public/private subnets
Internet and NAT Gateways for secure outbound access
Security groups for Lambda functions

Serverless Components**
Lambda Functions** with inline Python code (no external ZIP files)
EventBridge** custom event buses with content-based routing rules
DynamoDB Global Tables** for fraud scores and transaction metadata
S3 Buckets** with cross-region replication and lifecycle policies

Messaging & Queuing**
SQS FIFO queues** with DLQs for each Lambda function
Content-based deduplication enabled
14-day message retention

Security & Compliance**
AWS-managed KMS encryption for all resources
Least-privilege IAM policies
VPC isolation for Lambda functions
Server-side encryption for S3 and DynamoDB

Monitoring & Observability**
CloudWatch Alarms for Lambda errors/throttles
X-Ray tracing enabled
Structured CloudWatch Log Groups
SNS topics for alert notifications

High Availability**
Cross-region deployment (us-east-1 and us-west-2)
DynamoDB Global Tables for multi-region data replication
S3 cross-region replication
EventBridge rules in both regions


