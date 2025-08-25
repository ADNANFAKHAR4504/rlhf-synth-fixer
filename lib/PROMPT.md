We need to design and deploy a **security-focused AWS infrastructure** using **CDK for Terraform (Go)**.  
The idea is to take the kind of security controls we’d normally write in a CloudFormation YAML template and implement them in CDKTF (Go) instead.  

---

## What we want to achieve

- **IAM**  
  - Create IAM roles but only attach **AWS Managed Policies** (no inline or custom policies).  
  - Follow least privilege by selecting only the required managed policies.  

- **S3 Buckets**  
  - All buckets must be **private by default**.  
  - Enable server-side encryption with **SSE-KMS**.  
  - Log buckets included—no exceptions.  

- **Tagging**  
  - Every resource must include the tag:  
    ```
    Environment: Production
    ```  

- **Lambda Logging**  
  - All AWS Lambda functions deployed must have **logging enabled** (via CloudWatch Log Groups).  

- **VPC**  
  - A highly available VPC setup with **public and private subnets across two Availability Zones**.  
  - Ensure proper routing for internet access from public subnets and NAT for private subnets.  

- **RDS Security**  
  - All RDS instances must use **AWS KMS-managed keys** for encryption at rest.  

- **CloudTrail**  
  - Enable CloudTrail across **all AWS regions**.  
  - Store CloudTrail logs in an encrypted, private S3 bucket.  

---

## Files to create

- **modules.go** → This file will contain all the actual resource definitions:  
  - IAM roles (with AWS Managed Policies only).  
  - KMS keys.  
  - S3 buckets (main + log bucket).  
  - Security groups.  
  - CloudTrail setup.  
  - RDS instance with KMS encryption.  
  - Lambda function definitions with logging enabled.  
  - VPC with subnets across 2 AZs.  

- **tap-stack.go** → This is where everything is tied together:  
  - Import the modules from above.  
  - Pass in variables like VPC CIDR, subnet CIDRs, RDS KMS key ID, etc.  
  - Expose outputs such as IAM role ARN, S3 bucket names, VPC ID, RDS endpoint, and CloudTrail ARN.  

---

## Key Requirements

- Use **us-west-2 (Oregon)** region.  
- Naming convention: `project-name-resource`.  
- IAM roles must only use AWS Managed Policies.  
- All S3 buckets must default to private + KMS encryption.  
- Every resource must include the tag `Environment: Production`.  
- Lambda functions must send logs to CloudWatch.  
- VPC must span 2 AZs with both public and private subnets.  
- RDS instances must use KMS-managed encryption.  
- CloudTrail must be enabled **in all regions**.  
- The CDKTF code must pass `terraform validate` and `terraform plan`.  

---

## What to deliver

Two Go files:  

1. `modules.go` → all resource definitions.  
2. `tap-stack.go` → wiring and outputs.