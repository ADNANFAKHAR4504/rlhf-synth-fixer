# Ideal Response

This response delivers a **complete CloudFormation YAML template** named `TapStack.yml` that:

- Creates **three isolated environments** (development, staging, production) in `us-east-1`.
- Defines **unique VPCs** with exact CIDR blocks (10.0.0.0/16, 10.1.0.0/16, 10.2.0.0/16).
- Builds **2 public and 2 private subnets** per VPC across two AZs.
- Configures **Internet Gateways, NAT Gateways, and Route Tables** appropriately.
- Creates **S3 buckets per environment** with:
  - Versioning enabled
  - SSE-S3 encryption
  - Public access blocked
  - Lifecycle rules for incomplete multipart uploads
  - DeletionPolicy: Retain
- Implements **automated replication** (dev → staging → prod) only for `non-sensitive/` prefix.
- Defines **replication roles with least privilege**.
- Defines **IAM environment roles** (`TapStack-<env>-Role`) scoped to:
  - Only their environment’s S3 bucket
  - EC2 permissions restricted by tags/conditions
  - Explicit deny for cross-environment access
- Includes **Parameters** (`ProjectName`, `Owner`, `TeamPrincipalARN`, `CreateNatPerAZ`).
- Provides **Outputs** (VPC IDs, Subnet IDs, Bucket Names/ARNs, IAM Role ARNs, Replication Roles).
- Includes **Metadata/Comments** explaining design decisions, limitations, and verification commands.
- **Passes acceptance criteria**:
  - No overlapping CIDRs
  - Isolation enforced
  - Replication restricted to `non-sensitive/`
  - Least-privilege IAM roles
  - Resource names follow `TapStack-<env>-<resource>`

This is the **gold-standard response**: complete, validated YAML with documentation, ready for deployment.
