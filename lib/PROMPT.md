**Act as an expert DevOps engineer** specializing in Infrastructure as Code with Terraform and AWS.  
You will write code in **TypeScript** using AWS CDK for Terraform (CDKTF).  
The code must be organized into **two files only**:

1. **`modules.ts`**  
   - Define all Terraform AWS resources here as reusable, production-ready modules.  
   - Each major resource type (VPC, EC2, IAM, S3, RDS, CloudWatch Logs) should be modularized for clarity and reusability.  
   - Include descriptive comments explaining each resource’s purpose, configuration, and security considerations.

2. **`tap-stack.ts`**  
   - Instantiate all modules from `modules.ts`.  
   - Pass environment variables (e.g., EC2 instance type, S3 bucket name, allowed SSH CIDR).  
   - Export all required outputs here only.  
   - Ensure no hardcoded secrets; reference variables instead.  

---

**Requirements:**
- **Region:** All resources must be deployed in `us-east-1`.  
- **S3:**
  - All buckets must use **AES-256 encryption**.  
  - Enable **versioning** to prevent accidental deletion.  
  - Bucket names should be customizable via parameters/variables.  
- **IAM:**
  - Define IAM roles with **least privilege access**.  
- **EC2:**
  - Deploy an EC2 instance with:
    - A **security group** allowing **inbound SSH only** from specified IP CIDRs.  
    - CloudWatch Logs enabled to monitor EC2 activity.  
- **RDS:**
  - Deploy an RDS instance with **encryption at rest** and **automatic backups** enabled.  
  - RDS should be customizable (e.g., DB instance class, allocated storage).  
- **Tagging:**
  - All resources must be tagged with:  
    - `ProjectName`  
    - `Environment`  
- **Customizability:**
  - Use variables to allow customization of key values:
    - EC2 instance type  
    - S3 bucket names  
    - Allowed SSH CIDR(s)  
    - RDS instance type  
- **Best Practices:**
  - Follow AWS security best practices (encryption, least privilege, restricted security groups).  
  - Ensure resources are destroyable with `terraform destroy`.  
  - No hardcoded credentials.  
  - Code must pass `terraform validate` and `terraform plan` checks.  

---

**Deliverables:**
- `modules.ts` → Definitions of all required AWS resources with reusable, well-commented modules.  
- `tap-stack.ts` → Instantiation of modules, variable wiring, and all outputs.  

---

**Expectations:**
- Use **CDKTF TypeScript conventions** with proper imports and type safety.  
- Ensure modularity so future services (e.g., more S3 buckets, new EC2 instances) can be added easily.  
- Provide clear, descriptive comments explaining the purpose of each block of code.  
- Ensure configurations meet **enterprise-grade security and compliance**.