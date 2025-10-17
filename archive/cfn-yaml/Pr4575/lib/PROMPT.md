### Prompt to Generate `TapStack.yml`

Create a **comprehensive AWS CloudFormation template named `TapStack.yml`** that builds a **brand-new secure AWS environment** following strict security best practices.

**Requirements:**

* The template must be fully self-contained — define every resource (no references to existing ones).
* Include **Parameters**, **Mappings**, **Resources**, and **Outputs** sections.
* All variable declarations and default values should be present inside the same file.
* The YAML must be clean, modular, and aligned with production best practices.

**Stack Name:** TapStack
**Naming Convention:** Prefix all resources with environment identifiers like `prod-` or `dev-`.

**Functional Requirements:**

1. **S3 Security:**

   * Create S3 buckets with server-side encryption using AWS-managed KMS keys.
   * Block all public access.
   * Enable versioning and access logging.

2. **IAM Configuration:**

   * Define IAM roles for EC2 instances (no IAM users).
   * Add a role with the least privilege policy for Lambda.
   * Enforce MFA for IAM users with console access (via IAM policy).

3. **EC2 and Networking:**

   * Create a new VPC (10.0.0.0/16) with public and private subnets in two AZs.
   * Attach an Internet Gateway to the public subnets.
   * Deploy NAT Gateways for private subnets.
   * Associate appropriate route tables for isolation.
   * Use Security Groups (no network ACL modifications) — allow SSH only from a controlled CIDR (e.g., 203.0.113.0/24).

4. **CloudTrail:**

   * Deploy CloudTrail with encryption enabled via KMS.
   * Store logs in an encrypted S3 bucket with access logging enabled.

5. **API Gateway:**

   * Create an API Gateway with access logging enabled for all stages.
   * Use a dedicated CloudWatch log group with retention defined.

6. **RDS:**

   * Deploy a MySQL or PostgreSQL RDS instance inside private subnets.
   * Ensure **PubliclyAccessible = false**.
   * Enable storage encryption with KMS.
   * Enable automated backups and deletion protection.

7. **Lambda:**

   * Create a Lambda function with least privilege IAM policy.
   * Ensure the Lambda uses encrypted environment variables and runs inside private subnets.

8. **KMS Management:**

   * Create a centralized KMS key for encrypting S3, RDS, CloudTrail, and Lambda data.
   * Include a proper key policy allowing necessary services to use it.

9. **Outputs:**

   * Export key identifiers like VPC ID, Subnet IDs, S3 bucket names, RDS endpoint, KMS Key ARN, and IAM Role ARNs.

**Additional Notes:**

* All encryption must use KMS (no AES256 defaults).
* Include CloudWatch log groups for monitoring API Gateway and Lambda.
* Keep resource logical IDs consistent, human-readable, and aligned with TapStack conventions.
* Ensure the YAML passes `cfn-lint` without errors and uses **CAPABILITY_IAM** for deployment.

**Deliverable:**
Provide a single YAML file named `TapStack.yml` implementing all of the above, ready to be deployed in a new AWS account with zero external dependencies.
