### Reasoning Trace
---

The user wants me to create a Terraform configuration for a static website hosting infrastructure on AWS S3. Let me break down the requirements:

1. **S3 Bucket Configuration:**
   - Single S3 bucket with name: "media-assets-" + 8-character random suffix
   - Configured for public website hosting
   - Host index.html and error.html pages
   - Version tracking enabled
   - Lifecycle policies for cost optimization
   - CORS configuration

2. **Security Requirements:**
   - Server-side encryption with SSE-S3
   - Bucket versioning enabled
   - Public read access via bucket policy
   - Dynamic ARN references (no hardcoding)

3. **Operational Configuration:**
   - Random string: exactly 8 characters
   - Static website: index.html as index, error.html as error document
   - Lifecycle rule: transition to Standard-IA after 30 days (no deletion)
   - CORS: GET from any origin, max age 3600, allow Content-Type and Authorization headers
   - Tags: Environment='production', Project='media-launch'

4. **File Organization:**
   - provider.tf: Terraform block, S3 backend, AWS provider with default tags
   - main.tf: Variables, data sources, locals, resources, outputs

5. **Specific Requirements:**
   - AWS provider version ~> 5.0
   - Terraform version >= 1.5.0
   - Region: us-west-2
   - Use data sources for account ID
   - No hardcoded values

Let me create these two files:
### Answer 
---

I'll create a production-ready static website hosting infrastructure on AWS S3. Here are the two Terraform files:

## provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
  
  backend "s3" {}
}

provider "aws" {
  region = "us-west-2"
  
  default_tags {
    tags = {
      ManagedBy = "Terraform"
      Owner     = "DevOps Team"
    }
  }
}
```

## main.tf

```hcl
# Variables
variable "aws_region" {
  description = "The AWS region where resources will be created"
  type        = string
  default     = "us-west-2"
}

# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Locals
locals {
  account_id = data.aws_caller_identity.current.account_id
  
  common_tags = {
    Environment = "production"
    Project     = "media-launch"
  }
}

# Random String for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# S3 Bucket
resource "aws_s3_bucket" "media_assets" {
  bucket = "media-assets-${random_string.bucket_suffix.result}"
  
  tags = local.common_tags
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side Encryption Configuration
resource "aws_s3_bucket_server_side_encryption_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Static Website Configuration
resource "aws_s3_bucket_website_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "error.html"
  }
}

# CORS Configuration
resource "aws_s3_bucket_cors_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  cors_rule {
    allowed_headers = ["Content-Type", "Authorization"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

# Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

# Public Access Block Configuration
resource "aws_s3_bucket_public_access_block" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket Policy for Public Read Access
resource "aws_s3_bucket_policy" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.media_assets.arn}/*"
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.media_assets]
}

# Outputs
output "bucket_name" {
  description = "The name of the S3 bucket hosting the static website"
  value       = aws_s3_bucket.media_assets.id
}

output "website_endpoint" {
  description = "The website endpoint URL for the S3 bucket"
  value       = aws_s3_bucket_website_configuration.media_assets.website_endpoint
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.media_assets.arn
}
```

## Deployment Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Plan the deployment:**
```bash
terraform plan
```

3. **Apply the configuration:**
```bash
terraform apply
```

4. **Upload your website files:**
```bash
# Upload index.html
aws s3 cp index.html s3://$(terraform output -raw bucket_name)/

# Upload error.html
aws s3 cp error.html s3://$(terraform output -raw bucket_name)/

# Upload other assets
aws s3 sync ./assets s3://$(terraform output -raw bucket_name)/assets/
```

5. **Test the website:**
```bash
# Get the website endpoint
terraform output website_endpoint

# Test with curl
curl http://$(terraform output -raw website_endpoint)
```

## Key Features Implemented

1. **Security:**
   - Server-side encryption with AWS-managed keys (SSE-S3)
   - Bucket versioning for complete change history
   - Carefully scoped bucket policy allowing only GetObject

2. **Cost Optimization:**
   - Lifecycle policy transitions objects to Standard-IA after 30 days
   - No deletion rules to preserve all content

3. **Web Hosting:**
   - Static website hosting with index.html and error.html
   - CORS configuration for cross-origin requests
   - Public read access properly configured

4. **Best Practices:**
   - Dynamic ARN references using resource attributes
   - Account ID from data source
   - Proper tagging for resource management
   - Exact 8-character random suffix for bucket naming

The infrastructure is production-ready and will successfully deploy with the standard Terraform workflow.