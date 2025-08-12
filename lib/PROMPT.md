# Prompt: Generate Terraform HCL (`secure_compliant_infra.tf`)

You are an expert Terraform engineer with 10+ years of experience. Your task is to generate a **Terraform HCL configuration file** named `secure_compliant_infra.tf` that meets the **exact requirements** listed in the "Provided Data" section.  
**Do not modify, remove, or reword any part of the Provided Data** — it is immutable and must be used exactly as given.

---

## PROVIDED DATA (IMMUTABLE – DO NOT ALTER)

**Constraints:**

Use only Terraform version 1.3.0 or above.  
Ensure all AWS resources are tagged with `Environment` and `Project`.  
Implement IAM roles to comply with least privilege principle.  
Restrict SSH access to the EC2 instances to IP address `203.0.113.0/24`.  
Enable encryption at rest for all databases.  
Use AWS Key Management Service (KMS) for managing encryption keys.  
Ensure that no security group allows unrestricted ingress traffic on port 22.  
Deploy resources across two AWS regions for high availability: `us-west-1` and `us-east-1`.  
Log all API requests made to AWS services using AWS CloudTrail.  
Create an S3 bucket for storing CloudTrail logs with all access logs enabled.  
Implement AWS WAF rules to protect against SQL injection attacks.

---

**Environment:**

You are tasked with setting up a secure AWS infrastructure using Terraform that adheres to the following specifications:

1. Make sure all AWS resources are tagged with `Environment` and `Project` to facilitate resource tracking and billing.  
2. Implement IAM roles that follow the least privilege principle.  
3. Restrict SSH access to EC2 instances to the specific IP address range `203.0.113.0/24`.  
4. Enable encryption at rest for all databases using AWS KMS for managing encryption keys.  
5. Ensure that no security group permits unrestricted ingress traffic on SSH port 22.  
6. Deploy all resources across two AWS regions, `us-west-1` and `us-east-1`, for redundancy and high availability.  
7. Utilize AWS CloudTrail to log all API requests made to AWS services.  
8. Store CloudTrail logs in an S3 bucket with all access logs enabled to monitor access patterns.  
9. Implement AWS WAF to create rules that protect against SQL injection attacks that may threaten web application components.

---

**Expected Output:**  
Write a valid Terraform HCL file named `secure_compliant_infra.tf` that defines the configurations meeting all the above requirements.  
Ensure the Terraform code is verified, region-aware, and deployable without any manual modifications.  
The configuration must pass `terraform validate` and work successfully with `terraform plan` and `terraform apply`.  
All AWS accounts and both specified regions must reflect the intended design.

---

**Proposed Statement:**  
The infrastructure is built for a secure, multi-region web application running in `us-west-1` and `us-east-1`. All resources follow strict tagging conventions using project-based prefixes and environment identifiers (e.g., `webapp-dev-*` or `webapp-prod-*`) and are deployed in accordance with AWS security best practices.

---

## GENERATION RULES

1. Output only the **Terraform HCL file** for `secure_compliant_infra.tf`.  
2. Use **Terraform v1.3.0+** syntax.  
3. Include **variables** for configurable values:  
   - VPC CIDRs  
   - Allowed IP ranges for SSH (must default to `203.0.113.0/24`)  
   - Project name  
   - Environment name  
4. Implement:  
   - Secure **VPC** and **subnets** in both regions  
   - **Security groups** that do NOT allow unrestricted port 22 access  
   - **EC2 instances** with restricted SSH and proper tags  
   - **IAM roles** with least privilege policies  
   - **Encrypted RDS instances** using **AWS KMS**  
   - **CloudTrail** with log delivery to an **S3 bucket with access logging enabled**  
   - **AWS WAF** with SQL injection mitigation rules  
5. Tag all resources with `Project` and `Environment`.  
6. Use `terraform validate`-compliant syntax with outputs and modules if needed.  
7. All configurations must work seamlessly across `us-west-1` and `us-east-1`.  
8. Ensure the code is **modular**, **production-ready**, and **fully automated**.