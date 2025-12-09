Functional scope (build everything new):

* Generate a single **AWS CloudFormation template** named **`TapStack.yml`** that provisions a brand-new, security-hardened baseline in **us-east-1 or us-west-2** with the organizational naming convention **`corp-*`**. No resources may reference pre-existing infrastructure.
* Enforce security baselines across **S3, IAM, EC2, VPC, RDS, CloudTrail, AWS Config, GuardDuty, and Security Groups**, with parameters, conditions, rules, and outputs included in the same YAML file.

Security and compliance requirements (must be encoded in YAML resources, policies, and rules):

* **S3**: All buckets must have encryption at rest enabled by default (SSE-S3 minimum; allow KMS via parameter). Enforce **Block Public Access**, **versioning**, **bucket policies** that deny unencrypted and non-TLS requests.
* **IAM**: Define roles/policies strictly by **least privilege** (inline or managed policies scoping to only required actions and resources). No wildcards except where strictly unavoidable; use condition keys where applicable.
* **EC2**: Ensure **no public IPs** are assigned (Launch Template/Instance: `AssociatePublicIpAddress: false`). Apply **IMDSv2** hardening (`HttpTokens: required`, `HttpEndpoint: enabled`, `HttpPutResponseHopLimit: 1`).
* **VPC/Subnets**: Default to **private subnets** only; public subnets must be **explicitly opted in** via parameter. Provide NAT gateway option behind a parameter/condition.
* **Security Groups**: **Deny all inbound by default** (no ingress rules). Outbound should be scoped; if `all` egress is used, explain and parameterize to allow restriction.
* **RDS**: **Auto minor version upgrades enabled**, storage encryption on, not publicly accessible, multi-AZ toggle, deletion protection parameter, and KMS encryption parameter.
* **CloudTrail**: Enable a **multi-region trail**, log file validation on, SSE (KMS param), write to a compliant S3 logs bucket with proper policy; include CloudWatch Logs integration (role + log group).
* **AWS Config**: Deploy **Configuration Recorder**, **Delivery Channel**, and **at least one managed rule** (e.g., s3-bucket-server-side-encryption-enabled, ec2-instance-managed-by-ssm, rds-storage-encrypted). Ensure resource **ordering** and start the recorder (avoid `NoAvailableConfigurationRecorder`); the stack must **validate that Config resources are active before completion**.
* **GuardDuty**: **Enable GuardDuty** in the region with a **parameterized detector**. If a detector ID is provided, use it; otherwise, **create a detector** and expose its ID in Outputs.
* **Region guardrails**: Gate template execution so it **only runs in us-east-1 or us-west-2**.
* **Parameter validation**: Use **Parameters**, **AllowedPattern**, **Min/MaxLength**, and **CloudFormation Rules/Conditions** to prevent invalid inputs and accidental misconfiguration (e.g., region, CIDR ranges, KMS ARNs, detector ID format, S3 names).
* **Naming**: **All physical resource names** (where naming is required) must include **`${EnvironmentSuffix}`** to avoid collisions; also tag every resource with `ProjectName`, `EnvironmentSuffix`, and `Owner` tags. Prefix names with `corp-` when a Name field is necessary.
* **Outputs**: Expose key ARNs/IDs/Names (VPC ID, Private Subnet IDs, Launch Template ID, Security Group IDs, S3 bucket names, RDS instance identifier/endpoint, CloudTrail ARN, Config Recorder/DeliveryChannel names, GuardDuty Detector ID, KMS Key ARNs, etc.).

Template conventions and style:

* **Single file**: Everything must be defined in **`TapStack.yml`**; no external references.
* **YAML only** (no JSON). Clean, commented, production-ready formatting.
* **Sections**: `AWSTemplateFormatVersion`, `Description`, **`Parameters`**, `Mappings` (if needed), **`Metadata`** (parameter groups/labels), **`Rules`** (input validation), **`Conditions`**, **`Resources`**, **`Outputs`**.
* **Environment suffix**: Do **not** hardcode `AllowedValues` for `EnvironmentSuffix`. Instead, enforce a **safe regex** via `AllowedPattern` such as:
  `^[a-z0-9](?:[a-z0-9-]{0,18}[a-z0-9])$`
  and document examples (e.g., `prod-us`, `production`, `qa`, `dev-usw2`).
* **Name construction**: Where Names are required, use a consistent pattern such as:
  `!Sub "corp-\${ProjectName}-\${EnvironmentSuffix}-<purpose>"`.
* **Best practices**: Private by default, encryption by default, principle of least privilege, idempotent and pipeline-safe.

Inputs (Parameters) to include (with validation):

* `ProjectName` (e.g., `tapstack`, lower-case, `^[a-z0-9-]{3,20}$`)
* `EnvironmentSuffix` (safe regex above; examples in `Metadata`)
* `VpcCidr` (default `10.0.0.0/16`, regex validation)
* `CreatePublicSubnets` (AllowedValues: `true|false`, default `false`)
* `NumberOfAZs` (2 or 3; default 2)
* `KmsKeyArn` (optional; if empty, create a CMK for logs/data encryption)
* `EnableNAT` (default `true`; only if private subnets require outbound internet)
* `RdsInstanceClass`, `RdsEngineVersion`, `RdsAllocatedStorage`, `RdsMultiAZ` (default `true`), `RdsDeletionProtection` (default `true`)
* `GuardDutyDetectorId` (optional; `^([a-z0-9-]{10,64})?$`)
* `CloudTrailToCloudWatch` (default `true`)
* `AllowedEgressCidr` (default `0.0.0.0/0`, with note and pattern)
* Any additional toggles needed to parameterize encryption choices (e.g., `UseSSEKMSForS3: true|false`).

Validation logic (Rules/Conditions):

* Rule to **allow only us-east-1 or us-west-2** using `AWS::Region`.
* Rule to validate **CIDRs** and **name patterns**.
* Conditions to create a **new KMS key** if `KmsKeyArn` is empty; same for **GuardDuty detector**.
* Condition to **skip public subnets** unless `CreatePublicSubnets` is true.

Resource blueprint highlights (what must be present in `Resources`):

* **KMS**: Optional CMKs for S3, CloudTrail, RDS if `KmsKeyArn` not provided.
* **VPC**: VPC + **private subnets** across `NumberOfAZs`. NAT gateways only if `EnableNAT` is true. Routing tables accordingly. **No Internet Gateway** unless public subnets are explicitly enabled.
* **Security Groups**: A default SG with **no ingress**; parameterized egress. Separate SGs per tier as needed; still default-deny inbound unless explicitly required.
* **EC2 Launch Template**: `AssociatePublicIpAddress: false`, IMDSv2 required, EBS encryption by default, tags with Name including `${EnvironmentSuffix}`.
* **S3**: Logging bucket and data buckets with **SSE**, BPA, versioning, TLS-only policies, and deny unencrypted puts.
* **RDS**: Encrypted, **AutoMinorVersionUpgrade: true**, not publicly accessible, multi-AZ parameterized, deletion protection toggle, parameter group if needed.
* **CloudTrail**: Multi-region, KMS-encrypted logs to S3, log file validation, optional CloudWatch Logs (role + log group).
* **AWS Config**: Recorder, Delivery Channel (ordered dependencies), at least one **managed rule** for S3 encryption and EC2 compliance; ensure **recorder is started**.
* **GuardDuty**: Create or adopt detector as per parameter; enable it and **output DetectorId**.
* **Outputs**: Comprehensive IDs/ARNs/Endpoints for all created components.

Deliverable:

* A single, production-ready **`TapStack.yml`** (YAML) implementing all above requirements with:

  * Complete **Parameters**, **Rules**, **Conditions**, **Resources**, and **Outputs**.
  * **All resource names** (where applicable) including **`${EnvironmentSuffix}`** and prefixed with **`corp-`** when a Name property is required.
  * Strict **encryption-by-default**, **private-by-default**, **least-privilege IAM**, **IMDSv2 required**, **no public IPs**, **default-deny inbound** security groups.
  * **CloudTrail** multi-region enablement, **AWS Config** recorder/channel/rules with proper ordering and activation, **GuardDuty** enabled with parameterized detector handling.
  * Clear inline comments explaining critical security choices and any conditions.
  * Validates inputs and region constraints to **prevent mis-deployments**.

Verification notes (pre-deployment quality gates):

* Must pass `cfn-lint` with no errors.
* Names, tags, and outputs must include **`${EnvironmentSuffix}`**.
* Parameters and Rules must reject invalid inputs (region, CIDR, names).
* No references to existing resources; template must be self-sufficient to create a **new stack**.

Formatting and tone:

* Human-written technical style, concise and directive.
* No conversational opening or filler.
* YAML only; no JSON.
