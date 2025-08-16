# Prompt: Secure-by-Design AWS Infrastructure via CloudFormation

**Role:** Senior DevSecOps Engineer
**Objective:** Generate a comprehensive CloudFormation YAML template named `secure_infra_main.yaml`. The template must provision a highly secure and compliant AWS environment, enforcing stringent security controls through Infrastructure as Code (IaC).

---

## Technical Requirements

1.  **General & Regional Configuration**
    * The infrastructure should be deplosssyable in AWS regions **us-east-1** and **eu-west-1**.
    * All provisioned resources must be tagged with `Project: SecureOps`.

2.  **VPC (Virtual Private Cloud)**
    * Provision a new VPC.
    * **Constraint:** Use AWS Config to create a rule that continuously validates that the VPC has the `enableDnsSupport` attribute set to `true`.

3.  **IAM (Identity and Access Management)**
    * **IAM Roles:**
        * Create at least two distinct IAM roles (e.g., `AppServerRole`, `LowSecurityReadOnlyRole`).
        * **Constraint:** None of the created IAM roles are permitted to have the `AdministratorAccess` AWS managed policy attached. Use least-privilege inline policies instead.
    * **IAM Tagging:**
        * The `LowSecurityReadOnlyRole` must be created with the tag `SecurityLevel` set to the value `Low`.

4.  **KMS (Key Management Service)**
    * Create a customer-managed KMS Key (CMK).
    * This KMS key is to be used for encrypting all data at rest for S3 and RDS.

5.  **Storage (S3)**
    * **Central Logging Bucket:**
        * Create a private S3 bucket for centralized logging from services like RDS.
        * The bucket must deny all public access.
        * **Constraint:** Data in this bucket must be encrypted at rest using the specified KMS CMK (SSE-KMS).
    * **Secure Data Bucket:**
        * Create a second S3 bucket for general data storage.
        * **Constraint:** Attach a bucket policy that **explicitly denies** all S3 actions (`s3:*`) if the requesting principal (IAM role) has a tag where the key is `SecurityLevel` and the value is `Low`.
        * **Constraint:** Data in this bucket must also be encrypted at rest using the same KMS CMK.

6.  **Database (RDS)**
    * Provision an RDS Database instance.
    * **Constraint:** All data stored within the RDS instance must be encrypted at rest using the specified KMS CMK.
    * **Constraint:** Enable log exports (e.g., `audit`, `error`, `general`) for the RDS instance, configuring them to be stored securely in the central logging S3 bucket.

---

## Best Practices

* **Security First:** Adhere strictly to the principle of least privilege for all IAM and resource-based policies.
* **Parameterize:** Use parameters for configurable values like database instance class, usernames, or CIDR ranges.
* **Clarity:** Use comments (`#`) within the YAML file to explain the purpose of major resources and complex policies.
* **Validation:** The final template must be valid and pass checks with `cfn-lint` and `aws cloudformation validate-template`.
* **Inline Policies:** Define all IAM and resource-based policies inline within the template for self-contained deployment and clarity.

---

##  Deliverables

* A single, syntactically valid **CloudFormation YAML** file that meets all the requirements and constraints listed above.
* The template should be organized into logical sections: `Parameters`, `Resources`, and `Outputs`.
* Include relevant outputs such as the S3 Bucket Names, RDS Endpoint Address, and the ARN of the KMS Key.

---