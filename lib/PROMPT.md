
---

You are tasked with creating a secure AWS infrastructure using **CloudFormation (YAML)**. The environment must strictly follow security best practices and meet compliance requirements.

**Requirements:**

1. All resources must be deployed in the **us-east-1** region.
2. Use **AWS KMS** to manage encryption keys for the RDS database.
3. Enable **CloudTrail** to capture **all management events**.
4. Create an **IAM role** that applies the **least privilege principle** when attaching policies.
5. Configure **S3 buckets** with **server-side encryption** and **logging enabled**.
6. Apply **tags** (`Environment`) to **all resources** for auditing purposes.

**Output:**
Write a CloudFormation template that provisions the infrastructure with these constraints. The template must deploy without errors and demonstrate compliance with all the requirements.

---

