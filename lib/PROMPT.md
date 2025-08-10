# Terraform HCL Infrastructure Prompt

Create a comprehensive AWS infrastructure setup using Terraform HCL that includes:

## Requirements

1. **Simple S3 Bucket**
   - Create S3 Bucket
   - disable public access
   - enable versioning

2. **State Management**
   - Configure S3 backend for remote state storage
   - Include DynamoDB table for state locking
   - Enable versioning and encryption
3. **Best Practices**
   - Proper resource tagging
   - Variable validation where appropriate
   - Security-conscious configurations
   - Modular and reusable code structure