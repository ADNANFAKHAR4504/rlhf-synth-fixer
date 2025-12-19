**Functional scope (build everything new):**
Generate a single CloudFormation template named **TapStack.yml** that provisions a *brand-new* secure AWS baseline covering: VPC (2 AZ public/private subnets), ALB, tightly-scoped IAM roles, S3 (SSE-KMS, access logs, BPA), KMS keys, Security Groups (inbound only 80/443), AWS WAF v2 (WebACL + ALB association), AWS Shield Advanced (subscription + protected resources), AWS CloudTrail (multi-region, encrypted to S3 + CloudWatch Logs), AWS Config (recorder, delivery channel, conformance packs/managed rules), Security Hub (standards enabled), GuardDuty (detector + S3 protection), and an encrypted RDS instance placed in private subnets with TLS enforced. The template must create all modules/resources itself (no references to pre-existing resources).

**Inputs & global conventions:**

* Parameters must include: `ProjectName`, `EnvironmentSuffix`, `OrganizationUnit`, `AccountAlias`, `WorkloadOwnerEmail`, `PrimaryRegion` (default `us-east-1`), `SecondaryRegion` (default `us-west-2`), `AllowedIngressCidrsHttp`, `AllowedIngressCidrsHttps`, `VpcCidr`, per-AZ subnet CIDRs, RDS engine/version/class/storage, ALB scheme, and toggles (e.g., `EnableShieldAdvanced`, `EnableSecurityHub`, `EnableGuardDuty`, `EnableWAF`).
* Enforce a *safe naming regex* for `EnvironmentSuffix` using `AllowedPattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'` with a helpful `ConstraintDescription`. Do **not** use hard `AllowedValues`.
* Every **resource name** (logical where applicable and especially physical Names/Prefixes, tags, bucket names, key aliases, DB identifiers, log group names, WebACL names, Security Group names) must append `-${EnvironmentSuffix}` to avoid cross-deployment conflicts.
* Apply consistent Tags to **all** taggable resources: `Project`, `Environment`, `OrganizationUnit`, `AccountAlias`, `OwnerEmail`, `CostCenter` (param), and `DataClassification` (param).

**Architecture & modules to provision (two-region ready):**

* **Networking (VPC):** 1 VPC (`VpcCidr`), 2 public + 2 private subnets across distinct AZs, route tables, IGW, NAT Gateways (1 per AZ), VPC endpoints (S3, CloudWatch Logs, STS, KMS, EC2, SSM, EC2Messages, SSMMessages).
* **Security Groups:** Only inbound TCP 80 and 443 where appropriate (e.g., ALB). No other inbound. Egress 0.0.0.0/0 TCP unless further restricted.
* **KMS:** Customer-managed CMKs for: S3 general data, CloudTrail, RDS, and (if used) ALB/WAF logs—each with rotation enabled, key policies granting least privilege to necessary services/principals.
* **S3:**

  * `LoggingBucket-${EnvironmentSuffix}` (versioned, SSE-KMS, Object Ownership = BucketOwnerEnforced, BPA = true, no public access, lifecycle for noncurrent versions).
  * `CloudTrailBucket-${EnvironmentSuffix}` (versioned, SSE-KMS with dedicated CMK, bucket policy allowing CloudTrail delivery, BPA = true, TLS-only).
* **ALB:** Internet-facing or internal based on param; listeners 80/443; HTTPS requires TLS policy and ACM ARN parameter; access logs to `LoggingBucket-${EnvironmentSuffix}`.
* **WAF v2:** Regional WebACL with AWS managed rule groups (Common, KnownBadInputs, AdminProtection, AnonymousIpList; parameterize toggles). Associate to ALB via `AWS::WAFv2::WebACLAssociation`.
* **Shield Advanced:** `AWS::Shield::Subscription` (conditional on `EnableShieldAdvanced`), and `AWS::Shield::Protection` objects protecting ALB and Elastic IPs/NATs where applicable.
* **CloudTrail:** Organization/multi-region trail parameterized; log to `CloudTrailBucket-${EnvironmentSuffix}` with SSE-KMS; CloudWatch Logs integration (log group, role/policy), event selectors (management + data events for S3, optional lambda).
* **AWS Config:** Configuration Recorder, Delivery Channel to `LoggingBucket-${EnvironmentSuffix}`, required IAM role; enable key managed rules (e.g., `s3-bucket-server-side-encryption-enabled`, `cloudtrail-enabled`, `restricted-ssh`, `rds-storage-encrypted`, `vpc-default-security-group-closed`, `root-account-mfa-enabled`, etc.). Optionally add a CIS Conformance Pack parameterized.
* **Security Hub:** Opt-in + enable standards (CIS Foundations, AWS Foundational Security Best Practices); auto-enable controls where available.
* **GuardDuty:** Detector enabled with S3 Protection; publish findings to Security Hub; optional auto-enable for EKS runtime if parameters provided.
* **RDS:** Encrypted at rest with KMS CMK; in private subnets; no public access; SG allows inbound only from application tier/ALB targets as applicable; enforce TLS (`rds.force_ssl=1` via Parameter Group), storage autoscaling, backup retention.
* **Observability:** Central CloudWatch Log Groups (KMS-encrypted); VPC Flow Logs to CloudWatch or S3 (KMS-encrypted).
* **IAM (least privilege):** Distinct roles for: CloudTrail to CloudWatch, AWS Config, Security Hub, GuardDuty, WAF logging (if used), and stack operations. Each policy scoped to minimum required actions and resource ARNs.

**Security & compliance requirements (implement explicitly):**

* All S3 buckets must use SSE-KMS with CMKs defined in this template; block all public access; enforce TLS via bucket policies (`aws:SecureTransport`).
* Security Groups must only allow inbound TCP 80 and 443 (from parameterized CIDRs for 80/443 where applicable) and must **not** expose administrative ports.
* CloudTrail must be enabled, multi-region, log file validation on, encrypted, with delivery permissions locked down.
* AWS Config must run continuously and evaluate at least the core CIS-aligned managed rules noted above.
* WAF must protect the ALB with managed rule sets enabled and versioned.
* Shield Advanced must be enabled and attached to ALB and other edge resources when `EnableShieldAdvanced = true`.
* Security Hub must aggregate findings from Config, GuardDuty, and native checks with the above standards enabled.
* GuardDuty must be enabled with S3 data event protection.
* RDS must enforce encryption at rest (KMS) and in transit (TLS), private subnets only.
* VPC endpoints used for private access to AWS APIs; Flow Logs enabled and encrypted.

**Naming & parameterization rules:**

* Every name/alias/prefix must end with `-${EnvironmentSuffix}`. Examples: `Alias: alias/${ProjectName}-${EnvironmentSuffix}-rds`, `WebAclName: !Sub '${ProjectName}-${EnvironmentSuffix}-webacl'`, `DBInstanceIdentifier: !Sub '${ProjectName}-${EnvironmentSuffix}-db'`, `LogGroupName: /${ProjectName}/${EnvironmentSuffix}/...`
* Provide sensible defaults for parameters so the stack can deploy without user edits, but keep security-sensitive values (ACM ARNs, CIDRs) as parameters.
* Avoid hardcoded region/account; use `AWS::Region`, `AWS::AccountId` in policies/ARNs; structure template to be StackSet-compatible for deployment in `us-east-1` and `us-west-2`.

**Implementation details & YAML expectations:**

* Output must be **valid YAML**, not JSON. Use intrinsic functions (`!Sub`, `!Ref`, `!GetAtt`, `!If`, `!Equals`, `!And`, `!Or`, `!Not`) and Conditions to toggle optional services (WAF/Shield/SecurityHub/GuardDuty).
* Include `Metadata` → `AWS::CloudFormation::Interface` with Parameter Groups and Labels for a professional UI experience.
* Include deterministic resource dependencies (`DependsOn`) only where needed (e.g., Config Delivery Channel order, CloudTrail bucket policy before Trail).
* Bucket policies must include exact service principals and required `aws:SourceArn`/`aws:SourceAccount` conditions where applicable.
* IAM policies must be least-privilege and avoid wildcards except where unavoidable (scoped by condition keys/ARNs).
* Add lifecycle rules (e.g., log buckets transition/delete after param-driven retention); enable KMS key rotation for all CMKs.
* ALB access logs and (if enabled) WAF logs must target the logging bucket with SSE-KMS.
* RDS Parameter Group must set `rds.force_ssl=1`; add an Option/Parameter group as needed per engine.
* Ensure Config Recorder + Delivery Channel creation order is correct (recorder references role; delivery channel references bucket), and start the recorder.

**Validation & outputs:**

* Provide `Outputs` for: VpcId, PublicSubnetIds, PrivateSubnetIds, AlbArn, AlbDnsName, WebAclArn (conditional), ShieldSubscriptionState (conditional), CloudTrailArn, CloudTrailBucketName, ConfigRecorderName, SecurityHubStatus, GuardDutyDetectorId, RdsEndpointAddress, RdsArn, KmsKeyArns (per purpose), LoggingBucketName, FlowLogId, and a consolidated `SecurityControlsSummary` string.
* Include `Export` names that append `-${EnvironmentSuffix}` for cross-stack referencing if needed.

**Deliverable:**
Produce **TapStack.yml** as a single, self-contained CloudFormation YAML file that implements the above—in best-practice form, with complete Parameters, Conditions, Resources, and Outputs—creating all resources from scratch, appending `-${EnvironmentSuffix}` to all names, enforcing a safe naming regex (no hard allowed values), and suitable for deployment in both `us-east-1` and `us-west-2` under AWS Organizations.