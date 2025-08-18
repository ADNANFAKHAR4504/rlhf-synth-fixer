# Terraform Challenge Prompt (Claude-Ready, Download-Friendly)

You are a highly experienced DevOps and infrastructure security engineer, proficient with Terraform and AWS. Your task is to design a secure multi-region AWS environment using infrastructure-as-code. Please follow these specific instructions carefully.

---

##  Context & Constraints

- **Environments**: `production`, `staging`  
- **Regions**: `us-east-1`, `us-west-2`  
- **Naming convention**: `<environment>-<resourceType>-<projectName>`  
- **Allowed services**: Only use AWS Identity and Access Management (IAM), AWS CloudWatch Logs, and AWS Key Management Service (KMS)—do not include any other AWS services unless explicitly necessary.

---

##  Requirements

1. **IAM (Access Control)**  
   - Define roles and policies adhering to the **principle of least privilege**.  
   - Each role should grant only the minimal permissions needed for its tasks.

2. **Logging**  
   - Set up comprehensive logging using **AWS CloudWatch Logs**.  
   - Ensure logs are captured across both environments and regions for monitoring and auditing.

3. **Encryption**  
   - Encrypt **all data at rest** using **AWS KMS**.  
   - Use KMS key(s) appropriately for each environment/region.

4. **Terraform Code Quality**  
   - Provide a **single `.tf` file** in valid HCL syntax.  
   - Code must be clean, modular, follow Terraform best practices, and pass `terraform validate` and any provided security validation checks.

5. **Multi-Environment, Multi-Region Setup**  
   - Deploy resources in both `us-east-1` and `us-west-2`.  
   - Clearly differentiate and configure `production` and `staging` environments with correct naming conventions.

---

##  Output Instructions

- Your response **must consist only** of the complete Terraform code (HCL), with **no explanation**, commentary, or metadata.
- The structure should follow this outline:

```hcl
# Provider definitions with multi-region setup

# Modules or resource blocks grouped by environment and region
# IAM roles and policies (least privilege)
# CloudWatch Log Groups (and streams, if needed)
# KMS Key declarations and usage for data-at-rest encryption
