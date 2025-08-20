# Advanced AWS Security Configuration — Terraform (HCL) Implementation Prompt

## Role
You are a senior cloud security engineer and Terraform specialist. You write production-grade, compliant Terraform **HCL** that passes security scans and implements best practices for AWS at enterprise scale.

## Objective
**Deliver a complete Terraform HCL implementation** that enforces strict security controls (least privilege, encryption, monitoring, and threat detection) for an enterprise AWS environment, with data residency compliance in the EU.

## Environment
- Cloud: **AWS**
- Primary region for personal data and stateful services: **eu-west-1 (Ireland)**
- Availability: At least **three Availability Zones**
- Core services: **IAM, VPC, EC2, RDS (MySQL), S3, CloudWatch, CloudTrail, GuardDuty, WAF, KMS, Secrets Manager, Route 53 (if used), AWS Config (for compliance checks)**

## Functional Requirements
1. **IAM (Least Privilege)**
   - Create IAM **roles** and **policies** that grant only the permissions required by each workload/service.
   - Separate roles: e.g., `app_ec2_role`, `app_lambda_role`, `backup_role`, `ops_readonly_role`.
   - Deny actions by default; follow least privilege and scoped resource ARNs.
   - Inline or managed policies with clear, minimal actions and conditions.

2. **VPC (Secure Network Segmentation)**
   - One VPC in **eu-west-1** spanning **≥ 3 AZs**.
   - **Public** and **private** subnets in each AZ.
   - **Databases** strictly in **private subnets** (no public IPs).
   - NAT Gateways for egress from private subnets; no inbound from the internet.
   - **VPC Endpoints** (Gateway/Interface) for S3, Secrets Manager, KMS, CloudWatch Logs, STS, and EC2 to avoid public egress for these services.
   - **VPC Flow Logs** to a centralized logs destination (S3 and/or CloudWatch Logs).

3. **S3 (Encryption & TLS Enforcement)**
   - All S3 buckets (e.g., `logs`, `app-artifacts`, `backups`, `pii-data`) must use **SSE-S3 (AES-256)** or **SSE-KMS** keys.
   - **Bucket policies** must:
     - **Deny non-TLS** (`aws:SecureTransport = false`).
     - Restrict access to least-privileged principals/roles.
   - Block public access at account and bucket levels.
   - **Lifecycle** policies for logs (e.g., transition/expire as needed).

4. **KMS (Encryption at Rest)**
   - Create **customer-managed CMKs** for:
     - S3 (if SSE-KMS chosen),
     - RDS encryption,
     - Secrets Manager,
     - CloudWatch Logs (optional).
   - Enable **key rotation** (KMS-managed annual rotation).
   - Tag keys and restrict key policies to least privilege.

5. **Secrets Management**
   - Store sensitive values in **AWS Secrets Manager** with **automatic rotation** enabled wherever applicable (e.g., DB credentials) on a **90-day schedule**.
   - Ensure secrets are encrypted with KMS CMK and retrieved via VPC endpoints from private subnets.

6. **Key Rotation (90 Days)**
   - Enforce **IAM access key** rotation ≤ **90 days** using:
     - **AWS Config** managed rule(s) and/or a **scheduled Lambda** (Terraform-managed) with EventBridge rule to detect/disable/rotate stale keys.
   - Configure **Secrets Manager** rotation schedules (90 days).
   - (Note: KMS auto-rotation is annual; include **AWS Config** or controls to flag CMKs older than 90 days for manual rotation policy acknowledgment.)

7. **RDS (Private, Encrypted, HA)**
   - **RDS MySQL**:
     - **Multi-AZ**, encrypted with KMS CMK,
     - Deployed **only** in private subnets,
     - No public accessibility, proper SGs (from app tier only),
     - Automated backups and PITR,
     - Optionally integrate **CloudWatch Enhanced Monitoring**.

8. **Monitoring, Logging & Threat Detection**
   - **CloudTrail** organization or account trail (multi-region optional), logging to encrypted S3 with **CloudWatch Logs** integration.
   - **CloudWatch**:
     - Metrics & **alarms** for suspicious events (e.g., root usage, unauthorized API calls, console logins without MFA, security group changes, KMS key disable events).
     - EC2/RDS metrics with alarms.
   - **GuardDuty** enabled with findings published to CloudWatch Events/Alarm destinations and S3.
   - **Security Hub** (optional) enabled with foundational standards.
   - Centralized **S3 logs** bucket with lifecycle to transition/expire logs.

9. **WAF (Web Protection)**
   - **AWS WAF** (v2) with managed rule groups (AWSManagedRulesCommonRuleSet, SQLi, etc.).
   - Associate WebACL to an ALB or CloudFront distribution (resource created or placeholder plus variable toggle).

10. **TLS & In-Transit Encryption**
   - Enforce in-transit encryption for services:
     - ALB/CloudFront TLS policies,
     - Bucket policy `aws:SecureTransport`,
     - RDS parameter group enforcing TLS (where applicable),
     - Interface endpoints with TLS.

11. **GDPR Compliance (EU Residency)**
   - All **personal data** persisted only in **eu-west-1** (PII S3 buckets, RDS, backups).
   - Disable cross-region replication for PII unless to another **EU** region.
   - Tag resources holding PII (`DataClassification = PII`, `RegionConstraint = EU`).

12. **Backups**
   - Automatic backups for **RDS** (retention, copy tags, encrypted).
   - Optional EBS snapshot policies (if EC2 used) via **Data Lifecycle Manager** or AWS Backup.
   - Ensure backup vaults are encrypted and access-controlled.

## Constraints
- Use **IAM roles** (not users) for workloads; follow least privilege.
- **S3** must use **AES-256** encryption at rest and require **TLS** for transit.
- **CloudWatch** for logging & **alarms on security breaches/suspicious activity**.
- **VPC with public & private subnets**, DBs only in private subnets.
- **≥ 3 AZs** for HA across subnets and RDS.
- **Key rotation ≤ 90 days** for IAM access keys and Secrets; KMS rotation enabled (annual) plus compliance checks.
- **GuardDuty** enabled account-wide.
- **WAF** protecting web apps.
- **Secrets Manager** for sensitive data.
- **EU data residency** for personal data (eu-west-1).

## Delivery Rules
- Create all the resources in the same `main.tf` file
- add the necessary outputs at the end of the file after all resources have been created
- declare the variables with reasonable defaults at the beginning of the file.
- no need to add generic tags like "name" or "environment" on resources. Only use tags for specific resources mentioned in the problem statement.
