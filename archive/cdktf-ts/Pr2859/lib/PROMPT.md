We need to design and implement a **secure and highly available AWS environment** for a company operating in the **us-east-1 region** using **CDK for Terraform (TypeScript)**.  
The original requirement specifies a CloudFormation YAML template, but we will build the same infrastructure using CDKTF in a clean and modular two-file structure.

---

## Problem Description

Your goal is to build a secure infrastructure that meets strong compliance and security standards.  
The environment should deploy compute, storage, network, monitoring, and security services, while enforcing encryption, logging, least privilege, and availability best practices.

---

## Key Requirements

### Security & Compliance
- Encrypt all data at rest using **AWS KMS**.
- Enable **logging for all AWS Lambda functions**.
- Set **IAM roles and policies** using the **least privilege principle**.
- Protect all **API Gateway endpoints using AWS WAF**.
- Configure **S3 buckets** with versioning and **server-side encryption (SSE-S3)**.
- Use **AWS Config** to track configuration changes of resources.
- Enable **VPC Flow Logs** for monitoring network traffic.
- Restrict **SSH access to EC2 instances** from a specific company IP range.
- Enable **detailed monitoring** on all CloudWatch alarms.
- Deploy **RDS instance** with **automatic backups enabled**.
- Implement **AWS Shield** protection for DDoS on public services.

### Availability & Resilience
- Resources must span **multiple Availability Zones** for high availability.
- All resources must be deployed in the **us-east-1 region**.

---

## File Structure

### 1. `modules.ts`  
Define reusable constructs for the following AWS resources:
- VPC with multiple AZ subnets
- IAM roles and policies (least privilege)
- S3 buckets (versioned + encrypted)
- API Gateway with WAF protection
- Lambda functions with logging enabled
- RDS instance with automatic backups
- AWS Config recorder
- VPC Flow Logs
- Security Groups (SSH restricted)
- AWS Shield protection
- CloudWatch Alarms
- SNS topic for alarms

Each resource should include **inline comments** explaining why the configuration helps meet security/compliance goals.

---

### 2. `tap-stack.ts`  
Glue everything together by:
- Importing and instantiating modules from `modules.ts`.
- Wiring up variables (e.g., CIDR blocks, approved IPs, AMI IDs, KMS Key IDs).
- Defining meaningful outputs such as:
    - VPC ID  
    - S3 Bucket Name  
    - Lambda Function ARN  
    - RDS Endpoint  
    - API Gateway URL  
    - CloudWatch Alarm ARNs  

Ensure no credentials are hardcoded—use variables or Secrets Manager references.

---

## Deliverables

Two TypeScript files:

1. **modules.ts** → Resource definitions with proper tagging, security configs, and clear comments explaining the design decisions.  
2. **tap-stack.ts** → Composition file wiring the resources, defining variables, and exposing outputs.
---