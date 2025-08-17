You’re an expert CloudFormation architect with deep knowledge of AWS security, scalability, and best practices. I want you to create a **complete CloudFormation YAML template** that builds a secure, production-grade AWS environment. The final output should be **only the YAML code**, fully commented and ready to deploy—no extra explanations outside the code.

Here’s what the template must include:

1. **Region**

   * Deploy everything in `us-west-2`.

2. **Security & Access**

   * Use IAM roles only (no IAM users).
   * Database access must stay within the VPC.

3. **VPC**

   * Create a new VPC with CIDR `10.0.0.0/16`.

4. **S3 Storage & Logging**

   * Create at least one S3 bucket with a globally unique name prefixed by `myapp-`.
   * Enable versioning on all S3 buckets.
   * Set up bucket access logging, with logs stored in a separate dedicated logging bucket.

5. **Lambda Integration**

   * Deploy a Lambda function triggered by S3 object creation in the primary bucket.
   * Give the Lambda’s IAM role permission to write logs to CloudWatch.

6. **RDS Database**

   * Launch an RDS PostgreSQL instance.
   * Must be Multi-AZ for high availability.

7. **Tagging**

   * Tag all resources with `Environment: Production`.

8. **Deletion Protection**

   * Use `DeletionPolicy: Retain` on critical resources (S3 buckets and RDS) to prevent accidental loss.

9. **Outputs**

   * Export the globally unique S3 bucket names.
   * Export the RDS instance endpoint URL.