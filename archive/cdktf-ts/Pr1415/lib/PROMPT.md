We need to set up a serverless AWS environment using CDK for Terraform (TypeScript). 
The code should be organized into two files:

1. `modules.ts` 
- Define all AWS resources as reusable modules here. 
- Include resources like Lambda functions, S3 buckets, IAM roles/policies, and CloudWatch Logs. 
- Add inline comments to explain what each resource does and why its needed. 
- Make sure resource names follow corporate conventions: prefix with `corp-` and use lowercase. 

2. `tap-stack.ts` 
- Instantiate the modules defined in `modules.ts`. 
- Pass in variables like Lambda function name, S3 bucket name, and VPC ID. 
- Configure outputs here. 
- Do not hardcode sensitive values use variables or environment references. 

---

### Requirements
- **Region:** Deploy everything in `us-east-1`. 
- **Lambda function:** 
- Triggered by uploads to the S3 bucket `image-uploads`. 
- Connected to an existing VPC: `vpc-123abc`. 
- Follow AWS best practices for serverless functions (timeouts, memory, logging). 
- **IAM:** 
- Create roles and policies granting the Lambda function read access to the S3 bucket. 
- Grant permission to write logs to CloudWatch Logs. 
- **S3:** The `image-uploads` bucket triggers the Lambda and must exist in the configuration. 
- **Naming:** All AWS resources must follow the corporate naming convention (`corp-` prefix, lowercase). 

---

### Deliverables
- `modules.ts`: All reusable resource definitions with comments explaining purpose and configuration. 
- `tap-stack.ts`: Module instantiation, variable wiring, outputs, and connection to VPC. 

---

### Expectations
- Stick to CDKTF TypeScript style with proper imports and type safety. 
- Keep modules flexible so additional Lambda functions or buckets can be added later. 
- Include clear comments to explain design choices. 
- Ensure the setup passes `terraform validate` and `terraform plan` without errors. 
- Follow AWS best practices for serverless deployments, IAM, and logging.