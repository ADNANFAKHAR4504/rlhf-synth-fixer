You are an expert AWS cloud infrastructure engineer specializing in Terraform (HCL) and enterprise-grade compliance.  
Your task is to generate fully functional HCL code that meets the following requirements. The output must be production-ready, syntactically correct, and pass `terraform validate` and `terraform plan` checks.

---

## **Infrastructure Requirements**

### **Environment**
1. All resources must be defined using AWS's provider.
2. Implement AWS KMS encryption for all data storage services; Amazon S3 must have default encryption enabled.
3. Set up an Amazon CloudFront distribution to serve all HTTP content over HTTPS only, using an AWS-managed certificate.
4. Use IAM roles to provision user access, restricting permissions to the principle of least privilege.
5. Set all S3 buckets to private; manage access via explicit bucket policies.
6. Enable logging for all AWS services that support logging.
7. Implement CloudWatch alarms to trigger notifications for **any failed attempts to modify IAM policies**.
8. Apply the tags `Environment`, `Owner`, and `Purpose` to **all** resources.

### **Naming Conventions**
- Use `<env>-<service>-<resource>` for **all** resource names.

### **Environments**
- Three distinct environments: `development`, `testing`, and `production`.
- Each environment should reside in its own AWS account.
- All deployments must target the `us-east-1` region.

---

## **Expected Output**
- Write **Terraform HCL** files that implement all the above requirements.
- Ensure:
  - Configurations are linted and free of syntax errors.
  - Code passes `terraform plan` validation against a simulated AWS account.
  - Code is modular and reusable, with separate configurations for each environment.
  - AWS KMS, S3, CloudFront, IAM, CloudWatch configurations meet the stated security constraints.
- Maintain consistent formatting, clear comments, and readable structure.

---

**Final Instruction:**  
Generate the complete HCL codebase, including:
- Provider configuration for multiple AWS accounts.
- Separate modules for storage (S3 + KMS), content delivery (CloudFront), identity management (IAM roles + policies), monitoring (CloudWatch alarms), and logging.
- Variables and outputs where appropriate.
- Example environment configurations (`development`, `testing`, `production`).

Return only the code, with inline comments explaining each resource’s purpose.
