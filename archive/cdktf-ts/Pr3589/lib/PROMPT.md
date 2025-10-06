You are required to build a secure, auditable AWS environment using CDK for Terraform (CDKTF with TypeScript).  
The original requirement was to design this infrastructure using a CloudFormation YAML template, but you must now implement it through a two-file CDKTF project — consisting of `modules.ts` and `tap-stack.ts`.

---

## Problem Overview

Your task is to design and deploy an AWS environment focused on encryption, access control, and auditability.  
The solution must ensure that all resources are secure by default, encrypted at rest, and monitored for compliance.  
The infrastructure must run in the us-east-2 region and leverage AWS services configured according to security best practices.

---

## Core Requirements

1. Encryption
   - Use AWS Key Management Service (KMS) for all encryption tasks.  
   - Apply server-side encryption (SSE-KMS) for all S3 buckets.  
   - Encrypt logs, configurations, and other sensitive data using KMS keys.

2. Identity and Access Management
   - Implement IAM roles and policies based on the least privilege principle.  
   - Define and attach policies directly to IAM roles where necessary.  
   - Ensure that only specific IAM roles can access designated S3 buckets.

3. Networking
   - Create a VPC with both public and private subnets.  
   - Configure appropriate route tables, NAT Gateway, and Internet Gateway.  
   - Use security groups to restrict:
     - HTTP (port 80) and SSH (port 22) to specific IP ranges only.

4. Logging & Auditing
   - Enable AWS CloudTrail to log all API activity across the environment.  
   - Set up AWS Config to continuously track configuration changes and compliance.  
   - Ensure logging is enabled for all AWS services used in the infrastructure.  
   - Store logs securely in an encrypted S3 bucket.

5. Storage
   - Deploy an Amazon S3 bucket with:
     - Server-side encryption (SSE-KMS)
     - Access restricted to a specific IAM role
     - Logging and versioning enabled for auditing

6. Deployment Settings
   - All resources must be provisioned in the us-east-2 region by default.  
   - Each resource should include consistent tags for audit and identification.

---

## File Structure

### 1. `modules.ts`
Define reusable CDKTF modules for:
- VPC module → public/private subnets, IGW, NAT  
- IAM module → least-privilege roles and inline policies  
- S3 module → encrypted bucket with restricted access  
- CloudTrail module → audit logging with SSE-KMS  
- AWS Config module → compliance tracking and rule setup  
- Security Groups module → HTTP/SSH restriction to specific IPs  
- KMS module → KMS key creation and alias management  

Each module should include inline documentation to explain how it satisfies its respective security and compliance controls.

---

### 2. `tap-stack.ts`
- Import all modules from `modules.ts`.  
- Initialize the AWS provider (region: `us-east-2`).  
- Wire the modules together logically (e.g., CloudTrail logs → S3 bucket → encrypted with KMS).  
- Ensure IAM role permissions are correctly applied for S3 and logging access.  
- Apply consistent tagging (`Environment: SecureApp`).  
- Output identifiers for key resources:
  - VPC ID  
  - Public & Private Subnet IDs  
  - KMS Key ARN  
  - S3 Bucket Name  
  - IAM Role ARN  
  - CloudTrail Log Group  

---

## Constraints Summary

- Use AWS KMS for all encryption  
- Apply IAM least privilege principle  
- Enable logging for all AWS services  
- Deploy in us-east-2 by default  
- VPC must include public and private subnets  
- Restrict HTTP/SSH access to specific IP ranges  
- Enable CloudTrail for auditing  
- Use AWS Config for compliance tracking  
- S3 bucket must use SSE-KMS encryption  
- Restrict S3 access to specific IAM roles only

---

## Deliverables

- `modules.ts` → defines reusable security-focused AWS resource modules  
- `tap-stack.ts` → integrates modules into a deployable stack  
- CDKTF code should:
  - Pass `cdktf synth` and `terraform validate`  
  - Enforce all security, encryption, and compliance constraints  
  - Be production-ready for a secure environment