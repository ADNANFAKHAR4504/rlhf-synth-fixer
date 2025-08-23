<<<<<<< HEAD
Design a secure AWS environment for handling sensitive data with advanced security controls, full auditability, and least-privilege access.

Core Requirements
1. VPC Architecture
   - Create a VPC with a prefix `prod-sec` (e.g., `prod-sec-vpc`).  
   - Include both public and private subnets across multiple Availability Zones.  
   - Use CIDR ranges appropriate for enterprise use (e.g., `10.100.0.0/16`).  
   - Ensure secure routing: public subnets use an Internet Gateway; private subnets use a NAT Gateway for outbound traffic only.

2. IAM Security
   - Create IAM users with programmatic and console access.  
   - Apply the principle of least privilege: each user must have only the permissions required for their role.  
   - Attach granular IAM policies—no use of `*` (wildcard) unless absolutely necessary and justified.  
   - Enforce multi-factor authentication (MFA) for all IAM users.  
   - Avoid inline policies; use managed policies where possible.

3. Terraform State Management
   - Configure a remote backend using existing infrastructure (assume S3 and DynamoDB are available).  
   - Enable encryption at rest using AWS KMS (`prod-sec-kms-key`).  
   - Ensure state locking and consistency via DynamoDB table.

4. Data Encryption
   - Enable encryption at rest for all storage services using AWS KMS.  
   - Create a customer-managed KMS key with alias `alias/prod-sec-cmk` and appropriate key policy.  
   - Use this key for EBS, S3, RDS, and any other applicable services.

5. Network Security  
   - Implement security groups for common tiers (e.g., web, app, db).  
   - Allow only necessary inbound/outbound traffic (e.g., HTTPS 443, SSH from bastion only).  
   - No open `0.0.0.0/0` ingress unless explicitly required and documented.

6. Logging & Auditing  
   - Enable AWS CloudTrail in `us-east-1` with multi-region support.  
   - Log all management events to a dedicated S3 bucket (`prod-sec-logs-bucket`) with access logging enabled.  
   - Protect logs with S3 bucket policies and KMS encryption.

7. **Compliance & Configuration Management**  
   - Enable AWS Config with a rule set to enforce:  
     - S3 buckets are private  
     - EC2 instances have required tags  
     - CloudTrail is enabled  
     - KMS key rotation is enabled  
   - Deliver configuration history and compliance reports to an S3 bucket.

8. S3 Security
   - All S3 buckets must be private by default (block public access enabled).  
   - Enable access logging for all buckets.  
   - Use bucket policies to restrict access to authorized IAM roles/users.

9. Secrets Management
   - Store sensitive data (e.g., database credentials) in AWS Secrets Manager.  
   - Use `aws_secretsmanager_secret` and `aws_secretsmanager_secret_version` resources.  
   - Grant access only to specific IAM roles via resource-based policies.

10. Modular Design  
    - Organize the configuration using Terraform modules for:  
      - VPC  
      - IAM users and policies  
      - KMS  
      - CloudTrail  
      - AWS Config  
    - Ensure modules are reusable, parameterized, and follow DRY principles.

11. Security Safeguards  
    - Implement preventive controls to detect and block:  
      - Wildcard IAM permissions (`"Effect": "Allow", "Action": "*", "Resource": "*"`).  
      - Unauthorized data exfiltration (e.g., S3 bucket policies allowing public write).  
    - Use automated checks (e.g., `pre-commit` hooks, `tfsec`, `checkov`) to validate configuration.

Output Expectations  
- Provide a complete, working Terraform configuration in HCL.  
- Include all necessary `.tf` files: `main.tf`, `variables.tf`, `outputs.tf`, `providers.tf`, and `backend.tf`.  
- Structure using modules: `modules/vpc/`, `modules/iam/`, `modules/kms/`, etc.  
- Ensure the code passes manual review and automated compliance tools.  
- Add inline comments for complex logic and security decisions.  
- Do not include placeholder values—use variables where appropriate.

Assumptions  
- You may assume the remote backend (S3 bucket and DynamoDB table) already exists.  
- Use `terraform { backend "s3" { ... } }` with encryption enabled.  
- All resources must include `Name` and `Project` tags.

Note:- Give all infrastructure in single file tap_stack.tf.
=======
# CDKTF Enterprise AWS Infrastructure Project

## Overview

Create a CDK for Terraform (CDKTF) project using TypeScript or Python, implementing all resources and configurations in a single file named main.ts or main.py. This script should deploy a secure AWS cloud environment for an enterprise application, following strict security best practices and organizational standards.

## Environment Configuration

- **Region**: us-east-1
- **VPC**: Includes both public and private subnets.
- **Resource Naming**: All resources must be prefixed with prod-sec.
- **Terraform Backend**: Use an existing remote backend for state management (e.g., S3 + DynamoDB) with encryption enabled.
- **Project Name**: IaC – AWS Nova Model Breaking

## Security and Compliance Requirements

### IAM Users and Roles

- Create IAM users with least privilege policies.
- Enforce Multi-Factor Authentication (MFA).
- Avoid wildcard "\*" permissions unless absolutely necessary and justified.
- Apply least privilege in all IAM policies and roles.

### VPC and Networking

- Create a VPC with public subnets in at least 2 Availability Zones.
- Define Security Groups to allow only necessary inbound/outbound traffic.
- Ensure secure access to resources and isolation between environments.

### Terraform State Management

- Use secure S3 backend with server-side encryption and state locking via DynamoDB.
- Prevent unauthorized access through IAM policies and S3 bucket policies.

### Data Encryption and Secrets Management

- Use AWS KMS for encryption at rest (for S3, EBS, RDS, etc.).
- Manage secrets using AWS Secrets Manager or SSM Parameter Store, with encryption enabled.

### Logging and Monitoring

- Configure CloudWatch logs and alarms for application monitoring.
- Ensure S3 buckets are private by default and enable access logging.
- Optionally configure AWS Config rules if no existing configuration recorder exists.

### Security Controls and Safeguards

- Prevent unauthorized data exfiltration (e.g., restrict outbound internet access).
- Enforce environment isolation using networking and IAM boundaries.
- Include automated checks for security posture (e.g., GuardDuty, CloudWatch alarms).
- Optionally include CloudTrail for audit logging if not managed externally.

## Infrastructure Implementation Style

- Implement all resources in a single file (main.ts or main.py).
- Follow CDKTF best practices while maintaining readability and structure within the single file.
- Apply tags to all resources: Environment=Production, Project=IaC-AWS-Nova.

## Expected Output

A single file CDKTF script (main.ts or main.py) that:

- Implements all infrastructure and security configurations as described.
- Successfully runs with cdktf synth and cdktf deploy.
- Passes manual review and automated compliance checks.
- Uses CDKTF constructs and logic but keeps everything in one file for simplicity.
>>>>>>> 043468c0d4b28b69cdfe06caec11670886894d9d
