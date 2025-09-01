You are an expert **AWS CDKTF (Cloud Development Kit for Terraform)** engineer.  
Please generate a **production-ready TypeScript implementation** that provisions secure and scalable AWS infrastructure in the **us-west-2** region.

---

## What the solution should include

### VPC & Networking
- Create a VPC with three subnets:
  - **Public subnet** (for the NAT Gateway).
  - **Private subnet** (for the EC2 instance).
  - **Isolated subnet** (for the RDS database).
- Ensure the EC2 instance in the private subnet can reach the internet through the NAT Gateway in the public subnet.

### Compute
- Launch an EC2 instance in the private subnet.
- Secure SSH access via IAM roles (no hardcoded keys).

### Storage
- Provision an S3 bucket with:
  - Versioning enabled.
  - Server-side encryption enabled.
- Grant EC2 and RDS IAM permissions to read from this bucket.

### Database
- Deploy a MySQL RDS database in the isolated subnet with:
  - Multi-AZ for high availability.
  - Automated backups enabled.
  - Encrypted storage.

### Security
- Configure IAM roles and policies so that EC2 and RDS can access S3.
- Follow the principle of least privilege for all access.

### Monitoring
- Enable CloudTrail logging across the infrastructure.

### Encryption
- Ensure encryption at rest is enabled for:
  - **S3**
  - **RDS**
  - **CloudTrail logs**

### Code Organization
- The implementation must be split into exactly two files:
  - `lib/tap-stack.ts` → Main stack file that imports and composes all modules.
  - `lib/modules.ts` → Contains reusable infrastructure components (VPC, S3, EC2, RDS, IAM, CloudTrail).

### Output Constraints
- Use AWS CDKTF with TypeScript.
- Follow AWS best practices for **security, monitoring, and high availability**.
- Use Terraform constructs from `@cdktf/provider-aws`.
- The code must synthesize and deploy without errors.
- Add inline comments for clarity.
- Ensure all resources are explicitly deployed in **us-west-2**.