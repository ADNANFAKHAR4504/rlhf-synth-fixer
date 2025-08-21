I need Terraform infrastructure code to create a secure and auditable S3 bucket configuration for us-west-2 region.

The requirements are:

1. Create an S3 bucket with server-side encryption enabled using AWS KMS with a customer-managed key. Use DSSE-KMS (dual-layer encryption) for enhanced security compliance.

2. Configure comprehensive public access restrictions:
   - Block all public access settings
   - Create a bucket policy that enforces TLS/HTTPS communication only
   - Deny any requests not using secure transport

3. Enable versioning on the S3 bucket to maintain object history and protect against accidental deletions.

4. Implement complete lifecycle management rules:
   - Transition objects to Intelligent Tiering after 30 days
   - Move objects to Glacier after 90 days 
   - Move objects to Deep Archive after 180 days
   - Delete objects after 7 years (2555 days)
   - Delete incomplete multipart uploads after 7 days

5. Set up comprehensive logging and monitoring:
   - Configure AWS CloudTrail to log all S3 bucket operations including data events
   - Use S3 Express One Zone logging capabilities for enhanced visibility
   - Create CloudWatch log group for CloudTrail logs
   - Set up CloudWatch alarms for unauthorized access attempts
   - Configure log file validation for tamper detection

Include proper resource naming with meaningful prefixes, comprehensive tags for resource management, and all necessary IAM permissions. Ensure the configuration follows AWS security best practices and compliance requirements.

Please provide the complete Terraform configuration with one code block per file.