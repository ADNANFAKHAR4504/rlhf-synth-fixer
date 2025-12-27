We need to create a secure AWS environment using CDKTF with TypeScript. CloudTrail connects to an S3 bucket to write audit logs, with IAM roles controlling access between services. Security groups protect resources within the VPC and trigger alerts when rules change. Secrets Manager stores sensitive configuration that applications retrieve at runtime.

The code should be organized into two files:

1. `modules.ts`
 - Define all AWS resources as reusable modules here.
 - Include resources like VPC, IAM roles and policies, S3 buckets, Security Groups, CloudTrail, and Secrets Manager.
 - Add comments for each resource explaining its purpose and configuration.
 - Make sure security best practices are followed: encryption, least privilege, and logging.

2. `tap-stack.ts`
 - Import and instantiate the modules from `modules.ts`.
 - Pass in variables like allowed IP ranges for Security Groups and names for S3 buckets or Secrets.
 - Define outputs for key components: VPC ID, S3 bucket names, and IAM role ARNs.
 - Avoid hardcoding sensitive values - use variables or environment references.

---

### Requirements
- **Region:** Deploy everything in **us-west-2**.
- **VPC:** All resources must reside within a single VPC.
- **IAM:**
 - Roles must follow the principle of least privilege.
 - Define roles using IAM Policies.
- **S3:**
 - Buckets must use server-side encryption with AWS-managed KMS keys.
- **Security Groups:**
 - Allow inbound HTTP and HTTPS traffic **only from specified IP addresses**.
- **CloudTrail:**
 - Enable capture of all management events.
 - Log file validation must be turned on.
 - CloudTrail sends logs to the S3 bucket for audit storage.
- **Secrets Manager:**
 - Store all secrets and sensitive information securely.

---

### Deliverables
- `modules.ts`: Reusable resource definitions with comments explaining security configurations.
- `tap-stack.ts`: Module instantiation, variable wiring, and outputs.
- Code must be valid CDKTF TypeScript and pass `terraform validate` and `terraform plan`.

---

### Expectations
- Stick to CDKTF TypeScript conventions for imports, typing, and structure.
- Keep modules modular so new resources can be added later easily.
- Add clear comments to explain design choices and security rationale.
- Ensure all resources comply with AWS security best practices, encryption, and access control.
