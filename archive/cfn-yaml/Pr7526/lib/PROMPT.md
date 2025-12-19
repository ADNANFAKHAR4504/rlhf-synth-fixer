**Functional scope (build everything new):**
Produce a single `TapStack.yml` that provisions a brand-new, production-ready AWS environment and embeds a Python-based CloudFormation Custom Resource (Lambda-backed) to enforce and continuously validate the following security and compliance controls at deploy time (and on stack updates). The template must define all modules from scratch—no references to pre-existing resources—and must not depend on external artifacts.

**Environment & naming rules:**

* Primary region: `us-east-1`.
* Create a **new** dedicated VPC (do not point to an existing VPC ID).
* All logical and physical resource names use the pattern `projectname-resource-type-ENVIRONMENT_SUFFIX`.
* Every resource name in the stack **must** include `ENVIRONMENT_SUFFIX` to prevent collisions across deployments.
* Enforce a safe naming regex for `EnvironmentSuffix` instead of hardcoded `AllowedValues.

  * Example: `AllowedPattern: '^[a-z0-9-]{3,32}$'` with a helpful `ConstraintDescription`.
* Use parameters for project-wide naming and CIDRs (e.g., `ProjectName`, `EnvironmentSuffix`, `VpcCidr`, etc.), with secure, sensible defaults.

**Compliance controls enforced by the embedded Python Custom Resource:**
Implement a Lambda-backed Custom Resource (runtime Python 3.12) embedded inline via `ZipFile` that:

1. Validates IAM roles are only assumable by specific trusted entities (Configurable allowlist in Parameters/Metadata).
2. Enforces specific encryption standards for all data at rest (KMS-backed; AES-256/KMS where applicable).
3. Restricts ingress to EC2 instances to **known IP addresses** only (Configurable allowlist parameter).
4. Enables VPC Flow Logs for all subnets and the VPC, publishing to CloudWatch Logs with KMS CMK.
5. Ensures EC2 instances are launched with a specific, stack-managed Security Group.
6. Enforces MFA for AWS Management Console access across IAM users via an account-wide guardrail (e.g., IAM policy + explicit deny for `aws:MultiFactorAuthPresent = false`).
7. Controls (limits) S3 bucket creation to specific IAM roles and applies **versioning + default encryption (SSE-KMS)** to every stack-created bucket.
8. Denies public read (and public ACLs/policies) on any S3 bucket provisioned by the stack.
9. Ensures CloudTrail is enabled **organization/account-wide** and **multi-region**, delivering to an encrypted S3 bucket with access logging.
10. Requires **KMS key rotation** for all CMKs used by the stack.
11. Constrains RDS instances to be deployed **inside the VPC** and **encrypted at rest** (KMS), with Subnet Groups and Security Groups defined by this template.
12. Allows only **compliant EC2 instance families/types** (configurable allowlist).
13. Mandates that **all Lambda functions** created by the stack log to **CloudWatch Logs** with retention & encryption.
14. Prevents resource deployment when the **current region is blacklisted** (configurable blacklist; fail fast if in a disallowed region).
15. Requires an **AWS WAF** (v2) in front of **every internet-facing ALB** created by the stack, with sane default managed rule sets.

**Technical implementation requirements:**

* Single file deliverable: valid **YAML** CloudFormation, not JSON.
* Define **Parameters** (with defaults, AllowedPattern regexes, and clear descriptions), **Mappings** (if needed), **Conditions**, **Resources**, and **Outputs**.
* Create all foundational modules in this stack:

  * VPC, subnets (public/private), NAT/GW, route tables, NACLs.
  * KMS CMKs (with rotation enabled) for: S3 default encryption, CloudWatch Logs, VPC Flow Logs, RDS, EBS, and Lambda environment variables.
  * CloudTrail (multi-region) -> encrypted S3 bucket (versioned, access logging, block public access).
  * CloudWatch Log Groups (encrypted, retention), Metric Filters, and Alarms for key controls.
  * S3 buckets used by the stack (all must be private, versioned, and encrypted).
  * IAM roles/policies for Lambda, CloudTrail, Flow Logs, EC2, RDS, and WAF/ALB as required—least privilege only.
  * Lambda Function resource for the Custom Resource, with inline `ZipFile` Python code implementing request/response to CloudFormation (use the signed `ResponseURL` PUT pattern; no deprecated libraries).
  * VPC Flow Logs to CloudWatch Logs (encrypted).
  * Security Groups: at least one enforced SG for EC2 and one for RDS, with restrictive ingress/egress and parameterized known IP allowlist for ingress.
  * RDS example instance (encrypted, Multi-AZ optional via parameter), subnet group, parameter group (optional), SG wired to app tier.
  * ALB (internet-facing) with WAFv2 WebACL association (managed rules + parameter to enable/disable specific rule groups), target groups, listeners, health checks.
  * Example EC2 Auto Scaling Group or Launch Template referencing the enforced Security Group and compliant instance types only (parameterized allowlist; fail on noncompliant).
  * Example Lambda function to demonstrate logging/permissions enforcement.
* The Python Custom Resource must **evaluate the stack’s resources** during `Create/Update` and:

  * Fail the operation with a clear `Reason` if noncompliance is detected.
  * Return granular `Data` fields about passed/failed checks.
  * Support idempotent updates (handle `Update`/`Delete` events safely).
* Use **Outputs** to expose: VPC ID, Subnet IDs, Security Group IDs, KMS Key ARNs, CloudTrail status/bucket, Flow Log Group, WAF ARN/ID, ALB DNS, RDS endpoint, compliant instance types, and Custom Resource compliance summary.
* Ensure every resource name includes `ENVIRONMENT_SUFFIX`.
* Include `Metadata` blocks (where helpful) describing parameters and compliance logic.

**Python Custom Resource logic (high-level expectations):**

* Runtime: Python 3.12.
* Handler validates inputs from template Parameters (trusted entities list, EC2 instance type allowlist, known IPs list, region blacklist, required encryption standards, etc.).
* Enumerates relevant resources in the stack (from event `ResourceProperties` or via ARNs/Refs passed in) and validates:

  * IAM trust policies, inline/managed policies.
  * S3 bucket policies/ACLs/default encryption/versioning/public access block.
  * KMS key rotation flags.
  * EC2 SG ingress cidrs aligned to known IP allowlist.
  * Lambda -> CloudWatch Logs policy/creation, log group encryption, retention.
  * RDS: storage encryption, subnet group in VPC, SG rules.
  * VPC Flow Logs present and writing to encrypted log group.
  * WAFv2 WebACL association with ALB when `Scheme: internet-facing`.
  * Region compliance (fail immediately if in blacklisted region).
* Implements CloudFormation response protocol via `ResponseURL` (signed S3 PUT) with success/failure and a human-readable summary.

**Best practices & resilience:**

* Principle of least privilege on all IAM roles and policies.
* KMS CMK rotation enabled where applicable; deny unencrypted or non-compliant resources.
* S3 public access block everywhere; bucket policies default-deny public access.
* Parameterized allowlists (trusted entities, instance types, known IPs, region blacklist).
* Conditions to optionally create example workloads (ASG/EC2, RDS, sample Lambda) while keeping compliance checks mandatory.
* All logs encrypted and retained per parameterized retention days.
* Clear `DependsOn` where necessary to ensure deterministic creation/update order.

**Deliverable:**

* A single file named `TapStack.yml` containing:

  * Complete **Parameters**, **Mappings** (if any), **Conditions**, **Resources** (including the inline Python Lambda for the Custom Resource), and **Outputs**.
  * **No** external references or imports; build everything new in this template.
  * Fully valid **YAML**, not JSON.
  * All resource names suffixed with `ENVIRONMENT_SUFFIX`.
  * `EnvironmentSuffix` validation via **regex** (`AllowedPattern`) rather than hardcoded allowed values.

**Constraint items to encode (verbatim coverage):**
Ensure IAM roles are only assumable by specific trusted entities. | Enforce the use of specific encryption standards for all data at rest. | Restrict ingress traffic to only known IP addresses for EC2 instances. | Enable logging for all network traffic across the VPC. | Ensure that all EC2 instances are launched with a specific security group. | Enforce MFA for all users accessing the AWS Management Console. | Limit the creation of S3 buckets only to specific IAM roles. | Enable versioning and encryption for all S3 buckets. | Ensure no public read access is allowed on any S3 bucket. | Require CloudTrail logging to be enabled across all regions. | Deny the use of keys without key rotation enabled. | Ensure all RDS instances are inside a VPC and are using encryption. | Restrict the use of non-compliant EC2 instance types. | Require that all Lambda functions log to CloudWatch. | Ensure that no resources can be deployed into a specified blacklist of regions. | Mandate the deployment of a WAF in front of all internet-facing load balancers.

**Outputs (minimum):**

* `VpcId`, `PublicSubnetIds`, `PrivateSubnetIds`
* `FlowLogsGroupName`, `FlowLogsKmsKeyArn`
* `TrailArn`, `TrailS3BucketName`
* `S3ArtifactBucketName` (encrypted, versioned, PAB enabled)
* `AppSecurityGroupId`, `RdsSecurityGroupId`
* `KmsKeyArns` (list/map for data classes: S3, Logs, EBS, RDS, Lambda)
* `AlbDnsName`, `WebAclArn`
* `RdsEndpoint`
* `CompliantInstanceTypes`
* `ComplianceSummary` (from the Custom Resource)

**Validation & failure behavior:**

* If any control fails, the Custom Resource must **fail the stack** with a clear, actionable reason.
* Return structured compliance details in the Custom Resource `Data` so CI/CD can parse pass/fail per control.
* Idempotent on Update; safe on Delete (no orphaned critical resources; respect retention policies where suitable).

**Template authoring notes:**

* Prefer intrinsic functions and `Fn::Sub` for name formatting with `ENVIRONMENT_SUFFIX`.
* Provide descriptive `Description` and `Metadata` for parameters and key resources.
* Include examples for parameter defaults (e.g., CIDR ranges, known IPs list, allowed instance families).
* Keep policies tightly scoped; avoid wildcards except where absolutely required for CloudFormation workflows.
* No conversational preamble in the file.
