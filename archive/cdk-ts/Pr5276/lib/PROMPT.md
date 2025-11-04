We need infrastructure guardrails that protect our systems and make remediation accountable. Please generate an AWS CDK TypeScript template which:

    •	Evaluates resource config on changes and keeps evaluations fast (we’ll aim to re-evaluate within 15 minutes of changes).
    •	Stores compliance data for 7 years (S3 lifecycle configured).
    •	Ensures every Lambda’s maximum execution timeout is at or below 5 minutes.
    •	Ensures services use IAM roles rather than long-lived access keys; flag any active IAM access keys.
    •	Implements remediation workflows that write audit logs (S3 & CloudWatch) before making any changes.

Keep the code single-file, well-commented, and include placeholders where we’ll drop business-specific remediation logic.
