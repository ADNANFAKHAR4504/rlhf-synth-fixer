# Build a Secure, Scalable AWS Stack (CloudFormation JSON)

We’re setting up a production-quality AWS foundation for a mid-sized company. Please deliver a **CloudFormation template in JSON** that’s secure by default, easy to deploy, and follows AWS best practices.

## What you’re building

A dedicated VPC in **us-west-2** with public/private subnets, an internet-facing ALB, private EC2 instances, an encrypted PostgreSQL RDS database, S3 buckets for content and logs, a Lambda for log processing, and CloudFront in front of S3. Everything should be locked down and monitored.

---

## Must-haves (at a glance)

* Region: **us-west-2**
* Dedicated **VPC** (isolated from anything else)
* **2 public** and **2 private** subnets across **at least two AZs**
* **Internet Gateway** + **NAT Gateway** (NAT lives in a public subnet)
* **Route tables** wired correctly for public/private traffic
* **Bastion host** in a public subnet for SSH into private EC2
* **ALB** in public subnets; **EC2** instances in private subnets
* **Security Groups**:

  * EC2: allow **HTTP (80)** only **from the ALB**
  * EC2: allow **SSH (22)** only **from the bastion**
* **S3**: buckets for data + access logs; **versioning** and **SSE-KMS** required; block public access; **deny non-HTTPS**
* **RDS (PostgreSQL)**: private, **KMS-encrypted**, **Multi-AZ**, SSL required, not publicly accessible
* **IAM**: least privilege roles for EC2/Lambda/etc.
* **Lambda**: small function for log processing, optional S3 trigger
* **CloudFront**: in front of S3; **HTTPS enforced**; use **OAI or OAC**
* **KMS**: encrypt EBS, S3, and RDS
* **CloudWatch**: metrics + alarms (at minimum EC2 CPU); logs for S3/Lambda where applicable
* **TLS everywhere** for traffic in transit

---

## Networking & access

* Create a VPC (CIDR via parameter) with:

  * Two **public** subnets (AZ-spread)
  * Two **private** subnets (AZ-spread)
* Attach an **Internet Gateway**.
* Add a **NAT Gateway** in a public subnet for private egress.
* Wire **route tables** appropriately (public → IGW, private → NAT).
* Launch a **bastion host** in a public subnet for controlled SSH.

## Compute (EC2 + ALB)

* EC2 runs in **private subnets** only.
* Front with an **internet-facing ALB** in **public subnets**.
* **Security Groups**:

  * ALB: allow 80/443 from the internet.
  * EC2: allow **80 only from the ALB SG**; **22 only from the bastion SG**.
* **CloudWatch Alarms** for EC2 **CPUUtilization**.
* EC2 **IAM Role** with least-privilege access to what it needs (e.g., S3/KMS).

## Storage (S3)

* Buckets:

  * **Data** bucket
  * **Access logs** bucket
* Enable **versioning** on all buckets.
* Turn on **server access logging** (logs → logs bucket).
* Enforce **SSE-KMS**.
* **Block public access** and add a **policy to deny non-HTTPS**.

## Database (RDS)

* **PostgreSQL** in **private subnets** only.
* **KMS-encrypted**, **Multi-AZ**, **not publicly accessible**.
* Require **SSL** for connections.
* Keep IAM/RDS permissions minimal.

## IAM & security

* Create roles/policies for EC2, Lambda, and any other services used.
* **Principle of least privilege** throughout.
* Avoid public or cross-account access unless explicitly required.

## Serverless (Lambda)

* Add a Lambda for **log processing** or automation tasks.
* Optionally, wire up **S3 event notifications**.
* Lambda role: only what’s needed for **CloudWatch Logs** and relevant **S3** actions.

## Content delivery (CloudFront)

* CloudFront in front of the content S3 bucket.
* **Enforce HTTPS** (ViewerProtocolPolicy = `redirect-to-https`).
* Use **OAI or OAC** to prevent direct public access to S3.

## Encryption & observability

* **KMS** for:

  * RDS storage
  * S3 data
  * EC2 volumes (EBS)
* **CloudWatch**:

  * Metrics and alarms for EC2 (CPU at minimum)
  * Logging for Lambda
  * S3 access logs to the logs bucket

---

## What to deliver

A single **CloudFormation template (JSON)** that:

* Passes `aws cloudformation validate-template` and **cfn-lint**
* Deploys cleanly in **us-west-2** without edits
* Uses secure defaults and implements everything above

Include:

* **Parameters** (e.g., VPC CIDR, InstanceType, KeyName, etc.)
* **Resources** for networking, compute, storage, IAM, monitoring
* **Outputs** (VPC ID, ALB DNS, bucket names, RDS endpoint, etc.)

---

## How we’ll validate

* Valid JSON and proper CloudFormation structure
* Follows AWS security best practices (encryption, least privilege)
* No missing references or dependency issues on deploy
* S3 buckets: versioning, access logs, server-side encryption, HTTPS-only
* CloudWatch alarms present for EC2 CPU
* Subnets and routes isolated correctly (bastion in public, workloads in private)
* CloudFront secured over HTTPS with OAI/OAC to S3

---

## Constraints (for quick reference)

| Item          | Requirement                                   |
| ------------- | --------------------------------------------- |
| Region        | `us-west-2`                                   |
| VPC Isolation | Dedicated VPC                                 |
| Subnets       | ≥2 public + ≥2 private across ≥2 AZs          |
| NAT Gateway   | Required for private egress                   |
| Bastion Host  | Required for SSH into private EC2             |
| EC2 Security  | HTTP from ALB only; SSH from bastion only     |
| S3            | Versioning + logging + SSE-KMS + HTTPS-only   |
| RDS           | KMS-encrypted, private, SSL, not public       |
| CloudFront    | HTTPS enforced; OAI/OAC to S3                 |
| IAM           | Least privilege for all roles                 |
| KMS           | Encrypt S3, EBS, RDS                          |
| CloudWatch    | EC2 CPU alarms (and logging where applicable) |
| TLS           | Encryption in transit everywhere              |

---

