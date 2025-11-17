# model_failure

## Typical Failure Modes

Using static, globally unique names for S3 buckets routinely causes deployment failures when a name has already been used in the account or globally. Similarly, hard-coding an IAM role name can collide with a role created by a prior stack or manual configuration. Both patterns result in “already exists” errors and prevent idempotent, multi-environment deployments.

CloudTrail configurations often fail when invalid data event resource patterns are specified. An example is attempting to include a wildcard S3 object ARN pattern that is not accepted by the current API. This yields an invalid request error during trail creation. Another recurring issue is forgetting to allow CloudTrail to use the KMS key or failing to enforce TLS-only access on the destination S3 bucket.

## Security and Networking Gaps

Common weaknesses include leaving the Lambda function in public subnets, omitting NAT-based egress control, neglecting gateway or interface endpoints where private connectivity is required, or missing public access block settings on the log bucket. Each of these violates best practices for least privilege and private-by-default design.

IAM policies can be overbroad or incomplete. Typical mistakes are allowing wildcard administrative actions in key policies, failing to grant only the exact CloudWatch Logs and KMS permissions needed by Lambda, or omitting required permissions for SQS and DynamoDB Streams. These issues can either fail deployment or pass deployment but fail at runtime.

## Observability and Reliability Gaps

It is easy to overlook a 30-day retention policy for the Lambda log group, forget to create a dedicated SNS topic for alerts, or misconfigure the CloudWatch Alarm threshold and period. Without these controls, production incidents may go undetected or unresolved.

## Linting and Syntax Errors

YAML-specific pitfalls include accidental JSON syntax, improper intrinsic function usage, or quoting errors for Availability Zone lookups and substitutions. These cause linter and transform errors that block deployment.

## Remediation Guidance

Avoid global name collisions by not specifying static names for S3 buckets and IAM roles unless absolutely required. Keep the Lambda function in private subnets with NAT egress. Enforce full public access blocking and TLS-only access on the log bucket. Use a KMS key with rotation and narrowly scoped key policies. Provide gateway and interface endpoints where private connectivity is beneficial. Ensure the CloudTrail configuration adheres to accepted patterns and that it can write to the encrypted bucket using the KMS key. Add a CloudWatch Alarm that notifies an SNS topic upon Lambda errors within five minutes, and set the log retention period to 30 days. Validate with a linter before deployment and maintain consistent naming that includes the environment suffix across all resources.
