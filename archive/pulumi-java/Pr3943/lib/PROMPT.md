I need to set up a secure document storage system for a legal firm in AWS us-east-2 region. The firm handles around 2,900 document submissions daily that require compliance-grade security.

Here's what I need:

Create an S3 bucket for document storage with Object Lock enabled in compliance mode. The bucket needs encryption at rest using a customer-managed KMS key with automatic key rotation enabled.

Set up IAM policies that require MFA for any object deletion operations. Users should be able to upload and read documents without MFA, but deleting requires MFA verification.

Configure CloudTrail to log all API operations related to the S3 bucket and KMS key. The CloudTrail logs need to be retained for 7 years (2555 days) to meet legal compliance requirements. Store the CloudTrail logs in a separate S3 bucket with encryption.

Add CloudWatch monitoring to track access patterns to the document bucket. Create a CloudWatch Log Group for storing access logs and set up a metric filter to monitor document access frequency.

Make sure S3 Object Lock is configured in compliance mode so documents cannot be deleted or modified once stored, even by administrators. Set a default retention period of 90 days.

The infrastructure code should be written in Pulumi using Java. Please provide complete, working code with proper error handling and following AWS best practices for security and compliance.
