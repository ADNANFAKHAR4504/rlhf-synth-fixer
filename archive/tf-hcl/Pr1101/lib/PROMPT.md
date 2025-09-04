Here's a prompt designed to align with Claude's Sonnet best practices, offering a clear, structured, and comprehensive request for building a secure AWS environment with Terraform.

---

## Secure AWS Environment with Terraform

---

### Objective

As a senior cloud security engineer, your task is to provision a **highly secure environment on AWS** using **Terraform**. This infrastructure must adhere to a strict set of security standards, including tightly-controlled network access, consistent resource tagging for governance, and a secure IAM model for cross-account access. Your configuration will be subject to a rigorous security compliance audit.

---

### Core Architectural Components

The Terraform configuration must define and configure the following AWS services:

- **AWS Security Groups**: A security group that acts as a virtual firewall for your EC2 instances. It must have precise inbound rules to restrict network access.
- **AWS IAM Roles and Policies**: A role with a trust policy that allows secure access from another AWS account, along with a least-privilege permissions policy.
- **AWS EC2 Instance**: A simple EC2 instance to serve as the target for the security group rules and IAM role.
- **Resource Tagging**: A tagging strategy that ensures all deployed resources are correctly labeled for identification and management.

---

### Technical Specifications & Constraints

- **Infrastructure as Code (IaC)**: The entire infrastructure must be defined using **Terraform version 1.0 or higher** in the **HCL** syntax.
- **Configuration Directory**: All configuration files (`.tf`) **must reside within a directory named `secure_env/`**.
- **Network Security**:
- The created **security group** must contain **ingress rules for HTTP (port 80) and HTTPS (port 443) only**.
- These rules must restrict access to a **predefined list of IP ranges** (e.g., your office network's CIDR blocks) and **deny all other inbound traffic** on these ports.
- No other ports should be open to the internet.
- **IAM Cross-Account Access**:
- Implement an **IAM role** with a trust policy that allows a principal from a different AWS account (the "trusted" account) to assume it.
- The permissions policy attached to this role must strictly adhere to the **principle of least privilege**, granting only the minimum necessary permissions to the trusted account to manage resources in this environment.
- **Resource Tagging**:
- All resources deployed by the Terraform configuration **must be tagged** with the following key-value pairs:
- `Environment: Production`
- `Owner: SecurityTeam`

---

### Expected Output

Your response should provide a complete and functional Terraform configuration. The output should be a single block of code containing all the necessary `.tf` files (e.g., `main.tf`, `variables.tf`) with their content nested within the code block.

```terraform
# The content for the secure_env/ directory
# All Terraform files should be presented here, ready for a `terraform init` and `terraform apply`

# main.tf
# ...

# variables.tf
# ...
```
