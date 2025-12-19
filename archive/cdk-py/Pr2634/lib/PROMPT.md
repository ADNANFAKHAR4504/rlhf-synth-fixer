Here’s a clean, drop-in **PROMPT.md** you can place at `lib/PROMPT.md` (or pass to your code generator). It’s tailored for **CDK (Python)**, your repo layout, and the exact security constraints you listed. **No code below—just the prompt/spec.**

---

## Context

Generate production-grade **AWS CDK (Python)** code that synthesizes to a **single CloudFormation template** implementing a **secure, scalable web-app environment** in **us-west-1**. Favor least-privilege IAM, encrypted storage, controlled network access, and full observability.

Use the following repository layout — do **not** change file names or paths:

```
root/
├── tap.py                     # CDK app entry
├── lib/
│   └── tap_stack.py           # Main CDK stack logic (VPC, EC2, ALB, S3, etc.)
└── tests/
    ├── unit/
    │   └── test_tap_stack.py  # Unit tests for constructs/properties
    └── integration/
        └── test_tap_stack.py  # Integration tests for outputs/resources
```

## Deliverables (what to generate)

1. **CDK app** in `tap.py` that instantiates the stack with parameters (see Parameters).
2. **CDK stack** in `lib/tap_stack.py` that defines all resources & security per Requirements.
3. **Unit & integration tests stubs** in `tests/...` that assert key resources/properties/outputs exist.
4. Guidance comments on how to **synthesize** to a single YAML (e.g., `cdk synth "IaC-NovaModelBreaking" > cloudformation_security.yml`).

> **Do not** include plaintext credentials or hardcode account IDs.
> **Do not** fetch the latest AMI via the EC2 API directly—use **SSM Parameter** for AL2023.

## Region & Naming

* **Region:** `us-west-1` (hard requirement).
* **Stack name (logical/app IDs):** Use a predictable prefix: `Nova` and the given `projectName` → e.g., `NovaSecurityTapStack`.
* **Resource logical IDs:** Stable, readable (no randoms). Physical names should be deterministic where required (e.g., S3 logs bucket).

## Parameters (exposed via CDK context/props)

* `EnvironmentName` (string; e.g., `dev`, `prod`; default `dev`).
* `VpcCidr` (string; default `10.0.0.0/16`).
* `AllowedSshCidrs` (list of CIDR strings; default empty). **Required for SSH**.
* `EnableBastion` (bool; default `false`). If `true`, create a small bastion in a public subnet; ingress 22 only from `AllowedSshCidrs`.
* `AlbCertificateArn` (string; optional). If provided, add HTTPS (443) listener; otherwise default to HTTP 80 only.
* `AlarmEmail` (string; optional). If provided, create an SNS Topic and subscribe this email for alarm notifications.
* `EnableRds` (bool; default `false`). If `true`, create a small RDS (engine: Postgres or MySQL), **private** subnets, security group restricted to the **app security group** only.
* `AppParamPath` (string; default `/nova/<env>/app/`).
* `AppSecretName` (string; default `nova/<env>/app/secret`).

## High-Level Architecture

* **VPC** with 2 AZs minimum:

  * **Public subnets** (ALB, NAT, optional bastion).
  * **Private subnets** (EC2 app instance/ASG, RDS if enabled, DynamoDB access via VPC endpoints optional).
  * **1 NAT Gateway** (cost-aware) **or** NAT per AZ (toggle via clear code constant; default to single NAT).
* **Application Load Balancer (ALB)** in **public** subnets.
* **EC2 application instance** (or ASG with desired=1) in **private** subnets.
* **S3** application data bucket (versioned, blocked public access, encryption).
* **DynamoDB** table (on-demand, encryption enabled).
* **Parameter Store** for config; **Secrets Manager** for secrets.
* **CloudTrail** (multi-region) + S3 encrypted logs + optional CW Logs.
* **CloudWatch** metrics/logs/alarms. Collect app logs to CW Logs.
* **IAM** roles/policies with least privilege; no broad `*` unless AWS-managed necessity (e.g., SSM core).

## Detailed Requirements (map to constraints)

1. **CloudFormation via CDK:** All resources defined in `tap_stack.py` (CDK v2).
2. **Least-privilege IAM:**

   * **Instance Role/Instance Profile:**

     * Read **Parameter Store** only for `AppParamPath` prefix (`ssm:GetParameter*` for that path).
     * Read **Secrets Manager** only for `AppSecretName` ARN (`secretsmanager:GetSecretValue`).
     * **CloudWatch Logs** permissions: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` scoped to created log group.
     * **SSM managed instance core** for Session Manager (no broad admin).
     * **S3** access limited to the **app bucket** (read/write if needed; scope to bucket ARN and `arn:...:object/*`).
   * **ALB** role/policies only if required (usually none).
   * **Trail** KMS key and S3 policy constrain CloudTrail service principal.
3. **Encryption at rest everywhere:**

   * S3 buckets: **SSE-KMS** (KMS CMK you create) or **SSE-S3** for the app bucket (prefer KMS for CloudTrail and logs).
   * CloudTrail logs: S3 + KMS.
   * DynamoDB: Server-Side Encryption (AWS owned or KMS).
   * CloudWatch Logs are encrypted (default AES).
   * RDS (if enabled): storage encryption.
4. **VPC with public+private subnets:**

   * 2 AZs, route tables correctly set.
   * **NAT Gateway** for egress from private subnets.
5. **EC2 in private subnet:**

   * **Ingress 22** permitted **only** from `AllowedSshCidrs` (and/or a bastion SG if `EnableBastion=true`).
   * App traffic from ALB only (see SG rules).
6. **ALB in public subnets:**

   * Listener 80; if `AlbCertificateArn` provided, add 443 listener with redirect 80→443.
   * Target group → EC2/ASG, health checks enabled.
7. **S3 app bucket:**

   * **Block Public Access** (all 4 flags).
   * **Versioning** enabled.
   * Bucket policy: deny unencrypted `PutObject` and deny non-TLS (`aws:SecureTransport=false`).
   * (Optional) Access logs to a separate **logs bucket** (also encrypted & blocked public).
8. **DynamoDB:**

   * Billing mode: **PAY\_PER\_REQUEST** (on-demand).
   * **SSE** enabled.
   * Deterministic table name including env.
9. **CloudTrail:**

   * **Multi-region trail**, management events at minimum, data events optional.
   * Log to a dedicated encrypted S3 bucket (with proper bucket policy for CloudTrail).
   * (Optional) Send to CloudWatch Logs.
10. **Secrets Manager:**

* Create a placeholder secret (no plaintext in code).
* Instance role can only read **that** secret.

11. **Parameter Store:**

* Create a few string parameters under `AppParamPath` (e.g., `/nova/dev/app/APP_ENV`, `/nova/dev/app/API_URL`).

12. **CloudWatch Alarms:**

* **EC2 CPUUtilization** alarm (>= 70% for 5 minutes).
* If `AlarmEmail` provided, create SNS Topic + email subscription and wire alarm actions.

13. **Security Groups (minimal ports):**

* **ALB SG:** Ingress 80 (and 443 if TLS) from `0.0.0.0/0`; egress ephemeral.
* **App SG:** Ingress **app port** (e.g., 8080) from **ALB SG only**; Ingress **22** from `AllowedSshCidrs` and/or **Bastion SG** only; egress ephemeral.
* **Bastion SG (optional):** Ingress 22 from `AllowedSshCidrs`; egress to private subnets on 22 if you permit SSH jump.
* **RDS SG (if enabled):** Ingress **DB port** from **App SG only**; no public ingress.

14. **Logging to CloudWatch:**

* Install/enable **CloudWatch Agent** via user data or SSM document to send `/var/log/messages` and app log path to a dedicated Log Group (retention 30 days configurable).

15. **Tagging:**

* Apply consistent tags to **all** resources:

  * `Project = IaC - AWS Nova Model Breaking`
  * `Environment = <EnvironmentName>`
  * `Owner = CDK` (adjustable)
  * `CostCenter` and `SecurityTier` (placeholders acceptable)

16. **Outputs:**

* `VpcId`, `AlbDnsName`, `AppSecurityGroupId`, `AlbSecurityGroupId`, `PrivateSubnetIds`, `PublicSubnetIds`, `AppBucketName`, `DynamoTableName`, `SecretArn`, `ParamPath`, `TrailName`, `AlarmName` (and `RdsEndpoint` if `EnableRds=true`).

17. **RDS restriction (constraint):**

* If `EnableRds=false`, still define the **RDS SG** construct (not attached) to demonstrate policy of “RDS accepts from App SG only,” and document it.
* If `EnableRds=true`, create the RDS instance in **private** subnets with that SG linkage.

18. **Network ACLs (optional, not required):**

* Prefer SGs; do not over-constrain with NACLs unless tests expect them.

19. **Cost awareness:**

* Default to **single NAT**. Make ALB access logging optional.

## Tests (what to assert)

In `tests/unit/test_tap_stack.py`, assert (examples of what to check—write real asserts):

* VPC with 2+ subnets (public/private) and a NAT Gateway.
* ALB `AWS::ElasticLoadBalancingV2::LoadBalancer` in public subnets; listeners present.
* App instance/ASG in **private** subnets; SG rules:

  * App SG allows **app port** only from ALB SG (by SG reference).
  * SSH (22) only from `AllowedSshCidrs` (and/or Bastion SG if enabled).
* S3 app bucket: versioning **enabled**, public access **blocked**, bucket policy denies unencrypted and non-TLS.
* DynamoDB table: `PAY_PER_REQUEST`, SSE enabled.
* CloudTrail Trail with multi-region = true, S3 log bucket encrypted.
* Parameter Store params under `AppParamPath`; Secrets Manager secret present; instance role policies scoped to these.
* CW Alarm on EC2 CPU with threshold/time specified; SNS Topic wired when `AlarmEmail` is set.
* Tags applied to all major resources.

In `tests/integration/test_tap_stack.py`, assert outputs exist and are non-empty:

* `AlbDnsName`, `VpcId`, `AppBucketName`, `DynamoTableName`, etc.

## Assumptions (document in code comments)

* SSH to private instances is intended via **bastion** or **corporate VPN**—thus SG permits only `AllowedSshCidrs` (and/or bastion SG).
* App runs on a configurable **APP\_PORT** (default 8080); ALB forwards to that port.
* AMI via SSM Parameter for **Amazon Linux 2023**.
* No hard dependency on RDS unless `EnableRds=true`. DynamoDB is the primary DB per requirements.

## Non-Functional & Style

* CDK v2; clear separation of props vs constructs; no magic constants.
* Deterministic naming for buckets/tables based on `EnvironmentName`.
* KMS keys with rotation for CloudTrail/logging buckets; key policies scoped to principals.
* No wildcard `Resource: "*"`, except where strictly required by AWS managed patterns (avoid if possible).
* Add docstrings/type hints; keep constructs small and readable.

---

**End of prompt.**
