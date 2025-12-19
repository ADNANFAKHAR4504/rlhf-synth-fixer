You are an expert AWS CloudFormation architect. Write a complete, production-grade CloudFormation template in JSON that provisions a secure and auditable AWS environment in the us-east-1 region with the following requirements:

1. VPC & Networking
   - Create a VPC with CIDR 10.0.0.0/16.
   - Create one public subnet (10.0.1.0/24) and one private subnet (10.0.2.0/24), each in us-east-1.
   - Create and attach an Internet Gateway to the VPC.
   - Route tables:
     - Public route table routes 0.0.0.0/0 to the Internet Gateway and is associated to the public subnet.
     - Private route table has no route to the internet and is associated to the private subnet.
2. S3 Logging Bucket
   - Create an S3 bucket for logs with server-side encryption using KMS (SSE-KMS).
   - Add a bucket policy that restricts access to trusted IPs only (parameterize the allowed CIDR list).
3. IAM Roles for EC2
   - Create an IAM role and instance profile for EC2 that grants read-only access to the logging bucket (e.g., s3:GetObject, s3:ListBucket scoped to that bucket).
4. CloudTrail
   - Enable a multi-region (or at least us-east-1) CloudTrail trail.
   - Deliver CloudTrail logs to the S3 logging bucket.
5. Security Groups
   - Create a Security Group for EC2 that allows SSH (22) only from specific IP addresses (parameterize allowed CIDRs). Deny all else by default.
6. KMS
   - Create or reference a KMS key managed via CloudFormation for S3 (and CloudTrail if needed). Ensure key policy allows required AWS services and the account to use it.
7. Best Practices
   - Tag all resources for identification and auditing (e.g., Environment=Production plus sensible Name tags).
   - No hard-coded credentials anywhere in the template.
   - Assume/enable rollback on failure for the stack.
8. Outputs
   - Output: VPC ID, Public Subnet ID, Private Subnet ID, and the Security Group ID.
9. Validation
   - The template must pass aws cloudformation validate-template.
     Use parameters for: trusted IP CIDRs (for S3 and SSH), bucket name prefix, and optional KMS key alias. Keep the template clear, strictly valid JSON, and ready to deploy.
