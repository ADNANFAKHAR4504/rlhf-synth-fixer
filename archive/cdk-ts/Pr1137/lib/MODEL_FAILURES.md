# MODEL Failures and Fixes

This document describes the changes made to reach the ideal implementation from the initial MODEL response.

## Multi-Region App Wiring

- MODEL created two stacks with fixed IDs and direct dependency. We implemented multi-region deployment in `bin/tap.ts` driven by context (`primaryRegion`, `backupRegion`) and environment suffix, producing deterministic names and enabling easy extension.

## Bucket Naming and Security

- MODEL used `corp-data-bucket-<region>-<account>`.
- Fix: Adopted `corp-data-<env>-<region>-<account>` (DNS-compliant, environment-aware) and enforced `blockPublicAccess`, `enforceSSL`, `ObjectOwnership.BUCKET_OWNER_ENFORCED`, and `RemovalPolicy.RETAIN` for security and safe deletions.

## Replication Mechanism

- MODEL Lambda used environment variables with static destination bucket names.
- Fix: Lambda resolves the destination bucket at runtime via SSM Parameter Store, reducing hard-coding and enabling future region additions with less code change.

## IAM Least Privilege

- MODEL included broader S3 permissions and CloudWatch PutMetricData.
- Fix: Scoped to exact ARNs for peer bucket write and local bucket read; separate permission for `ssm:GetParameter` on the precise parameter ARN. Metrics are gathered via native service metrics and Lambda default execution role.

## Monitoring

- MODEL added custom metrics for replication success/errors and EventBridge health checks.
- Fix: Dashboard includes AWS/Lambda and AWS/S3 metrics for object counts and bucket sizes across regions, plus Lambda operational metrics. This avoids custom metrics overhead while meeting monitoring requirements.

## Tests and Outputs

- Existing repo tests expect CFN output files and unrelated stacks. We kept stack logic independent and recommend producing outputs or adapting tests to this architecture in CI.

Insert here the model's failures
