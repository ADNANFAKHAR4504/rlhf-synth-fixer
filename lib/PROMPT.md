## Prompt: Secure Logging Infrastructure with Terraform (HCL)

**Role**  
You are an expert in cloud security infrastructure.

**Objective**  
Design a Terraform configuration (written in HCL) that establishes a secure logging environment on AWS.

**Requirements**  
- Use an AWS S3 bucket to store logs securely, ensuring encryption both **in transit** and **at rest**.  
- Implement IAM roles and policies following the **principle of least privilege** to restrict access to the S3 bucket.  
- Ensure the Terraform configuration includes a check to determine if the S3 bucket already exists, preventing accidental overwrites.  
- Enable **versioning** for resources to facilitate safe updates and rollbacks.  
- Incorporate a **monitoring solution** (such as AWS CloudWatch) that tracks and alerts on unauthorized access attempts.  
- Enforce **multi-factor authentication (MFA)** for any IAM user with write access to the S3 bucket.

**Additional Context**  
- Target region: **us-east-1**.  
- Naming conventions: All resources must be prefixed with `corpSec-`.

**Expected Output**  
A complete Terraform configuration in HCL that satisfies all of the above constraints. The solution must be fully functional, applicable without errors, and ready to deploy successfully.

---

