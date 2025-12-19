### Prompt

You are an expert AWS infrastructure and security engineer specializing in Terraform.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a **legal firm’s storage system**.  

All code must include:  
- **Variable declarations** (with defaults where needed)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all resources and modules from scratch. Do not point to any existing modules.  
The Terraform logic must strictly follow **AWS best practices** for **security, compliance, and cost efficiency**.  

---

### Business Use Case

A **legal firm** must store **10,000 daily documents** while meeting compliance and audit requirements:  
- Documents must support **versioning**.  
- The system must enforce a **90-day retention policy**.  
- Access to documents must be **restricted and logged**.  
- **Audit trails** must be available for regulatory compliance.  

---

### Required Architecture & Components

1. **S3 Bucket**  
   - Primary storage for documents.  
   - **Versioning enabled** to maintain history of changes.  
   - **Lifecycle policies** to enforce **90-day retention**.  
   - **KMS encryption at rest** for all objects.  
   - Enforce **TLS-only access** for encryption in transit.  

2. **IAM Policies & Roles**  
   - Restrict access to authorized roles only.  
   - Apply **least privilege** principle.  
   - Separate read/write roles if necessary.  

3. **CloudTrail**  
   - Enable access logging for all S3 operations.  
   - Store logs in a dedicated, encrypted S3 bucket.  

4. **CloudWatch Monitoring**  
   - Enable bucket-level metrics.  
   - Create **alarms** for unusual access patterns or error spikes.  

5. **Security & Compliance**  
   - All data encrypted **in transit and at rest**.  
   - Logging and auditing must be tamper-proof and retained per compliance standards.  
   - Ensure **bucket policies** explicitly deny public access.  

6. **Tagging**  
   - All resources must include:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates **all resources from scratch**.  
- Implements **secure, compliant, and auditable storage** for the legal firm.  
- Adheres to **AWS best practices** for compliance, encryption, and monitoring.