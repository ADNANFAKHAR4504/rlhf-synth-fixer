# model_response

# Deliverable

A single YAML file named TapStack.yml that declares all parameters, conditions, resources, and outputs needed for a multi-region S3 DR deployment. The template adheres to best practices, avoids hardcoded environment AllowedValues by using a safe regex for EnvironmentSuffix, and ensures every resource name includes EnvironmentSuffix.

## What the template contains

* Parameters for EnvironmentSuffix, PrimaryRegion, SecondaryRegion, RetentionYears, GlacierTransitionDays, ExpirationDays, VpcEndpointIds, EnableMonitoring, and NotificationEmail.
* Conditions to detect primary vs secondary deployment and to gate monitoring resources.
* KMS CMK and alias per region with a key policy granting root/admin and the S3 service.
* An IAM role for replication, uniquely named per region, with least-privilege permissions for source read, destination write, and KMS usage.
* An S3 bucket with:

  * Object Lock in Compliance mode with default retention.
  * Versioning enabled.
  * Default SSE-KMS encryption using the regional CMK and bucket keys.
  * Lifecycle rules: transition to Glacier at 90 days, expire after 10 years (including noncurrent).
  * Replication configuration (only in the primary) that:

    * Replicates all objects and delete markers.
    * Uses Priority and an empty Prefix filter.
    * Declares SseKmsEncryptedObjects in SourceSelectionCriteria.
    * Configures Metrics with EventThreshold and ReplicationTime for RTC.
    * Uses the secondary KMS alias for replicated objects.
* Bucket policy enforcing TLS, VPCe-only access, and SSE-KMS for PutObject while not blocking S3’s replication role.
* Optional monitoring stack:

  * SNS topic and optional email subscription.
  * CloudWatch alarms for replication latency and failures.
  * CloudWatch dashboard for DR status.

## Usage considerations

* Deploy the same template in both regions (secondary first, then primary).
* Provide region-specific VpcEndpointIds per deployment.
* Confirm the SNS subscription if monitoring is enabled.
* All names include EnvironmentSuffix to avoid conflicts.

## Expected outputs

* Names and ARNs for primary/secondary buckets, replication role ARN, KMS identifiers, optional SNS topic ARN, and dashboard URL, plus the deployment region.

