# Ideal Response Documentation

## Expected Terraform Configuration

The ideal response should include two properly structured Terraform files:

### provider.tf Requirements:
- Terraform version constraint >= 1.0
- AWS provider version constraint >= 3.0
- aws_region variable declaration
- AWS provider configuration with default tags
- Clean, production-ready structure

### tap_stack.tf Requirements:
- All required variables: aws_region, bucket_name, owner, security_level, vpc_id
- Locals block for common tags and computed values
- S3 bucket with security hardening:
  - AES-256 server-side encryption
  - Versioning enabled
  - Public access blocked
  - Bucket policy enforcing TLS and encryption
- Two IAM roles with least privilege:
  - analytics-reader-role: GetObject access to analytics/* prefix
  - uploader-role: PutObject access to uploads/* prefix
- Instance profiles for both roles
- Comprehensive outputs for all resources
- Proper tagging on all resources
- No external module dependencies

## Security Standards Met:
- Encryption at rest and in transit
- Principle of least privilege
- Public access prevention
- Comprehensive logging and monitoring ready
- Production-grade security policies