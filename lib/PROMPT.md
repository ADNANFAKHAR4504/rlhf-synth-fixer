You are asked to **optimize and restructure an existing CDKTF configuration** so that it supports a secure and scalable AWS infrastructure across multiple environments (development, staging, and production). The solution must be built with a **reusable design** to ensure long-term maintainability and monolithic approach with all code in one file.

The following requirements must be met:

1. Use **CDKTF** to define AWS infrastructure in a way that can be applied across different environments.
2. Leverage **input variables (context values)** in CDKTF to customize resource configuration per environment (e.g., VPC CIDRs, instance sizes, tags).
3. Define **outputs** to expose useful information such as VPC IDs, subnet IDs, RDS endpoints, and S3 bucket names after deployment.
4. Implement **CDKTF/Terraform built-in functions** (e.g., validations, conditionals, and computed values) to improve reliability, catch misconfigurations early, and prevent deployment errors.

Expected Output

Provide a **CDKTF TypeScript configuration** that implements the above requirements. The code should:

- Be reusable, secure, and easy to extend across environments.
- Pass validation (`cdktf synth` and `terraform validate`) without errors.
- Successfully deploy working infrastructure in AWS for **development**, **staging**, and **production**.

Constraints Items:

- Must use **CDKTF** for reusability and maintainability.
- Must leverage **CDKTF input variables and outputs** for configuration management.
- Must use **validations and built-in functions** to minimize deployment errors.
