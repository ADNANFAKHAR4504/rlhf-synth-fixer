I need to build a secure AWS infrastructure using Pulumi with TypeScript. The setup must be production-ready, strictly follow AWS security best practices, and be deployed in the 'ap-south-1' region. Here are the components I need:

1. Create an S3 bucket with server-side encryption enabled using an **AWS-managed KMS key** (`SSE-KMS` with the key managed by AWS for S3).
2. Provision an RDS instance with **encryption at rest using an AWS-managed KMS key**.
3. Implement an IAM policy that **restricts access to the S3 bucket to a specific IAM role only**, following the principle of least privilege.
4. Ensure all resource names follow the corporate naming convention: prefix with `'corp-'` followed by the resource type and a unique identifier (e.g., `corp-s3-acctingdata-123`).
5. All resources must be deployed in the `'ap-south-1'` AWS region.
6. Add a DynamoDB table configured with:
- **Provisioned throughput mode** ("warm" capacity) for predictable workloads.
- **Server-side encryption enabled**, using an **AWS-managed KMS key**.
- A global secondary index (GSI) for optimized querying.
- **Point-in-time recovery** and **deletion protection** enabled for production resilience.
- Proper tagging for compliance and traceability.

Please provide the Pulumi TypeScript code implementing this infrastructure. The code must be modular, validated, and adhere to naming, encryption, and access control best practices. Avoid boilerplate focus only on the infrastructure logic and the secure configuration of each resource.