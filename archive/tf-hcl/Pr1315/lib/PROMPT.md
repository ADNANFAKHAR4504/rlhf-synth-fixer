Youre a seasoned DevOps engineer working for an enterprise that runs multiple AWS accounts under AWS Organizations.
Our security team has asked for a reusable security-configuration-as-code module that creates the IAM foundation for every new account we spin up.

Please deliver a **complete, runnable Terraform package** (HCL v0.14+), plus a concise `README.md`, that meets the specs below.

1. Create at least three example IAM roles (e.g., `AppDeployRole`, `ReadOnlyRole`, `AuditRole`) that strictly follow the _least-privilege principle_.
- Use _separate_ JSON policy documents (no inline JSON in the `.tf` files).
- Attach the policies to the roles with Terraform resourcesnot `inline_policy`.
- Show how to assume each role across accounts (use wild-carded AWS account IDs like `111111111111` and `222222222222` in the `trusted_entities`).
2. Produce the IAM policies themselves (least privilege, no wildcard `*` actions unless absolutely necessary).
- Include at least one policy that allows CloudWatch read-only, one for S3 upload to a single bucket, and one that lets CloudTrail write to a centralized logging bucket.
- Reference AWS managed policies only when it genuinely reduces complexity.
3. Enable **full logging/auditing** of role activity by:
- Creating or referencing a CloudTrail trail that logs _all_ management and data events.
- Ensuring the trail delivers logs to an S3 bucket with versioning enabled.
- Adding an SNS topic and subscription to alert on IAM changes (e.g., new role creation).
4. Keep the code modular: a root module that calls a reusable `iam_baseline` child module.
- Show how to pass variables such as `environment`, `account_id`, and `log_bucket_name`.
- Provide sane defaults and clear variable descriptions.

Make sure the code runs with `terraform validate` and that the IAM policies pass AWSs access advisor checks.
