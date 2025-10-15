**Goal**

Create a production-grade AWS CloudFormation template named **`production_security.yaml`** that provisions a secure, highly available web application stack. The stack must include at least: one VPC, multiple EC2 instances behind a load balancer, and an RDS database. Implement every requirement below explicitly.

**Single-file constraint**

* Deliver **one** YAML template only: **no nested stacks, no secondary templates, no external files**.
* All resources, policies, schedules, and automation must live inside **this single stack**.

**Must-have architecture**

* **Networking**

  * One VPC spanning **two or more Availability Zones**.
  * Public subnets (for the load balancer) and private subnets (for app EC2 and RDS).
  * **Network ACLs** on each subnet that allow only necessary ports (80 for redirect, **443** for the load balancer, DB port only from the app tier, ephemeral as needed).
  * **Security Groups**:

    * Load balancer: allow **443** from the internet; **80** only to issue a permanent redirect to 443.
    * App EC2: inbound only from the load balancer SG on the app port; **no public ingress**.
    * **SSH** strictly limited to a parameterized CIDR (e.g., `AllowedAdminCidr`) and only via a bastion/management path (never 0.0.0.0/0).

* **Compute**

  * Multiple EC2 instances in **private subnets**, spread across AZs, with **least-privilege** instance profiles.
  * **EBS encryption** enabled by default (CMK). Add **automated backups** via AWS Backup or EBS snapshot lifecycle for all app instances.

* **Database**

  * RDS (engine of your choice) deployed **Multi-AZ**, **storage encrypted**, **not publicly accessible**, reachable only from the app tier SG.

* **Edge / Protection**

  * **Application Load Balancer** with a listener on **port 443** enforcing a policy that allows **TLS 1.2 or higher**.
  * A listener on **port 80** that performs a **301 redirect to 443** (no plaintext application traffic served).
  * The load balancer must **consume a pre-existing certificate ARN** provided via parameter (e.g., `CertificateArn`). **Do not create any certificate** in this template—only consume the ARN.
  * **AWS WAF** Web ACL associated with the load balancer (use sensible managed rule groups).

**Security controls**

* **Global tagging**: Apply **`Environment: Production`** and **`Owner: SecurityTeam`** to **every** supported resource (including child resources where tagging is supported).
* **Encryption at rest (KMS)**:

  * Customer-managed keys with rotation enabled for **EBS**, **RDS**, and any **S3** buckets created by this stack.
* **Encryption in transit**

  * Enforce **TLS ≥ 1.2** at the load balancer; for S3, add a bucket policy that **denies requests without TLS** using `aws:SecureTransport`.
* **IAM (least privilege)**

  * Minimal, task-scoped permissions for instance roles and any service roles.
  * Define an **account password policy** and include example guard policies that **require MFA** for sensitive actions (use `aws:MultiFactorAuthPresent` in policy conditions).
* **MFA for users**

  * Provide outputs/guidance and sample policies that block sensitive console/API paths unless MFA is present. (You don’t have to provision devices—enforce via policy and document via Outputs/Descriptions.)
* **Access key rotation (90 days)**

  * Implement an **EventBridge + Lambda + SNS** schedule to audit access key ages, notify owners, and optionally **deactivate keys older than 90 days** (make enforcement toggleable).
* **Monitoring & detective controls**

  * **CloudTrail** enabled with log file validation, delivering to a secure S3 bucket (encryption on), with optional CloudWatch Logs streaming and alarms for critical API activity.
  * **AWS Config** enabled to capture resource changes and deliver to S3/SNS; avoid any disallowed terminology.
* **S3**

  * Any buckets (e.g., logs) must have **default encryption**, **block public access**, and a policy that **denies non-TLS** requests.
* **Backups**

  * Use **AWS Backup** (preferred) or lifecycle policies to **regularly back up EBS** and **RDS**, with retention and vault encryption via CMK.

**Parameters & outputs (include at least)**

* Parameters: `AllowedAdminCidr`, `DBName`, `DBUsername` (avoid reserved names), `DBPassword` (NoEcho), instance types, desired capacity, **`CertificateArn`** (consumed by the 443 listener), and helpful toggles (e.g., key-rotation enforcement).
* Outputs: VPC ID, subnet IDs, load balancer DNS name, WAF WebACL ARN, RDS endpoint, KMS key ARNs, CloudTrail trail ARN, Backup plan ID, plus **guidance strings** for MFA and key rotation.

**Quality & validation**

* Format: **YAML**, single file named **`production_security.yaml`**.
* Apply tags via a central mechanism to guarantee coverage.
* Ensure **no public access** to RDS or app EC2, and **no wide-open SSH**.
* Pass common checks (e.g., cfn-lint, cfn-nag). Follow AWS security best practices for each service.
* Add concise **Descriptions** on critical resources explaining the security intent (e.g., why SG rules are restricted, how the TLS policy is enforced).

**Acceptance checklist (all must be true)**

1. One stack file only; no nested stacks or extra files.
2. Every resource tagged with `Environment: Production` and `Owner: SecurityTeam`.
3. KMS encryption for EBS, RDS, and S3; CMK rotation enabled.
4. Load balancer listener on 443 enforces **TLS 1.2+**; listener on 80 issues permanent redirect to 443.
5. IAM roles/policies follow least privilege; account password policy enforced.
6. MFA required for sensitive operations; example policies and outputs included.
7. CloudTrail enabled with validation; logs encrypted and stored securely.
8. S3 buckets: default encryption on; public access blocked; deny non-TLS.
9. NACLs restrict traffic; SGs do **not** allow 22/tcp from the world.
10. AWS Config enabled to capture changes (no disallowed terms).
11. Workload spans multiple AZs for high availability.
12. RDS is private (no public endpoint) and only reachable from the app tier.
13. Automated access key rotation process at 90 days via scheduled automation.
14. AWS WAF attached to the load balancer with managed rule groups.
15. Automated EBS (and DB) backups on a defined schedule with retention.

**Deliverable**

Return **only** the final single-file CloudFormation template named **`TapStack.yaml`** implementing everything above, with sensible parameter defaults for a common region, and brief comments where trade-offs are made.
