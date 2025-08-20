Need CDKTF (TypeScript) code to build a security-focused AWS infra setup for project requiring below goals. All code should be in a monolithic format.

Main goals:

- Every resource must be tagged with:
- Environment
- Owner
- Project
- IAM policies must be inline and follow least privilege
- Encrypt all data at rest with KMS-managed keys
- S3 buckets: versioning enabled + public access blocked
- VPCs: no direct internet access use NAT Gateway for outbound traffic
- Logging enabled for all AWS services used
- EC2 instances: must launch inside VPC + use security groups
- Enforce MFA for all IAM users

Constraints:

- Must meet all listed security/compliance requirements
- Output should be valid CDKTF (TypeScript) that passes `cdktf synth` and `terraform plan/apply`