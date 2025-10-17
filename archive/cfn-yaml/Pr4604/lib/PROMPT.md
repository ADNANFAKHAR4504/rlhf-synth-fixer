Please build **one** YAML CloudFormation stack that sets up a secure, production-ready AWS environment. It must validate and deploy cleanly. Keep everything inside this single template.

### 1) Network layout (simple and safe)

* Create a VPC spanning **two AZs**.
* **Public subnets**: only for an **Application Load Balancer** (ALB) listening on **port 80**.
* **Private subnets**: for **EC2** and **RDS** only.
* **No public IPs** anywhere on EC2 (disable public IPs at subnet level and on network interfaces).
* Add **gateway endpoints** for **S3** and **DynamoDB** and attach them to the **private** route tables.
* Add **interface endpoints** for `ssm`, `ssmmessages`, `ec2messages`, `logs`, `events`, and `kms` so instances can operate privately without internet egress.

### 2) Security groups (least privilege by default)

* **ALB SG**: allow **80/tcp** from the internet; deny everything else inbound.
* **EC2 SG**: allow **80/tcp** **only** from the ALB SG; restrict egress to what the app actually needs (including the endpoints).
* **RDS SG**: allow the database port **only** from the EC2 SG; no public access.

### 3) Compute with private access only

* Launch EC2 through a Launch Template or equivalent in **private subnets** with `AssociatePublicIpAddress: false`.
* Access and admin via **Systems Manager Session Manager** (no bastion, no SSH from the internet).
* Create an **instance profile** for EC2 with just the minimum permissions for SSM and app logs/metrics.
* **Important**: Do **not** set explicit names on any IAM roles, instance profiles, or policies.

### 4) Load balancing & optional edge

* **ALB** in public subnets with an **HTTP (80)** listener and a target group for the EC2 instances (HTTP health checks).
* You may place a **CloudFront** distribution in front of the ALB for global edge protection and latency benefits. Keep the origin on **HTTP** (no custom certificates to be created here).

### 5) Database with high availability and encryption done right

* Create a **Multi-AZ** managed database (default: **PostgreSQL 15**) in private subnets.
* Turn on: encryption at rest, automatic backups (≥ **7 days**), deletion protection, and preferred minor version auto-upgrade.
* Use a **customer KMS key** for the database. **Enable annual rotation**.

**Database key policy (must be correct)**

* Grant the **account root** full administration of the key.
* Allow the **managed database service** in this region to use the key for encrypting the database and its snapshots. Constrain with conditions like:

  * `kms:ViaService` = the regional database service endpoint, and
  * `kms:CallerAccount` = this account.
* Allow only the minimal IAM principals created in this stack to use the key where necessary (principle of least privilege).

### 6) Buckets (logging + app) with strict data protection

Create separate S3 buckets for:

* **Trail logs**
* **ALB access logs**
* Optionally, **app logs/artifacts**

For **every** bucket:

* **Versioning ON**.
* **Default encryption ON** (SSE-KMS using a customer key, or SSE-S3 where appropriate).
* **Block public access** (all four settings).
* Bucket policy to **deny non-TLS** (`aws:SecureTransport = false`) and prevent any public access.

### 7) End-to-end visibility & auditing

* **CloudTrail**: capture account activity across services, including **S3, IAM, EC2**, and **object-level events** for the relevant buckets.

  * Turn on **log file validation**.
  * Deliver to the dedicated logs bucket (policy must allow the logging service while still enforcing TLS-only).
  * Optionally stream to **CloudWatch Logs** (the log group should be encrypted).
* **CloudWatch**:

  * Create encrypted log groups for app/ALB/WAF as needed.
  * Add sensible alarms: EC2 status check failures, high CPU, target group **5XX**, database freeable memory/storage/availability.

### 8) Edge protections

* **WAF v2**: attach a web ACL with AWS managed rule groups, including **SQLi** and **XSS** protections.
* If using **CloudFront**, note it benefits from managed DDoS protections at the edge by default.

### 9) Strong encryption & key hygiene

* Use **KMS** customer keys with **rotation enabled** for:

  * The database at rest,
  * Any S3 buckets using SSE-KMS,
  * CloudWatch Logs and CloudTrail (if you wire them to keys).
* Keep key policies minimal and service-scoped (log delivery, load balancer access logs, etc.), as needed.

### 10) Operations with Systems Manager

* Ensure the EC2 instance profile includes the **core SSM managed policy** so instances register and can be managed privately via the endpoints.
* Optionally add a simple association or userdata step to install/enable the **CloudWatch agent** for metrics and logs.

### 11) Parameters, outputs, and quality bar

* Parameterize sensible knobs (CIDRs, instance sizes/classes, DB engine/version, allowed CIDR for ALB, retention days).
* **Outputs**: VPC ID; subnet IDs; route table IDs; endpoint IDs; ALB DNS; target group ARN; database endpoint/ARN; S3 bucket names; KMS key ARNs; key CloudWatch log group names.
* The template must be **lint-clean**, validate with the standard validation command, and deploy without surprises.
* Keep the entry point strictly **HTTP** (no custom TLS resources).
* Everything—**all resources above—must live in this one stack**.

**Important don’ts**

* Don’t hardcode names for IAM roles, instance profiles, or policies.
* Don’t add any custom certificate resources.
* Don’t expose EC2 to the internet or attach public IPs.
