**Act as an expert DevOps engineer** specializing in Infrastructure as Code with Terraform and AWS. 
You will write code in **TypeScript** using AWS CDK for Terraform (CDKTF). 
The code must be organized into **two files only**:

1. **`modules.ts`** 
- Define all Terraform AWS resources here as reusable modules. 
- Each major infrastructure component (VPC, subnets, security groups, EC2, RDS, IAM roles, S3, etc.) should be modularized for reusability and clarity. 
- Include descriptive comments explaining the purpose and functionality of each resource and configuration.

2. **`tap-stack.ts`** 
- Instantiate all modules from `modules.ts`. 
- Pass necessary variables. 
- Export all required outputs here only. 
- Include remote backend configuration for Terraform state storage in Amazon S3 with DynamoDB table for state locking. 
- Ensure no hardcoded secrets; use variables and environment references.

---

**Requirements:**
- **Region:** `us-east-1` 
- **Tags:** All resources must have `Environment` and `Owner` tags. 
- **Networking:**
- Create one VPC with **two public subnets** and **two private subnets**. 
- Attach an **Internet Gateway** to the VPC for outbound access from public subnets. 
- Deploy **NAT Gateways** (one per public subnet) for outbound access from private subnets. 
- Create route tables for public and private subnets with correct routing rules.
- **Security:**
- Security Group for SSH access (limited to a specified CIDR block). 
- Security Group for HTTP (80) and HTTPS (443) access from anywhere for web servers. 
- IAM roles with least privilege for Terraform execution. 
- No hardcoded credentials in any file.
- **Compute & Storage:**
- RDS instances must be placed **only in private subnets**. 
- EC2 instances with **encrypted EBS volumes**. 
- An S3 bucket for logs with **server-side encryption** enabled.
- **Best Practices:**
- Ensure all resources can be destroyed via `terraform destroy` without manual intervention. 
- Use comments for clarity in all configurations. 
- Encrypt data at rest and in transit where possible.

---

**Deliverables:**
- `modules.ts` All resource/module definitions with production-ready configurations. 
- `tap-stack.ts` Module instantiation, backend configuration, output variables. 
- Code must be **clean, reusable, and compliant with AWS and Terraform best practices**.

---

**Expectations:**
- Follow CDKTF TypeScript coding standards with proper imports, typing, and structure. 
- Make configurations modular for scalability. 
- Provide clear and descriptive inline comments to explain purpose and functionality.