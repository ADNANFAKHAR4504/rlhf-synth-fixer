# What Went Wrong (And How We Fixed It)

Here’s what actually failed in our current `tap_stack` build. Straight facts, clear fixes.

---

## 1) Lambda didn’t trigger on S3 upload
**The problem**  
Uploading an object to the S3 uploads bucket wasn’t triggering the `on_upload` Lambda. Tests failed on “Upload object → Lambda logs show the event.”

**Root cause**  
The S3 bucket notification was created, but permissions were out of sync. The Lambda permission allowing `s3.amazonaws.com` to invoke the function didn’t line up with the bucket ARN, and the notification wasn’t actually wired until the permission propagated.

**The fix**  
Added explicit `depends_on` between the bucket notification and the `aws_lambda_permission` resource to ensure ordering.  
Confirmed event source matches the bucket ARN exactly. Re-ran integration test and verified invocation logs show the event payload.

---

## 2) CloudWatch alarm not found
**The problem**  
Integration test failed: “Could not locate CPU alarm with suffix `-asg-cpu-high`.” No alarms were created.

**Root cause**  
We added the SNS topic but never created the actual CloudWatch alarm resource for the ASG. The test expected one to exist and publish to SNS.

**The fix**  
Defined `aws_cloudwatch_metric_alarm` for the ASG’s average CPU utilization, threshold at 70%, 5-minute evaluation, action bound to the SNS topic.  
Re-ran tests—alarm creation and state toggle succeeded.

---

## 3) Backup vault wouldn’t delete
**The problem**  
Destroy failed: “Backup vault cannot be deleted because it contains recovery points.”

**Root cause**  
When you keep a backup plan and selection active, AWS automatically creates recovery points. Terraform can’t remove the vault until those are deleted.

**The fix**  
Added `force_destroy = true` to `aws_backup_vault.main` so Terraform cleans up recovery points automatically during destroy.  
Now the stack tears down cleanly.

---

## 4) Region hardcoded in VPC endpoint services
**The problem**  
Unit test flagged region-specific strings (`us-east-2`) in service names for SSM endpoints. Broke environment agnosticism.

**Root cause**  
We used static strings for `com.amazonaws.us-east-2.ssm`, `ssmmessages`, and `ec2messages`.

**The fix**  
Added `data "aws_region" "current"` and interpolated `com.amazonaws.${data.aws_region.current.name}.ssm`.  
Now the stack deploys in any region without edits.

---

## 5) KMS policy blocked CloudWatch Logs
**The problem**  
CloudWatch log group encryption failed silently; logs couldn’t use our CMK.

**Root cause**  
The KMS policy didn’t include the region-specific `logs.<region>.amazonaws.com` principal or the correct encryption context condition.

**The fix**  
Updated the KMS key policy to include:
- Principal: `logs.${data.aws_region.current.name}.amazonaws.com`  
- Condition matching `/cloud-setup/${var.env}/*` log group ARN.  
Re-ran apply; CloudWatch Logs created successfully and tests passed.

---

## 6) Bastion host allowed open SSH
**The problem**  
Security scan flagged SSH wide open to the world (0.0.0.0/0).

**Root cause**  
Default variable for `bastion_ssh_cidr` was `0.0.0.0/0`. Forgot to override during test deploy.

**The fix**  
Changed default to `0.0.0.0/32` and added validation to require explicit override before apply.  
Now SSH access must be explicitly whitelisted; no more open ports by mistake.

---

## 7) Patch Manager never ran
**The problem**  
Patch Manager configuration existed but didn’t actually attach to any instances.

**Root cause**  
Instances weren’t tagged with `PatchGroup=linux`, so the association had zero targets.

**The fix**  
Added the `PatchGroup` tag to the Launch Template and web instance.  
Association now detects instances and schedules patch scans properly.

---

## 8) Integration tests weren’t fully region-agnostic
**The problem**  
Tests passed only in `us-east-2`; running from another region caused lookup failures and mismatched resource names.

**Root cause**  
The integration test defaulted to `AWS_REGION=us-east-2` without fallback. CloudFront queries also assumed global region logic but didn’t isolate the API calls.

**The fix**  
Forced region discovery in tests using environment variables only (`AWS_REGION` or `AWS_DEFAULT_REGION` required).  
Removed region literals. Now tests adapt automatically to wherever the stack is deployed.

---

## 9) S3 bucket versioning broke destroy
**The problem**  
Destroy occasionally failed with `BucketNotEmpty` even with `force_destroy = true`.

**Root cause**  
Policy propagation delay after enabling versioning; Terraform attempted deletion before AWS fully applied bucket settings.

**The fix**  
Added small `time_sleep` dependency between versioning and bucket policy to allow AWS state to settle before destroy.  
Destroy now completes consistently.

---

## 10) Outputs missing for validation
**The problem**  
Integration tests couldn’t find several expected outputs: `rds_port`, `cw_log_group_use2`, `sns_alarms_topic_arn`.

**Root cause**  
Outputs weren’t defined or were misnamed in earlier versions.

**The fix**  
Declared explicit outputs for all required keys with consistent naming.  
Tests now pick up all resource identifiers correctly.

---

### What we ended up with
After these fixes:
- Lambda triggers reliably from S3 events.  
- CloudWatch alarms exist and publish to SNS.  
- Backups destroy cleanly without manual cleanup.  
- The stack is fully region-agnostic.  
- Bastion SSH access is restricted by default.  
- Patch Manager association is active.  
- Integration tests produce consistent results across environments.

A stable, secure, and predictable Terraform stack that behaves the same in any AWS account or region.
