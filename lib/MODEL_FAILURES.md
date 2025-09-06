# Model Failures

## Accuracy
- The model ignored constraints on Terraform version and syntax.
- It allowed public access on some resources (e.g., S3 and RDS) even though the requirements were strict about privacy.
- Missed CloudFront HTTPS-only enforcement and defaulted to HTTP.
- Incorrectly left IAM roles with overly broad permissions instead of least privilege.

## Completeness
- Did not configure CloudWatch alarms for failed IAM policy modification attempts.
- Skipped enabling logging on several AWS services (e.g., CloudTrail, S3 access logs).
- Missed tagging requirements (`Environment`, `Owner`, `Purpose`) on all resources.
- Did not separate configurations into environment folders (`dev`, `test`, `prod`).

## Code Quality & Execution
- Provided incomplete HCL snippets instead of full runnable files.
- Mixed placeholders without clear instructions.
- Naming conventions inconsistent with `<env>-<service>-<resource>`.
- Did not validate with `terraform plan` instructions.

## Other Issues
- Response style was overly verbose without actionable code.
- Included unnecessary disclaimers instead of production-ready outputs.
