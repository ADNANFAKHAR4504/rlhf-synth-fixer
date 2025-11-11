# model_failure

## What Went Wrong (Common Pitfalls)

* The Configuration Recorder was created or started before the Delivery Channel existed, triggering `NoAvailableDeliveryChannelException`.
* The logging bucket policy did not explicitly allow AWS Config to read the bucket ACL or to write objects with the required ACL, causing silent validation failures.
* S3 bucket names exceeded 63 characters or collided with existing names, creating linter warnings or 409 conflicts.
* IAM policy reuse caused “policy already exists” errors on updates.

## Observable Symptoms

* Stack creation fails at the recorder step with “Delivery channel is not available.”
* Repeated retries show inconsistent outcomes due to eventual consistency.
* S3 bucket operations return conflicts or linter flags appear for long names.

## How To Avoid This

* Always create or update in this order: logging bucket and policy → delivery channel → configuration recorder → start recorder.
* Ensure the bucket policy allows AWS Config to read ACLs and write with bucket-owner-full-control.
* Keep S3 bucket names under 63 characters and include a short, deterministic uniqueness suffix.
* Parameterize or uniquify IAM inline policy names to avoid collisions across updates.

## Recovery Steps

* Reorder resources so the Delivery Channel is available before the Recorder.
* Fix the logging bucket policy to include required AWS Config permissions and TLS enforcement.
* Shorten bucket names and add a stable, short suffix to avoid conflicts.
* Redeploy; verify that the custom start step only runs after both Config resources are discoverable.
