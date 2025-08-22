We need to design and deploy a security-first AWS setup using CDK for Terraform (TypeScript).  
The target is to replicate the same controls we’d usually define in CloudFormation YAML, but now using CDKTF.  

---

## What’s needed

- IAM  
  - Define a secure IAM role + fine-grained policy for controlling access to AWS resources.  
  - Avoid broad `*` actions, stick to least privilege.  

- S3 with KMS Encryption  
  - All buckets must have server-side encryption (SSE-KMS).  
  - Ensure logging buckets are encrypted as well.  

- Security Groups  
  - Only allow inbound/outbound traffic from approved IP ranges.  
  - No wide-open `0.0.0.0/0` rules.  

- CloudTrail  
  - Track all API activity.  
  - Deliver logs into an encrypted S3 bucket.  

- Backup Strategy  
  - Use AWS-native backup service or cross-region S3 replication to store backups in a different AWS region.  

- Alerts  
  - Set up CloudWatch Alarms / SNS topics to notify the security team if unauthorized access attempts occur.  

---

## Files to create

- modules.ts → Define all AWS resources here:
  - IAM roles + policies.  
  - KMS keys.  
  - S3 buckets (main + log bucket).  
  - Security groups.  
  - CloudTrail.  
  - Backup configuration (cross-region or AWS Backup service).  
  - CloudWatch alarms + SNS alerts.  
  - VPC

- tap-stack.ts → Glue code:
  - Import modules.  
  - Wire up variables (VPC ID, approved IP ranges, KMS key IDs, etc.).  
  - Outputs: IAM role ARN, S3 bucket name, CloudTrail ARN, SNS topic ARN.  

---

## Requirements

- Region = `us-east-1`.  
- All resources follow the naming convention: `SecProject-<ResourceType>-<ID>`.  
- Encrypt all data at rest using KMS.  
- IAM must follow least privilege.  
- Security groups restricted to approved IPs.  
- Logging enabled (CloudTrail → encrypted S3).  
- Backup plan must use a different region.  
- Alerts notify security team on suspicious activity.  
- Code should pass `terraform validate` and `terraform plan`.  

---

## Deliverables

Two TypeScript files (`modules.ts` and `tap-stack.ts`) that together define this secure infra.  
Both should include inline comments explaining the security rationale behind each resource/config.  

---
