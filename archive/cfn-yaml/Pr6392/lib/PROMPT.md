**Functional scope (build everything new):**
Design and deliver a brand-new, production-grade multi-region disaster recovery setup for critical document storage using **two CORE services** and **one OPTIONAL enhancement**. The solution must create all resources from scratch within a single `TapStack.yml` template (YAML only), including parameters, validation, conditions, IAM, encryption keys, replication, lifecycle, access policies, monitoring (optional), and outputs. No references to pre-existing buckets, KMS keys, roles, or topics.

**Core services (mandatory):**

1. **Amazon S3** — primary and replica buckets with Object Lock, versioning, lifecycle, CRR, VPC endpoint–only access.
2. **AWS KMS** — customer-managed CMKs in each region for S3 server-side encryption and replication key access.

**Optional enhancement (if included):**
**Amazon CloudWatch (+ SNS)** — alarms for replication health/latency/failures and an operational dashboard; email notification subscription.

---

**Deployment model and DR behavior:**

* Primary region: **us-east-1**. Secondary region: **us-west-2**.
* Use **the same `TapStack.yml`** in both regions. Deploy the stack once in **us-east-1** (active) and once in **us-west-2** (passive).
* Bucket names must be deterministic and collision-safe: include the AWS account ID, region, and **`ENVIRONMENT_SUFFIX`** (e.g., `fin-docs-${AWS::AccountId}-${AWS::Region}-${ENVIRONMENT_SUFFIX}`).
* When deployed in the **primary** region, configure S3 **Cross-Region Replication (CRR)** on the primary bucket to replicate **all objects and versions** to the secondary bucket (destination in us-west-2).
* When deployed in the **secondary** region, create the replica bucket (same naming pattern) with versioning/Object Lock/lifecycle/policy/KMS, but **do not** create outbound replication rules there (passive target).
* Object Lock must be enabled at **bucket creation time** on both buckets in **Compliance mode** with a **7-year** default retention.
* Lifecycle on both buckets: transition to **Glacier** (or Glacier Instant Retrieval/Glacier Flexible Retrieval—choose the cost-optimal class) after **90 days**; **expire** after **10 years**.
* Restrict S3 bucket access to **specific VPC endpoints only**, using bucket policies that check `aws:SourceVpce`. Separate endpoint IDs for each region are provided as parameters.
* Use **KMS CMKs** (one per region) with key policies and grants that allow: S3 default encryption, replication service role access, and least-privilege administrative control.

---

**Parameters (reusable across environments):**

* `ENVIRONMENT_SUFFIX` (String): Used in every resource name to avoid collisions.

  * **No hard AllowedValues.** Enforce a **safe naming regex** via `AllowedPattern` and a clear `ConstraintDescription`.
  * Example regex: `^[a-z0-9-]{2,20}$`
* `PrimaryRegion` (Default `us-east-1`), `SecondaryRegion` (Default `us-west-2`).
* `PrimaryVpcEndpointIds` (List<String>): S3 Interface/ Gateway VPC endpoint IDs for the primary region.
* `SecondaryVpcEndpointIds` (List<String>): Endpoint IDs for the secondary region.
* `NotificationEmail` (String, optional if the optional monitoring module is enabled).
* `RetentionYears` (Number, Default `7`, Min `1`, Max `99`): Object Lock retention years (applied as 7y by default).
* `GlacierTransitionDays` (Number, Default `90`), `ExpirationDays` (Number, Default `3650`).
* Optional toggles: `EnableMonitoring` (AllowedPattern-validated string like `^(true|false)$`, Default `true`), `CreateDashboard` (same style, Default `true`).

*All parameters must include sensible defaults and strong `AllowedPattern`/`MinLength`/`MaxLength` constraints where applicable. Avoid any list-style hard AllowedValues for environment names.*

---

**Naming & tagging conventions:**

* Every name includes `ENVIRONMENT_SUFFIX`.
* Include consistent tags on **all** resources (e.g., `Environment=${ENVIRONMENT_SUFFIX}`, `CostCenter`, `Owner`, `DataClassification=Confidential`, `Compliance=FINRA/SOX` as applicable).
* Deterministic bucket names: `fin-docs-${AWS::AccountId}-${AWS::Region}-${ENVIRONMENT_SUFFIX}` and `fin-docs-replica-${AWS::AccountId}-${SecondaryRegion}-${ENVIRONMENT_SUFFIX}`.

---

**Security and compliance requirements:**

* **Object Lock**: Compliance mode, default retention **7 years**; block object lock bypass and prevent configuration changes by non-admin roles.
* **KMS CMKs** per region with explicit key policies (least privilege), aliases including `ENVIRONMENT_SUFFIX`, and grants for S3 replication role.
* **Bucket policies**:

  * Deny all non-TLS access.
  * Deny if request is **not** from the allowed VPC endpoint IDs in that region.
  * Deny `s3:PutObject` without KMS encryption context and bucket key conditions as appropriate.
  * Allow only specific principals (replication role, logging if used) with condition keys.
* **S3 default encryption**: SSE-KMS with the regional CMK; require KMS encryption in policy.
* No public access; block public access at bucket level.
* Versioning **enabled** on both buckets (required for CRR).
* Replication role with **inline IAM policy**: minimum actions on source bucket, destination bucket, and KMS keys (both regions).

---

**Implementation details (YAML only; best practices):**

* Single **`TapStack.yml`** file, **valid YAML**, not JSON.
* Use Conditions to detect whether the deployment is in `PrimaryRegion` vs `SecondaryRegion` and to switch on CRR configuration only in the primary deployment.
* Compute bucket names via `!Sub` using `${AWS::AccountId}`, `${AWS::Region}`, and `${ENVIRONMENT_SUFFIX}`.
* Enable Object Lock at creation via `ObjectLockEnabled: true` and `ObjectLockConfiguration` (Compliance).
* Lifecycle rules: transition to Glacier at `${GlacierTransitionDays}`, expiration at `${ExpirationDays}`.
* CRR: Replicate **all objects and versions**, replica KMS CMK in the secondary region, and appropriate `AccessControlTranslation`/`ReplicaKmsKeyID` where required.
* IAM: One replication role with trust policy for S3 and granular permissions for source read and destination write + KMS decrypt/encrypt on the respective keys.
* VPC endpoint restriction: use `aws:SourceVpce` in `Condition` blocks; parameterize endpoint IDs per region.
* Strong `Metadata`/`cfn-lint` region hints; clear `Description` for the stack.
* **No cross-region resources created in a single stack** (CloudFormation limitation). Instead, rely on the deterministic bucket name in the secondary region and configure CRR in the primary stack to that known name. The same template is deployed in both regions.

---

**Monitoring (optional module):**

* If `EnableMonitoring` is `true`, create:

  * SNS Topic + Email subscription (from `NotificationEmail`).
  * CloudWatch Alarms on S3 replication metrics (replication latency and failed operations) where available, and a Dashboard that visualizes key DR signals (replication status, bytes pending replication, failed operations, 4xx/5xx on data paths if using S3 CloudWatch metrics).
  * Outputs include the dashboard URL.

---

**Outputs (for integration):**

* `PrimaryBucketArn`, `SecondaryBucketArn`.
* `ReplicationRoleArn`.
* `PrimaryKmsKeyArn`, `SecondaryKmsKeyArn`.
* `SnsTopicArn` (if monitoring enabled).
* `MonitoringDashboardUrl` (if dashboard created).
* Deterministic bucket names as string outputs for downstream wiring.

---

**Acceptance criteria:**

* Deploy the identical `TapStack.yml` in **us-east-1** and **us-west-2** with distinct `ENVIRONMENT_SUFFIX` values to avoid conflicts.
* All resource names contain `ENVIRONMENT_SUFFIX`.
* Primary deployment establishes CRR to the secondary bucket name derived from the template’s naming convention.
* Object Lock **Compliance** mode with **7-year** retention is enforced on both buckets at creation.
* Lifecycle: transition at **90 days** to Glacier; **expire** at **10 years**.
* Bucket policies deny requests not coming from the allowed VPC endpoints; enforce TLS and SSE-KMS.
* KMS CMKs exist and are correctly referenced by bucket default encryption and CRR.
* If enabled, CloudWatch + SNS monitoring is provisioned and alarms are active.
* Template validates with `cfn-lint` and deploys without manual pre-created resources.

---

**Deliverable:**
A single **`TapStack.yml`** (YAML) containing **all** parameters, conditions, mappings (if used), resources, IAM roles/policies, outputs, and optional monitoring—ready for dual deployment in primary and secondary regions. The file must be self-contained, human-readable, and follow AWS security best practices, with robust parameter validation via regex (no hard AllowedValues for environment names).
