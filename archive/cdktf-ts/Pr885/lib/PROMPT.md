**Act as an expert DevOps engineer** specializing in Infrastructure as Code with Terraform and AWS. 
You will write code in **TypeScript** using AWS CDK for Terraform (CDKTF). 
The code must be organized into **two files only**:

1. **`modules.ts`** 
- Define all Terraform AWS resources here as reusable, well-structured modules. 
- Each major component (S3, IAM, RDS, networking, etc.) should be modularized. 
- Include descriptive comments explaining each resources purpose and configuration.

2. **`tap-stack.ts`** 
- Instantiate all modules from `modules.ts`. 
- Pass environment-specific variables (e.g., `env`, `owner`, `costCenter`). 
- Export all outputs here only. 
- Ensure no hardcoded secrets; use variables or external references.

---

**Requirements:**
- **Region:** Must be an AWS region supporting **at least 3 Availability Zones** (e.g., `us-east-1`, `us-west-2`). 
- **Tags:** All resources must include `Environment`, `Owner`, and `CostCenter`. 
- **S3:**
- Create an S3 bucket for application logs.
- Enable **versioning**.
- Follow naming conventions that reflect the environment.
- **IAM:**
- Implement an IAM role for EC2 instances.
- Follow **principle of least privilege** for policies.
- **RDS:**
- Provision an RDS instance with:
- Automated backups enabled.
- Multi-AZ deployment for high availability.
- **Scalability:**
- Design infrastructure to be scalable for future expansion.
- Use modular code to allow adding more resources later without refactoring.
- **Best Practices:**
- Follow Terraform v1.1.0+ and AWS best practices.
- No hardcoded credentials or secrets.
- Use comments to document purpose and functionality.
- Ensure `terraform validate` and `terraform plan` run without errors.

---

**Deliverables:**
- `modules.ts` - All resource/module definitions with production-ready configurations.
- `tap-stack.ts` - Module instantiation, backend configuration, and all outputs.
- Code must be **clean, modular, reusable**, and compliant with AWS and Terraform standards.

---

**Expectations:**
- Use CDKTF TypeScript conventions with proper imports and type safety.
- Ensure modularity for scalability and maintenance.
- Provide clear, descriptive inline comments explaining the reasoning for each configuration choice.