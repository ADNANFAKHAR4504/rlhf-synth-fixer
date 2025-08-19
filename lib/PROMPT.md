I need help creating a secure AWS infrastructure using Terraform HCL. I want to set up a security-focused environment with the following requirements:

1. All S3 buckets must use server-side encryption with AWS KMS customer-managed keys (not the default AWS managed keys)
2. Create IAM roles following least privilege principles for accessing the encrypted S3 buckets
3. Use the naming convention 'myapp-component-environment' for all resources (example: myapp-storage-prod, myapp-role-prod)
4. Deploy everything in the us-east-1 region
5. Include AWS GuardDuty with Extended Threat Detection enabled for enhanced security monitoring
6. Set up Amazon Macie for automated sensitive data discovery and protection on the S3 buckets
7. Make sure the solution passes terraform validate

Please provide the complete Terraform HCL infrastructure code. Each file should be in a separate code block so I can easily copy and paste them. Keep it simple but secure.