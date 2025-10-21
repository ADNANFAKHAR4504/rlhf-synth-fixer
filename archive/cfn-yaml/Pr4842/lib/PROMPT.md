Create a single CloudFormation YAML file named **TapStack.yml** that provisions a brand-new, secure AWS environment in **us-west-2**. The template must be complete and self-contained (no references to pre-existing resources), include all variable declarations (Parameters), sensible defaults, intrinsic-function logic (Mappings/Conditions where helpful), and comprehensive **Outputs**. Follow AWS best practices and ensure it passes `aws cloudformation validate-template`.

**Functional scope (build everything new):**

* **VPC**: one new VPC (e.g., `10.0.0.0/16`) with **at least one public and one private subnet** in different AZs, Internet Gateway, public route table with default route to IGW, and a private route table (no NAT required unless the template needs it for updates; if not used, omit NAT).
* **Security Groups**:

  * Web SG for the EC2 instance: allow **HTTP (80)** and **HTTPS (443)** from `0.0.0.0/0`.
  * Restricted SSH: allow **TCP 22** **only** from a parameterized **AllowedSSHIp** (CIDR, default empty; when empty, no SSH rule should be created—use a Condition to add it only if provided).
* **EC2**:

  * One **t3.micro** instance, launched in the public subnet with auto-assign public IP enabled.
  * Use latest Amazon Linux 2023 AMI via SSM parameter (`/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64`).
  * Parameterize KeyName; if empty, omit KeyName via a Condition.
  * Instance Profile/Role should be least-privileged (only what’s needed for CloudWatch agent if used).
* **S3 (Sensitive Data Bucket)**:

  * New bucket dedicated to sensitive data.
  * **SSE-KMS** encryption using a **new KMS CMK** created in this template (with alias), key policy granting S3 and CloudTrail (if CloudTrail needs to use it) appropriate permissions.
  * **Versioning enabled**.
  * Block Public Access enabled.
  * Bucket policy enforcing TLS and denying public access.
* **IAM**:

  * Create an **IAM role** with an **inline policy** that grants **read-only access** (`s3:GetObject`, `s3:ListBucket`) **only** to the sensitive data bucket. Attach this role to EC2 instance as its Instance Profile or output the role separately if not attached.
* **CloudTrail**:

  * Create a new **organization-agnostic** (account-level) **trail** to log **management events** with a focus on IAM actions (read and write) across the account/region.
  * Deliver logs to a **new, separate CloudTrail logs S3 bucket** with a proper bucket policy allowing CloudTrail to write.
  * If encrypting CloudTrail logs with KMS, add necessary KMS key policy statements to permit CloudTrail.
* **CloudWatch Monitoring**:

  * Create a **CloudWatch Alarm** on the instance’s **CPUUtilization** (namespace `AWS/EC2`, metric `CPUUtilization`, statistic `Average`, period 300s, threshold parameterized).
  * Optionally include a simple metric math or set `TreatMissingData` to `notBreaching`.
  * SNS topic and subscription parameters optional; if no Email provided, create the alarm without actions.

**Tagging:**

* Tag **all resources** with `Project=SecurityConfig` (plus standard Name tags where helpful).

**Parameters (with defaults where sensible):**

* `ProjectTag` (Default: `SecurityConfig`).
* `VpcCidr` (Default: `10.0.0.0/16`).
* `PublicSubnetCidr` (Default: `10.0.1.0/24`).
* `PrivateSubnetCidr` (Default: `10.0.2.0/24`).
* `AllowedSSHIp` (Type: String, Default: `""` — when empty, no SSH ingress; use a Condition).
* `InstanceType` (Default: `t3.micro`, AllowedValues include `t3.micro`).
* `KeyName` (Default: `""` — optional; when empty, omit KeyName via Condition).
* `CpuAlarmHighThreshold` (Number, Default: `80`).
* `KmsKeyAlias` (Default: `alias/tapstack-sensitive-data`).
* `TrailKmsKeyAlias` (Default: `alias/tapstack-cloudtrail` or reuse the same key if you choose one key—explain in comments).
* (Optionally) `NotificationEmail` for SNS; if empty, don’t create subscription.

**Conditions & Mappings:**

* Condition to include SSH ingress only if `AllowedSSHIp` is non-empty.
* Condition to attach KeyName only if provided.
* Use `AWS::Region` mapping or SSM for AMI (prefer SSM).

**Policies & Security:**

* S3 sensitive bucket policy: deny non-TLS (`aws:SecureTransport = false`), deny public principals, scope down to bucket ARN and objects.
* KMS key policies: root/admins + services (S3, CloudTrail if used) with least privilege; enable key rotation.
* IAM role for bucket read: limit to specific bucket and prefixes.

**Outputs (export-ready, well-named):**

* `VpcId`, `PublicSubnetId`, `PrivateSubnetId`, `InternetGatewayId`, `PublicRouteTableId`.
* `WebSecurityGroupId`.
* `InstanceId`, `InstancePublicIp`, `InstanceRoleArn`.
* `SensitiveBucketName`, `SensitiveBucketArn`, `SensitiveBucketKmsKeyArn`.
* `CloudTrailName`, `CloudTrailBucketName`, `CloudTrailBucketArn`, `CloudTrailKmsKeyArn` (if created).
* `CpuAlarmName` (and ARN if convenient).

**Other requirements:**

* Hard-set the template to **us-west-2** wherever a region selection matters (e.g., AMI via SSM path is region-aware; avoid cross-region ARNs).
* No references to “default VPC” or any existing resources. Build all required networking and security from scratch.
* Keep logical IDs stable and descriptive.
* Add concise comments in YAML where clarifying intent helps (e.g., why Conditions exist).
* Ensure the template is syntactically valid YAML, uses intrinsic functions correctly, and **passes**:

  * `aws cloudformation validate-template --template-body file://TapStack.yml`
  * (Bonus) cfn-lint clean.

**Deliverable:**

* A single file output, **TapStack.yml**, containing **Parameters**, (optional) **Mappings**, **Conditions**, **Resources**, and **Outputs**, ready to deploy a fresh, compliant stack that meets every item above.