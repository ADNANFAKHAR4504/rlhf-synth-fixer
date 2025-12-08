# Functional scope (build everything new):

Produce a **single CloudFormation template** named **`TapStack.yml`** that provisions a brand-new, security-hardened AWS environment in **us-east-1**. The template must **create all modules from scratch** (no references to pre-existing resources) and align with strict security best practices suitable for a regulated industry.

# Environment & high-level goals

* Region: **us-east-1**.
* Services: VPC, Subnets, NAT, EC2 (via Launch Template/ASG), ALB, S3, RDS (Multi-AZ), API Gateway (REST), IAM, KMS, CloudTrail, CloudWatch (Logs/Alarms), AWS Config, GuardDuty, Secrets Manager, SNS (notifications), EventBridge (as needed).
* **All resource names** must include `ENVIRONMENT_SUFFIX` to avoid collisions across deployments (e.g., `${ProjectName}-${EnvironmentSuffix}-vpc`).
* **YAML only** (no JSON). Production-grade formatting, intrinsic functions clearly used, comments minimal and purposeful.

# Security requirements (must be enforced in code)

1. **Security Groups**: Every SG defines **explicit inbound and outbound** rules (no “allow all egress” defaults).
2. **IAM model**: Applications use **IAM roles** (EC2 instance profile, Lambda role) rather than IAM users.
3. **S3**: Buckets are **private**, with **Block Public Access** enabled and bucket policies denying non-TLS and public access.
4. **API Gateway logging**: Enable **access logs + execution logging** to CloudWatch Logs with a dedicated log group and retention.
5. **EC2 in VPC**: All instances launched in private subnets; **SSH restricted by parameterized IP/CIDR** via bastion or SSM Session Manager (prefer SSM; if SSH is provided, strictly locked down).
6. **MFA for IAM users**: Add an **account password policy** and an **IAM deny policy** that blocks non-MFA console/API actions for IAM users (Condition `aws:MultiFactorAuthPresent`), attached via an account-wide mechanism (e.g., group/inline policy; do not create new users).
7. **Least privilege**: IAM policies scoped to the minimum required actions and resources.
8. **AWS Config**: Recorder + delivery channel + **managed rules** (e.g., restricted SSH, S3 public read prohibited, required tags, IAM root access key prohibited).
9. **CloudWatch alarms**: Alarms for **`UnauthorizedOperation`/`AccessDenied`** derived from **CloudTrail metric filters**; notify via SNS topic.
10. **Encryption at rest**:

    * **KMS CMK** for: S3 bucket encryption, EBS volumes in Launch Template, RDS storage, CloudTrail logs, and CloudWatch log groups (where supported).
    * Launch Template must enable **EBS volume encryption** with KMS key.
11. **RDS backups**: Multi-AZ, **automated backups** with non-overlapping windows, `BackupRetentionPeriod` ≥ 7 days, copy-tags-to-snapshots, and deletion protection (parameterized).
12. **IAM password policy**: Strong complexity, minimum length, reuse prevention, and rotation (e.g., 90 days).
13. **GuardDuty**: Enable **Detector** in the account/region and route findings via **EventBridge → SNS** (or CloudWatch alarm) notifications.
14. **Secrets Manager**: Store database credentials with **rotation enabled** (managed rotation for the chosen engine) and inject via references where needed (no plaintext in UserData).
15. **CloudTrail**: **Multi-region** trail with log file validation, encryption with KMS, and S3 delivery. Provide a parameter to enable **Organization Trail** if the deployer has required org-level permissions; otherwise default to account-scoped multi-region.

# Conventions & constraints

* **All names include** `ENVIRONMENT_SUFFIX` (e.g., `${ProjectName}-${EnvironmentSuffix}-trail`).
* **Do not hard-code `AllowedValues`** for `EnvironmentSuffix`. Instead, enforce a **safe naming regex** using `AllowedPattern` (lowercase letters, digits, and hyphens only; length 3–32).
* **Parameters** provide sensible **defaults** to allow non-interactive CI/CD deploys.
* Template uses **Outputs** for all critical identifiers/ARNs (KMS keys, trail name, log groups, S3 buckets, VPC/Subnet IDs, SG IDs, RDS endpoint, API Gateway ID/URL, SNS topic ARN, GuardDuty detector, etc.).
* **No placeholders** like “<fill here>”. Provide fully wired resources.
* **Public subnets** only for ALB/NAT gateways; **no public EC2** workloads. Prefer SSM Session Manager over SSH; if SSH is included, gate by parameterized `KnownAdminCidr` and SG rules.
* API Gateway stage has **AccessLogSetting** with JSON format, and a **LogGroup** with retention (e.g., 30–90 days).
* RDS uses **Secrets Manager** for master credentials and sets **rotation** (e.g., 30 days).
* CloudWatch:

  * **Metric Filters** on CloudTrail logs for Unauthorized/AccessDenied and root login events.
  * **Alarms** tied to an **SNS topic** (email subscription parameter).
* AWS Config rules (non-exhaustive examples; include at least these): `restricted-ssh`, `s3-bucket-public-read-prohibited`, `iam-root-access-key-check`, `required-tags`.
* S3 buckets: enable **versioning**, **server-side encryption with KMS**, **lifecycle** for logs (e.g., transition to Glacier), and **access logging** where applicable (log buckets must also be private).
* Include **WAFv2** association to ALB or API Gateway (parameter toggle), with a minimal managed rule set as example.

# Parameters (illustrative expectations to include in the template)

* `ProjectName` (String; default `tapstack`; naming regex).
* `EnvironmentSuffix` (String; **AllowedPattern** only; no `AllowedValues`; e.g., `^[a-z0-9-]{3,32}$`).
* `KnownAdminCidr` (String; default empty or safe CIDR like `203.0.113.0/32`; used to restrict SSH if enabled).
* `VpcCidr`, `PublicSubnetACidr`, `PublicSubnetBCidr`, `PrivateSubnetACidr`, `PrivateSubnetBCidr` (CIDRs).
* `RdsInstanceClass`, `RdsEngine`, `RdsEngineVersion`, `RdsBackupRetentionDays`, `RdsDeletionProtection` (Bool).
* `AlarmEmail` (String; for SNS subscription).
* `EnableOrganizationTrail` (Bool).
* `EnableWAF` (Bool).
* `LogRetentionDays` (Number; used for CloudWatch log groups).
* `ApiAccessLogFormat` (String; a JSON log format string).
* `KeyRotationDays` (Number; for Secrets rotation schedule).

# Infrastructure modules to build (all new)

* **Networking**: VPC, 2 AZs minimum, public/private subnets, IGW, NAT gateways (1–2), route tables/associations, VPC endpoints for SSM/Secrets/S3 (as feasible).
* **Security Groups**:

  * ALB SG (80/443 from world if HTTPS; prefer 443).
  * App SG (from ALB SG only).
  * Optional Bastion/SSM SG for maintenance; SSH only from `KnownAdminCidr` (if SSH is enabled). **All SGs include explicit egress rules.**
* **KMS**: Customer-managed key for general data encryption; key policies scoped minimally; aliases include `EnvironmentSuffix`.
* **S3**:

  * Centralized log bucket (CloudTrail/ALB/API GW/Config logs), with lifecycle and strict policies.
  * Application data bucket(s) as needed, all private with BPAs.
* **CloudTrail**: Multi-region (and org trail if enabled); delivery to log bucket; KMS encryption; log validation enabled.
* **CloudWatch Logs/Alarms**: Dedicated log groups for API Gateway, application, and trails; metric filters + alarms (Unauthorized/AccessDenied, root sign-in).
* **AWS Config**: Recorder + delivery channel to an S3 bucket; rules as specified.
* **GuardDuty**: Detector enabled; EventBridge rule for high-severity findings → SNS notifications.
* **Secrets Manager**: DB credentials secret with rotation schedule (use managed rotation for the chosen engine).
* **RDS**: Multi-AZ, encrypted with KMS, automated backups, maintenance/backup windows, copy tags to snapshots.
* **Compute**: Launch Template with encrypted EBS volumes (KMS), ASG in private subnets, ALB in public subnets, health checks, and SSM agent for access (prefer **no SSH**).
* **API Gateway (REST)**: Private or edge/public per parameter; stage with access logs, execution logging, and KMS-encrypted log group; IAM auth example or authorizer stub; WAF association if enabled.
* **WAFv2**: Optional managed rule group associated to ALB or API Gateway.

# Outputs (non-exhaustive; include all critical references)

* VPC ID, Subnet IDs (by tier), Security Group IDs.
* KMS Key ARN(s) and Alias.
* S3 bucket names/ARNs (logs, data).
* CloudTrail Trail Name/ARN; Log Group ARN(s).
* API Gateway ID/Invoke URL; Stage name; Access Log Group.
* RDS Endpoint/Port/DBIdentifier; Secret ARN.
* GuardDuty Detector ID; SNS Topic ARN (alerts).
* AWS Config Delivery Channel and Recorder names.
* ALB DNS name/ARN; Target Group ARNs.

# Deliverable:

Provide **one file** named **`TapStack.yml`** that:

* Declares all **Parameters** (with safe defaults), **Mappings** (if used), **Conditions**, **Resources**, and **Outputs**.
* Implements every requirement above with **best-practice** configurations and **least privilege** IAM.
* Uses **`EnvironmentSuffix` everywhere in resource names**.
* Uses **YAML** exclusively (no JSON blocks).
* Avoids hard `AllowedValues` for `EnvironmentSuffix`; enforce a **regex** with `AllowedPattern` instead.
* Compiles with `cfn-lint` and is deployable non-interactively in CI/CD.

Generate the complete `TapStack.yml` now.
