# AWS Infrastructure Compliance Analysis with Pulumi TypeScript

Create a Pulumi TypeScript program to analyze existing AWS infrastructure and identify compliance violations. The configuration must:

1. Import and analyze existing EC2 instances to check for unencrypted EBS volumes and instances without IAM roles attached.

2. Scan RDS databases to verify encryption at rest is enabled and automated backups are configured with at least 7-day retention.

3. Check S3 buckets for public access blocks, versioning status, and server-side encryption configuration.

4. Verify that CloudWatch Logs are enabled for all VPC Flow Logs with retention periods of at least 30 days.

5. Generate a compliance report as a JSON file stored in an S3 bucket with findings categorized by severity (CRITICAL, HIGH, MEDIUM, LOW).

6. Create CloudWatch custom metrics for each compliance check category showing pass/fail counts.

7. Tag all analyzed resources with a 'last-compliance-check' timestamp.

8. Export a summary dashboard URL showing compliance status across all resource types.
