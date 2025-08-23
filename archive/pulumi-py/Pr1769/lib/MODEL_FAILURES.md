# MODEL_FAILURES.md

This document outlines mismatches and deficiencies in tap_stack.py compared to the requirements specified in IDEAL_RESPONSE.md.

---

## Configuration & Validation

- Required config validations for `allowed_cidr`, `db_backup_retention_days`, and `cross_region_replication_region` are present, but error handling and deployment termination for missing configs are not strictly enforced throughout.  
  Correction: Add explicit error raising or halt deployment if any required config is missing.

- The RDS resource contains hardcoded database credentials ("changeme123!").  
  Correction: Credentials must be loaded securely from AWS Secrets Manager.

---

## Resource Naming & Tagging

- Resource naming conforms to `<TeamName>-<Environment>-<ServiceName>`.
- Tagging is in place for most resources, but some resources may be missing one or more of the required tags (`Owner`, `Purpose`, `Environment`).  
  Correction: Ensure all resources include each required tag.

---

## VPC & Networking

- VPC, subnet layouts, and route tables meet the multi-AZ, public/private/isolated structure.
- The RDS security group is missing unrestricted egress rules.  
  Correction: Add egress rules to the RDS security group.

- The EC2 security group allows HTTP from ALB but does not include HTTPS (443). Fargate security group allows HTTP but not HTTPS.  
  Correction: Add HTTPS (443) ingress rules for EC2 and Fargate security groups as required.

---

## Compute

- Auto Scaling Group uses the correct instance type (C5 family), launch template, health checks, and block device encryption.
- ASG launches in private subnets; verify multi-AZ configuration and proper traffic routing.
- SSH access is restricted via security group but needs explicit validation to ensure only `allowed_cidr` is approved.

---

## Storage

- S3 buckets use KMS encryption and versioning.
- Cross-region replication is implemented.
- The replication IAM role's policy does not include all required S3 actions (e.g., `s3:ReplicateTags`, `s3:PutObject`).  
  Correction: Update the IAM policy to cover all required permissions for replication.

- S3 buckets lack configuration for public access blocking.  
  Correction: Add public access block settings to all buckets.

---

## Databases

- RDS credentials are hardcoded rather than loaded from AWS Secrets Manager.
- Backup retention and multi-AZ are properly configured.
- RDS backups rely only on built-in mechanisms; AWS Backup plan and vault resources are missing.  
  Correction: Implement centralized AWS Backup resources covering both RDS and EBS volumes.

---

## Monitoring & Alarms

- CloudWatch log group for Fargate is present.
- CloudWatch alarms are only partially implemented; the code for EC2 CPU alarm is incomplete, and alarms for Fargate CPU are not present.  
  Correction: Complete the implementation for CloudWatch alarms for both EC2 and Fargate CPU metrics.

---

## Pipeline

- AWS CodePipeline configuration is present only as comments.
- There are no CodePipeline infrastructure resources defined in the Pulumi code.
- Rollback logic for deployments is mentioned in comments but not implemented in the code.  
  Correction: Add resources and logic for full pipeline and rollback capability.

---

## Implementation Rules

- Helper functions are defined within the main stack file.
- Hard-coded secrets are present; these must be replaced by secure secret retrieval.

---

## Testing

- There are no unit or integration test files present.

---

## Additional Issues

- There is no enforcement of TLS 1.2+ for Fargate-to-ALB and service-to-service communications; ALB listener is configured for HTTP (port 80) only.  
  Correction: Ensure ALB provides HTTPS listener and configure all services for encrypted traffic.

- IAM policies attached to roles use AWS managed policies that may over-provision permissions.  
  Correction: Refine IAM policies to follow least privilege principle.

---

## Summary

Major issues include hard-coded database credentials, lack of AWS Backup plan for RDS/EBS, incomplete CloudWatch alarm wiring, missing security group rules for HTTPS, S3 public access block settings absent, missing unit/integration tests, missing CodePipeline infrastructure resources, and lack of TLS enforcement.  
Required corrections include secure secrets management, complete monitoring and backup configurations, refined IAM and security group policies, pipeline resource implementation, public access protection for S3, and comprehensive Pulumi test coverage.
