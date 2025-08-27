# PROMPT.md
---

## Situation
The organization requires a secure cloud infrastructure to host applications and services within **AWS (us-east-1)**. Currently, there is no standardized, codified approach to security configuration across services like **IAM, S3, RDS, Lambda, and CloudTrail**, which can expose the environment to risks of:
- Excessive IAM permissions.
- Unencrypted sensitive data in storage.
- Unrestricted network access.
- Lack of consistent logging and auditing.
- Overly broad Lambda execution roles.
- Weak MFA enforcement for IAM users with console access.

These gaps increase the likelihood of data breaches, compliance violations, and operational blind spots.

---

## Task
Design and implement a **CloudFormation template in YAML** that:
1. Codifies **security best practices** across IAM, S3, RDS, Lambda, and CloudTrail.
2. Applies the **principle of least privilege** with fine-grained IAM roles and policies.
3. Ensures **encryption of data at rest** using AWS KMS keys (for S3 buckets and RDS).
4. Defines **network security groups** restricting EC2 instance access only to specified IP ranges.
5. Enables **monitoring and auditing** by configuring S3 Bucket Logging and CloudTrail.
6. Restricts Lambda execution roles to explicitly defined resources only.
7. Enforces **MFA** for IAM users with AWS console access.

Constraints:  
- Policies **must not include wildcards** (`*` for Action/Resource) except where absolutely necessary.  
- Every storage service (S3, RDS) must have **KMS-based encryption**.  
- Security groups cannot default to `0.0.0.0/0`.  
- Logging and auditing must be immutable and centralized.  

---

## Action
Define a **CloudFormation YAML template** with the following components:

- **IAM Configuration**  
  - Roles with least-privilege policies for EC2, Lambda, and Admin.  
  - IAM users with console access enforced to use MFA (via policy condition `aws:MultiFactorAuthPresent`).  

- **KMS & Encryption**  
  - Create Customer Managed KMS Keys.  
  - Apply to all S3 buckets (`BucketEncryption`) and RDS (`StorageEncrypted: true`, with `KmsKeyId`).  

- **Security Groups (EC2)**  
  - Allow inbound traffic only from specified CIDR ranges passed as template parameters.  
  - Deny any open access except for whitelisted ranges.  

- **Logging & Auditing**  
  - Enable S3 access logging, targeting a dedicated logging bucket.  
  - Configure CloudTrail in **multi-region** with log storage in encrypted S3.  

- **Lambda Functions**  
  - Execution roles specify explicit resource ARNs (no `*`).  
  - Optional KMS key for Lambda environment variables containing sensitive config.  

Testing plan includes:
- Validating IAM policy structure.  
- Examining encryption settings.  
- Verifying restricted security groups.  
- Ensuring CloudTrail is enabled account-wide.  
- Checking Lambda resource scope.  

---

## Result
The resulting **CloudFormation YAML template** will:  
- Deliver a **secure, compliance-ready AWS environment**.  
- Enforce **data protection** through encryption, restricted access, and MFA.  
- Provide **auditing capability** using S3 logging and CloudTrail.  
- Ensure **operational resilience** by limiting IAM, EC2, and Lambda permissions to only what is required.  
- Be **ready for deployment** in `us-east-1` and pass AWS `cfn-lint` validation as well as manual inspection for security best practices.  
 

**Deliverable:** A **single CloudFormation YAML template** implementing all security requirements, validated against the acceptance tests.  
