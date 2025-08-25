# IDEAL_RESPONSE.md

## Project Summary

**Project:** IaC - AWS Nova Model Breaking  
**Region:** us-west-2  
**Framework:** Python + Pulumi SDK  
**Team:** Nova Team  
**Environment:** Production-ready, secure, and highly available AWS stack

---

## Implementation File: `lib/tap_stack.py`

### Configuration & Validation

- All required Pulumi config keys (`allowed_cidr`, `db_backup_retention_days`, `cross_region_replication_region`) are validated; deployment fails fast if missing.
- `cross_region_replication_region` defaults to `us-east-1` if unspecified.
- All secrets (DB credentials, etc.) handled via AWS Secrets Manager. No hard-coded credentials.

### Resource Naming & Tagging

- Every AWS resource name conforms to `<TeamName>-<Environment>-<ServiceName>`.
- All resources tagged with:
  - `Owner`: Nova Team
  - `Purpose`
  - `Environment`

### VPC & Networking

- Custom VPC (`10.0.0.0/16`) with DNS support.
- Subnets:
  - Public subnets for ALB (multi-AZ)
  - Private subnets for EC2 & Fargate (multi-AZ)
  - Isolated subnets for RDS (multi-AZ)
- Internet Gateway (public subnets), NAT Gateway (private subnets), appropriate route tables.
- Security groups:
  - ALB: Ingress `80/443` from anywhere.
  - EC2: Ingress `22` (SSH) from `allowed_cidr`, web traffic from ALB SG.
  - Fargate: Ingress web ports from ALB SG.
  - RDS: Ingress `3306` only from EC2 SG & Fargate SG.
  - Egress: all protocols allowed.

### Compute

- Auto Scaling Group:
  - EC2 C5 family instances (multi-AZ, encryption, correct launch template).
  - Scaling policies: scale up if average CPU >75% for 5 minutes.
  - SSH restricted to `allowed_cidr`.
- Fargate Service:
  - ECS cluster/tasks in private subnets only.
  - Logging enabled.
  - Service-to-service comms encrypted (TLS 1.2+).

### Storage

- S3 Buckets:
  - Server-side encryption (KMS) and versioning.
  - Cross-region replication on critical buckets.
  - Public access blocked via resource policy.

### Databases

- RDS:
  - Multi-AZ MySQL engine.
  - KMS encryption at rest.
  - In isolated subnet group.
  - Credentials in AWS Secrets Manager.
  - Maintenance & backup windows set.
  - Automated, scheduled backups via AWS Backup.
- AWS Backup:
  - Daily backup plan for RDS and EBS, retention per config.

### Monitoring & Alarms

- CloudWatch Alarms:
  - EC2: alarm for CPU >75%.
  - Fargate: alarm for task CPU >75%.
- All monitoring resources encrypted.

### Pipeline

- AWS CodePipeline for CI/CD:
    - Build → Test → Deploy → Rollback stages.
    - Inline buildspec YAML snippet as code comment in stack file.
    - Fails deployment and auto-rolls back to last working revision if deploy fails.

---

## Unit Testing: `tests/unit/test_tap_stack.py`

- Uses pytest + Pulumi mocks (no AWS calls).
- Validates:
  - All resources deployed in `us-west-2`.
  - KMS encryption enabled for RDS, S3, EBS.
  - S3 buckets have versioning.
  - ASG uses C5 family, multi-AZ.
  - WAF attached to ALB.
  - Ingress rules on SGs exactly match `allowed_cidr` from config.
  - AWS Backup plan exists for RDS/EBS.
  - Tags: `Owner`, `Purpose`, `Environment` for each resource.

---

## Integration Testing: `tests/integration/test_tap_stack.py`

- Uses pytest + Pulumi mocks (offline/deterministic).
- Verifies resource wiring and relationships:
  - Fargate service is in private subnets, ALB in public.
  - ALB linked to WAF ACL.
  - S3 replication enabled to correct region.
  - RDS is multi-AZ in isolated subnets.
  - CloudWatch alarms attached to correct compute metrics.
  - AWS Backup covers RDS and EBS.

---

## Implementation Rules

- All helper functions defined within `lib/tap_stack.py`.
- Absolutely no hard-coded secrets; everything loaded from AWS Secrets Manager via Pulumi config at deploy time.
- IAM roles/policies always follow least privilege.
- Only file modifications allowed:
  - `lib/tap_stack.py` (infra + pipeline comments)
  - `tests/unit/test_tap_stack.py` (unit tests)
  - `tests/integration/test_tap_stack.py` (integration tests)

---

## Deliverable

- A repository where only the above files are changed/added.
- All requirements strictly enforced by code assertions and test coverage.
- Tests pass locally/offline with Pulumi mocks; no "real" AWS calls for test execution.
- Solution follows AWS and infrastructure-as-code best practices, and can be maintained/audited over time.
