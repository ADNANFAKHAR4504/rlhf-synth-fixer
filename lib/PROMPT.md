Create Terraform code for a legal document storage system that handles about 15,000 documents per day. The system needs strict version control, retention policies, and full audit logging to meet legal compliance requirements.

Here's what I need:

**S3 Bucket Setup**
Set up the main bucket with versioning turned on. Enable Object Lock in compliance mode with a 90-day default retention (make this configurable). Block all public access and enforce encrypted uploads only. Consider adding MFA Delete protection (configurable, since it needs root account setup).

**Storage Lifecycle**
Create lifecycle rules that:

- Move current documents to Intelligent-Tiering after 30 days
- Move old versions to Glacier after 90 days
- Delete old versions after 7 years (2,555 days) for legal retention
- Clean up incomplete uploads after 7 days
- Remove expired delete markers

**Encryption**
Use a customer-managed KMS key with automatic rotation enabled. Create a separate key for audit logs if needed (make this optional). Make sure the bucket policy blocks any unencrypted uploads and requires SSL/TLS for all operations.

**Access Control**
Create three IAM roles:

- Uploader role: can only add documents, no delete permissions
- Auditor role: read-only access to documents and logs
- Admin role: full access but requires MFA for deleting versions

Add bucket policies that enforce SSL, encryption headers, and optionally restrict access to specific VPC endpoints or allow trusted partner accounts.

**Audit Logging**
Enable CloudTrail to log every action on the bucket (reads, writes, deletes). Store these logs in a separate audit bucket with its own encryption and retention rules. Also turn on S3 access logging. Make CloudTrail integration with CloudWatch Logs optional.

**Monitoring**
Set up CloudWatch alarms for:

- Too many failed requests (possible unauthorized access)
- Unexpected delete operations
- High download volumes (potential data leak)
- Upload failures

Create metric filters on CloudWatch Logs to catch suspicious activity like access denials, deletions, or attempts to disable versioning.

**Compliance Checks**
Build a Lambda function that runs daily to verify:

- Versioning is still enabled
- Object Lock is active
- All objects are encrypted
- Lifecycle policies are in place
- No public access configured
- CloudTrail is logging properly

Send results to CloudWatch metrics and alert via SNS if anything fails.

**Monthly Reports**
Create another Lambda that runs on the first of each month to generate a storage report showing:

- Total documents and versions
- Storage usage by tier (Standard, Glacier, etc.)
- Monthly growth rates
- Top users and access patterns
- Any errors or issues

Save the report as CSV to a reporting bucket and optionally email it via SES.

**Additional Features**

- Optionally enable S3 Inventory for detailed object reports
- Create EventBridge rules to trigger Lambdas and alert on config changes
- Set up an SNS topic for all alerts with email subscriptions
- Build a CloudWatch dashboard showing storage metrics and compliance status (optional)

**What to deliver:**
Separate Terraform files for:

- Version and provider configs
- Variables with sensible defaults (7-year retention, 90-day lock, etc.)
- Primary and audit S3 buckets with all configs
- Optional reporting bucket
- KMS keys and policies
- IAM roles with proper permissions
- CloudTrail setup
- CloudWatch alarms and metric filters
- Both Lambda functions with Python code
- EventBridge rules
- Optional inventory and dashboard configs
- Outputs for all important resource IDs
- Detailed README with setup instructions, MFA Delete setup, role assumption examples, and troubleshooting tips

Make everything configurable through variables where it makes sense. Include validation for bucket names and retention periods. Add clear comments explaining Object Lock limitations (needs versioning, only works at bucket creation). Provide example commands for uploading documents and querying audit logs with Athena.

Keep the code modular and production-ready with proper error handling and security best practices throughout.
