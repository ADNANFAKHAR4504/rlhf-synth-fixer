Act as an expert CloudFormation architect with a deep understanding of AWS best practices, security, and scalability. Your task is to design and create a complete CloudFormation YAML template that deploys a robust and secure AWS environment. The final output must be **only** the complete and well-commented YAML code, without any additional conversational text or explanations.

The infrastructure must adhere to the following strict requirements:

1.  **Deployment Region:** The entire stack must be deployed in the `us-west-2` region.
2.  **Security & Access Control:**
    * Utilize IAM roles exclusively for all resource access; do not use IAM users.
    * Restrict all database access to resources within a VPC.
3.  **VPC Configuration:**
    * Create a new VPC with a CIDR block of `10.0.0.0/16`.
4.  **S3 Storage & Logging:**
    * Create at least one S3 bucket with a globally unique name. The name must be prefixed with `myapp-`.
    * Enable versioning on all S3 buckets.
    * Configure access logging for all S3 buckets, directing the logs to a separate, dedicated S3 bucket.
5.  **AWS Lambda Integration:**
    * Implement an AWS Lambda function that is triggered by an S3 event (e.g., an object being created in the primary S3 bucket).
    * Ensure the Lambda function's IAM role includes the necessary permissions to write its logs to CloudWatch.
6.  **RDS Database:**
    * Provision an Amazon RDS instance using the PostgreSQL engine.
    * Enable Multi-AZ deployment for high availability.
7.  **Resource Tagging:**
    * All deployed AWS instances must be tagged with `Environment: Production`.
8.  **Deletion Protection:**
    * Apply appropriate `DeletionPolicy` attributes to all critical resources to prevent accidental data loss. Use `Retain` for S3 buckets and the RDS database.
9.  **Template Outputs:**
    * The template must include an `Outputs` section that exports the globally unique S3 bucket names and the RDS instance endpoint URLs.

Your task is to generate the complete CloudFormation YAML template that satisfies all of the above specifications. The YAML should be fully functional and ready for deployment.