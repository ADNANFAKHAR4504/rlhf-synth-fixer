I need Terraform infrastructure code to create a secure and auditable S3 bucket configuration for us-west-2 region.

Requirements:

1. Create an S3 bucket with server-side encryption enabled using AWS KMS with a customer-managed key. Use DSSE-KMS dual-layer encryption for enhanced security compliance.

2. Configure comprehensive public access restrictions:
   - Block public access at bucket level
   - Create a bucket policy that enforces TLS/HTTPS communication
   - Deny requests not using secure transport

3. Enable versioning on the S3 bucket to maintain object history and protect against accidental deletions.

4. Implement lifecycle management rules:
   - Transition objects to Intelligent Tiering after 30 days
   - Move objects to Glacier after 90 days
   - Move objects to Deep Archive after 180 days
   - Delete objects after 7 years totaling 2555 days
   - Delete incomplete multipart uploads after 7 days

5. Set up logging and monitoring:
   - Configure AWS CloudTrail to log S3 bucket operations and data events
   - CloudTrail sends logs to CloudWatch log group for centralized monitoring
   - CloudWatch monitors the logs and triggers alarms for unauthorized access attempts
   - Enable log file validation for tamper detection
   - SNS topic receives alarm notifications for security incidents

Service Connectivity:
S3 bucket -> KMS for encryption -> CloudTrail logs operations -> CloudWatch Logs stores trail data -> CloudWatch Alarms monitor for security events -> SNS notifies on alarms. IAM roles grant CloudTrail write access to CloudWatch Logs and S3 access logging permissions.

Include proper resource naming with meaningful prefixes, tags for resource management, and IAM roles with specific permissions for CloudTrail and CloudWatch. Follow AWS security best practices and compliance requirements.

Provide the Terraform configuration with one code block per file.