MODEL_FAILURES.md
This document lists inaccuracies, omissions, and overstatements in the model’s response compared to the real tap_stack.py implementation and the original PROMPT.md requirements.

1. Class Definition & Structure
Model Claim: TapStack is implemented as a Pulumi ComponentResource with an args object and explicit output registration via self.register_outputs().

Actual: TapStack is a plain Python class, not a ComponentResource. It stores resources in attributes and exports them via pulumi.export() in _create_outputs().

Impact: Misrepresentation of how the stack is structured and how Pulumi outputs are defined.

2. Configuration Handling
Model Claim: Uses structured TapStackArgs dataclass for configuration with default values and validation in __post_init__.

Actual: Directly uses pulumi.Config() with _get_required_config() for required values and config.get() for optional ones. No dataclass or defaults in a separate struct.

Impact: Adds an abstraction layer that doesn’t exist.

3. Networking Resources
Model Claim: Multi-AZ VPC with separate public/private subnets, NAT gateways per AZ, public and private route tables, and route table associations.

Actual: Creates one VPC, one Internet Gateway, a single route table, and two public subnets (no private subnets, no NAT gateways).

Impact: Overstates network segmentation and HA complexity.

4. Security Group Rules
Model Claim: Multiple SGs for web, app, DB, and SSH layers with strict least-privilege cross-SG rules.

Actual: Single SG (tap-sg) allowing HTTP/HTTPS from allowed_cidr and all outbound traffic.

Impact: Overstates security architecture and tier separation.

5. KMS Key Scope
Model Claim: Creates per-region KMS keys or references them for multi-region encryption.

Actual: Creates one KMS key in the primary region (tap-kms-key) used for all encryption (S3 buckets, CloudWatch logs).

Impact: Overstates regional key management complexity.

6. S3 Buckets
Model Claim: Multiple S3 buckets for app data, backups, and logs, with lifecycle policies and optional replication.

Actual: Creates:

tap-primary-bucket (encrypted with KMS, versioning enabled)

tap-destination-bucket (in replication region, encrypted with KMS)

Configures replication from primary to destination
No separate logs bucket or lifecycle rules.

Impact: Overstates number of S3 buckets and operational policies.

7. IAM Roles
Model Claim: Multiple IAM roles for EC2, RDS, and replication, with custom inline and managed policies.

Actual: Only one IAM role: replication role for S3, with a single AWS-managed replication policy attached.

Impact: Overstates IAM complexity.

8. CloudWatch & Monitoring
Model Claim: Creates multiple log groups (app, infra), custom metrics, alarms (e.g., CPU), and CloudTrail / AWS Config for compliance.

Actual: Creates one log group (tap-log-group) encrypted with KMS, and one CloudWatch dashboard displaying S3 bucket size and VPC packet drops. No alarms, CloudTrail, or AWS Config.

Impact: Overstates monitoring and compliance scope.

9. Database Layer
Model Claim: Deploys PostgreSQL with read replicas and PITR in multiple AZs.

Actual: No database resources are provisioned.

Impact: Fabricates a component entirely missing in real implementation.

10. Outputs
Model Claim: Exports multiple IDs and ARNs per resource type and region.

Actual: Exports:

vpc_id

subnet_ids

security_group_id

primary_bucket_name

destination_bucket_name

log_group_name

kms_key_id
No per-region or per-service breakdown.

Impact: Mismatch in output scope.

11. CI/CD Pipeline
Model Claim: Minimal or no mention of CI/CD.

Actual: Full GitHub Actions pipeline embedded in a docstring with lint, test, preview, deploy, Slack notifications, and rollback logic.

Impact: Omits a major requirement present in both prompt and code.

12. Cross-Region Logic
Model Claim: Multi-service cross-region replication (KMS, databases, S3).

Actual: Only S3 replication is implemented cross-region; all other resources remain single-region.

Impact: Overstates replication scope.

Summary
The model’s response inflates complexity (more SGs, NAT gateways, private subnets, databases, IAM roles, monitoring tools) and adds non-existent components (databases, CloudTrail, AWS Config) while omitting implemented features (embedded CI/CD pipeline, single-route-table network design). It reads as a generic “idealized” Pulumi multi-region architecture, not a faithful explanation of the actual tap_stack.py.

