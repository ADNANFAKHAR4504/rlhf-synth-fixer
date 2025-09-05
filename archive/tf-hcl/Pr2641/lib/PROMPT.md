---
## Task

Generate the requirements and architectural constraints into Terraform code using HCL syntax.

---

## Requirements

- **Do not** change, omit, or reinterpret any of the requirements listed below.
- Produce Terraform HCL code that implements all security and compliance controls specified.
- Output must be a complete, valid Terraform configuration that is ready to be deployed.
- The produced Terraform code should be suitable for a multi-region AWS environment (us-west-2 region, VPC spanning two AZs, subnets as proposed).
- The final file should be named `secure_infrastructure_setup.tf`.

---

## Background

Security is a critical aspect of any online service. AWS offers several tools and services to ensure compliance and security of infrastructure, and automating these provides a scalable and manageable solution.

---

## Environment

Design and implement security configurations for a multi-region AWS setup using Terraform HCL, following AWS best practices for security and compliance.  
The target environment includes a VPC spanning two availability zones in the us-west-2 region with necessary subnets in each zone.

---

## Implementation Constraints

Your Terraform configuration **must**:

1. Encrypt all Amazon S3 buckets using AWS or customer-managed keys.
2. Create IAM roles to manage cross-account access securely.
3. Monitor configuration changes with AWS Config to ensure compliance.
4. Use VPC security groups to control access to EC2 instances.
5. Capture all management events with AWS CloudTrail.
6. Apply a password policy for IAM users requiring a minimum of 12 characters, including uppercase, numbers, and symbols.
7. Encrypt RDS databases and enable backups.
8. Use Elastic Load Balancing across multiple EC2 instances in various availability zones.
9. Provide DDoS protection with AWS Shield.
10. Enable MFA for all IAM users with console access.
11. Disable public access to all Lambda functions.

---

## Instructions for Output

- **Produce** only the Terraform HCL code.
- Ensure all services and resources comply with the listed constraints.
- The output file must be named `secure_infrastructure_setup.tf`.
- The code must pass Terraform validation and adhere to AWS security best practices.

---

## Expected Output

A valid Terraform HCL configuration, named `secure_infrastructure_setup.tf`, that implements all the requirements above in the us-west-2 region. The configuration should be ready for deployment and must pass all security and compliance checks.