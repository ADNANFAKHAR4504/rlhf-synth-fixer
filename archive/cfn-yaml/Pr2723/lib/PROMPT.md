**Prompt to generate `TapStack.yml`**

I need a single, production-ready AWS CloudFormation template in **YAML** named **TapStack.yml** that builds a brand-new, secure multi-environment stack from scratch (no references to pre-existing VPCs, subnets, roles, or buckets). It must implement the security/management practices below and mirror the spirit of the original “secure\_architecture.json” spec, but the deliverable is **TapStack.yml** only.

### What to include (end-to-end)

* **Parameters (with sensible defaults for dev, staging, production):**

  * `EnvironmentName` (AllowedValues: dev, staging, production).
  * `ProjectName` (default: TapStack).
  * `AllowedAdminCidr` for SSH/RDP admin access (default a safe CIDR like 203.0.113.0/24).
  * `AlarmEmail` for SNS subscriptions.
  * `DbMasterUsername`, `DbMasterPassword` (NoEcho).
  * `DbEngineVersion` (Postgres; use a region-supported current version).
  * Key pair handling: create an **AWS::EC2::KeyPair** resource using a parameter `PublicKeyMaterial` (string) so the stack itself owns the keypair (this satisfies “pre-defined keypair” without relying on an external one).
  * Any other knobs that help right-size per environment (instance types, retention days, RDS storage, etc.), with **safe defaults**.

* **Mappings & Conditions:**

  * Map environment → sizes (e.g., t3.micro in dev, t3.small in staging, t3.medium in prod; larger RDS in prod).
  * Conditions to toggle dev/staging/prod differences cleanly (e.g., log retention, volume sizes).

* **Network (built fresh):**

  * One VPC (CIDR 10.0.0.0/16), **two AZs** via `Fn::GetAZs`.
  * 2 public subnets + 2 private subnets, route tables, IGW, 2 NAT gateways (1 per AZ).
  * Tags on all resources.

* **EC2:**

  * One EC2 instance in a **public subnet** for admin/bastion duties (or make it a bastion explicitly).
  * AMI via SSM parameter (Amazon Linux 2023), correct parameter type `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>`.
  * Security group restricted to `AllowedAdminCidr` for SSH (port 22).
  * **Use the KeyPair created by the stack**.
  * CloudWatch agent/ssm enabled (IAM role with least-privilege for SSM + logs put).

* **S3 (secure by default):**

  * Primary bucket with **SSE-S3 (AES-256)**, bucket policy blocking public access, versioning enabled, and public access block = true.
  * Explicitly deny insecure policies (no public ACLs/ policies).
  * Tags applied.

* **IAM (least privilege, no wildcards in **Allowed** actions or resources):**

  * A minimal console user example (e.g., `ReadOnlyUser`) in a group with **scoped** managed policies or fine-grained inline policies (avoid `*` in **Allow**).
  * **MFA enforcement**: attach an **explicit-deny** policy to a group (or to all users via group) that denies a curated list of sensitive actions when `aws:MultiFactorAuthPresent` is `false` (avoid `Action: "*"`, enumerate critical actions/services).
  * Account password policy (strong length, complexity, rotation).
  * Roles for:

    * EC2 instance to send logs/metrics to CloudWatch.
    * VPC Flow Logs to CloudWatch Logs.
    * CloudTrail → CloudWatch Logs.

* **RDS (Postgres):**

  * Deployed in **private subnets**, `PubliclyAccessible: false`, encrypted storage on.
  * DB subnet group, security group (no public ingress).
  * CloudWatch logs exports enabled (e.g., `postgresql`).
  * Parameter group as needed; right-sized per env.

* **Observability & logging:**

  * A **dedicated CloudWatch Logs LogGroup** (e.g., `/tapstack/centralized`) with env-based retention.
  * **VPC Flow Logs** to that log group (with needed IAM role).
  * **CloudTrail** multi-region trail delivering to **the same log group** and to the S3 bucket for archival, with log file validation.
  * **CloudWatch Alarm** for EC2 CPUUtilization > threshold (env-based) with **SNS Topic** + email subscription using `AlarmEmail`.

* **Auto-remediation Lambda (S3 policy guard):**

  * Python 3.12 inline ZIP (or short inline code) that:

    * Subscribes via **EventBridge rule** for `PutBucketPolicy`/`PutBucketAcl` API calls (via CloudTrail).
    * Detects overly permissive statements (e.g., `Principal: "*"` or public READ/WRITE) and rewrites/removes them to a compliant baseline (private + AES-256).
  * Minimal least-privilege execution role (enumerate actions, no wildcards in **Allow**).

* **Tagging:**

  * Every resource supports tags: `Environment`, `Project`, `CostCenter` (param), `Owner` (param). Enforce consistent tagging across all resources.

* **Outputs (clear and complete):**

  * VPC ID, subnet IDs, security group IDs.
  * EC2 InstanceId and PublicDnsName.
  * S3 bucket name/ARN.
  * RDS endpoint/address and port.
  * CloudWatch LogGroup name/ARN.
  * SNS Topic ARN.
  * Lambda function name/ARN.
  * CloudTrail trail name/ARN.

### Quality & validation

* **No placeholders, no TODOs, no external references**—the stack must be deployable as-is.
* **No wildcard (“\*”) in any IAM Allow** statements or resource ARNs (explicit, least-privilege).
* Use intrinsic functions properly; pass **cfn-lint**; avoid circular dependencies.
* Region-agnostic: must deploy unchanged in **us-east-1** and **us-west-2**. Do not hardcode AZ names; rely on `Fn::GetAZs`.
* Keep comments minimal and practical.

### Delivery format

Return **only one code block** containing the full **TapStack.yml** (complete Parameters, Mappings, Conditions, Resources, and Outputs). No extra prose before/after.