We need to build a secure AWS environment using CDK for Terraform (TypeScript). 
The code should be split into just two files:

1. `modules.ts` 
- Define all the AWS resources here as reusable modules. 
- Group resources by type (VPC, IAM, S3, CloudWatch, Security Groups, NACLs, etc.). 
- Add inline comments to describe what each block is doing and why. 

2. `tap-stack.ts` 
- This file wires everything together. 
- Import the modules from `modules.ts` and instantiate them. 
- Pass in variables like subnet CIDRs, allowed traffic ranges, and S3 bucket names. 
- Define and export all outputs here. 
- Do not hardcode sensitive values rely on variables or environment references. 

---

### Requirements
- **Region:** Everything must deploy in `us-east-1`. 
- **IAM:** Roles and policies must follow the principle of least privilege. 
- **S3:** 
- All buckets encrypted using **KMS keys** (not just AES-256). 
- S3 should handle sensitive data securely. 
- **Logging:** Enable logging across all services and send logs to **CloudWatch Logs**. 
- **Networking (VPC):** 
- Create both public and private subnets. 
- Add a **NAT gateway** so private subnets can access the internet securely. 
- Configure route tables properly. 
- **Security:** 
- Use **Security Groups** to allow only required traffic (e.g., SSH, HTTP/HTTPS). 
- Use **NACLs** for additional traffic restrictions and subnet protection. 

---

### Deliverables
- `modules.ts`: All resource definitions, modular and commented. 
- `tap-stack.ts`: Module instantiation, variable wiring, outputs. 

---

### Expectations
- Stick to CDKTF TypeScript coding style with proper imports and types. 
- Keep the modules generic so new resources can be added later without rewriting everything. 
- Add clear comments so the purpose of each configuration is obvious. 
- Make sure the setup follows AWS best practices for encryption, access control, and monitoring. 
- The code should run through `terraform validate` and `terraform plan` cleanly.