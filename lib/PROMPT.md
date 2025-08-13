# Prompt

Ensure that all IAM roles are created with the least privilege principle in mind. | Use AWS KMS for all data encryption at rest. | All data in transit must be encrypted using TLS 1.2 or higher. | Security groups must be locked down to the minimum required ports and IPs. | No security group should have an allow rule for 0.0.0.0/0 for any port except port 80 and 443. | Implement logging for all AWS services using CloudTrail. | Ensure CloudTrail logs are encrypted using AWS KMS. | Rotate all IAM user passwords every 90 days. | Enforce MFA for all IAM users. | Ensure S3 buckets have server-side encryption using AWS KMS. | Ensure all S3 buckets have versioning enabled. | Apply Terraform's lifecycle policy to prevent accidental deletions of critical resources. | Use Terraform modules to manage complexities and ensure reusability of IAM policies, security groups, and network ACLs.

**Instructions:**

As a DevOps engineer working for a financial services organization, you are tasked with creating a secure AWS infrastructure using Terraform with HCL language. The infrastructure should adhere to best practices for security and compliance. Specifically, you must:

1. Configure IAM roles based on the principle of least privilege.
2. Ensure all data is encrypted both at rest (using AWS KMS) and in transit (using TLS 1.2 or above).
3. Set up security groups to restrict access to necessary ports and IPs only.
4. Implement logging and monitoring across all services via AWS CloudTrail
5. Enforce password rotation every 90 days and use of MFA for all IAM users.
6. Utilize Terraform modules to manage IAM policies, security groups, and network ACLs efficiently.

Expected output: A set of Terraform HCL files that, when applied, deploys an AWS infrastructure complying with the specified security measures. The solution should pass all tests validating the security configurations and resource management practices outlined.


The target infrastructure consists of AWS resources managed through Terraform. Resources are deployed across multiple regions to ensure high availability. The infrastructure must comply with strict security policies suitable for a financial services environment. Naming conventions follow a standard {environment}-{service}-{resource} pattern, e.g., prod-web-server.