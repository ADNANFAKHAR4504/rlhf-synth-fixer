Generate a single CloudFormation template named **TapStack.yml** (YAML syntax) for **us-east-1** that provisions a brand-new, secure baseline stack. Don’t reference or import any existing resources—create everything needed right in this file. The stack must follow least-privilege and security-by-default practices, and it must pass both `aws cloudformation validate-template` and `cfn-lint` for **us-east-1**.

### What to build (all from scratch)

**KMS**

* One customer-managed KMS key for general data-at-rest encryption (`alias/tapstack-kms`).
* Least-privilege key policy that permits: the account root, CloudTrail, CloudWatch Logs, and the roles/services defined in this stack.
* Enable automatic key rotation.

**S3 (all new buckets, public access blocked)**

* **trail-logs** bucket for CloudTrail (SSE-KMS with the KMS key). Bucket policy: deny non-TLS (`aws:SecureTransport = false`), deny unencrypted `PutObject`, and allow the CloudTrail service principal as per AWS guidance.

  * Settings: Object Ownership = BucketOwnerEnforced (or BucketOwnerPreferred for access logging), Versioning enabled, Lifecycle to transition noncurrent versions and expire old logs, and **server access logging** that writes to a separate **access-logs** bucket.
* **access-logs** bucket dedicated for server access logs (SSE-KMS, block public, versioning, TLS-only policy).
* **lambda-artifacts** bucket for packaging code (SSE-KMS, block public, TLS-only policy). Even if function code is inline, keep this bucket for future updates.

**Networking**

* New VPC `10.0.0.0/16` with two public and two private subnets across distinct AZs. Attach an IGW.
* One cost-aware NAT Gateway in a public subnet; private route tables egress via NAT; public route tables route to IGW.
* VPC endpoints so private resources reach AWS services over TLS without the public internet:

  * **Gateway:** S3
  * **Interface:** KMS, CloudWatch Logs, SSM, and EC2 Messages
  * Use tight endpoint policies (allow only what this stack needs).

**Security Groups (minimal and specific)**

* **ALB SG:** allow inbound TCP/80 from `0.0.0.0/0`; egress only what’s needed to reach targets (app port inside VPC) and standard web egress as required.
* **EC2 SG:** inbound **only** from the ALB SG on the app port (e.g., 8080). No SSH from the internet. Egress limited to required destinations (HTTPS to AWS endpoints, etc.).
* **Lambda SG:** no inbound; minimal egress (e.g., HTTPS to interface endpoints).

**Application Load Balancer (HTTP-only)**

* New ALB in public subnets with a single HTTP:80 listener forwarding to a Target Group for EC2 instances in private subnets.
* Health checks enabled on the application path/port.
* **No ACM/HTTPS** here (intentionally excluded).

**WAF (WAFv2)**

* A regional `AWS::WAFv2::WebACL` with AWS Managed rule groups enabled:

  * `AWSManagedRulesCommonRuleSet`
  * `AWSManagedRulesKnownBadInputsRuleSet`
  * `AWSManagedRulesAmazonIpReputationList`
  * `AWSManagedRulesAnonymousIpList`
* Associate the Web ACL to the ALB with `WebACLAssociation`.

**EC2 (private, managed via SSM; no SSH)**

* Launch Template + Auto Scaling Group (min=1, max=2) in the private subnets.
* User data starts a basic HTTP app on **port 8080** for health checks.
* Don’t open SSH/22 and don’t attach a key pair. Access is via SSM (Session Manager).
* EBS volumes encrypted (leave `KmsKeyId` unset so default EBS encryption is used safely).
* Instance profile/role with least-privilege:

  * `AmazonSSMManagedInstanceCore`
  * Minimal CloudWatch Logs write for the specific log group
  * Optional read to a **specific prefix** in the artifacts bucket (not the whole bucket)

**Lambda (example function)**

* One small function (Python or Node.js) showing:

  * Least-privilege execution role
  * KMS-encrypted environment variables
  * Optional VPC attachment (to the private subnets via the Lambda SG)
  * Writes to a dedicated CloudWatch log group with explicit retention

**CloudTrail**

* Organization-agnostic, multi-region trail writing to the **trail-logs** bucket (SSE-KMS with the created key) **and** to a CloudWatch Logs log group (retention set).
* Include the CloudTrail service role and bucket policy statements required by AWS.
* Enable log file validation.

**GuardDuty**

* Enable a `AWS::GuardDuty::Detector` in this account/region (no cross-account).
* Make it easy to toggle on/off at deploy time (e.g., a parameter).

**CloudWatch**

* Log groups (with retention) for:

  * EC2 app logs (collected by the CloudWatch agent)
  * Lambda logs (retention managed explicitly)
  * CloudTrail logs (for the trail’s CloudWatch integration)

**IAM (least-privilege everywhere)**

* Roles to create:

  * `EC2InstanceRole`
  * `LambdaExecutionRole`
  * `CloudTrailLogsRole`
  * Any small helper roles needed for logging
* Favor AWS managed policies only where appropriate (e.g., SSM core). Inline policies must scope to resources in this stack (specific S3 ARNs, log groups, and the KMS key). Avoid wildcards unless a service requires them, and then constrain with conditions.

**Tagging**

* Apply consistent tags on all taggable resources:

  * `Project=TapStack`, plus `Environment`, `Owner`, and `CostCenter`.

### Encryption & in-transit expectations

* **At rest:** Use SSE-KMS (the created key) for S3 buckets; EBS volumes encrypted by default. Enable KMS rotation.
* **In transit:** Enforce TLS to buckets via `aws:SecureTransport` bucket policies. VPC endpoints use TLS. SSM/EC2 Messages use TLS. (Front-end HTTPS is intentionally deferred; see Exclusions.)

### Template structure & ergonomics

* Sections: `AWSTemplateFormatVersion`, `Description`, `Metadata`, `Parameters`, `Mappings`, `Conditions`, `Resources`, `Outputs`.
* **Parameters:** `EnvironmentName`, `ProjectName`, `AllowedIngressCIDRForAlbHttp` (default `0.0.0.0/0`), `InstanceType`, `MinCapacity`, `MaxCapacity`, `AppPort`, `LogRetentionDays`, and a toggle for GuardDuty. Validate inputs with `AllowedPattern`/`AllowedValues`.
* **Mappings:** e.g., AZ mapping (or rely on SSM Param for the latest AL2023 AMI).
* **Conditions:** e.g., `IsProd` to tweak retention or lifecycle.
* **Naming:** Use `Fn::Sub` consistently; keep S3 bucket names lowercase and DNS-safe.
* **No deprecated or region-unsupported resource types.**

### Outputs (make them useful)

* `VPCId`, `PublicSubnetIds`, `PrivateSubnetIds`
* `AlbArn`, `AlbDnsName`, `AlbSecurityGroupId`, `TargetGroupArn`
* `WebAclArn`
* `Ec2AutoScalingGroupName`, `Ec2InstanceProfileArn`
* `LambdaFunctionName`, `LambdaFunctionArn`, `LambdaLogGroupName`
* `TrailName`, `TrailArn`, `CloudTrailLogGroupArn`
* `GuardDutyDetectorId` (if enabled)
* `KmsKeyArn`
* Bucket names/ARNs for: **trail-logs**, **access-logs**, **lambda-artifacts**
* VPC Endpoint IDs (at least S3/KMS/Logs/SSM/EC2Messages)

### Validation & quality bars

* Must be a single YAML file named **TapStack.yml**.
* Must create all resources from scratch (no imports to existing KMS keys, buckets, trails, etc.).
* Must pass `aws cloudformation validate-template` and `cfn-lint` in **us-east-1**.
* Keep IAM and KMS key policies tight. No `*` on actions/resources unless strictly required, and then constrain with conditions.
* Provide sane defaults so the stack launches without edits.

