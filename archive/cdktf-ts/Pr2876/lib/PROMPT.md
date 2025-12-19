We need to design and deploy a **secure, scalable, and highly available AWS infrastructure** for a web application using **CDK for Terraform (TypeScript)**.  
The original task describes a CloudFormation YAML solution, but we will implement the same in a modular CDKTF structure with two files: `modules.ts` and `tap-stack.ts`.

---

## Problem Overview

Your goal is to implement a robust infrastructure that enforces strong security practices, ensures high availability, and scales automatically when needed.  
All resources should be deployed in the **us-west-2 region**, designed for production-grade reliability and security.

---

## What You Must Implement

### Core Infrastructure Components
- **VPC Setup**
  - CIDR block: `10.0.0.0/16`
  - Two public subnets and two private subnets across multiple Availability Zones
  
- **EC2 Instances**
  - Launched in private subnets
  - Use IAM roles strictly following least privilege
  - Monitored by CloudWatch with alarms for high CPU usage

- **S3 Buckets**
  - Server-side encryption using AWS KMS
  - Versioning and server access logging enabled

- **RDS Database**
  - Multi-AZ setup
  - Automatic backups enabled

- **CloudFront Distribution**
  - Uses S3 bucket as origin to serve static content securely

- **Lambda Functions**
  - All deployed inside the VPC for secure private execution

- **Security Groups**
  - Allow inbound HTTP (port 80) and HTTPS (port 443) only

- **CloudWatch**
  - Alarms configured to trigger on high CPU usage

- **DynamoDB**
  - Auto-scaling enabled for handling variable workloads

---

## Files to Deliver

### 1. `modules.ts`  
Define reusable modules that declare resources for:
- VPC (with subnets, routing, and NAT Gateway)
- EC2 Instances with IAM Roles
- S3 Buckets (with encryption, versioning, and logging)
- RDS instance (Multi-AZ + automatic backups)
- CloudFront distribution (S3 as origin)
- Lambda functions in VPC
- Security Groups
- CloudWatch Alarms
- DynamoDB table with auto-scaling

Provide meaningful inline comments explaining security and high-availability rationale behind each resource.

---

### 2. `tap-stack.ts`  
- Instantiate all modules from `modules.ts`
- Define variables such as:
    - VPC CIDR block
    - Approved IP ranges
    - KMS Key IDs
    - AMI IDs for EC2
- Wire outputs:
    - VPC ID  
    - EC2 Instance IDs  
    - S3 Bucket names  
    - RDS Endpoint  
    - CloudFront Distribution Domain  
    - DynamoDB Table Name  
    - Lambda Function ARNs  
    - CloudWatch Alarm ARNs  

Avoid hardcoded credentials or secrets.

---

## Requirements Summary

- Region: `us-west-2`
- Encryption of all data at rest (S3, RDS) using KMS
- Least privilege IAM roles
- Versioned and logged S3 buckets
- CloudFront configured with S3 origin
- Lambda functions inside VPC
- Security Groups limited to HTTP and HTTPS
- CloudWatch monitoring with alarms
- DynamoDB auto-scaling enabled
- Proper tagging of resources (e.g., `Environment: Production`)

All code must pass:
- `terraform validate`  
- `terraform plan`

---

## Deliverables

- `modules.ts` → Infrastructure resource definitions, documented with comments
- `tap-stack.ts` → Wiring file with variables, module calls, and outputs

This CDKTF solution must reflect the same security, availability, and functionality standards originally defined for CloudFormation YAML.