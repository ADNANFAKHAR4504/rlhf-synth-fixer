# Context

Global e-commerce platform requires consistent, high-availability infrastructure across three AWS regions: **us-east-1**, **eu-west-1**, **ap-southeast-1**. Provision a brand-new, self-contained stack per region—no references to pre-existing resources.

# Functional scope (build everything new):

* Produce a single **TapStack.yml** (pure YAML, not JSON) CloudFormation template that provisions, from scratch, for the active deployment region:

  * One VPC with segregated public and private subnets across at least two Availability Zones.
  * Internet Gateway, NAT Gateways, route tables, and routes wired correctly for public vs. private isolation.
  * At least **two EC2 instances** (Amazon Linux) spread across multiple AZs, launched via an **Auto Scaling Group** and **Launch Template**, with:

    * User data to install/enable **CloudWatch Agent** for memory metrics.
    * Instance profile/role providing **read-only access to S3** in the same region.
  * One **RDS** database instance in a **private subnet** (no public access), parameterized engine/size, with deletion safety controls (see Cleanup).
  * **CloudWatch** logging and monitoring:

    * Log groups for app/system logs.
    * **Alarms** on EC2 **CPUUtilization** and **memory** (via CloudWatch Agent), and a basic RDS CPU alarm.
  * Minimal, least-privilege **IAM roles/policies** for EC2, and any service roles required by the template.
* The template must be **region-agnostic** (deploy the same template independently to us-east-1, eu-west-1, and ap-southeast-1). Do not hard-code region identifiers; rely on pseudo-parameters or parameterization.
* All logical and physical **resource names must include `ENVIRONMENT_SUFFIX`** to avoid collisions across environments and regions.

# Constraints & best practices

* **No external references**: The template must create all modules/resources itself; do not point to pre-existing VPCs, subnets, security groups, or roles.
* **Subnetting**: Provide CIDR defaults and parameters; ensure non-overlapping CIDR blocks. Public subnets route to IGW; private subnets route to NAT.
* **High availability**: Distribute EC2 and subnets across **≥2 AZs**; ASG spans those subnets.
* **Security**:

  * Security groups least-privilege (e.g., restrict SSH via parameterized allowed CIDR).
  * RDS not publicly accessible; use private subnets and SGs.
  * IAM policies scoped to **read-only S3** actions (`s3:Get*`, `s3:List*`) with region-appropriate ARNs or conditions.
* **Parameters**:

  * Include `ProjectName`, `EnvironmentSuffix`, `VpcCidr`, `PublicSubnetCidrs[]`, `PrivateSubnetCidrs[]`, `InstanceType`, `DesiredCapacity`, `MaxSize`, `KeyPairName` (optional), `RdsEngine`, `RdsEngineVersion`, `RdsInstanceClass`, `RdsAllocatedStorage`, `DBName`, `DBUsername`, `DBPassword` (NoEcho), `AllowedSshCidr`, and any others needed.
  * **Do not** use a hardcoded AllowedValues list for `EnvironmentSuffix`. **Enforce a safe naming regex via `AllowedPattern`** (e.g., lowercase alphanumerics and hyphens, 2–32 chars). Provide a helpful `ConstraintDescription`.
* **Naming**: Every resource’s `Name` tag and any name fields must append or incorporate `${EnvironmentSuffix}` (e.g., `${ProjectName}-${EnvironmentSuffix}-vpc`).
* **Outputs**: Export useful outputs for tests and operators (e.g., VPC ID, public/private subnet IDs, ASG name, Launch Template ID, RDS endpoint, instance role ARN, log group names).

# Technical directives (YAML only)

* Deliver a **single file named `TapStack.yml`** written in **valid CloudFormation YAML** (no JSON), ready for `aws cloudformation deploy`.
* Use **intrinsic functions** (`!Ref`, `!Sub`, `!GetAtt`, `!FindInMap`, `!If`, `!Select`, `!Split`, etc.) appropriately.
* Include **Mappings** where beneficial (e.g., per-region AMI lookups via SSM Parameter paths if you choose), and **Conditions** for optional features.
* Provide **sane defaults** for parameters so a default deploy succeeds without overrides.
* For **memory alarms**, configure the CloudWatch Agent via user data (write config to `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json` and start the service).
* Ensure the **ASG** attaches to **private subnets** (recommended) with outbound via NAT; if a bastion is not required, do not create one.
* Keep security groups explicit and minimal (separate SGs for EC2 and RDS).

# Logging & monitoring

* Create dedicated **CloudWatch LogGroups** for:

  * EC2 system/app logs (collected via CloudWatch Agent).
  * A general application log group (named with `${ProjectName}-${EnvironmentSuffix}`).
* **Alarms**:

  * EC2 `CPUUtilization` > 80% for 5 minutes.
  * EC2 memory utilization > 80% for 5 minutes (using `CWAgent` metrics namespace).
  * RDS CPU > 80% for 5 minutes.
* Include SNS Topic (optional parameter to enable) for alarm notifications; if enabled, wire alarms to the topic.

# Security & IAM

* Define an **instance role + instance profile** for EC2 with:

  * Managed policy for CloudWatch Agent.
  * Inline policy granting **read-only S3** access, ideally constrained to the current region via condition keys (or parameterized bucket ARNs).
* Any additional roles (if needed) must be least-privilege and named with `${EnvironmentSuffix}`.

# Cleanup & teardown

* Set **DeletionPolicy** and **UpdateReplacePolicy**:

  * For RDS: **Snapshot** on delete; provide a parameter `RetainDbSnapshotOnDelete` (default `true`). If set to `false`, delete without snapshot.
  * For other resources: **Delete** to avoid billing of unused resources.
* Do **not** retain NAT/EIPs, ASG, Launch Template, or LogGroups by default.
* Include a clearly documented **Teardown** note in the template description explaining parameter(s) controlling snapshot retention and that deleting the stack removes all non-retained resources.

# Testing & validation (for consumers of the template)

* The template must expose outputs enabling automated tests to verify:

  * VPC and subnets exist with expected CIDRs across **≥2 AZs**.
  * ASG spans multiple AZs; desired capacity and max size reflect parameters.
  * At least **two EC2 instances** running and associated to the ASG.
  * RDS endpoint reachable within VPC (private), non-public.
  * CloudWatch LogGroups created and receiving EC2 metrics; alarms present for CPU and memory.
  * Instance role grants **read-only S3** permissions (policy document inspection).
* Tests will be executed independently in **us-east-1**, **eu-west-1**, **ap-southeast-1** using the same template/parameters.

# Deliverable:

* A single, production-grade **`TapStack.yml`** that:

  * Is **fully self-contained** (creates everything new; no external stack outputs or manual prereqs).
  * Uses **only YAML** (no JSON), valid CloudFormation.
  * Parameterized for safe reuse and per-region deployment.
  * Conforms to the naming rule: **all resource names include `ENVIRONMENT_SUFFIX`**.
  * Enforces a **regex `AllowedPattern`** for `EnvironmentSuffix` **instead of** hard `AllowedValues`.
  * Includes comprehensive **Outputs** for integration tests and operations.

# Non-goals

* Do not introduce third-party constructs, CDK code, or nested stacks.
* Do not depend on pre-existing VPCs, subnets, security groups, or roles.
* Do not hard-code region names or AZ identifiers.

# Output format

* Return only the **complete `TapStack.yml`** content (no extra commentary).