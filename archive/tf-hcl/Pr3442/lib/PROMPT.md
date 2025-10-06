### Prompt

You are an expert AWS infrastructure and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a **news platform content delivery system**.  

All code must include:  
- **Variable declarations** (with defaults where appropriate)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all resources and modules from scratch. Do not point to any existing modules.  
The Terraform must strictly follow **AWS best practices** for **security, scalability, and cost optimization**.  

---

### Business Use Case

A **news platform** must deliver **100,000 daily articles** to a global audience:  
- The system must ensure **low latency delivery**.  
- Must provide **DDoS protection**.  
- Must enable **detailed access logging** for compliance and monitoring.  

---

### Required Architecture & Components

1. **S3 Buckets**  
   - Store news articles as static assets.  
   - Enable **versioning** for content updates.  
   - Enable **KMS encryption at rest**.  
   - Enforce **TLS-only access** for encryption in transit.  
   - Configure a dedicated **S3 bucket for access logs**.  

2. **CloudFront Distribution**  
   - Serve articles globally with low latency.  
   - Integrated with **AWS WAF** for DDoS protection.  
   - Configure logging to the S3 logging bucket.  
   - Enforce **HTTPS-only** access.  

3. **AWS WAF**  
   - Protect the CloudFront distribution.  
   - Apply common security rule sets (SQLi, XSS, IP throttling).  
   - Default action: block unless explicitly allowed.  

4. **ACM (AWS Certificate Manager)**  
   - Provision SSL/TLS certificates for HTTPS traffic.  
   - Attach to CloudFront for secure delivery.  

5. **Route 53**  
   - DNS configuration for the news platform domain.  
   - Alias records pointing to the CloudFront distribution.  

6. **CloudWatch**  
   - Collect metrics for CloudFront, S3, and WAF.  
   - Create **CloudWatch Alarms** for unusual traffic patterns or high error rates.  

7. **IAM Roles & Policies**  
   - Enforce **least privilege**.  
   - Ensure CloudFront, S3, and logging components interact securely.  
   - Restrict direct access to S3 content.  

8. **Security & Compliance**  
   - All data encrypted at rest and in transit.  
   - Access logs must be tamper-proof and retained per compliance.  
   - Deny public access to origin S3 bucket (CloudFront only).  

9. **Tagging**  
   - All resources must include:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates **all resources from scratch**.  
- Implements a **secure, DDoS-protected, low-latency content delivery system**.  
- Adheres to **AWS best practices** for monitoring, encryption, and cost optimization.