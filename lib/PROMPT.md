Refined User Prompt:

I need a complete Terraform configuration in a single main.tf file to securely provision AWS S3 buckets and IAM roles for a production environment in the us-east-1 region. The configuration must satisfy these conditions and best practices:

    File Structure & Variables
        All code (resource definitions, variable declarations, default values, logic, and outputs) must reside in main.tf.
        I already have a separate provider.tf file with provider configuration, and it uses an aws_region variable for the region value. Ensure main.tf declares and uses this variable properly (do not hard-code the region).
    Stack Creation
        The main.tf should provision all resources required for a secure, production-ready stack from scratch. Do not reference or import any pre-existing modules or resources; everything should be created new within this configuration.
    S3 Bucket Security
        Every S3 bucket must be encrypted at rest using AES-256 (SSE-S3).
        Implement bucket policies and configuration to prevent public access and ensure secure permissions.
    IAM Policy Best Practices
        Define IAM roles and policies following the principle of least privilege, granting only necessary permissions to access S3 resources.
        Policies must be tightly scoped and should not allow wildcards or unnecessary actions.
    Outputs
        Provide appropriate outputs for key resources (e.g., bucket names, IAM role ARNs) for integration and visibility.
    Best Practices
        Follow AWS and Terraform security best practices throughout (e.g., block public access, use resource tags, clearly comment logic).
        The configuration must be suitable for production and pass standard AWS security unit tests.

Expected Output:
A single, well-structured main.tf file that meets all the above requirements and is ready to deploy a secure AWS stack for S3 and IAM using Terraform.