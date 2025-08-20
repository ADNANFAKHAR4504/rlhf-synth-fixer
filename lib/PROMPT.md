I need your help drafting a Terraform configuration for a new, highly secure AWS infrastructure designed to host a critical financial application. Think of this as a foundational setup for a multi-account, multi-region environment (specifically `us-east-1` and `us-west-2`) where security and compliance are the top priorities.

Your task is to create a single, comprehensive Terraform configuration file named `tap_stack.tf`. This file should be self-contained, including all variable declarations, locals, resources, and outputs. Please build all resources directly without using any external modules, as we're starting this stack from scratch.

Here are the key security controls we need to bake into the infrastructure:

1.  **VPC Foundation:**
    * Deploy all compute resources, specifically EC2 instances, within a secure VPC to ensure network isolation.

2.  **Default-Deny Network Access:**
    * All security groups must block inbound traffic by default. Only create explicit `ingress` rules for necessary traffic, adhering to the principle of least privilege.

3.  **Data Encryption at Rest:**
    * **S3 Buckets:** Ensure all S3 buckets are encrypted by default using AES-256.
    * **RDS Databases:** Provision RDS database instances with storage encryption enabled, using a customer-managed AWS KMS key.

4.  **Identity and Access Management (IAM):**
    * Create IAM roles with policies that strictly enforce the use of Multi-Factor Authentication (MFA) for any critical actions, especially for making changes to IAM policies or accessing the AWS Management Console.

5.  **Comprehensive Logging:**
    * For any API Gateway stages you define, enable detailed access logging to monitor all requests and troubleshoot issues effectively.

6.  **Vulnerability Management:**
    * Set up AWS Systems Manager Patch Manager to automatically scan our EC2 instances for insecure configurations and vulnerabilities. This should include creating the necessary IAM roles and SSM associations.

**Configuration Guidelines:**

* **Single File:** All code must be in `./tap_stack.tf`.
* **Best Practices:** Follow AWS and Terraform best practices diligently. This means least-privilege IAM policies, encryption everywhere possible, secure security group rules, and consistent resource tagging (e.g., with `Project`, `Environment`, `Owner`).
* **Outputs:** Define useful outputs that would be needed for a CI/CD pipeline or for testing, but be careful not to expose any secrets.
* **Provider Setup:** Assume a standard `provider.tf` is in place. You just need to include the `variable "aws_region" {}` declaration in your `tap_stack.tf` file.

The final output should be a clean, well-commented, and production-ready Terraform file that stands up this secure environment when `terraform apply` is run.
