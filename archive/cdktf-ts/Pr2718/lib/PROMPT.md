We need to design and deploy a **secure and scalable AWS environment** for a web application using **CDK for Terraform (TypeScript)**.  
The original problem specifies a CloudFormation JSON template, but we will implement it in **CDKTF** with a **two-file structure**.  

---

## Problem

You are tasked with creating a **secure infrastructure setup** in **AWS us-east-1 region** for a production web application.  
The environment must cover compute, storage, networking, IAM, monitoring, and security services.  
All resources must strictly adhere to **least privilege** and **security best practices** while ensuring scalability and compliance.  

---

## Requirements

### Networking
- Create a **VPC** with both **public and private subnets**.  
- All subnets must be tagged following the company naming convention.  
- Attach an **Internet Gateway** to the VPC.  
- Deploy a **NAT Gateway** to provide internet access for private subnets.  
- Use **VPC endpoints for S3** to keep S3 traffic inside the AWS network.  

### Compute
- Deploy **EC2 instances** only inside **private subnets**.  
- Enable **detailed monitoring** on all EC2 instances.  
- Restrict **security group inbound rules** (no wide-open access).  

### Storage
- Create **S3 buckets** with:  
  - **Encryption enabled** at rest.  
  - **Public access blocked**.  
  - **Bucket policy denying public access**.  

### IAM
- Define **IAM roles and policies** for:  
  - EC2 instances (least privilege).  
  - Lambda function (least privilege).  
  - DynamoDB + S3 + CloudWatch (minimal permissions).  

### Lambda & DynamoDB
- Deploy a **Lambda function** inside the VPC (private subnets).  
- Create a **DynamoDB table** with **point-in-time recovery enabled**.  

### Database & Analytics
- Deploy an **RDS instance** inside private subnets.  
  - Not publicly accessible.  
  - Encrypted at rest.  
- Any **Elasticsearch domains** must have **encryption at rest enabled**.  

### Logging & Monitoring
- Enable **AWS CloudTrail** with logs encrypted using a **KMS key**.  
- Create **CloudWatch log groups** with **90-day retention**.  
- Set up **CloudWatch alarms** for key metrics.  
- Integrate with an **SNS topic** to send notifications on alarm events.  

### General
- All resources must be tagged with environment + operational metadata.  
- All resources must pass `terraform validate` and `terraform plan`.  

---

## File Structure

- **modules.ts**  
  Define and export constructs for:  
  - VPC, subnets, IGW, NAT Gateway, VPC endpoints  
  - Security groups (EC2, Lambda, RDS)  
  - EC2 instances (private subnets, detailed monitoring)  
  - IAM roles + least privilege policies  
  - S3 bucket (encryption, policy, block public access, versioning optional)  
  - Lambda function (inside VPC)  
  - DynamoDB table (PITR enabled)  
  - RDS instance (private, encrypted, backups enabled)  
  - Elasticsearch domain with encryption at rest  
  - CloudTrail (logs encrypted with KMS key)  
  - CloudWatch log groups (90-day retention)  
  - CloudWatch alarms + SNS topic  

- **tap-stack.ts**  
  - Import and compose modules from `modules.ts`.  
  - Wire up variables (e.g., region, company IPs, AMI IDs, naming convention).  
  - Apply tagging to all resources.  
  - Define outputs:  
    - VPC ID  
    - EC2 instance IDs  
    - S3 bucket names  
    - DynamoDB table name  
    - RDS endpoint  
    - SNS topic ARN  
    - CloudTrail ARN  

---

## Deliverables

Two TypeScript files:  

1. **modules.ts** → Defines AWS resources with secure configs.  
2. **tap-stack.ts** → Wires them into a complete stack, applies tagging, and defines outputs.  

Both must include **inline comments** explaining security and compliance decisions.  

---
