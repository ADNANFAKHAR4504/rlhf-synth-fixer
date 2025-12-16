# **IaC - AWS Nova Model Breaking**

## **Objective**
Design and deploy a secure AWS infrastructure for data storage using **AWS CloudFormation**, ensuring strict access control, encryption compliance, and adherence to AWS best practices through modular and maintainable templates.

---

## **Problem Statement**
You are tasked with designing a secure AWS infrastructure for storing sensitive data.  
The solution must use AWS CloudFormation to provision resources within the **us-west-2** region, implement **KMS-managed encryption** for all S3 buckets, and create **IAM roles with strict access permissions** to those buckets.  
The CloudFormation templates should be **modularized using nested stacks** to separate IAM, KMS, and S3 configurations for better maintainability and scalability.

---

## **Functional Requirements**
1. **IAM Role for S3 Access**  
   - Define an IAM role with **explicit allow** permissions for specific S3 buckets.  
   - Include **explicit deny** permissions for any other resources outside the defined scope.
   
2. **S3 Bucket Security**  
   - All S3 buckets must have **KMS-managed encryption keys** enabled.  
   - Buckets must block all public access by default.
   
3. **KMS Key Management**  
   - Create **AWS KMS-managed keys** specifically for S3 encryption.  
   - Restrict KMS key usage to only the defined S3 buckets and IAM role.
   
4. **AWS Region Enforcement**  
   - All resources must be deployed **exclusively** in the `us-west-2` region.
   
5. **CloudFormation Best Practices**  
   - Use **nested stacks** to separate resource definitions:
     - One stack for **IAM role definitions**.
     - One stack for **KMS key configurations**.
     - One stack for **S3 bucket configurations**.

6. **Single Template Structure**
   - Create a **single CloudFormation YAML template** that contains all resources
   - Do NOT use separate nested stack files or external S3 template storage

---

## **Constraints**
- Use AWS IAM to define a role with **permissions limited to accessing S3 buckets only**.
- Encrypt all S3 bucket data at rest using **AWS KMS-managed keys**.
- Deploy all resources **only** in the `us-west-2` region.
- Apply **CloudFormation modularization** by splitting configurations into **nested stacks** for IAM, KMS, and S3 resources.
- Use **explicit allow and deny statements** in IAM policies to enforce security boundaries.

---

## **Deliverable**
- A **CloudFormation template in YAML** that:
  - Creates the required infrastructure following the **least privilege principle**.
  - Implements **KMS encryption** for all S3 buckets.
  - Organizes resource creation using **nested stacks** for IAM, KMS, and S3.
  - Is deployable in **us-west-2** without modifications.
- The deployment must pass a **compliance verification test suite** ensuring:
  - Correct IAM permissions.
  - Proper KMS encryption configuration.
  - Region enforcement.
  - Modular template structure.