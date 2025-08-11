# Claude Sonnet Prompt: Harden AWS Environment with Pulumi & TypeScript

**Role:** You are an expert AWS Security Engineer and a senior TypeScript/Node.js developer specializing in hardening AWS environments using Infrastructure as Code (IaC). Your primary tool is Pulumi, and you are a strong advocate for policy-as-code and test-driven infrastructure development.

**Objective:** Generate a complete and production-ready Pulumi TypeScript project that defines and validates a secure AWS environment in the `us-east-1` region. The project must enforce strict security configurations on S3 buckets and IAM roles, implement the principle of least privilege, and include comprehensive tests to verify compliance.

---

### **High-Level Architecture Scenario**

You are tasked with managing infrastructure for multiple environments, specifically `development` and `production` based on the environmentSuffix variable. Your solution must leverage Pulumi's configuration system to easily switch between deploying these environments.

A strict naming convention of `<resource>-<environment>` (e.g., `app-data-development`) must be applied. Furthermore, all resources you provision must be tagged with `Department: Security` and `Project: PulumiIaCProject`.

---

### **Detailed Infrastructure & Security Requirements**

Your Pulumi code should be modular, promoting reuse and consistency across environments.

#### **Part 1: Secure S3 Bucket Component**

Create a reusable TypeScript class or a function that defines a "Secure S3 Bucket". This component must enforce the following security configurations by default:

1.  **Encryption:** Server-Side Encryption must be enabled using a customer-managed KMS key.
2.  **Versioning:** Versioning must be enabled to protect against accidental data deletion or modification.
3.  **Public Access:** All public access must be explicitly blocked.
4.  **Tagging:** The component must automatically apply the mandatory `Department` and `Project` tags.

In your main program, use this component to create two S3 buckets: one for `development` and one for `production`.

#### **Part 2: IAM Role with Least Privilege**

Define an IAM Role and an associated IAM Policy that demonstrates the principle of least privilege. This role is intended for an application that needs to read data from the S3 buckets.

1.  **IAM Role:**
    * The role must have a defined `path` (e.g., `/applications/`).
    * The `description` field must be populated to clearly state its purpose (e.g., "Read-only access to the application data bucket for the development environment").
2.  **IAM Policy (Connection):**
    * Create a dedicated, inline IAM policy for the role.
    * This policy must grant **only** the permissions necessary for reading objects: `s3:GetObject` and `s3:ListBucket`.
    * **Crucially**, the `Resource` clause of the policy must be scoped down to the **specific ARN** of the S3 bucket created for that environment. For example, the `development` role should *only* have access to the `development` bucket's ARN.

Create one such role and policy for the `development` environment and another for the `production` environment.

#### **Part 3: CloudWatch Auditing**

To satisfy the requirement for logging on CloudWatch resources, create the following setup for auditing purposes:

1.  **CloudWatch Metric Alarm:** Create a basic metric alarm that monitors a simple S3 metric, such as the number of objects (`NumberOfObjects`) in the `production` S3 bucket.
2.  **EventBridge Rule & Logging (Connection):**
    * Create an EventBridge (formerly CloudWatch Events) rule that triggers on any state change (`ALARM`, `OK`, `INSUFFICIENT_DATA`) from the metric alarm you just created.
    * Create a new CloudWatch Log Group.
    * Configure the EventBridge rule to send all matching events to this CloudWatch Log Group as its target. This ensures a persistent, auditable log of all alarm activities.

---

### **Mandatory Constraints Checklist**

Ensure your generated code explicitly implements every one of these constraints:

* **S3 Encryption:** All S3 buckets use customer-managed KMS keys for encryption at rest.
* **S3 Versioning:** Versioning is enabled on all S3 buckets.
* **IAM Role Metadata:** All IAM roles have a defined `path` and a descriptive `purpose` in the description field.
* **CloudWatch Logging:** An EventBridge rule captures alarm state changes and logs them to a CloudWatch Log Group.
* **Least Privilege:** IAM policies are narrowly scoped to specific actions (`s3:GetObject`) and resources (the specific bucket ARN for the environment).
* **Tagging & Naming:** All resources adhere to the specified tagging and naming conventions.

---

### **Expected Output Format**

* **Language:** TypeScript
* **Tool:** Pulumi