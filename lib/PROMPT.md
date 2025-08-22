You are an expert AWS Solutions Architect specializing in building secure, multi-region infrastructures with CloudFormation. Your task is to produce a complete CloudFormation YAML template that sets up a production-grade, security-focused AWS environment.

**Context:**
The goal is to establish a foundational infrastructure that works in any AWS region and adheres to strict security and compliance standards. This environment should support multiple applications over time, so it needs to be modular, parameterized, and tagged consistently for governance.

**High-Level Security and Compliance Requirements:**
1. IAM roles and policies must follow least privilege principles, granting only the minimum permissions needed.
2. All storage (S3, logs, etc.) should be encrypted at rest using AWS KMS with customer-managed keys.
3. CloudTrail should capture all API activity, with logs stored in an encrypted S3 bucket.
4. AWS Config should be enabled to record configuration changes and support compliance monitoring.
5. GuardDuty with malware protection for S3 should be enabled for continuous threat detection.
6. MFA should be enforced for IAM users where applicable.
7. No S3 buckets should be public; apply secure bucket policies and block public access by default.
8. Security groups must be restrictive, only allowing inbound traffic from explicitly defined IP ranges.
9. Network ACLs should further restrict inbound and outbound traffic at the subnet level.
10. VPC endpoints should be used for private S3 access.
11. All resources should include consistent tagging: `Environment`, `Project`, and `Owner`.

**Core Infrastructure Components:**
- A VPC spanning multiple Availability Zones with both public and private subnets.
- KMS keys with properly scoped key policies for encryption.
- CloudTrail configured with secure log delivery.
- AWS Config recorder and delivery channel for compliance auditing.
- S3 buckets for application storage and logging (all encrypted, no public access).
- Security groups and NACLs enforcing a locked-down network model.
- VPC endpoints for S3 connectivity.
- IAM roles with least privilege permissions.
- VPC Lattice for secure service-to-service communication inside the environment.

**Template Expectations:**
- The template must be in CloudFormation YAML format only, provided in a single code block as `SecureInfraSetup.yaml`.
- Parameters should allow customization for environment (e.g., dev, staging, prod) and tagging values.
- Outputs should provide useful identifiers (e.g., VPC ID, Subnet IDs, KMS key ARNs, S3 bucket names, VPC endpoint IDs).
- Include thoughtful comments and descriptions in the template so other engineers can quickly understand its structure and purpose.
- Avoid any hardcoding; rely on parameters, intrinsic functions (`!Ref`, `!GetAtt`, `!Sub`, etc.), and region-agnostic constructs.
- Ensure the design aligns with AWS best practices and Trusted Advisor recommendations for security.

**Expected Output:**
Generate the full CloudFormation YAML template within `<yaml_code>` tags, structured for readability and maintainability.
