# model_failure

# Failure summary

This section enumerates common pitfalls for multi-region S3 CRR with Object Lock and KMS, their likely causes, and the corrective actions to bring the stack to a clean, deployable state.

## Common issues and fixes

1. Missing or invalid EnvironmentSuffix

   * Symptom: Lint errors for regex or naming collisions across environments.
   * Fix: Use a lowercase/digit/hyphen suffix 2–20 chars long; ensure every name includes EnvironmentSuffix.

2. IAM role name collisions across regions

   * Symptom: Create-stack fails because an IAM role or inline policy already exists.
   * Fix: Include the region in the role and policy names or allow CloudFormation to auto-name.

3. Unsupported or misplaced replication properties

   * Symptom: Lint errors or S3 400 errors citing unexpected properties.
   * Fix: Define CRR only under the bucket’s ReplicationConfiguration; use Destination.EncryptionConfiguration.ReplicaKmsKeyID; avoid unsupported fields at that location.

4. RTC validation failures

   * Symptom: Errors such as “ReplicationMetrics must contain an event threshold.”
   * Fix: Under Destination.Metrics, set Status: Enabled and include EventThreshold with Minutes; pair with ReplicationTime settings.

5. KMS-encrypted replication errors

   * Symptom: Errors requiring SseKmsEncryptedObjects.
   * Fix: Add SourceSelectionCriteria.SseKmsEncryptedObjects.Status: Enabled and ensure ReplicaKmsKeyID references the secondary region’s CMK alias.

6. Object Lock configuration mistakes

   * Symptom: Bucket creation fails or retention not enforced.
   * Fix: Set ObjectLockEnabled at bucket creation and configure ObjectLockConfiguration with Compliance mode and the default retention period.

7. VPC endpoint denial breaking replication

   * Symptom: Replication stalls due to bucket policy denying S3 service traffic.
   * Fix: Enforce aws:SourceVpce for general clients but ensure the policy does not deny requests from the replication role.

8. Public access exposure

   * Symptom: Buckets inadvertently accessible.
   * Fix: Block public access at the bucket level and deny insecure transport.

9. Cross-region resource creation attempts

   * Symptom: Errors trying to create resources in another region from a single stack.
   * Fix: Deploy the same template separately in each region; rely on deterministic names and the secondary CMK alias.

10. Monitoring alarms not firing

    * Symptom: Alarms remain INSUFFICIENT_DATA.
    * Fix: Ensure RTC is enabled, metrics are configured with EventThreshold, and monitoring is enabled; subscribe and confirm the SNS email.

## Recovery approach

* Validate parameters and conditions.
* Check replication prerequisites in the secondary region: bucket exists, CMK alias created.
* Redeploy secondary if necessary, then deploy primary.
* Review bucket policy conditions to ensure replication traffic isn’t blocked.
* Confirm lifecycle and Object Lock configurations comply with retention requirements.

## Acceptance check after fixes

* Lint passes with no errors.
* Secondary deploy completes; primary deploy completes with CRR enabled.
* Replication status shows enabled, RTC metrics available, alarms and dashboard present (if enabled).
* Access limited to specified VPC endpoints; encryption and lifecycle policies applied as intended.
