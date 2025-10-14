# Prompt: Secure & Compliant AWS Infrastructure (Terraform – tap_stack.tf)

You are an **expert Terraform and AWS Infrastructure Engineer** with deep knowledge of **security, compliance, and infrastructure as code (IaC)** best practices.  
Your goal is to generate a **production-ready Terraform configuration (`tap_stack.tf`)** that securely deploys AWS resources across multiple environments (development, staging, and production) while enforcing organizational compliance.

---

## Scenario

An organization is moving to a **multi-account, multi-region AWS setup** and wants to codify all of its security configurations and infrastructure policies in Terraform (HCL).  
Your job is to design a **secure, compliant, and auditable AWS environment** — focusing on **S3, IAM, CloudTrail, RDS, Lambda, EC2, API Gateway, and WAF** — ensuring that every component aligns with AWS best practices.

---

## Key Requirements (Weave These Into the Scenario Naturally)

- **S3 Security & Compliance**  
  - All S3 buckets must be **non-public**, versioned, and **encrypted using AWS KMS (SSE-KMS)**.  
  - Bucket policies should **deny access from all IPs except the organization’s allowed ranges**.  
  - Each bucket must have **tags**: `Environment`, `Owner`, and `CostCenter`.

- **IAM Hardening**  
  - IAM roles must include **IP-based access restrictions** using condition blocks.  
  - Policies should follow **least privilege** principles.

- **Audit & Monitoring**  
  - **AWS CloudTrail** must be enabled **across all regions** for comprehensive API activity logging.  
  - Configure **alarms** for **failed login attempts** or other suspicious actions.  
  - **AWS WAF** should have logging enabled to monitor rule activity.

- **Compute & Database Layers**  
  - **EC2 instances** must use **the latest AMIs** and should be **tagged appropriately**.  
  - **RDS instances** must **not be publicly accessible**, and all connections should **enforce SSL**.  
  - **Redshift clusters** must enforce **encryption at rest and in transit**.  
  - **Lambda functions** must run **inside a VPC** with restricted subnet access and **concurrency limits** defined.

- **Network & API Security**  
  - **API Gateway endpoints** must use **IAM authorization**.  
  - **AWS Shield Advanced** must protect **CloudFront distributions**.  
  - **Logging and metrics** should be configured for all WAF and CloudFront activities.

---

## Expected Outcome

Produce a **single Terraform file (`tap_stack.tf`)** that:

- Creates all required AWS resources using **HCL**, without provider or backend blocks.  
- Is **region-agnostic** but suitable for multi-region deployment.  
- Ensures **connectivity and reliability** between services (e.g., Lambda ↔ VPC ↔ RDS, API Gateway ↔ Lambda).  
- Adheres to **security, tagging, and compliance** requirements above.  
- Passes automated validation and integration tests for configuration correctness and live AWS connectivity.

---

## Writing Style & Tone

The generated prompt should:
- Read as if written by a real **DevOps or Cloud Security Engineer**.  
- Flow naturally — **no bullet list repetition** of constraints; instead, **weave requirements** into an architectural story.  
- Maintain a **professional yet conversational tone** that provides enough technical clarity for another AI or engineer to generate **fully functional, secure Terraform code**.

---

**Subject Label:** _Security Configuration as Code_  
**Background Context:** Security configuration as code ensures that policies and controls are versioned, reviewed, and consistently applied across all environments.
