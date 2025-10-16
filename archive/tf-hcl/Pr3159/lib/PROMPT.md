ROLE: You are a senior Terraform engineer.

CONTEXT:
A small e-commerce startup (≈1,000 daily users) needs a reliable, low-cost AWS web stack with basic load balancing and monitoring. Keep the design simple, secure by default, and production-ready.

TOOLING:
Generate **Terraform (HCL)** code targeting **AWS us-east-1**.

REQUIREMENTS (BUILD EXACTLY THIS):

* **Networking**

  * Create a **VPC** with CIDR **10.0.0.0/16** in **us-east-1**.
  * Two **public subnets**: **10.0.1.0/24** (us-east-1a) and **10.0.2.0/24** (us-east-1b).
  * Internet Gateway, public route table, and routes so instances in public subnets have outbound internet access.
* **Compute**

  * One or more **EC2 t3.micro** instances running **nginx** (install via user_data).
  * (Cost-aware scalability) Use a small **Auto Scaling Group** (ASG) with **Launch Template**: `min=1`, `desired=1`, `max=3`. Rolling replace friendly.
* **Load Balancing**

  * **Application Load Balancer** (ALB) in the two public subnets, **HTTP :80** listener.
  * Target group (instance or IP) with health checks; register the ASG to the target group.
* **Security**

  * Use separate **Security Groups**:

    * **ALB SG**: allow **HTTP 80 from 0.0.0.0/0** (public site).
    * **EC2 SG**: allow **SSH 22 only from 203.0.113.0/24**; allow **HTTP 80 only from the ALB SG** (no direct public HTTP).
  * Least-privilege IAM where needed (e.g., SSM read-only core for management is OK but optional; avoid wide policies).
* **Storage**

  * **S3 bucket** for static assets with **SSE-S3** (server-side encryption with S3 managed keys), **block all public access = true**, and a basic bucket policy that prevents unencrypted puts. (No public website hosting.)
* **Monitoring**

  * **CloudWatch**: ALB/TargetGroup health checks, minimal **alarms** (e.g., ASG average CPU > 70% for 5 min), and instance status check alarm.
  * Useful **outputs** (ALB DNS name, bucket name, VPC/Subnet IDs, SG IDs).
* **Tagging**

  * Apply a consistent map of tags to all resources, e.g., `Project`, `Environment`, `Owner`, `CostCenter`.

ASSUMPTIONS & DEFAULTS (FOLLOW UNLESS OVERRIDDEN):

* Availability Zones: **us-east-1a** and **us-east-1b**.
* AMI: the latest Amazon Linux 2 via SSM parameter (`/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64`) or a data source.
* Nginx user_data: install, enable service, simple index page that prints instance ID.
* Keep costs low: no NAT Gateways, no RDS, no extra AZs beyond two.

BEST PRACTICES (MANDATORY):

* **Modularity:** Prefer small reusable modules (vpc, security_groups, alb, asg_ec2, s3, monitoring). If you in-line resources, keep files logically separated.
* **Variables & Defaults:** Sensible defaults, type constraints, validation where useful.
* **Immutability:** Use Launch Template + ASG; avoid ad-hoc pets.
* **Security:** Principle of least privilege; no public access to EC2 HTTP; S3 public access blocked; explicit egress rules.
* **Idempotence:** No hard-coded dynamic IDs; use data sources where appropriate.
* **Comments:** Inline comments explaining key resources, assumptions, and choices.
* **Formatting:** `terraform fmt`-ready, readable naming, and consistent tagging.

DELIVERABLES (OUTPUT EXACTLY THESE FILES):

1. **providers.tf** – AWS provider (us-east-1), required versions, and (optional) backend block with placeholders only (no secrets).
2. **variables.tf** – Inputs (tags map, ssh_ingress_cidr default `203.0.113.0/24`, instance_type default `t3.micro`, desired/min/max, etc.).
3. **vpc.tf** – VPC, subnets, IGW, route tables, associations.
4. **security_groups.tf** – ALB SG and EC2 SG with rules as specified.
5. **alb.tf** – ALB, target group, HTTP listener, attachments to ASG.
6. **compute_asg.tf** – Launch Template (AMI, user_data for nginx), ASG in both subnets, scaling settings.
7. **s3.tf** – S3 bucket with SSE-S3, public access block, minimal bucket policy to enforce encryption.
8. **monitoring.tf** – CloudWatch alarms (CPU, StatusCheckFailed), TG health checks already in alb.tf.
9. **outputs.tf** – ALB DNS, bucket name, VPC/Subnet IDs, SG IDs.
10. **README.md** – How to use: prerequisites, variables, `init/plan/apply`, and how to test HTTP via ALB DNS.

OUTPUT FORMAT (IMPORTANT):

* Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:

```hcl
# providers.tf
...
```

```markdown
# README.md
...
```

VALIDATION & NOTES:

* Ensure ALB health checks pass (target group path `/` on port 80).
* Confirm that port 80 is reachable **only** via the ALB (not directly to instance SG).
* Confirm SSH (22) is restricted to **203.0.113.0/24**.
* Show `terraform outputs` that include the ALB DNS name to test in a browser.
* Include minimal costs and avoid unnecessary managed services.

Please generate the complete Terraform implementation now, following the above structure and constraints, with clear inline comments explaining key parts.
