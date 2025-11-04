**Functional Scope (build everything new):**

* **KMS Key Creation:**

  * Create a new customer-managed KMS key with automatic rotation enabled to encrypt sensitive data.
  * The key policy must restrict key usage to specific AWS services and prevent root account access.
  * The KMS key will be used to encrypt data in Systems Manager Parameter Store and CloudWatch Log Groups.

* **IAM Roles for Teams:**

  * Define IAM roles for developers and operations teams with least-privilege permissions.
  * Implement boundary policies to prevent privilege escalation for both teams.
  * Create MFA enforcement for all delete operations on critical resources.

* **Cross-Account Access:**

  * Set up cross-account assume role policies, allowing access from a central security account (123456789012).

* **Systems Manager Parameter Store:**

  * Create encrypted entries in Systems Manager Parameter Store for storing database credentials.
  * Ensure the encryption uses the newly created KMS key.

* **CloudWatch Logs:**

  * Set up CloudWatch Log Groups with KMS encryption for audit trails.
  * Configure the retention period for 90 days and ensure only authorized users can access the logs.

* **Service-Linked Roles:**

  * Define service-linked roles for AWS Config and CloudTrail alternative logging.

* **Resource Tagging:**

  * Implement mandatory resource tags for compliance tracking:

    * `Environment`
    * `Owner`
    * `Classification`
  * Ensure tags are applied to all security resources.

* **IAM Password Policy:**

  * Implement an IAM password policy requiring passwords to be at least 14 characters long and have complexity requirements.

* **SNS Topic for Security Alerts:**

  * Create an SNS topic with KMS encryption to send security alerts.

**Deliverable:**

* A complete YAML CloudFormation template (`TapStack.yml`) that creates all the required security resources with proper dependencies and outputs.
* The template should:

  * Include all variables, existing values, and logic.
  * Create all resources from scratch and not reference any existing modules or stacks.
  * Use CloudFormation intrinsic functions for dynamic resource naming, with an `ENVIRONMENT_SUFFIX` to ensure naming conflicts are avoided between deployments.
  * Follow best practices for IAM, encryption, and audit logging.
  * Include outputs for key ARNs that can be used by other stacks.

**CloudFormation Template Logic:**

* **Variables and Parameters:**

  * Parameters for environment name and account IDs.
  * Use dynamic resource naming with `ENVIRONMENT_SUFFIX`.

* **IAM Policies and Roles:**

  * Policies that enforce least privilege and explicitly deny unauthorized actions.
  * Boundary policies that prevent privilege escalation for developers and operations teams.

* **KMS Key and Encryption:**

  * Ensure all encrypted resources use customer-managed KMS keys.
  * KMS key policy restricts usage to specified services and prevents root access.

* **Cross-Account Role Assumption:**

  * Include assume role policies for cross-account access from a central security account.

* **Audit Logging:**

  * Create CloudWatch Log Groups with KMS encryption and a 90-day retention period.
  * Ensure IAM roles have permissions to manage CloudWatch logs.

* **Compliance Tracking:**

  * Tag all resources with `Environment`, `Owner`, and `Classification` for compliance.

The template should be designed with scalability and reusability in mind, adhering to AWS best practices for security, encryption, and access management.
