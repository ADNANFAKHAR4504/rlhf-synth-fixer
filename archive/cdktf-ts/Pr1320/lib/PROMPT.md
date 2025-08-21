We need to set up an AWS environment using CDK for Terraform (TypeScript). 
The code should live in just two files:

1. `modules.ts` 
- Put all AWS resources here as reusable modules. 
- Break things down by resource type (VPC, EC2, IAM, S3, RDS, CloudWatch Logs). 
- Add comments to explain what each resource does and why its there.

2. `tap-stack.ts` 
- This is where we wire everything together. 
- Import modules from `modules.ts` and instantiate them. 
- Pass in values like instance type, S3 bucket name, or SSH CIDR ranges as variables. 
- Outputs should be defined here only. 
- No hardcoded secrets, use variables.

---

### Requirements
- Everything must deploy in **us-east-1**. 
- **S3 buckets**: 
- AES-256 encryption 
- Versioning enabled 
- Bucket names configurable 
- **IAM roles**: least privilege only. 
- **EC2 instance**: 
- Security group should allow SSH only from a given IP range. 
- CloudWatch Logs must capture activity. 
- **RDS**: 
- Must be encrypted at rest 
- Automated backups enabled 
- Configurable instance class and storage 
- **Tagging**: every resource should have `ProjectName` and `Environment`. 
- **Variables**: use variables for EC2 type, bucket names, allowed SSH CIDRs, and RDS settings. 
- **General**: 
- Follow AWS security best practices. 
- Should be fully destroyable with `terraform destroy`. 
- No credentials in code. 
- Must pass `terraform validate` and `terraform plan`. 

---

### Deliverables
- `modules.ts` with all resource definitions, well-commented. 
- `tap-stack.ts` with instantiations and outputs. 

---

### Expectations
- Stick to CDKTF TypeScript conventions (imports, typing, structure). 
- Keep the code modular so we can expand later (extra S3 buckets, more EC2, etc.). 
- Comments should explain design choices in plain English. 
- Make sure everything meets AWS best practices for security and compliance.
