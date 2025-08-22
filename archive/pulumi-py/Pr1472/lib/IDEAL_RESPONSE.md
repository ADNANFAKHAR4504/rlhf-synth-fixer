Overview

This document describes the Pulumi-based implementation for cross-region AWS infrastructure migration from us-west-1 to us-east-1.
The program is production-grade, idempotent, and enforces AWS best practices including encryption, least privilege IAM, monitoring, and automated backups.

Implementation is in Pulumi with Python, located at:

Infrastructure: lib/tap_stack.py

Unit Tests: tests/unit/test_tap_stack.py

Integration Tests: tests/integration/test_tap_stack.py

Migration Scope
Services Migrated

Amazon S3

Source buckets in us-west-1 replicated to target buckets in us-east-1.

Features: KMS encryption, versioning, cross-region replication, lifecycle policies.

Amazon EC2

Blue/green deployment in target region.

Application Load Balancer + Global Accelerator ensure zero downtime.

Public IP continuity is preserved through accelerator DNS mapping.

Amazon RDS (MySQL 8.0)

Encrypted with KMS-managed keys.

Automated read replica + promotion Lambda for seamless switchover.

Point-in-Time Recovery (PITR) enabled.

Monitoring & Logging

CloudWatch alarms for EC2 CPU and RDS CPU.

Migration dashboard summarizing infrastructure state.

Backups

AWS Backup Vault with KMS encryption.

S3 lifecycle rules (IA + Glacier).

Automated backup plan (daily backups, 1-year retention).

Implementation Highlights
1. Providers

Two providers are instantiated:

source_provider → us-west-1

target_provider → us-east-1

This allows controlled resource creation and replication across regions.

2. Networking

VPC in us-east-1 with DNS enabled.

Public and private subnets across multiple AZs.

Internet Gateway + route table associations.

This ensures high availability for compute and database tiers.

3. S3 Migration

Buckets: Source + target, both with KMS encryption and versioning.

Replication: Configured with a dedicated IAM role + least privilege policy.

Lifecycle rules: Non-current versions transition to IA (30 days) and Glacier (60 days).

4. EC2 Migration

Security Groups for HTTP, HTTPS, and restricted SSH.

EC2 Instances: Two Amazon Linux 2 AMIs in separate subnets with simple Apache web server bootstrap.

Application Load Balancer distributes traffic.

Global Accelerator ensures stable public IP continuity and zero-downtime failover.

5. RDS Migration

Subnet group with private subnets.

RDS Instance (MySQL 8.0, encrypted, PITR enabled).

Secrets Manager stores DB credentials securely.

Read Replica deployed for cross-region migration and availability.

Promotion Lambda automates failover from replica to primary.

6. Monitoring

CloudWatch alarms for EC2 and RDS CPU utilization.

Dashboard with infrastructure overview and monitoring status.

7. Backups

S3 lifecycle policies for long-term archival.

Backup Vault + Plan with IAM role for AWS Backup service.

Daily automated backups with 1-year retention.

Outputs

The program exports all key infrastructure identifiers:

S3 bucket names (source + target).

EC2 instance IDs and public IPs.

Load Balancer DNS.

RDS endpoints.

CloudWatch dashboard ARN.

Global Accelerator DNS.

KMS key IDs.

Secrets Manager ARN.

RDS Promotion Lambda ARN.

Testing Strategy
Unit Tests (tests/unit/test_tap_stack.py)

Pulumi Mocks validate:

Resource creation (S3, EC2, RDS, IAM).

Encryption and versioning enabled.

IAM policies use least privilege.

Outputs exported correctly.

Integration Tests (tests/integration/test_tap_stack.py)

Deploy stack into a sandbox AWS account.

Validate replication by uploading test objects into source S3.

Verify Global Accelerator routes traffic with no downtime during EC2 cutover.

Validate RDS replica promotion workflow.

Ensure CloudWatch alarms trigger under simulated high CPU load.

Backup & Restore Plan

S3: Lifecycle + cross-region replication guarantee recovery options.

EC2: Snapshots taken automatically by AWS Backup.

RDS: PITR + snapshots + replica promotion.

Vault: All backups stored in KMS-encrypted AWS Backup Vault.

Rollback Strategy

If deployment fails:

Destroy new resources in us-east-1.

Continue serving traffic from existing us-west-1 stack.

If migration validation fails:

Keep Global Accelerator pointing to us-west-1 until remediation.

Verification Steps

Confirm S3 replication by uploading test object in us-west-1.

Access service endpoint via Global Accelerator DNS.

Perform failover drill: promote RDS replica → validate data consistency.

Trigger CloudWatch alarm simulation to verify monitoring.

Validate backup plan schedules by checking AWS Backup console.