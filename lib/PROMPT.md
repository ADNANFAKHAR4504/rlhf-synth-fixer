I’m writing down what I actually need built, in plain English, so there’s no confusion about scope.

What I want

- One Terraform file at lib/tap_stack.tf, nothing else. Provider setup already exists in provider.tf, so don’t repeat it.
- It should be easy to run “terraform plan” without prompts. Add sensible defaults and safe toggles for anything that’s likely to hit limits (CloudTrail, AWS Config, etc.).
- Keep it secure by default: TLS-only S3 access, server-side encryption, versioning, sane security groups, and least‑privilege IAM.

Region & inputs

- We already use an aws_region variable; declare it and wire everything to it. Default to us‑west‑2.
- I don’t want to pass a dozen variables just to plan. If something can be discovered (like default VPC/subnet) or safely defaulted, do that. Buckets still need unique names, but provide obvious placeholders.

What to include (practical checklist)

- S3: a logs bucket and a data bucket. Turn on versioning, block public access, enforce TLS in policies. Data bucket should have SSE (KMS is fine using alias/aws/s3 unless a key is provided). Send bucket access logs to the logs bucket.
- IAM: a role that lets an EC2 instance read/write S3 objects that are tagged the right way, and an IAM user we can use for deployments. Keep policies tight. Add an account‑level MFA requirement policy and attach it via a group the user belongs to.
- EC2 (behind a toggle): security group that only allows 22 and 443 from a provided CIDR. The instance (if enabled) must enforce IMDSv2 and have encrypted root volume.
- CloudTrail (behind a toggle): create a regional trail that writes to its own bucket, with the usual delivery policy. Since accounts often hit trail limits, give me an option to reuse an existing trail/bucket instead of creating one.
- AWS Config (behind a toggle): a recorder, delivery channel to the logs bucket, and a few core managed rules. Make it easy to switch off completely if the account already has a recorder.
- GuardDuty (behind a toggle): just the detector.

Outputs we rely on in tests/CI

- data_bucket_name
- trail_bucket_name (can be empty if CloudTrail disabled/reused)
- cloudtrail_arn (same note as above)
- ec2_instance_id (can be empty if EC2 is off)
- security_group_id (same)
- iam_role_name
- iam_user_name

General notes

- Don’t introduce any provider blocks into tap_stack.tf.
- Use small, readable blocks and comments where it’s not obvious why we’re doing something.
- Err on the side of not breaking shared accounts: ship with CloudTrail and AWS Config disabled by default, but make it trivial to enable with TF_VARs.
