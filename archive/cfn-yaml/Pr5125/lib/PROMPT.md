## Objective

Design a single **CloudFormation YAML** template named **`TapStack.yml`** that builds a new, secure, multi-AZ web-application stack in **`us-east-1`**.
The stack must be fully deployable with no external dependencies and include all required networking, compute, database, storage, and monitoring components using AWS native services only.

---

## Functional Scope

Provision a complete production-ready environment with:

* **VPC** (new) with 2 public and 2 private subnets across AZs, Internet Gateway, NAT Gateways, route tables, and VPC endpoints for S3, SSM, EC2 Messages, Logs, KMS, and STS.
* **Security Groups** for ALB, App, DB, and VPC endpoints.
* **KMS Keys** (Logs, Data, Params) with rotation enabled and aliases.
* **S3 Buckets** for central logs, CloudTrail logs, Config delivery, and app artifacts — all versioned, TLS enforced, and access-blocked from public.
* **ALB** (HTTP→HTTPS redirect if ACM cert provided) with access logs to S3, attached to an **Auto Scaling Group** across private subnets.
* **Launch Template** (Amazon Linux 2023, IMDSv2, encrypted EBS, SSM agent, minimal bootstrap server).
* **Aurora PostgreSQL** cluster (multi-AZ, encrypted, IAM Auth, backups, SSL enforced).
* **CloudTrail** (multi-region) sending logs to KMS-encrypted S3 and CloudWatch.
* **VPC Flow Logs** to S3 and CloudWatch Logs.
* **CloudWatch Alarms** for unauthorized operations, trail changes, and KMS activity, notifying via **SNS** email.
* **AWS Config** recorder, delivery channel, and managed rules (EBS encryption, S3 public access, CloudTrail enabled, root MFA, KMS rotation).
* **GuardDuty** detector with findings sent to SNS.
* **Lambda** (Python) triggered by S3 ObjectCreated events, running in private subnets with minimal permissions.
* **IAM Roles** for EC2, Lambda, CloudTrail, Flow Logs, and Config with least-privilege policies.

---

## Security & Compliance

All data and logs encrypted with KMS CMKs.
No public S3 access.
IMDSv2 enforced.
Multi-AZ design for availability.
FISMA-aligned controls via AWS native services.
All resources tagged with `Project`, `Environment`, and `FISMA=true`.

---

## Outputs

VPC ID, Subnet IDs, Security Group IDs, ALB DNS, Target Group ARN, ASG name, Launch Template ID, Aurora endpoints, S3 buckets, KMS aliases, CloudTrail ARN, Config delivery bucket, GuardDuty detector, SNS topic, Lambda ARN, and VPC endpoint IDs.

---

This template deploys a fully new, compliant, and production-grade AWS environment following best practices for security, availability, and monitoring.
