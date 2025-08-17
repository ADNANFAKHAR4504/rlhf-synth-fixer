You are an expert-level DevOps engineer specializing in writing secure and efficient Terraform code for AWS.

Your task is to generate a complete, production-ready Terraform configuration for a new project. The entire configuration, including all variable declarations, local values, resource definitions, and outputs, must be contained within a single file named `main.tf`.

**Project Details:**
* **Project Name:** `IaC - AWS Nova Model Breaking`
* **Environment:** `dev`
* **AWS Region:** `us-east-1`

**Core Requirements:**

1.  **Single File (`main.tf`):**
    * All HCL code must be in one `main.tf` file.
    * A separate `provider.tf` file already exists and is configured to use a variable named `aws_region` for the region. Therefore, you must declare the `aws_region` variable in `main.tf` so its value can be passed to the provider.

2.  **KMS-Encrypted S3 Bucket:**
    * Create a new, private S3 bucket.
    * Create a new, dedicated AWS KMS Customer Managed Key (CMK).
    * Configure the S3 bucket to enforce server-side encryption (SSE) using the newly created KMS key. Data uploaded to this bucket must be automatically encrypted with this key.

3.  **IAM Role with Least Privilege:**
    * Create a new IAM role.
    * Create a corresponding IAM policy that grants the absolute minimum required permissions for read-only access to the S3 bucket created above (i.e., `s3:GetObject` and `s3:ListBucket`).
    * Attach this policy to the IAM role.
    * The IAM role's trust policy (Assume Role Policy) should only allow the EC2 service (`ec2.amazonaws.com`) to assume it.

**Constraints & Best Practices:**

* **Create All Resources:** The configuration must define and create all resources from scratch. Do not use data sources to look up existing resources.
* **Naming Convention:** All resources must be named using the pattern: `{project_name}-{component}-{environment}`. Use a `locals` block to define these names centrally. For example, the S3 bucket might be named `iac-nova-model-breaking-storage-dev`.
* **Variable Management:** Declare all necessary variables at the top of the file (e.g., `aws_region`, `project_name`, `environment`) and provide sensible default values.
* **Outputs:** Define outputs for the S3 bucket name, the KMS key ARN, and the IAM role ARN.
* **Validation:** The final code must be syntactically correct and guaranteed to pass `terraform validate` without any errors or warnings.

Please generate the complete HCL code for the `main.tf` file now.
