Please update the CloudFormation template to resolve validation errors and strengthen security.

**Key fixes required:**

1. Replace hardcoded availability zones with dynamic `!GetAZs`.
2. Remove invalid `CloudWatchConfigurations` property from S3.
3. Simplify UserData by removing unnecessary `Fn::Sub`.
4. Update MySQL engine version from `8.0.35` to a supported version (e.g., `8.0.43`).
5. Replace database password parameter with AWS Secrets Manager (auto-generated, KMS-encrypted).

**Security/Best Practices:**

- Ensure all sensitive data is encrypted with KMS.
- Add Secrets Manager permissions to KMS key policy.
- Make template region-agnostic.

**Expected outcome:**

- Template passes `cfn-lint` with zero errors/warnings.
- Deploys successfully in any AWS region.
- Database credentials securely managed in Secrets Manager.
- All resources remain functional and follow AWS best practices.
