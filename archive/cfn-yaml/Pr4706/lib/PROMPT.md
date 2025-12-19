**Prompt:**

Create a **single CloudFormation template named `TapStack.yml` (YAML)** that provisions a **brand-new, secure web application environment**. The template must be fully self-contained (no references to pre-existing resources) and deployable as-is.

### Goals

* Lock everything to **`us-west-2`**.
* Follow security best practices by default.
* Prefer managed services where sensible, but **create** all resources from scratch.

### Hard Requirements (do not relax)

1. **Region Lock:** All resources in `us-west-2`. Add a `Mappings`/`Conditions` guard that fails if another region is used.
2. **IAM Roles Only:** Use **AWS IAM roles** to delegate access between services (no inline access keys, no users).
3. **Encryption at Rest Everywhere:**

   * S3 buckets: SSE-KMS (customer-managed KMS key created in this stack).
   * Databases: at-rest encryption enabled with the same KMS key (or a dedicated DB key—your call, but define in this stack).
   * Logs, EBS volumes, and anything that stores data: encrypted.
4. **Private-Only Networking:**

   * Create a **new VPC** with **private subnets only** across at least two AZs in `us-west-2`.
   * No public subnets. No public IPs attached to instances.
   * Provide outbound internet for private resources via a **NAT Gateway** in a small, clearly named egress subnet you create (the egress subnet itself must not host application resources).
5. **Web Tier Security Group:**

   * Ingress: **only TCP/80 (HTTP) from `0.0.0.0/0`** to web server instances.
   * Egress: least-privilege to what the web tier actually needs (document in SG description).
   * Do **not** open SSH or ephemeral wide-open rules.
6. **Database Isolation:**

   * Place the database in private subnets.
   * No public access.
   * Security group allows **only** app/web tier to connect on the DB port.
7. **Secrets Management:**

   * Store app secrets and environment variables in **AWS Systems Manager Parameter Store (SecureString)**.
   * Encrypt with the stack’s KMS key.
   * Provide an instance role (or task role if you choose ECS) with the minimum SSM permissions needed to read those parameters.
8. **Logging & Auditing:**

   * Enable **AWS CloudTrail** (org trail not required) writing to an encrypted S3 log bucket you create, with appropriate bucket policy and log file validation.
   * Enable VPC Flow Logs, ALB/ELB access logs (if you use an ALB), and CloudWatch Logs for compute.
   * Ensure all log destinations are **encrypted** (KMS) and access is least-privilege.
9. **KMS:**

   * Create a **customer-managed KMS key** (and alias) for S3, DB, Parameter Store, and logs as applicable.
   * Include a key policy that allows the services you use to encrypt/decrypt while remaining least-privilege.
10. **Validation:**

* The YAML **must pass `cfn-lint`** with zero errors.
* Use intrinsic functions correctly, no unresolved refs.

### Architecture to Build (baseline)

* VPC (CIDR e.g., `10.0.0.0/16`) with **two private application subnets** and **two private database subnets** in distinct AZs.
* One **egress/NAT subnet** per AZ hosting **NAT Gateways** attached to an Internet Gateway via a dedicated route (keep app/db subnets private).
* **Application compute** (choose one and implement cleanly):

  * Option A: **EC2 Auto Scaling Group** behind a **private** ALB/NLB that fronts the web tier (ALB can be internet-facing only if it does not violate “no public subnets”; if you need internet-facing access, place only the ALB in the egress/NAT AZs with tightly scoped SGs; app instances remain private without public IPs).
  * Option B: **ECS on EC2** or **ECS Fargate** in private subnets, using an ALB listener on port 80.
* **Database**: Amazon RDS (e.g., PostgreSQL or MySQL) in **private DB subnets**, multi-AZ where possible, with at-rest encryption and managed backups.
* **S3 buckets**:

  * `AppDataBucket` (app needs),
  * `LogsBucket` (for ALB, VPC Flow Logs if sent to S3, and CloudTrail),
    all with SSE-KMS, Block Public Access, and strict bucket policies.
* **CloudTrail** trail writing to `LogsBucket` with log file validation and encryption.
* **Parameter Store** (SecureString) for `AppSecret`, `DbConnectionString` (or discrete params), `AppEnv`, etc.
* **KMS**: One primary CMK + alias `alias/tapstack-kms` (you may create a separate DB CMK if you prefer—define both in this stack).

### Parameters (define sensible defaults)

* `EnvironmentName` (e.g., `prod`, `staging`), used as a prefix for names and tags.
* `VpcCidr`, `AppSubnetCidrs`, `DbSubnetCidrs`, `EgressSubnetCidrs`.
* `DbEngine`, `DbInstanceClass`, `DbAllocatedStorage`, `DbMasterUsername`, `DbMasterPasswordParameterName` (stored in SSM SecureString).
* `DesiredCapacity`, `MinCapacity`, `MaxCapacity` for the app tier.
* `AppImageId` (for EC2) or `AppTaskImage` (if ECS).
* Any ALB listener port parameters if needed (default 80).

### Outputs (clearly document)

Provide clean outputs for:

* `VpcId`, `PrivateSubnets`, `DbSubnets`, `NatGatewayIds`, `InternetGatewayId` (if created for NAT path),
* `AppSecurityGroupId`, `DbSecurityGroupId`,
* `AlbDnsName` (if using ALB),
* `RdsEndpoint`, `RdsArn`,
* `AppDataBucketName`, `LogsBucketName`,
* `KmsKeyArn`, `KmsAlias`,
* `ParameterPaths` used,
* `CloudTrailTrailArn`.

### Tags & Naming

* Prefix all resources with `${EnvironmentName}-tapstack-...`.
* Apply common tags: `Environment`, `Owner`, `Project=TapStack`, `Confidentiality=High`.

### IAM & Least Privilege

* Instance/Task role: minimal permissions to read specific SSM parameter paths and write to specific S3 prefixes if needed.
* Allow logging/ALB services to write to `LogsBucket` via bucket policy.
* KMS key policy must explicitly authorize CloudTrail, CloudWatch Logs, RDS, S3, and SSM usage as applicable.

### Deliverable Format

* **One YAML file** named **`TapStack.yml`** containing **Parameters**, **Mappings**, **Conditions**, **Resources**, and **Outputs**.
* No placeholders like “TO-DO”. Provide concrete default values where appropriate (safe, non-secret), and wire **all** references correctly.
* Add brief inline comments explaining any non-obvious choices.

### Quality Bar

* The template must **synthesize and validate cleanly** with **`cfn-lint` (zero errors)**.
* No circular dependencies.
* No references to resources outside this template.
* Security groups and route tables must reflect the **private-only** design (no instance public IPs).
* HTTP ingress only to web tier on port 80 from `0.0.0.0/0`. No SSH.

If any best-practice trade-offs are necessary (e.g., ALB placement), choose the secure option and keep the web/app instances private-only. The final `TapStack.yml` should be production-ready, minimal, and explicit.