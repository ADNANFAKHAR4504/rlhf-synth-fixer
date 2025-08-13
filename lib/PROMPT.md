I need to create secure AWS infrastructure using CDK TypeScript with the following requirements:

1. Set up an S3 bucket with server-side encryption using AWS Managed Keys (SSE-S3), versioning enabled, and access restricted to a specific VPC and IAM role. The bucket should prevent public access.

2. Create a DynamoDB table with server-side encryption using AWS KMS, with access limited to one specific IAM role for querying operations.

3. Implement comprehensive logging using CloudTrail to record all API calls and resource interactions for both S3 and DynamoDB.

4. Ensure secure protocols only - HTTPS for S3 access and TLS for DynamoDB communications.

5. Include AWS Macie for data security classification and Amazon GuardDuty for continuous threat detection as latest AWS security features.

6. Tag all resources with 'Environment' set to 'Production'.

7. Deploy in ap-northeast-1 region.

8. Provide outputs for S3 bucket name and DynamoDB table ARN.

Please create CDK TypeScript infrastructure code that implements these security configurations following AWS best practices for 2025. Use one code block per file and ensure the implementation can be deployed successfully.