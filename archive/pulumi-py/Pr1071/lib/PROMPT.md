# Pulumi AWS Infrastructure Project - Staging & Production Environments

## Objective
Develop a **Pulumi Python** project to manage AWS infrastructure across two environments: **staging** and **production**. The solution must be **modular**, with each AWS resource implemented as a class inside a `components` package. The code must follow Pulumi best practices and ensure environment separation, security, and maintainability.

---

## Requirements

### Infrastructure Definition
1. Use **Pulumi's Python SDK** to define resources.
2. Structure the code in a **modular format**, creating a `components` package with dedicated classes for:
   - S3 bucket (with versioning, logging, and KMS encryption)
   - DynamoDB table (on-demand capacity mode)
   - IAM role (minimum permissions)
3. Keep resource definitions reusable for both environments.

### Environments
4. Implement two environments: **staging** and **production**.
5. Use **environment variables** to determine which environment to deploy.
6. Ensure **unique naming conventions** per environment for all resources.
7. Changes to **staging** must not impact **production**.

### S3 Buckets
8. Create one S3 bucket per environment.
9. Enable:
   - Versioning
   - KMS encryption (at rest)
   - Access logging (logs stored in a dedicated log bucket)
10. Buckets must include tags for cost tracking.

### DynamoDB Tables
11. Create one DynamoDB table per environment.
12. Use **on-demand capacity mode**.
13. Tag tables for financial accountability.

### IAM Roles
14. Create environment-specific IAM roles.
15. Apply the **minimum necessary permissions**.
16. Tag roles for tracking.

### Global Settings
17. Deploy all resources in **us-west-2**.
18. Apply tagging across **all resources** for cost tracking and management.

---

## Expected Output
A valid **Pulumi Python** project that:
- Executes successfully with `pulumi up`
- Clearly separates staging and production infrastructure
- Implements all required security (KMS, IAM least privilege) and logging
- Uses modular class-based design inside `components` package
- Supports environment switching using environment variables
- Ensures that staging changes do not affect production

---

## Constraints
- AWS as the cloud provider
- Modular architecture (`components` package)
- Environment-specific resource naming
- KMS encryption for S3 buckets
- On-demand capacity for DynamoDB
- Environment isolation between staging and production
- Tagging for all AWS resources