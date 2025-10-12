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