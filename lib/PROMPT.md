# Secure AWS Infrastructure with Terraform


## Environment
Design a Terraform configuration to deploy a **secure AWS infrastructure** in the `us-west-2` region, following AWS best practices.

## Requirements
1. **Security Groups**
   - For the VPC, allow **inbound traffic only on ports 80 (HTTP)** and **443 (HTTPS)**.
   - All other inbound traffic must be denied.

2. **IAM Security**
   - Ensure all IAM users are required to use **Multi-Factor Authentication (MFA)**.
   - Restrict AWS Management Console access based on **specific IP address ranges**.

3. **S3 Security**
   - Encrypt **all S3 buckets** using **server-side encryption** with **AWS KMS**.
   - Access to S3 from EC2 instances should be via **IAM roles**, not hard-coded credentials.

4. **CloudFront**
   - Implement a **CloudFront distribution** to serve content securely from an S3 bucket.

5. **VPC Flow Logs**
   - Enable VPC Flow Logs to **monitor and log all IP traffic** entering and leaving the VPC.

## Constraints
- All Terraform configurations must be valid and pass `terraform validate`.
- The setup must deploy cleanly with `terraform apply` in a single AWS account.
- All resources are deployed in the **`us-west-2` region**.
- Use **IAM roles** instead of hard-coded credentials for EC2-to-S3 access.
- Infrastructure should follow AWS **security and compliance best practices**.

## Expected Output
- A complete Terraform configuration in one or more `.tf` files.
- Verified deployment that:
  - Restricts VPC inbound traffic to ports **80 and 443**.
  - Enforces **MFA** for IAM users.
  - Encrypts all **S3 buckets with AWS KMS**.
  - Uses **IAM roles** for EC2-to-S3 access.
  - Serves content from S3 via **CloudFront** securely.
  - Logs all VPC traffic via **VPC Flow Logs**.
  - Restricts AWS Management Console access by **IP address range**.

Note: all the resources to be created in main.tf file itself.