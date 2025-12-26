# Prompt for Terraform HCL AWS Infrastructure

## Task Overview:

Your task is to define a secure AWS environment using Terraform, ensuring best practices in resource access and data encryption across relevant services.

### Objective:

Create a secure AWS environment for a web application hosting use case using Terraform HCL. This solution should meet all specified security requirements and be deployable using a single Terraform configuration file, with no external modules.

## Requirements:

1. **Define Infrastructure Using Terraform HCL**
   - Implement all resources directly in main.tf or tap_stack.tf without using external modules.
   - The variable aws_region should be declared in main.tf or tap_stack.tf and passed to provider.tf.

2. **S3 Bucket Encryption with AWS KMS**
   - Secure all S3 buckets using AWS Key Management Service for encryption.

3. **IAM Roles and Policies**
   - Use IAM roles and policies that follow the principle of least privilege.
   - Ensure appropriate access restrictions are applied to resources based on roles.
   - Specify exact ARNs for all resources - no wildcards allowed.
   - List specific permissions needed - no blanket access patterns.

4. **Security Groups Configuration**
   - Configure security groups to allow only incoming traffic over HTTPS on port 443.

5. **Encryption in Transit**
   - Ensure that all data communications between AWS services like EC2 and RDS are encrypted in transit.

6. **CloudWatch Alarms**
   - Set up CloudWatch alarms to monitor and alert on unauthorized access attempts or IAM policy violations.

## Constraints and Best Practices:

1. **Use of Terraform HCL**
   - Use Terraform HCL to define all the infrastructure. Do not use external modules.
   - The provider block should remain in provider.tf.

2. **Security Configurations**
   - Use AWS KMS to encrypt S3 buckets.
   - Implement IAM roles and policies with least privilege access - specify exact ARNs and permissions.
   - Enforce HTTPS traffic only via security groups on port 443.
   - Enforce encryption in transit for communications between AWS services.
   - Create CloudWatch alarms for unauthorized access and IAM policy violations.

3. **Outputs for CI/CD and Testing**
   - The Terraform configuration should emit useful outputs for integration with CI/CD pipelines and testing. Outputs should not include secrets.

4. **Terraform File Structure**
   - **Variables**: Declare the necessary variables like aws_region in main.tf or tap_stack.tf.
   - **Resources**: Define all AWS resources such as S3 buckets, IAM roles, and security groups directly in main.tf or tap_stack.tf.
   - **Outputs**: Emit useful outputs for CI/CD integration and testing.
   - **No secrets in outputs**: Avoid including any sensitive information in outputs.

5. **Non-Negotiables**
   - Keep all Terraform logic in lib/main.tf or lib/tap_stack.tf.
   - The provider.tf file already exists and contains the AWS provider and S3 backend.
   - Do not include a provider block in main.tf.
   - Do not use any external Terraform modules; resources must be defined directly in main.tf or tap_stack.tf.
   - Ensure that integration tests do not trigger terraform init/plan/apply during the test case execution stage.

## Expected Output:

A complete Terraform configuration file that:

- Defines all required infrastructure resources.
- Implements security measures according to the best practices outlined.
- Is ready for deployment and validation.
- Includes the necessary outputs for CI/CD and testing, without exposing sensitive information.

Please provide the Terraform configuration code that satisfies these requirements and best practices.
