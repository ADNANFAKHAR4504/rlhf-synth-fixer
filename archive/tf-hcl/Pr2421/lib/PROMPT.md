You are a Senior Cloud Engineer with expertise in AWS and Terraform.

Design a **Terraform** that provisions a multi-environment, consistent infrastructure across **us-east-1** and **us-west-2**. The solution must strictly follow AWS best practices and satisfy the following requirements:

### Requirements
1. Deploy resources in both **us-east-1** and **us-west-2** regions using conditions to handle regional differences.  
2. Include:
   - An **S3 bucket** with versioning enabled, public read access for listing objects, logging enabled to a separate audit bucket, and a dynamically generated unique name.  
   - An **RDS instance** of type `db.m5.large` deployed within a VPC, with **deletion protection enabled**, **detailed CloudWatch monitoring**, and rollback on any failure.  
   - An **EC2 instance** of type `t2.micro` with a Security Group allowing only SSH access from a specified IP range and inbound HTTP access.  
3. Use **IAM Roles** to grant the EC2 instance permission to access the S3 bucket.  
4. Apply **tags** to all resources, including at least `Environment` and `Project`.  
5. Ensure **no ARNs are hardcoded**. Use intrinsic functions such as `Fn::Join` for constructing complex names.  
6. Use **Parameters** for dynamic configuration of:
   - S3 bucket names  
   - EC2 security settings (e.g., allowed CIDR blocks)  
   - RDS credentials (ensuring secure storage of the master password)  
7. Ensure the template supports **stack updates without downtime**.

### Expected output:
- Write the Terraform configuration files in HCL format and ensure all constraints above are met.

File structure guidance:

provider.tf (already present)
- Contains the AWS provider configuration and S3 backend for remote state.
- Only modify if absolutely necessary (e.g., backend bucket/key changes, provider aliases for multi-region).

Multi-environment tip:
- For multiple regions (us-west-2 and us-east-1), define multiple provider aliases in provider.tf (e.g., aws.usw2, aws.use1).
- Reference them where needed in main code using `provider = aws.usw2` or `provider = aws.use1`.

lib/main.tf (single source of truth)
- Declare all `variable` blocks (including regions, allowed ingress CIDRs, tags, and any IDs/names required for the centralized logging account).
- Define all `locals` for names, tags, and toggles that implement the corporate naming policy and mandatory tags.
- Implement all resources directly (do not use external/remote modules) to satisfy items 1–12 above across both regions, including KMS CMKs where required.

Notes:
- Keep the configuration simple, concise, and high-level while fully implementing the listed requirements.