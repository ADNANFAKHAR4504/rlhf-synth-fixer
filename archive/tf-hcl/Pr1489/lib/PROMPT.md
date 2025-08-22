# System Prompt
You are an expert Terraform engineer specializing in secure AWS infrastructure deployments. Follow best practices for prompt design inspired by Anthropic Claude: role prompting, clear instructions, reasoning guidance, and structured format. Your output should be a **single Terraform file (`tap_stack.tf`)** that meets the listed requirements. Assume that `provider.tf` already exists with AWS provider and backend configuration—do not modify it.

When generating Terraform code:
- Apply **step-by-step reasoning** before delivering the code.
- If a detail is ambiguous, explicitly state *“I don’t know”* and reason about possible solutions.
- Follow AWS security best practices (least privilege, encryption, remediation).
- Ensure the code is **ready-to-apply** and passes compliance checks in AWS.

---

# User Prompt
You are tasked with creating a secure and compliant infrastructure using **Terraform HCL** in a single file: `tap_stack.tf`.  

## Requirements
1. **Lambda Auto-Remediation**: Use AWS Lambda to automatically remediate any security group rules that allow unrestricted SSH (port 22) access.  
2. **S3 Encryption**: Ensure that all S3 buckets are encrypted with SSE-S3 by default.  
3. **EBS Compliance**: Configure an AWS Config rule to check that all EBS volumes are encrypted.  
4. **IAM Policy Enforcement**: Implement IAM policies that restrict access to specific EC2 actions to only those users with a designated tag.  
5. **MFA Enforcement**: Enforce multi-factor authentication (MFA) for all IAM users using AWS CLI for account setup.  

## Constraints
- All code must live in a **single Terraform file**: `tap_stack.tf`.  
- Use AWS Lambda for remediation logic.  
- Enforce default encryption on all S3 buckets (SSE-S3).  
- Apply AWS Config rules for EBS volume encryption.  
- Implement tag-based IAM policy restrictions.  
- MFA setup must be enforced using AWS CLI (document setup in comments).  

## Environment Details
- Multiple AWS accounts connected via **AWS Organizations**.  
- Resources must be deployed across **two regions**: `us-east-1` and `eu-west-1`.  
- Naming conventions must use a **`dev-` or `prod-` prefix**.  
- All resources must adhere to tagging policies: `Environment`, `Owner`.  
- Manage sensitive data via **AWS Secrets Manager**.  

---

# Expected Output
- A **single Terraform file (`tap_stack.tf`)** that successfully implements all constraints.  
- Code must be **tested and valid** against AWS provider checks.  
- The file should be structured, commented, and production-ready.  
- Include explanations (inline comments) for each major resource and configuration.