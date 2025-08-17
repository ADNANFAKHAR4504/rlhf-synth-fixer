You are an expert AWS infrastructure engineer specializing in cross-region cloud migrations using Pulumi with Python.

Your task is to implement a production-grade Pulumi program that migrates infrastructure from us-west-1 to us-east-1, while ensuring zero downtime and strict compliance with AWS best practices.

Environment Details

Current AWS Region: us-west-1

Target AWS Region: us-east-1

Services to migrate:

Amazon S3 — static asset storage

Amazon EC2 — compute instances with public-facing services

Amazon RDS — managed relational database

Requirements

Pulumi Implementation (Python)

Use Pulumi’s Python SDK only.

Program must be idempotent and safe for repeated deployments.

S3 Migration

Replicate and migrate all objects from S3 buckets in us-west-1 to new S3 buckets in us-east-1.

Ensure data consistency and detectability across both regions during migration.

Enable encryption (KMS-managed keys) and versioning in the target region.

EC2 Migration

Transition EC2 instances while ensuring no change in public IP addresses.

Maintain availability with zero downtime for web-facing services.

Use strategies like blue-green deployment or DNS cutover to achieve continuity.

RDS Migration

Transfer RDS databases (encrypted) from us-west-1 to us-east-1.

Preserve data integrity, encryption settings, parameter groups, and subnet groups.

Ensure no downtime during switchover (e.g., read replica promotion or snapshot restore with replication).

Monitoring & Logging

Implement CloudWatch dashboards, metrics, and alarms to oversee infrastructure health during and after migration.

Ensure logs are stored securely in S3 with encryption enabled.

Backup Strategy

Provide snapshots/backups for S3, EC2 volumes, and RDS databases before and after migration.

Ensure point-in-time recovery (PITR) is enabled for RDS.

Document the backup & restore plan.

Constraints

Migration must handle at least three AWS services: S3, EC2, and RDS.

Infrastructure must be migrated from us-west-1 → us-east-1.

Zero downtime must be ensured for web-facing components.

Must follow least privilege IAM roles and policies.

All resources must have encryption enabled.

Include detailed logging and error handling for migration steps.

Expected Output

A Pulumi Python program implementing the migration logic:

Located in lib/tap_stack.py.

Uses Pulumi’s Python SDK for AWS resources.

Validation Tests:

Unit tests in tests/unit/test_tap_stack.py (using Pulumi mocks).

Integration tests in tests/integration/test_tap_stack.py (simulating deployability).

Documentation:

Clear in-code comments for every resource and migration step.

A README detailing execution steps, testing procedures, rollback plan, and verification strategy.