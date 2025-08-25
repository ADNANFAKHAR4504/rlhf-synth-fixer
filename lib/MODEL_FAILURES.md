# MODEL_FAILURES

**Prompt:** Security Configuration as Code (Terraform · HCL)

**Observed failures in MODEL_RESPONSE:**

- Missing KMS on CloudTrail & CloudWatch Logs
- S3 logs bucket not created; no versioning; public access not blocked
- No access-logs bucket or server access logging
- No AWS Config (recorder / delivery channel / start)
- No GuardDuty detector
- No IAM account password policy
- No CloudWatch metric filters or SNS alarms
- Hard-coded region/bucket; not parameterized via variables

**Impact:** Security monitoring & audit trails incomplete; risk of public data exposure; no alerting.
**Fix reference:** See `IDEAL_RESPONSE.md`.
