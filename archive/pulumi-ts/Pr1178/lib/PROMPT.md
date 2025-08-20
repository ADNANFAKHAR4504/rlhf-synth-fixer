I need to build a secure AWS infrastructure using Pulumi with TypeScript. The setup must operate exclusively in the 'us-east-1' region, be production-grade, and enforce strict security protocols. Here are the components I need:

1. Create one or more S3 buckets with the following configurations:
- Server-side encryption using AWS KMS (with either AWS-managed or customer-managed keys).
- Versioning enabled.
- Bucket policies or ACLs that prevent any form of public access.
2. Define IAM roles and policies that adhere strictly to the principle of least privilege.
3. Implement policies that require multi-factor authentication (MFA) for performing sensitive IAM actions.
4. Enable AWS CloudTrail to capture and log all API activity across the account for audit purposes.
5. Apply resource tagging consistently across all resources using the following format:
- `Environment: Production`
- `Project: Security`
6. Ensure that all resources are provisioned within the 'us-east-1' AWS region.
7. Ensure the Pulumi code structure is modular, readable, and aligns with best practices for long-term infrastructure maintenance.

Please provide the Pulumi TypeScript code to implement this setup. The code must focus on correctness, security compliance, and maintainability. Avoid boilerplate setup only include the infrastructure code with secure defaults and production-grade patterns.