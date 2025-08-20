# Terraform CDK (TypeScript) Project Secure AWS Web Application Infrastructure

You are tasked with setting up a **secure AWS environment using Terraform CDK (TypeScript)** to host a web application. Your configuration must **adhere to AWS Security Best Practices v1.0.0** and be modular, readable, and production-ready.

---

## Security Requirements

### VPC

- Create a **VPC named `secure-network`** in the `us-west-2` region.
- Include:
- Public Subnets
- Internet Gateway
- Route Tables

---

### Network Controls

- **Security Groups**:
- Allow inbound traffic **only on ports 80 (HTTP) and 443 (HTTPS)**.
- Allow all outbound traffic.

- **Network ACLs** (NACLs):
- Restrict traffic in and out of the public subnet following **AWS best practices**.

---

### Compute

- Launch an **EC2 instance** in the **public subnet**.
- Attach the **Security Group** created above.
- Ensure the instance has **public internet access** (via IGW; NAT not required).
- Do **not attach unnecessary IAM permissions**.

---

### Storage (S3)

- Create an **S3 bucket** for storing **web application logs**.
- Enable **Server-Side Encryption** (AES-256 or AWS KMS).
- Restrict **write access** to the EC2 instance only (least privilege).

---

### IAM

- Create an **IAM Role** for the EC2 instance.
- Attach an **IAM Policy** with **minimal access**:
- Only `s3:PutObject` to the log bucket.

---

### Tagging

All AWS resources must be tagged with:

```hcl
Environment = "Production"
