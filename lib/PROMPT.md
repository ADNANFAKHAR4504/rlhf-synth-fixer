We need to set up a secure and resilient AWS environment using CDK for Terraform (TypeScript).  
The solution should be split into two files:

1. `modules.ts`  
   - Define reusable modules for VPC, EC2, S3, RDS, IAM, CloudTrail, CloudWatch, and Security Groups.  
   - Each resource must be clearly commented with its purpose and configuration details.  
   - Follow strict naming conventions: every resource must start with `corp-`.  
   - Add tags to all resources with `Department: IT`.  
   - Use variables for configurable values instead of hardcoding them.  

2. `tap-stack.ts`  
   - Instantiate the modules defined in `modules.ts`.  
   - Configure parameters such as VPC CIDR blocks, subnet counts, EC2 instance types, and S3 bucket names.  
   - Include outputs for key infrastructure components (VPC ID, subnet IDs, instance IDs, etc.).  
   - Enforce constraints directly where possible.  

---

### Requirements
- **Region:** Deploy all resources in `us-east-1`.  
- **VPC:**  
  - At least two public and two private subnets across multiple Availability Zones.  
  - Configure NAT gateway for outbound internet from private subnets.  
- **EC2:**  
  - Instances must be `m5.large` or larger.  
  - Attach IAM role with read-only access to S3.  
  - Attach Security Group allowing SSH only from `203.0.113.0/24`.  
  - Enable EBS volume encryption at rest.  
- **S3:**  
  - Buckets must have versioning enabled.  
  - Lifecycle policy to move objects to Glacier after 30 days.  
  - Encrypted at rest using AWS-managed KMS keys.  
- **IAM:**  
  - Implement least privilege.  
  - EC2 IAM role limited to read-only S3 access.  
- **RDS:**  
  - Multi-AZ deployment.  
  - Encrypted at rest.  
- **Logging & Monitoring:**  
  - Enable CloudTrail and store logs in a dedicated S3 bucket.  
  - Set up CloudWatch Alarms to trigger when CPU usage on any EC2 instance exceeds 80%.  
  - Ensure all services log to CloudWatch where possible.  
- **Compliance:**  
  - Use CloudFormation intrinsic functions equivalents in CDKTF (variables, outputs) to minimize hardcoding.  
  - Ensure all resources follow corporate naming convention: prefix `corp-`.  
  - All resources must include the `Department: IT` tag.  
- **Advanced:**  
  - Support StackSets equivalent for potential cross-account deployment.  

---

### Deliverables
- `modules.ts`: Resource definitions (VPC, EC2, S3, RDS, IAM, CloudTrail, CloudWatch) with comments and reusable patterns.  
- `tap-stack.ts`: Module instantiation, parameters, and outputs.  
- Code must be valid CDKTF TypeScript and pass `terraform validate` and `terraform plan`.  

---

### Expectations
- Adhere to AWS best practices for networking, encryption, IAM, and logging.  
- No resources exposed publicly except where explicitly allowed (e.g., controlled SSH).  
- Code should be modular and reusable for future environments.  
- Every requirement and constraint must be strictly enforced in code.  
