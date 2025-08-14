## CDK Stack for AWS Infrastructure

Your task is to act as a senior cloud infrastructure engineer specializing in secure, scalable, and reusable AWS deployments using with CDK

**Environment Overview:**  
Your organization manages multiple AWS accounts within a single AWS Organization, each representing a stage of the application lifecycle: development, staging, and production. All resources are provisioned in the `us-west-2` region. Required resources include VPCs, IAM roles, S3 buckets, and other essential AWS components.

**Requirements:**

1. **VPC Creation:**  
   - Deploy a VPC with a CIDR block of `10.0.0.0/16`.
   - Ensure VPC configuration supports common best practices for isolation and security.

2. **IAM Security:**  
   - Implement IAM roles with least privilege, granting only necessary permissions for each resource.
   - No excessive privileges are permitted.

3. **Resource Tagging:**  
   - Tag all AWS resources with `Environment`, `Owner`, and `Project` for governance and cost tracking.

4. **S3 Encryption:**  
   - Use AWS Key Management Service (KMS) to encrypt all S3 buckets at rest.

5. **API Logging:**  
   - Enable AWS CloudTrail to log all AWS API calls for compliance and auditing.

6. **Modular Structure:**  
   - Organize the configuration for to allow reuse.
   - Ensure modules are clean, maintainable, and adhere to the DRY (Don't Repeat Yourself) principle.

7. **Dynamic Resource Creation:**  
   - Use CDK to dynamically create resources based on input variables (e.g., accounts, environments, bucket lists).

8. **Security Best Practices:**  
   - Follow all AWS security audit recommendations (IAM, networking, encryption, logging, secrets management, etc.).
   - Do not hardcode any confidential data within the configuration files.

9. **Code Quality:**  
   - Ensure the CDK is reusable and passes any provided infrastructure correctness and security tests.

**Expected Output:**  
Produce a CDK stack in a single file with class name TapStack that, when applied, deploys the described infrastructure in AWS. All constraints and requirements must be clearly addressed. The solution should demonstrate expert-level practices in AWS security, modular CDK code, and scalable infrastructure design.

**Constraints Checklist:**  
- IAM roles must be least privilege.
- Use `for_each` for dynamic resource creation.
- Tag all resources with `Environment`, `Owner`, and `Project`.
- VPC CIDR block must be `10.0.0.0/16`.
- All S3 buckets must use AWS KMS encryption at rest.
- Strict adherence to the DRY principle in CDK code.
- CloudTrail must log all AWS API calls.
- Follow AWS security audit best practices.
- Do not hardcode confidential information in any file.

**Note:**  
You should deliver a production-ready CDK solution that is secure, scalable, and modular, demonstrating mastery of AWS deployment patterns and modern infrastructure automation with CDK
