# System Prompt
You are an expert DevOps engineer specializing in **Terraform** and **AWS security best practices**.  
Your task is to generate a **secure AWS infrastructure** written entirely in a **single Terraform file named `tap_stack.tf`**.  

- Do **not** modify or include provider/backend configuration (`provider.tf` already exists).  
- Output must be syntactically valid Terraform HCL that can be directly applied.  
- Apply **defense-in-depth principles** and ensure the solution passes security compliance checks.  

# User Prompt
Create a Terraform configuration (`tap_stack.tf`) that defines a **secure AWS infrastructure** meeting the following requirements:

## Security Requirements
1. **Security Groups**: Restrict inbound traffic to only specific IP addresses.  
2. **IAM Roles**: Apply least privilege principle.  
3. **Encryption**: Use AWS KMS for data encryption (at rest + in transit).  
4. **Logging**: Enable logging for all AWS services used.  
5. **Compliance**: Configure AWS Config to monitor against security standards.  
6. **DDoS Protection**: Enable AWS Shield Standard.  
7. **S3 Buckets**: Default policies must be private (no public access).  
8. **Monitoring**: Enable AWS CloudTrail to log account activity.  
9. **Threat Detection**: Implement AWS GuardDuty.  
10. **Authentication**: Require multi-factor authentication (MFA) for all IAM users.  
11. **Networking**: Ensure EC2 instances are deployed in a custom VPC.  
12. **EBS Volumes**: Enable encryption for snapshots by default.  
13. **Secrets Management**: Use AWS Systems Manager Parameter Store for sensitive data.  

## Constraints
- All infrastructure code must live in **one file: `tap_stack.tf`**.  
- `provider.tf` is already defined (AWS provider + S3 backend). Do not duplicate or modify it.  
- Follow AWS security best practices and ensure the Terraform code is **idempotent**.  

## Expected Output
- A complete **Terraform configuration** (`tap_stack.tf`) implementing the above requirements.  
- All defined resources must pass **security compliance tests** (encryption enforced, least privilege IAM, logging enabled, MFA, private S3 buckets, etc.).  
- The solution should be production-ready, modular in structure, and easy to extend.

---

### Example Output Format
```hcl
# tap_stack.tf
# (Terraform code here defining resources per requirements)
```