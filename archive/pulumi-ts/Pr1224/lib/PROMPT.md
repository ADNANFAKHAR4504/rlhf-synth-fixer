I need to build a secure, region-agnostic AWS infrastructure using Pulumi with TypeScript. The setup needs to be modular, production-ready, and must follow AWS security best practices. Here are the components I need:

1. Define all resources to be region-agnostic by supporting configurable provider inputs (such as through Pulumi stacks or config values).
2. Use AWS Key Management Service (KMS) to encrypt sensitive data stored across all supported services.
3. Implement IAM roles and policies that strictly follow the principle of least privilege.
4. Configure all S3 buckets with server-side encryption enabled using AWS-managed or customer-managed KMS keys.
5. Provision RDS instances with encryption enabled and automatic backups configured.
6. Ensure all EC2 instances use encrypted EBS volumes for storage.
7. Limit use of public IP addresses for EC2 instances only allow when absolutely necessary and fully justified.
8. Avoid assigning key pairs to EC2 instances unless explicitly required.
9. Set up security groups to only allow minimal and necessary ingress/egress traffic.
10. Apply resource tagging consistently with the keys: `Environment`, `Owner`, and `Project`.
11. Enable logging for every AWS service that supports it, including S3, RDS, EC2, and IAM where applicable.

Please provide the Pulumi TypeScript code that represents this configuration using modern Pulumi best practices. The code must be modular, reusable, and capable of deployment across multiple AWS regions with secure defaults. Avoid boilerplate focus solely on the infrastructure logic.
