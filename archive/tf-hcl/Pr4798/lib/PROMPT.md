Hey,

I need help setting up a document storage system for our legal team using Terraform. We're handling around 15,000 documents daily and need really strict version control and retention policies to stay compliant with legal requirements. Everything needs proper audit trails too.

So basically, we need an S3-based system but with a lot of compliance features baked in. Our legal department is pretty particular about document retention - we're talking 7 years minimum, and they want Object Lock so nobody can accidentally (or intentionally) delete stuff before that. The compliance folks also want every single action logged, which makes sense given the sensitivity.

## What I'm thinking for the setup

The main bucket needs versioning turned on obviously, and I'd like to enable Object Lock in compliance mode with maybe a 90-day default retention to start with. Make that configurable though since legal might want to adjust it. Oh, and definitely block all public access - that should go without saying, but you know how it is. We should probably add MFA Delete protection too, though that needs root account access to set up, so maybe make it optional?

For the lifecycle stuff, I'm thinking we could save some money by moving current documents to Intelligent-Tiering after 30 days, then push old versions to Glacier after 90 days. The legal team says we have to keep everything for 7 years (that's 2,555 days), so we can delete old versions after that. Also need to clean up any incomplete uploads after a week and remove those expired delete markers.

Encryption-wise, I want to use a customer-managed KMS key with automatic rotation. Maybe create a separate key for audit logs if needed, but let's make that optional. The bucket policy should definitely block any unencrypted uploads and require SSL/TLS for everything.

### Access control is important here

We need three different IAM roles with different permission levels. The uploader role should only be able to add documents - no delete permissions at all. Then we need an auditor role that has read-only access to both documents and logs. And finally an admin role with full access, but it should require MFA when deleting versions.

The bucket policies need to enforce SSL, proper encryption headers, and maybe we can optionally restrict access to specific VPC endpoints or allow some trusted partner accounts if needed down the line.

### Audit logging requirements

CloudTrail needs to log absolutely everything - reads, writes, deletes, the works. Store those logs in a completely separate audit bucket with its own encryption and retention rules. Also turn on S3 access logging. The CloudTrail integration with CloudWatch Logs should probably be optional since it can get pricey.

We'll need some CloudWatch alarms for stuff like too many failed requests (might indicate someone trying unauthorized access), unexpected delete operations, high download volumes (potential data leak), and upload failures.

Also create metric filters on CloudWatch Logs to catch suspicious activity - things like access denials, deletions, or if someone tries to disable versioning.

### Automated compliance checking

Build a Lambda function that runs daily to verify everything's still configured correctly. It should check that versioning is enabled, Object Lock is active, all objects are encrypted, lifecycle policies are in place, no public access is configured, and CloudTrail is logging properly. Send the results to CloudWatch metrics and fire off an SNS alert if anything fails.

Then we need another Lambda that runs on the first of each month to generate a storage report. Show total documents and versions, storage usage by tier (Standard, Glacier, whatever), monthly growth rates, top users and access patterns, any errors or issues. Save it as a CSV to a reporting bucket and optionally email it via SES.

### Additional nice-to-haves

If you can squeeze it in, enable S3 Inventory for detailed object reports. Set up EventBridge rules to trigger the Lambdas and send alerts when bucket configs change. We'll need an SNS topic for all the alerts with email subscriptions. And a CloudWatch dashboard showing storage metrics and compliance status would be great, but that's optional.

## Deliverables

I'm expecting separate Terraform files for everything - provider configs, variables with sensible defaults (7-year retention, 90-day lock, etc.), the primary and audit S3 buckets with all their configs, an optional reporting bucket, KMS keys and policies, IAM roles with proper permissions, CloudTrail setup, CloudWatch alarms and metric filters, both Lambda functions with Python code, EventBridge rules, optional inventory and dashboard configs, and outputs for all the important resource IDs.

Make everything configurable through variables where it makes sense. Include validation for bucket names and retention periods. Add clear comments explaining Object Lock limitations (like how it needs versioning and only works at bucket creation). Would be nice to have example commands for uploading documents and querying audit logs with Athena.

Keep the code modular and production-ready with proper error handling and security best practices. We're going to production with this so it needs to be solid.

Thanks!
