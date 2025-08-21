I need a CloudFormation YAML template for a secure AWS environment in us-west-2. The security requirements are pretty straightforward but important.

First, all IAM users need to have two-factor authentication enforced. Not just enabled, but actually required for any meaningful operations. Users should still be able to set up their MFA devices and change their passwords, but everything else gets blocked until they authenticate with MFA.

For S3 storage, I want all buckets completely private with server-side encryption using SSE-S3. No exceptions on the public access thing. Buckets should also enforce HTTPS connections and reject any uploads that aren't encrypted.

CloudTrail needs to be running across all regions to capture API calls for auditing. This includes both management events and data events for our S3 buckets. The CloudTrail logs should go to their own encrypted S3 bucket with proper access policies.

EC2 instances should only be allowed in us-west-2. This means IAM policies that explicitly allow EC2 operations in that region while denying instance creation anywhere else.

The template should be production-ready with proper resource naming, parameterization for different environments, and should pass CloudFormation validation without issues. All resources need to be in us-west-2 from the start.
