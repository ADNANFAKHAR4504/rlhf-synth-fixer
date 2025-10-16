# model_failure

## What went wrong earlier

* **Wrong service in KMS `ViaService`**
  The key policy allowed `cloudtrail.<region>.amazonaws.com` instead of `s3.<region>.amazonaws.com`. Because S3 is the caller for SSE-KMS object encryption, KMS denied the operation and CloudTrail surfaced a generic “insufficient permissions” error.

* **Over-restrictive S3 bucket policy**
  Adding `aws:SourceArn` and `aws:SourceAccount` seemed prudent, but in some accounts CloudTrail’s initial write doesn’t present `SourceArn` the way the policy expects during creation, leading to a deny.

* **Rollback obscuring the signal**
  With RDS `DeletionProtection = true`, any unrelated error escalated into `ROLLBACK_FAILED`, making it harder to see the original CloudTrail permission failure.

* **Human factor**
  We chased the error by tightening conditions instead of starting from the minimal, service-documented policy. That increased the chance of an initial write denial.

## Impact you saw

* Repeated `CREATE_FAILED` on the CloudTrail resource with the same message.
* Occasional `ROLLBACK_FAILED` due to RDS deletion protection preventing cleanup.
* Extra time lost because events looked similar across attempts, masking the true root cause.

## How we’ve prevented recurrence

* Switched KMS `ViaService` to S3 and allowed only the actions CloudTrail actually needs.
* Used a wildcarded, account-scoped encryption context to tolerate creation timing and multi-region details.
* Reverted the bucket policy to the minimal, stable pattern that consistently passes the first write.
* Ensured rollbacks can complete and preserve state with snapshots rather than blocking on deletion protection.

## If issues ever reappear

* Check the exact Event history for the CloudTrail resource; identify whether the deny is from **S3** or **KMS**.
* If your org mandates `SourceArn`/`SourceAccount`, add them back deliberately and verify headers during creation in a sandbox account first.
* Confirm the trail is referencing the **KMS key ARN** and that the bucket and key are in the same region as the trail.
