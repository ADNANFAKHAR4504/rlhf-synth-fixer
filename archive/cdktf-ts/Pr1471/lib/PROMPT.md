We need to create a secure AWS environment using CDK for Terraform (TypeScript). 
The code should be organized into two files:

1. `modules.ts` 
- Define all AWS resources as reusable modules here. 
- Include resources like VPC, IAM roles and policies, S3 buckets, Security Groups, CloudTrail, and Secrets Manager. 
- Add comments for each resource explaining its purpose and configuration. 
- Make sure security best practices are followed (encryption, least privilege, logging). 

2. `tap-stack.ts` 
- Import and instantiate the modules from `modules.ts`. 
- Pass in variables like allowed IP ranges for Security Groups and names for S3 buckets or Secrets. 
- Define outputs for key components (VPC ID, S3 bucket names, IAM role ARNs). 
- Avoid hardcoding sensitive values use variables or environment references. 

---

### Requirements
- **Region:** Deploy everything in **us-west-2**. 
- **VPC:** All resources must reside within a single VPC. 
- **IAM:** 
- Roles must follow the principle of least privilege. 
- Define roles using IAM Policies. 
- **S3:** 
- Buckets must use server-side encryption with AWS-managed KMS keys (SSE-KMS). 
- **Security Groups:** 
- Allow inbound HTTP and HTTPS traffic **only from specified IP addresses**. 
- **CloudTrail:** 
- Enable capture of all management events. 
- Log file validation must be turned on. 
- **Secrets Manager:** 
- Store all secrets and sensitive information securely. 

---

### Deliverables
- `modules.ts`: Reusable resource definitions with comments explaining security configurations. 
- `tap-stack.ts`: Module instantiation, variable wiring, and outputs. 
- Code must be valid CDKTF TypeScript and pass `terraform validate` and `terraform plan`. 

---

### Expectations
- Stick to CDKTF TypeScript conventions (imports, typing, structure). 
- Keep modules modular so new resources can be added later easily. 
- Add clear comments to explain design choices and security rationale. 
- Ensure all resources comply with AWS security best practices, encryption, and access control.