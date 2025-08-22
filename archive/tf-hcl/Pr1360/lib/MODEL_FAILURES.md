# Model Failures

- **Incomplete/invalid HCL**: The response is truncated and ends mid-resource at `aws_config_delivery_channel.main` (line ~989), causing a syntax error and failing `terraform validate`.

- **AWS Config delivery channel incomplete**: `aws_config_delivery_channel.main` is not fully defined (missing `s3_bucket_name` reference completion and related fields), so the recorder cannot deliver configuration snapshots.

- **Missing AWS Config managed rules**: Required rules are not present:
  - `s3-bucket-server-side-encryption-enabled`
  - `cloudtrail-enabled`
  - `encrypted-volumes`
  - `restricted-ssh`
  - `vpc-flow-logs-enabled`

- **GuardDuty not enabled**: No `aws_guardduty_detector` resource defined.

- **No outputs provided**: The response omits all required outputs specified in the prompt, including (at minimum):
  - VPC ID; Subnet IDs; Security Group IDs
  - RDS endpoint
  - S3 bucket names/ARNs (logs, data)
  - CloudTrail details
  - Config recorder/delivery identifiers
  - GuardDuty detector ID
  - API Gateway ID and stage name/URL

- **`aws_region` variable unused**: `variable "aws_region"` is declared but never referenced within resources/ARNs as requested (prompt: “Use `var.aws_region` consistently for region-specific resources and ARNs”).

- **CloudTrail S3 delivery policy missing**: No S3 bucket policy statement granting CloudTrail permission to write with `s3:x-amz-acl = bucket-owner-full-control` to the logs bucket prefix. The created IAM role for CloudTrail is also not referenced by the `aws_cloudtrail` resource, making it effectively unused.

- **Minor deviations from “least privilege” intent**: A standalone CloudTrail IAM role/policy is created but unused by CloudTrail; this introduces unnecessary IAM surface area contrary to “minimal roles and policies.”
