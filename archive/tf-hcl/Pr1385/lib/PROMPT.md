PROMPT.md

You are an expert DevOps engineer specializing in Terraform and AWS security/compliance.  
Your job is to produce a single-file, production-ready Terraform configuration that passes security checks and is fully deployable without manual steps.

Authoritative voice: be precise, decisive, and follow AWS best practices.  
Security-first: default-deny, least privilege, encryption everywhere, auditable.  
No hidden steps: everything must be codified in Terraform (or clearly documented outputs).

User Prompt

Objective

Create a secure and compliant AWS infrastructure with Terraform, deployed in us-west-2, under a single AWS account. Use standard naming conventions and the provided VPC ID vpc-0abc123de456.

All infrastructure code MUST live in lib/tap_stask.tf.  
A provider.tf already exists (AWS provider + S3 backend). Do not modify providers or backends.

Hard Requirements (must all be satisfied)

1. Security Groups (Ingress): Any SG that permits inbound traffic must only allow from specific IP addresses (parameterize allowed CIDRs).
2. S3 Encryption (CMK): All S3 buckets encrypted at rest using customer-managed KMS keys (not AWS-managed). Key rotation enabled.
3. S3 Access Logging: Server access logging enabled for every S3 bucket to a central logging bucket with appropriate write-only ACL/permissions.
4. IAM Least Privilege: Define roles/policies following least privilege; scope permissions by resource ARNs and conditions where possible.
5. CloudWatch Alarms: Create alarms that trigger on unauthorized API calls (e.g., AccessDenied, UnauthorizedOperation) using CloudTrail metrics filters with SNS notification.
6. VPC Flow Logs: Enable Flow Logs for VPC vpc-0abc123de456 to CloudWatch Logs (least-privilege role, log retention configured).
7. RDS High Availability: All RDS instances are Multi-AZ (storage encryption enabled, not publicly accessible, SG locked down).
8. EC2 AMIs: EC2 instances must use the latest security-patched AMIs (use SSM Parameter for latest Amazon Linux 2/2023) and hardened SGs.
9. Patch Automation: Configure SSM Patch Manager / Maintenance Windows / Associations to automatically apply security patches on EC2.
10. S3 Public Access Block: Block public access by default at the bucket level (and validate via bucket policy & account-level settings if needed).

Additional Constraints

Region: us-west-2 (pin all region-specific resources).  
Single file: lib/tap_stack.tf must include variables, locals, data sources, resources, and outputs—self-contained.  
No manual steps: Keys, roles, alarms, parameters—everything provisioned via Terraform.  
Tags: Apply consistent tags (e.g., Environment, Project, Owner, CostCenter, Compliance).  
Naming: Use predictable, lowercase, hyphenated names with suffixes by purpose (e.g., project-logs-bucket, project-cmk-s3, project-rds).

Deliverables

1. Terraform HCL in lib/tap_stack.tf only:  
   variable blocks (allowed CIDRs, alarm email(s), project/env names, RDS instance params, etc.).  
   locals for naming/tag standards.  
   data sources for SSM AMI lookup, caller identity, partition, and region.  
   KMS CMK for S3 with key policy least privilege.  
   S3 buckets with CMK encryption, versioning, bucket policy (deny non-TLS, deny unencrypted uploads, deny public ACLs), and logging.  
   VPC Flow Logs to CloudWatch Logs with retention and IAM role/policy.  
   CloudTrail writing to encrypted bucket + CloudWatch integration.  
   Metric filters + CloudWatch alarms + SNS topic for alerts.  
   IAM roles/policies scoped with least privilege.  
   RDS (Multi-AZ, encrypted, private).  
   EC2 with hardened SGs + SSM AMI.  
   SSM Patch Manager automation.  
   Outputs for key resource ARNs/IDs.
2. Validation Notes (Terraform comments at top).
3. No external modules (native AWS provider resources only).

Implementation Guidance

Defense-in-Depth: enforce TLS-only, deny unencrypted uploads, enforce SSE-KMS.  
IAM: avoid \*, scope to resource ARNs, use Condition blocks.  
EC2 Hardening: enforce IMDSv2, disable public IPs by default.  
Observability: log retention (90–365 days).  
RDS: enable deletion protection, backups, auto minor version upgrades.  
Flow Logs: include detailed fields (srcaddr, dstaddr, action).

Inputs to Expose

project_name, environment, owner, cost_center, compliance  
allowed_ingress_cidrs (list)  
alarm_emails (list)  
rds_engine, rds_engine_version, rds_instance_class, rds_allocated_storage  
ec2_instance_type  
vpc_id (default "vpc-0abc123de456")  
private_subnet_ids, public_subnet_ids  
flow_logs_retention_days, app_logs_retention_days  
ssm_patch_window_cron  
kms_key_administrators / kms_key_users

Acceptance Criteria

All S3 buckets: CMK encryption, logging, public access block.  
Bucket policies deny public access, enforce TLS, disallow unencrypted writes.  
CloudTrail enabled with encrypted logs + alarms.  
CloudWatch alarms trigger on unauthorized calls.  
VPC Flow Logs enabled + retained.  
SGs restrict ingress strictly to allowed CIDRs.  
RDS Multi-AZ, encrypted, private.  
EC2 uses latest AMI, hardened SGs, IMDSv2.  
SSM Patch automation active.  
All resources tagged and validated.
