You are acting as an **AWS Solutions Architect**. Your task is to design a **secure AWS infrastructure** using **CloudFormation in YAML format** for a web application that adheres to strict enterprise security and compliance requirements.

As the architect, you are responsible for translating high-level security controls into deployable, verifiable AWS infrastructure.

You must submit a CloudFormation YAML template named:
**`secure_app_infrastructure.yaml`**

All resources must be provisioned in the **`us-east-1`** AWS region.

---
**Constraints & Requirements:**

1. **IAM Roles and Policies**

   * Define IAM **roles** (not just inline policies) to assign permissions.
   * Ensure all **EC2 instances** are associated with IAM roles that allow access **only to specific S3 buckets**.
   * IAM users must be restricted to **list actions only** for those specific buckets.

2. **Encryption & Sensitive Data Protection**

   * Use **AWS KMS** to encrypt sensitive data across all applicable services (S3, CloudTrail, etc.).
   * Ensure S3 buckets used for logs or data storage are encrypted using **KMS CMKs** and access-restricted.

3. **Access Controls**

   * Implement **IP address-based restrictions** in IAM policies using `Condition` blocks (e.g., `IpAddress`).
   * Enforce **Multi-Factor Authentication (MFA)** for all IAM users with AWS Console access.

4. **Monitoring & Logging**

   * Enable **AWS CloudTrail** to track changes to all IAM roles and policies.
   * Store CloudTrail logs securely in an encrypted, access-restricted S3 bucket.

5. **Key Rotation & Automation**

   * Define a **scheduled automation (e.g., EventBridge + Lambda)** to rotate IAM user credentials **every 30 days**.

6. **Network Security**

   * Use **Security Groups** to strictly control:

     * Inbound access (only necessary ports like 443)
     * Outbound traffic (deny all unless explicitly required)

---

**Expected Output:**
A complete **CloudFormation YAML template** named `secure_app_infrastructure.yaml` that:

* Validates using `aws cloudformation validate-template`
* Provisions infrastructure in `us-east-1`
* Satisfies **all security constraints**
* Implements encryption, access control, and logging as per best practices
* Is modular, readable, and production-ready

---

**Evaluation Criteria:**

* Correctness and validation of CloudFormation syntax
* Full alignment with the security constraints
* Adherence to AWS Well-Architected Framework best practices
* Ability to audit, enforce, and maintain secure infrastructure

---
