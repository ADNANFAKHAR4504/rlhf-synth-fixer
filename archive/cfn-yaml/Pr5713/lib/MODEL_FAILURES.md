# Model_failure

## Potential failure modes

* Missing or invalid email for SNS subscription if defaults are overridden with an empty value.
* Region-specific constraints not met if deploying outside us-east-1 without adjusting features or ARNs.
* IAM policy granularity insufficient if future enrichment adds services beyond EC2, EKS, S3, and IAM.
* Event volume spikes could cause Lambda concurrency bursts if MEDIUM findings surge.
* S3 bucket naming collisions if the chosen prefix plus environment suffix matches existing naming conventions in a multi-account pipeline.
* GuardDuty feature enablement delays immediately after creation could briefly cause events not to route.

## Symptoms and impacts

* CreateChangeSet or CreateStack fails due to parameter validation for the email field.
* AccessDenied errors in Lambda logs if attempting to enrich resources from services not granted in policies.
* Throttling or partial enrichment if describe/tag calls exceed API limits during spikes.
* Missed notifications if SNS email subscription remains unconfirmed.

## Mitigations

* Ensure parameters are provided with valid values in automated pipelines and avoid blank overrides.
* Confirm SNS email subscription promptly to receive alerts.
* Consider reserved concurrency and dead-letter queues for Lambda in high-volume accounts.
* Extend IAM read-only permissions in a controlled manner if additional resource types must be enriched.
* Adopt a unique, organization-scoped naming convention for the audit bucket prefix to eliminate collision risks.

## Verification checklist post-deploy

* GuardDuty shows S3 protection and EKS audit logs as enabled.
* EventBridge rule displays a healthy target and recent invocations.
* Lambda logs present successful enrichments with S3 object keys in the expected prefix.
* SNS delivers a test notification after confirming the email subscription.
* EventBridge archive is present with the configured retention period.
* S3 bucket policy and public access block are in effect, and versioning is enabled.

## Follow-up enhancements

* Add optional KMS key integration for S3 and logs if compliance requires CMKs.
* Introduce structured alert formatting and control mappings to your internal compliance catalog.
* Add replay workflows to process archived events for backfills or forensics.
* Integrate with ticketing systems to auto-create incidents on HIGH findings.
