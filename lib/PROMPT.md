You are an expert AWS + Pulumi engineer. Implement the following secure, high-availability AWS infrastructure in Python using Pulumi.

Only modify these files:

lib/tap_stack.py — Pulumi stack implementation

tests/unit/test_tap_stack.py — Pulumi mocks-based unit tests

tests/integration/test_tap_stack.py — Pulumi mocks-based integration tests

Do not modify other files in the repo. If pipeline configuration is needed, include it as a comment in lib/tap_stack.py.

1) Objective
Create a secure, resilient AWS environment for project "IaC - AWS Nova Model Breaking" in region us-west-2 with encryption, auto-scaling, WAF, Fargate containers, automated backups, and full CI/CD + rollback capability.

2) Hard requirements
Language: Python with Pulumi SDK

Region: us-west-2

Security:

Data encryption at rest (KMS) for all supported services

Data encryption in transit using TLS 1.2+

IAM roles with least privilege policies

SSH access only from a configurable CIDR (via Pulumi config)

Compute:

EC2 C5 series instances in an Auto Scaling Group (multi-AZ)

CPU-based scaling (scale up when >75% for 5 min)

ALB in front with AWS WAF configured for OWASP Top 10

Containers:

AWS Fargate-based application with logging enabled

Service-to-service communication encrypted with TLS 1.2+

Storage:

S3 buckets with default encryption & versioning enabled

Cross-region replication for critical buckets

Databases:

AWS RDS Multi-AZ deployment with KMS encryption & automated backups (via AWS Backup)

Isolated private subnets for DB instances

Monitoring & Backup:

CloudWatch alarms for CPU >75% on EC2/Fargate tasks

AWS Backup daily backup plan applied to RDS and EBS

Networking:

Custom VPC with public, private, and isolated subnets

Security groups locked to allowed CIDRs

Secrets:

All sensitive configuration in AWS Secrets Manager

Pulumi config reads secrets securely at deploy time

Pipeline:

CI/CD with AWS CodePipeline

Auto-deploy on successful build & tests

Rollback on failure to last working state

3) Tests
Unit tests (tests/unit/test_tap_stack.py)
Must run with pytest + Pulumi mocks (no AWS calls)

Assert:

All resources deployed in us-west-2

KMS encryption enabled for RDS, S3, EBS

S3 buckets have versioning enabled

ASG uses C5 instance types and has multi-AZ setup

WAF attached to ALB

Security group inbound rules match CIDR from config

AWS Backup plan exists for RDS and EBS

Integration tests (tests/integration/test_tap_stack.py)
Run with Pulumi mocks, validate resource wiring:

Fargate service in private subnets, ALB in public subnets

ALB connected to WAF Web ACL

S3 replication configured

RDS in isolated subnet with multi-AZ set

CloudWatch alarms linked to correct metrics

4) Delivery format
Output must only include:

=== lib/tap_stack.py ===

=== tests/unit/test_tap_stack.py ===

=== tests/integration/test_tap_stack.py ===

No narrative explanation

Inline comments allowed for clarity

Must pass pytest locally with Pulumi mocks

5) Extra implementation rules
All resource names follow: <TeamName>-<Environment>-<ServiceName>

Tag all resources with:

Owner

Purpose

Environment

Fail fast if required config missing: allowed_cidr, db_backup_retention_days, cross_region_replication_region

Default cross_region_replication_region to us-east-1 if not set

Keep all helper functions inside lib/tap_stack.py

Include commented AWS CodePipeline YAML snippet in lib/tap_stack.py showing:

Build → Test → Deploy → Rollback stages

Final note to assistant:

No hard-coded credentials; all secrets in AWS Secrets Manager & read via Pulumi config

Tests must be deterministic and run offline using Pulumi mocks

Use infrastructure-as-code best practices & least privilege IAM