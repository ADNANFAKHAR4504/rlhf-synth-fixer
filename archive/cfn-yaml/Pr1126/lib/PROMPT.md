**Prompt:**

 You are an AWS Solutions Architect with expert-level CloudFormation YAML skills.

 Create a **production-ready AWS CloudFormation template** in **YAML format** that fully meets the following requirements:

 **Environment & Region**

 * Deploy all resources in `us-west-2`.
 * Use a dedicated and isolated VPC with CIDR `10.0.0.0/16`.
 * Tag all resources with `Environment: Production`.

 **S3 Configuration**

 * Create S3 buckets with **globally unique names starting with `myapp-`**.
 * Enable **versioning** and **server access logging** for all buckets.
 * Ensure all bucket access logging is sent to a dedicated logging bucket.
 * Apply **DeletionPolicy: Retain** to prevent data loss.

 **IAM & Security**

 * Use **IAM roles** (not users) for all resource access.
 * Create a Lambda execution role with permissions to:

   * Read from S3
   * Write logs to CloudWatch

 **Lambda Function**

 * Deploy at least one AWS Lambda function triggered by an **S3 event** (e.g., object created).
 * Ensure it writes operational logs to CloudWatch.

 **RDS (PostgreSQL)**

 * Create an **RDS PostgreSQL** instance with **Multi-AZ** enabled.
 * Restrict DB access to the VPC only.
 * Apply **DeletionPolicy: Snapshot** for the RDS instance to prevent accidental data loss.

 **Outputs**

 * Output all S3 bucket names created.
 * Output the RDS endpoint URL.

 **Constraints**

 * Follow AWS best practices for security and least privilege.
 * Ensure all resources comply with Production readiness.

 **Deliverable**: Provide a complete **CloudFormation YAML file** implementing all the above, with inline comments explaining key configurations.

