# AWS EC2 Security Group Terraform Challenge

## Problem Statement

You are tasked with designing a secure AWS infrastructure using Terraform, focusing specifically on the configuration of inbound security rules for your application servers. The objective is to define a security group that strictly follows best security practices and compliance requirements for controlling inbound network access.

**Requirements:**

- **Security Group Configuration:** 
- Allow inbound traffic **only** on ports 80 (HTTP) and 443 (HTTPS).
- Restrict inbound traffic to **specified IP ranges** for enhanced security (no open access to 0.0.0.0/0 unless explicitly required).
- No other inbound ports should be accessible.

- **Terraform Implementation:** 
- All code must be included in a single `main.tf` file.
- The `main.tf` file must contain:
- All necessary variable declarations (including `aws_region` for provider configuration, as referenced in `provider.tf`).
- Variable default values and example entries for specified IP ranges.
- Security group resource logic matching the above requirements.
- Output definitions to expose relevant information, such as the security group ID.
- Do **not** reference or point to any existing modules or resourcesthis is a brand new stack and all resources must be created from scratch.
- Ensure the configuration follows Terraform best practices for resource naming, variable usage, and output management.

- **Provider Configuration:** 
- The provider configuration is already present in `provider.tf` and utilizes the `aws_region` variable. Ensure the variable is properly declared and managed in `main.tf` for seamless integration.

- **Validation and Testing:** 
- After writing the configuration, apply it in a safe and controlled AWS environment.
- Validate that the security group is created with the expected inbound rules and restricted access.
- Ensure the setup is compliant with best security practices and AWS recommendations.

---

## Deliverable

- Submit a **complete Terraform configuration in `main.tf`** that:
- Declares all required variables.
- Implements the security group resource logic as described.
- Specifies example values for IP ranges using variables.
- Includes outputs for the created resources.
- The configuration must be self-contained and ready to deploy as a new stack (excluding the existing provider information in `provider.tf`).

---

## Notes

- The solution must be clean, well-structured, and easy to understand.
- Use descriptive variable names and add comments where necessary to clarify logic.
- Ensure that no resources or modules are referenced from outside the configuration; everything should be created within `main.tf`.