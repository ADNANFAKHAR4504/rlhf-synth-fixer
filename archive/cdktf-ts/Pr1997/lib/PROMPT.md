We need to design and deploy a security-focused AWS infrastructure using CDK for Terraform (TypeScript).  
The idea is to take the kind of security controls we’d normally write in a CloudFormation YAML template and implement them in CDKTF instead.  

---

## What we want to achieve

- IAM  
  - Create a secure IAM role with a very specific policy.  
  - Stick to the principle of least privilege (no `*` actions everywhere).  

- S3 Buckets with KMS Encryption  
  - Every S3 bucket must use KMS for encryption (SSE-KMS).  
  - This includes log buckets—no exceptions.  

- Security Groups  
  - Only allow traffic from approved IP ranges.  
  - No wide-open `0.0.0.0/0` rules anywhere.  

- CloudTrail  
  - Enable CloudTrail to log all API activity.  
  - Logs must go into an encrypted S3 bucket.  

- Backup Strategy  
  - Use AWS Backup or cross-region replication so we always have a copy in another AWS region.  

- Alerts  
  - Configure CloudWatch alarms and SNS to notify the security team if someone tries unauthorized access.  

---

## Files to create

- modules.ts → This file will contain all the actual resource definitions:  
  - IAM roles and policies.  
  - KMS keys.  
  - S3 buckets (main + log bucket).  
  - Security groups.  
  - CloudTrail setup.  
  - Backup plan or cross-region replication.  
  - CloudWatch alarms + SNS topics.  
  - VPC resources.  

- tap-stack.ts → This is where everything is tied together:  
  - Import the modules from above.  
  - Pass in variables like VPC ID, approved IP ranges, and KMS key IDs.  
  - Expose outputs such as IAM role ARN, S3 bucket name, CloudTrail ARN, and SNS topic ARN.  

---

## Key Requirements

- Use us-east-1 region.  
- Naming convention: `SecProject-<ResourceType>-<ID>`.  
- All data at rest must be encrypted with KMS.  
- IAM roles must stick to least privilege.  
- Security groups limited to approved IPs.  
- CloudTrail logs must be stored in encrypted S3.  
- Backup plan must cover another AWS region.  
- Alerts go to the security team on suspicious events.  
- The CDKTF code must pass `terraform validate` and `terraform plan`.  

---

## What to deliver

Two TypeScript files:  

1. `modules.ts` → all resource definitions.  
2. `tap-stack.ts` → wiring and outputs.  

Both files should have inline comments explaining why something is configured in a certain way (not just what it does).  

---
