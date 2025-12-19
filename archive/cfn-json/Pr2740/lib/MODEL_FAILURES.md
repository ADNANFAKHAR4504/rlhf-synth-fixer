Certainly. Below is a `failure_prompt.md` that outlines **what *not* to do** or describes a **failure scenario** when implementing the CloudFormation template. This is helpful for testing, validation, or documenting common pitfalls.

---

# ❌ `failure_prompt.md`

## Objective

Define common **failure conditions**, misconfigurations, and violations that would **invalidate** the CloudFormation JSON template or result in a **non-functional, insecure, or non-compliant AWS infrastructure**.

---

## 🔥 Failure Scenarios and Violations

### 🚫 CloudFormation Template-Level Issues

* The CloudFormation template is split into **multiple files** instead of a **single JSON file**.
* Template fails to **validate** using `cfn-lint` (shows **syntax or semantic errors**).
* Missing required **Parameters**, **Mappings**, or **Outputs** for core infrastructure.

---

### 🕸️ Networking Misconfigurations

* VPC is created with:

  * Only **one subnet**, or subnets are all in the **same Availability Zone**.
  * Missing **public or private subnet** configuration.
* **Internet Gateway** is not attached or incorrectly routed.
* **NAT Gateway** is:

  * Missing, or
  * Placed in a **private subnet**.
* Route tables:

  * Not associated with correct subnets.
  * Do not route internet-bound traffic correctly.

---

### 🖥️ EC2 and Autoscaling Failures

* EC2 instances are placed in **public subnets** instead of private.
* **Auto Scaling Group** is:

  * Not defined.
  * Has incorrect **desired capacity**.
* **Elastic Load Balancer (ELB)** is missing or not linked to the instances.
* Security Groups:

  * Allow **direct internet access** to EC2.
  * Do not restrict traffic to **only HTTP/HTTPS from the ELB**.
* Missing or incorrect **IAM instance roles**.
* No **detailed monitoring** enabled on EC2 instances.
* **SSM Agent** not installed or SSM not configured, requiring **SSH access**.

---

### 🗃️ Storage and Logging Failures

* S3 bucket for logs:

  * Not created.
  * Has **insecure bucket policy** (e.g., public access allowed).
  * Lacks error logging configuration.
* **EBS volumes** and **RDS storage** are **not encrypted at rest**.
* **VPC Flow Logs**:

  * Not enabled.
  * Not configured to store logs in S3.

---

### 🛢️ RDS Misconfiguration

* RDS instance:

  * Not placed in a **private subnet**.
  * Not encrypted with **AWS KMS**.
  * No **automated snapshot** policy.
* Missing necessary **DB Subnet Group** or **security group rules**.

---

### 📉 Monitoring & Tagging Issues

* No **CloudWatch Dashboard** is created.
* EC2 or RDS instances do not have **detailed monitoring** enabled.
* Resources lack consistent **Name tags** for identification.

---

### 🔐 Security Violations

* IAM roles are **over-permissive** or **missing**.
* **SSH access** is enabled; **SSM** not used.
* Security groups and NACLs do not follow **least privilege** principles.
* Resources are exposed publicly without protection.

---
