## Secure Terraform Stack: IAM Least Privilege for Sensitive S3 Buckets & Remote State Management

### Problem Statement

You are tasked with building a robust, secure AWS infrastructure using Terraform. The goal is to enforce least privilege access on sensitive S3 buckets and ensure secure, reliable Terraform state management using AWS services. The solution should be fully modular and self-contained, designed for a brand new stack deployment in the `us-east-1` region, following AWS and Terraform best practices.

#### Requirements

1. **IAM Least Privilege for Sensitive S3 Buckets**
- Create S3 buckets intended for sensitive data storage.
- Implement IAM policies that grant access **only to designated AWS roles and users**.
- Policies must follow the principle of least privilegedeny all except explicit permissions to specific entities.
- No policy should allow public access or broad AWS principal access.
- All necessary IAM users/roles must be defined within the Terraform configuration.

2. **Remote Backend for Terraform State Management**
- Configure a remote backend using AWS S3 for storing Terraform state files.
- Use DynamoDB for state locking and consistency.
- All backend resources (S3 bucket, DynamoDB table) must be created and managed by Terraform within the same stack.
- Ensure the S3 backend bucket has strict access controls similar to sensitive data buckets.

3. **Modular, Self-contained Configuration**
- All logic, resource definitions, variable declarations, and outputs are placed in a single file: `tap_stack.tf`.
- Do **not** reference any pre-existing modules or resourceseverything must be created from scratch.
- Variables must be declared with sensible defaults and example values.
- Outputs should reveal IDs, ARNs, and key resource attributes for verification.

4. **Region & Security Best Practices**
- All resources must be deployed in `us-east-1`.
- Avoid hardcoding sensitive values.
- Use Terraform data sources and resource referencing to link components securely.

#### Expected Output

- A single `tap_stack.tf` Terraform file containing:
- Variable declarations (with example values)
- Complete resource definitions (IAM, S3, DynamoDB, etc.)
- IAM policy logic for least privilege
- Remote backend setup logic
- Relevant outputs for validation
- The configuration must be validated using `terraform plan`no access or misconfiguration errors should occur.

#### Instructions for Implementation

- Do **not** split code into multiple fileseverything goes in `tap_stack.tf`.
- Assume `provider.tf` already exists for AWS provider configuration.
- Comments should explain best practices and logic choices.
- The stack must be ready for deployment in a new AWS account/environment.

---