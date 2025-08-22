We need to set up an AWS environment using CDK for Terraform in TypeScript.  
The main focus is security — encryption, least privilege, and proper logging.  
Everything has to live inside a VPC with subnets we define.

---

## What’s needed

- Use KMS so all data at rest is encrypted (EBS, S3, RDS, Lambda if possible).  
- IAM policies should be very restrictive (least privilege). No broad `*` permissions.  
- Enable logging everywhere:
  - S3 bucket access logs.  
  - Lambda execution logs in CloudWatch.  
- All resources (EC2, RDS, S3, Lambda, etc.) should run inside the given VPC + subnets.  

---

## Files to create

- modules.ts → define all the AWS resources:
  - VPC/subnets (or accept them as input variables).  
  - KMS key(s).  
  - IAM roles/policies with fine-grained access.  
  - S3 bucket with encryption + logging.  
  - Lambda function with logging + KMS.  
  Add inline comments to explain *why* something is configured (not just what).  

- tap-stack.ts → wire everything together:  
  - Import from `modules.ts`.  
  - Pass variables for subnet IDs, VPC ID, KMS key IDs, etc.  
  - Outputs for key resources (bucket names, IAM role ARNs, Lambda log group, etc.).  

---

## Requirements

- Region = `us-east-1`.  
- Encrypt all data at rest with KMS.  
- IAM must follow least privilege.  
- Logging must be turned on for S3 + Lambda.  
- All resources must be inside the given VPC and subnets.  
- Code should pass `terraform validate` and `terraform plan`.  

---

## Deliverables

Two TypeScript files (`modules.ts` and `tap-stack.ts`) that together define the infra.  
Inline comments included so someone reading the code understands the security reasoning.  

---