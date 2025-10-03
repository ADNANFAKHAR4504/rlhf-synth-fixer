We need to design and implement a secure and production-grade AWS environment using CDK for Terraform (CDKTF with TypeScript).  
The original requirement describes a CloudFormation YAML template, but your solution should use a two-file CDKTF approach with `modules.ts` and `tap-stack.ts`.

---

## Problem Overview

You are tasked with creating a highly available and secure infrastructure for a production workload.  
The design must emphasize least privilege access, encryption, monitoring, and compliance with enterprise security policies.  
All resources must be deployed in AWS and must meet the required availability and security standards.

---

## Key Requirements

### Core Security and Infrastructure
- Tagging
  - All resources must be tagged with:  
    `Environment: Production`

- IAM
  - Roles must enforce the least privilege principle  
  - Restrict IAM permissions to specific services only

- Networking
  - VPC with at least two subnets across separate AZs  
  - All Lambda functions deployed within the VPC  
  - RDS instances must not be publicly accessible

- Encryption
  - S3 buckets must use KMS-managed encryption (SSE-KMS)  
  - CloudTrail logs encrypted and stored in a designated S3 bucket  
  - All communication must enforce HTTPS

- Monitoring
  - Enable detailed EC2 monitoring  
  - CloudTrail enabled with secure log delivery  
  - Support rolling updates for minimal downtime

- Secrets Management
  - Store application secrets securely in AWS Systems Manager Parameter Store

- High Availability
  - Infrastructure deployed across multiple AZs  
  - Rolling updates supported with minimal disruption to services  

- Stack Design
  - Use nested stacks under a parent stack for organization

---

## Files to Deliver

### 1. `modules.ts`
Define reusable modules for:
- VPC (with at least 2 subnets across AZs)
- IAM Roles (least privilege, scoped to services)
- S3 Buckets (encrypted with SSE-KMS, logging enabled)
- CloudTrail (logs encrypted to S3)
- EC2 (detailed monitoring enabled)
- RDS (private, non-public, backups enabled)
- Lambda Functions (inside VPC, with IAM roles)
- Parameter Store secrets
- WAF / HTTPS enforcement

Each module should include inline comments highlighting how the design meets security and compliance requirements.

---

### 2. `tap-stack.ts`
- Import modules from `modules.ts`
- Configure variables (region, KMS Key ID, CIDR blocks, subnet IDs, etc.)
- Wire resources together (e.g., Lambda inside VPC, CloudTrail to S3, EC2 with IAM role)
- Apply consistent tagging (`Environment: Production`)
- Output key resource identifiers:
  - VPC ID
  - Subnet IDs
  - RDS Endpoint
  - S3 Bucket Names
  - CloudTrail ARN
  - Lambda ARNs

---

## Requirements Summary

- Tag all resources with `Environment: Production`
- IAM: least privilege only
- Enforce HTTPS
- S3 with KMS encryption
- Lambda inside VPC
- RDS not publicly accessible
- Nested stacks structure
- Secrets in Parameter Store
- Detailed EC2 monitoring
- Encrypted CloudTrail logs in S3
- Multi-AZ deployment (>=2 subnets)
- Rolling updates with minimal disruption

---

## Deliverables

- `modules.ts` → resource modules with security-focused best practices
- `tap-stack.ts` → main entrypoint wiring modules together
- Code must pass:
  - `terraform validate`
  - `terraform plan`
- Final architecture must align with enterprise security + HA standards