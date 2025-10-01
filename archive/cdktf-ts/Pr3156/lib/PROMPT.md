We need to design and deploy a **secure, compliant, and highly available AWS infrastructure** for a web application using **CDK for Terraform (TypeScript)**.  
The original solution describes a CloudFormation YAML template, but we’ll build the same infrastructure using a modular CDKTF structure with two files: `modules.ts` and `tap-stack.ts`.

---

## Problem Overview

Your mission is to implement a robust cloud environment focused on **security best practices, compliance, and monitoring**.  
The target deployment region is **us-east-1**.

---

## Key Requirements

### Core Infrastructure Components
- **VPC Setup**
  - CIDR block: `10.0.0.0/16`
  - Public and private subnets
  - Flow Logs enabled for security monitoring

- **EC2 Instance**
  - Launched in private subnet
  - IAM role strictly enforcing least privilege
  - Security Group rules:
    - Allow only HTTPS (port 443) and SSH (port 22) from specific CIDR blocks
    - No unrestricted (0.0.0.0/0) ingress except approved use cases
  
- **S3 Bucket**
  - Server-side encryption using AWS KMS (SSE-KMS)
  - Block public read access
  - CloudTrail logging enabled

- **IAM Setup**
  - Inline IAM roles and policies
  - No permissions for attaching/detaching network interfaces
  - Policies attached to groups or roles (never individual users)
  - MFA enforced for all console users
  - Access keys rotated every 90 days

- **CloudTrail and CloudWatch**
  - Capture all API activity in CloudTrail (logs stored in encrypted S3)
  - CloudWatch Alarm to monitor unauthorized IAM actions

- **AWS WAF**
  - Protect CloudFront distribution (for web application) from SQL injection and XSS attacks

- **Encryption**
  - KMS-managed encryption for S3, EBS volumes, and data at rest across services

---

## Files to Deliver

### 1. `modules.ts`  
Define reusable modules that declare resources for:
- VPC (with public & private subnets, flow logs)
- EC2 Instance (with secure IAM Role and Security Group)
- S3 Bucket (with encryption and logging)
- IAM Roles and Policies
- CloudTrail
- CloudWatch Alarms
- AWS WAF
- KMS Key Management

Each resource should include inline comments explaining the security rationale and compliance decisions.

---

### 2. `tap-stack.ts`  
- Instantiate modules from `modules.ts`
- Provide variables for:
    - VPC CIDR block
    - Approved IP ranges for SSH/HTTPS access
    - KMS Key IDs
    - AMI ID for EC2
- Output important values:
    - VPC ID  
    - EC2 Instance ID  
    - S3 Bucket Name  
    - CloudTrail ARN  
    - CloudWatch Alarm ARNs  
    - WAF ACL ID  

Avoid hardcoded secrets or credentials.

---

## Requirements Summary

- Region: `us-east-1`
- Data at rest encryption via AWS KMS (S3, EBS, etc.)
- Least privilege IAM roles, with no excessive permissions
- S3 buckets: versioning, encryption, no public access
- Flow logs enabled on VPC
- CloudTrail capturing management events
- WAF applied to CloudFront
- MFA enforced for IAM users
- Access keys rotated every 90 days
- CloudWatch alarm monitoring unauthorized IAM actions

All code must pass:
- `terraform validate`  
- `terraform plan`

---

## Deliverables

- `modules.ts` → Resource definitions with meaningful security-focused comments  
- `tap-stack.ts` → Wiring of modules, variables, and outputs