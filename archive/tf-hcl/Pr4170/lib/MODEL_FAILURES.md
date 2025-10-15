# Model Failures and Resolutions

This document chronicles all errors encountered during the S3 static website hosting implementation and their resolutions.

---

# Error 1: S3 Lifecycle Configuration - Missing Filter Attribute
Error Message
Warning: Invalid Attribute Combination

  with aws_s3_bucket_lifecycle_configuration.media_assets,
  on main.tf line 85, in resource "aws_s3_bucket_lifecycle_configuration" "media_assets":
  85: resource "aws_s3_bucket_lifecycle_configuration" "media_assets" {

No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required

This will be an error in a future version of the provider

Root Cause
The AWS Terraform provider version 5.x requires that lifecycle configuration rules must specify either a filter block or a prefix attribute to determine which objects the rule applies to. In version 4.x, you could omit this and it would default to all objects, but AWS tightened the requirements in the 5.x release.

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

This works now with just a warning, but will break in future provider versions when AWS makes this a hard requirement.

Resolution
Added an empty filter {} block to apply the rule to all objects in the bucket:

resource "aws_s3_bucket_lifecycle_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    filter {}  # Apply rule to all objects
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}

The empty filter block explicitly tells AWS to apply the lifecycle rule to all objects in the bucket, which is what we want - transition everything older than 30 days to Standard-IA storage.

---

# Error 2: S3 CORS Configuration - Unsupported OPTIONS Method

## Error Message
```
Error: updating S3 Bucket CORS Configuration (media-assets-9wo52imy): operation error S3: PutBucketCors, https response error StatusCode: 400, RequestID: HTBBJ35GDGYBVDQE, HostID: IujPA0soRemTTGmF6YV8zRHuDvq1vvVZlvf160kPQAC+ZdMGOCqRESu5smLnovyb62G8Nsq2TzQorCLF3IhTlg==, api error InvalidRequest: Found unsupported HTTP method in CORS config. Unsupported method is OPTIONS

  with aws_s3_bucket_cors_configuration.media_assets,
  on main.tf line 73, in resource "aws_s3_bucket_cors_configuration" "media_assets":
  73: resource "aws_s3_bucket_cors_configuration" "media_assets" {
```

## Root Cause
AWS S3 **static website hosting** does not support the OPTIONS HTTP method in CORS configuration. While regular S3 buckets can support OPTIONS for CORS preflight requests, S3 static websites have a limited set of supported methods.

The attempted configuration was:
```hcl
resource "aws_s3_bucket_cors_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  cors_rule {
    allowed_headers = ["Content-Type", "Authorization"]
    allowed_methods = ["GET", "OPTIONS"]  # OPTIONS not supported for static websites
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}
```

## Resolution
Removed the "OPTIONS" method from the allowed_methods list, as S3 static website hosting only supports GET and HEAD methods for CORS:

```hcl
resource "aws_s3_bucket_cors_configuration" "media_assets" {
  bucket = aws_s3_bucket.media_assets.id
  
  cors_rule {
    allowed_headers = ["Content-Type", "Authorization"]
    allowed_methods = ["GET"]  # Only GET is needed for static website hosting
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}
```

## Additional Changes Required
Since the OPTIONS method was removed, any integration tests that relied on CORS preflight requests (which use OPTIONS) needed to be updated to use regular GET requests with CORS headers instead, which is the standard way to test CORS functionality for static websites.