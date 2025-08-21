## Prompt: Secure AWS Infrastructure with Terraform
I want a complete Terraform configuration for AWS written in a **single main.tf file** (do not include provider configuration I already have provider.tf set up)
I am designing and implementing a **secure AWS cloud environment** using Terraform, adhering to advanced security and compliance best practices.

### Requirements
1. **IAM Roles & Policies** Implement roles and policies strictly following the principle of least privilege.
2. **S3 Bucket Encryption** All S3 buckets must use server-side encryption with AWS-KMS.
3. **VPC Design** Create VPCs with both public and private subnets, ensuring that sensitive resources are only placed in private subnets.
4. **Network Restrictions** Configure Security Groups and NACLs to block all public access unless explicitly allowed.
5. **Instance Profiles** Attach appropriate IAM instance profiles with correct permissions to all compute resources.
6. **Modular Terraform Structure** Organize configuration into Terraform modules separated by functionality.
7. **Terraform Backend** Store Terraform state in an S3 bucket with state locking enabled via DynamoDB.
8. **CloudTrail Logging** Enable AWS CloudTrail to log all API calls into a secure, encrypted S3 bucket.
9. **Region Restrictions** Restrict deployments to specific AWS regions for compliance, using `us-west-2` as the primary.

### Constraints
- **IAM**: Enforce least privilege.
- **Storage**: All storage encrypted with AWS-KMS.
- **Networking**: Public/private subnet separation, strict access control.
- **Compute**: Instance profiles with minimal required permissions.
- **Structure**: Must use Terraform modules.
- **Backend**: S3 + DynamoDB for state management.
- **Logging**: CloudTrail enabled and secured.
- **Compliance**: Deploy only to allowed AWS regions.

### Additional Guidelines
- Use **`prod-<resource>-<id>`** as the naming convention.
- Default VPCs in each region may be used for initial infrastructure.
- Expected output is a set of **Terraform HCL files** that pass all required security and compliance tests.