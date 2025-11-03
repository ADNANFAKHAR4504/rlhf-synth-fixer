# What Went Wrong (And How We Fixed It) — Task‑05 (S3 + Lambda + DynamoDB + API Gateway)

Real failures we hit while hardening the single‑file Terraform stack (`tap_stack.tf`). Focus areas: **S3 uploads → Lambda**, **API Gateway → Lambda**, **DynamoDB writes**, and **KMS‑encrypted everything**. No fluff — just what broke, why it broke, and how we fixed it.

---

## 1) S3 → Lambda never fired
**The problem**  
- Uploads to the content bucket did nothing; no Lambda invocations, empty logs.

**Root cause**  
- We created `aws_s3_bucket_notification` but forgot the **matching `aws_lambda_permission`** that authorizes `s3.amazonaws.com` to invoke the function. In some attempts, we created the permission but Terraform still raced the notification creation.

**The fix**  
- Added `aws_lambda_permission` with `principal = "s3.amazonaws.com"` and `source_arn = <content bucket ARN>`.  
- Put **explicit `depends_on`** from `aws_s3_bucket_notification` → `aws_lambda_permission`. Events now flow reliably.

---

## 2) Lambda couldn't write to DynamoDB (AccessDenied)
**The problem**  
- Function executed but writes to the table failed with `AccessDeniedException`.

**Root cause**  
- The role had only `dynamodb:PutItem`, but our handler used `UpdateItem` and occasionally `Query` for sanity checks.

**The fix**  
- Granted the minimal superset actually used: `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` on **the table ARN only**. Kept the scope tight — no wildcards across all tables.

---

## 3) KMS key policy blocked CloudWatch Logs and Lambda
**The problem**  
- Lambda ran, but log encryption and data key generation failed intermittently.

**Root cause**  
- CMK policy allowed the account root, but **not** the **regional logs service** nor the **Lambda service** with the correct `kms:ViaService` context.

**The fix**  
- Updated the CMK policy:  
  - Allow `logs.<region>.amazonaws.com` `Encrypt/Decrypt/GenerateDataKey*/DescribeKey`  
  - Allow `lambda.amazonaws.com` those same actions **plus** `CreateGrant` with `kms:ViaService = "lambda.<region>.amazonaws.com"` and `kms:GrantIsForAWSResource = true`.

---

## 4) S3 bucket policy + TLS enforcement broke our own clients
**The problem**  
- We enforced `aws:SecureTransport` and started seeing `AccessDenied` from the EC2 user‑data and Lambda during early boot.

**Root cause**  
- Some tools briefly fell back to non‑TLS endpoints or the policy denied access to our own principals inadvertently.

**The fix**  
- Kept the **deny‑non‑TLS** statement, but verified all SDK/CLI calls use HTTPS and adjusted the policy to **not** over‑restrict our own role ARNs. No broad principals, no accidental self‑denial.

---

## 5) Wrong place for S3 SSE configuration
**The problem**  
- Terraform complained: `Unsupported block type: "rule"` under the bucket resource.

**Root cause**  
- We mistakenly put SSE rules inside `aws_s3_bucket` instead of `aws_s3_bucket_server_side_encryption_configuration`.

**The fix**  
- Moved the SSE stanza into `aws_s3_bucket_server_side_encryption_configuration` and kept versioning and PAB as separate resources. Applied cleanly.

---

## 6) Archive hash drift kept forcing Lambda deploys
**The problem**  
- Every `terraform apply` tried to update the Lambda even when the handler code didn’t change.

**Root cause**  
- `data.archive_file` output path lived in a directory with changing timestamps or extra files, making the base64 hash unstable.

**The fix**  
- Pinned `output_path` to a deterministic location and fed **only** the inlined `index.py` content. Hash now stable; idempotent applies.

---

## 7) API Gateway returned 403/500 on `POST /process`
**The problem**  
- Hitting the endpoint returned 403 or proxy errors.

**Root cause**  
- Missing `aws_lambda_permission` for `apigateway.amazonaws.com` with the correct `source_arn` shape for our REST API + stage. In another run, the integration was `AWS` (non‑proxy) while the handler expected **proxy** payloads.

**The fix**  
- Switched to **`type = "AWS_PROXY"`** integration and added a **matching permission** with stage/token wildcards formatted correctly. Endpoint works; events reach the function intact.

---

## 8) Logs existed but were not encrypted
**The problem**  
- The Lambda log group and API Gateway access logs came up unencrypted, tripping checks.

**Root cause**  
- We created the log groups **after** service writes started, and we didn’t pass `kms_key_id` on creation. Also, KMS policy lacked the logs service permissions.

**The fix**  
- Provisioned `aws_cloudwatch_log_group` **first** with `kms_key_id = <CMK ARN>` and retention set; then wired services to them. KMS policy updated per item #3.

---

## 9) S3 notifications silently clashed
**The problem**  
- Enabling a second notification later (e.g., for a different event) wiped the first one.

**Root cause**  
- S3 supports **one** `NotificationConfiguration`; multiple resources compete unless you manage all rules in a **single** `aws_s3_bucket_notification` block.

**The fix**  
- Consolidated all Lambda notifications in **one** resource. Added comments to prevent future partial overwrites.

---

## 10) DynamoDB table wasn’t recoverable
**The problem**  
- A bad migration script deleted items; we had no point‑in‑time restore option.

**Root cause**  
- `point_in_time_recovery` wasn’t enabled.

**The fix**  
- Enabled `point_in_time_recovery { enabled = true }`. Added a note that restores still require separate orchestration but at least the snapshots exist.

---

## 11) `terraform destroy` stuck on versioned buckets
**The problem**  
- Destroy failed with `BucketNotEmpty` due to versioned objects and delete markers.

**Root cause**  
- We forgot `force_destroy = true`.

**The fix**  
- Set `force_destroy = true` on the **logs** and **content** buckets so CI cleanup is reliable.

---

## 12) EC2 proof writes failed against KMS‑encrypted bucket
**The problem**  
- User‑data wrote to S3 using `aws s3 cp`, which failed with KMS errors.

**Root cause**  
- The instance role lacked KMS permissions; in some cases, the CLI needed explicit `--ssekms-key-id` on `put-object` fallback.

**The fix**  
- Gave the role `kms:Encrypt`, `kms:GenerateDataKey*`, `kms:DescribeKey` on the CMK and added a fallback to `aws s3api put-object --server-side-encryption aws:kms --ssekms-key-id <key>` in user‑data. Now both paths succeed.

---

## 13) Integration tests flaked due to eventual consistency
**The problem**  
- Tests sometimes failed right after `apply` with “resource not found” for fresh ARNs and bucket notifications.

**Root cause**  
- We asserted too quickly after creation; S3 notifications and IAM trust take a moment to propagate.

**The fix**  
- Added **small retries/backoff** in the tests for: Lambda log fetch, S3 object listing, API invoke, and DynamoDB reads. Also added `depends_on` where creation order matters (e.g., notifications after permission).

---

## 14) API Gateway logs never appeared
**The problem**  
- Stage was active but no access logs showed up.

**Root cause**  
- We didn’t set up the **account‑level** CloudWatch Logs role via `aws_api_gateway_account` and attach `AmazonAPIGatewayPushToCloudWatchLogs` to it.

**The fix**  
- Created the IAM role, attached the managed policy, and referenced it from `aws_api_gateway_account`. Access logs flow, encrypted with CMK.

---

## 15) Outputs were incomplete for validation
**The problem**  
- CI couldn’t find the pieces it expected (table name, function ARN, API URL, bucket name, CMK ARNs, EC2 proof instance, etc.).

**The fix**  
- Added explicit outputs: environment/stack name, S3 bucket name/ARN, DynamoDB name/ARN, Lambda name/ARN, API ID and URL, CMK ID/ARN, EC2 instance ID/public IP. Tests can now resolve endpoints quickly.

---

## What We Ended Up With
After these fixes, the stack is predictable and secure:
- S3 uploads reliably trigger Lambda; API Gateway proxy invokes the same handler.
- DynamoDB writes are least‑privileged and succeed, with PITR enabled for safety.
- All logs are CMK‑encrypted; KMS policy supports both Lambda and CloudWatch Logs.
- Versioned buckets can be destroyed cleanly in CI.
- Tests include sensible retries and the Terraform graph includes necessary `depends_on` edges.
- Outputs surface everything you need to verify the deployment fast.

