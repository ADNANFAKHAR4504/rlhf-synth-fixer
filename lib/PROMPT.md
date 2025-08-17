Generate a single-file Terraform configuration at ./lib/main.tf that meets the following requirements and best practices:

1. **Backend & Providers**
   - Configure a remote backend in S3 with DynamoDB for state locking.
   - Restrict deployment to AWS regions `us-west-2` (primary) and `us-east-1` (secondary).
   - Declare `aws_region` variable in main.tf and use it in provider.tf.
   - No provider block in main.tf (already in provider.tf).

2. **IAM & Security**
   - Implement IAM roles and policies following the principle of least privilege.
   - Create IAM instance profiles for all compute resources with only required permissions.
   - Ensure Security Groups and NACLs block all public access by default; explicitly allow only what’s necessary.

3. **Storage**
   - All S3 buckets must have server-side encryption enabled with AWS-KMS.
   - Deny unencrypted uploads.
   - Block all public access.
   - Tag all resources with consistent keys: Environment, Project, Owner, ManagedBy=terraform.

4. **Networking**
   - Create a VPC with both public and private subnets across multiple AZs.
   - Sensitive resources (EC2, RDS) must only be in private subnets.
   - Use NAT Gateway for outbound internet from private subnets.
   - Bastion host deployed in public subnet for controlled SSH access.

5. **Compute**
   - EC2 instances launched into private subnets with correct IAM instance profiles.
   - Security groups must not allow `0.0.0.0/0` for sensitive ports (e.g., SSH restricted to Bastion only).

6. **Monitoring & Logging**
   - Enable CloudTrail for all regions and deliver logs to a secure, encrypted S3 bucket.
   - CloudWatch log groups must use KMS encryption and a retention of 90 days.

7. **Outputs**
   - Output non-sensitive information required by CI/CD:
     - VPC ID
     - Subnet IDs
     - Bastion host public IP
     - S3 bucket names (state, logging, app)
     - CloudTrail bucket ARN
   - Do not output secrets.

**Constraints:**
- Single-file configuration in ./lib/main.tf
- Terraform >= 0.15.0
- No external modules (all resources created directly in main.tf)
- No provider blocks in main.tf (provider.tf already contains AWS provider + S3 backend)
- Code must pass terraform validate and follow AWS security best practices.

Produce the complete ./lib/main.tf with all variables, locals, resources, and outputs included.