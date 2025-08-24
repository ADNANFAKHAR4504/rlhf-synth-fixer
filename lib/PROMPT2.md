# S3 Bucket Encryption Configuration Update

## Background
Our current infrastructure deployment is failing due to deprecated AWS S3 encryption resources. We need to update our CDKTF Go implementation to use the current AWS provider patterns for S3 bucket encryption.

## Current Issue
The deployment fails because we're using the deprecated `aws_s3_bucket_encryption` resource instead of the newer `aws_s3_bucket_server_side_encryption_configuration` resource.

## Requirements
- Update S3 bucket encryption to use the current AWS provider resource
- Ensure all S3 buckets have server-side encryption enabled with AES256
- Maintain compatibility with our multi-environment setup (dev, staging, prod)
- Keep the existing bucket versioning and public access block configurations

## Expected Outcome
- Clean deployment without deprecation warnings
- Proper S3 server-side encryption configuration
- Maintained security posture across all environments
- Updated code that follows current AWS provider best practices