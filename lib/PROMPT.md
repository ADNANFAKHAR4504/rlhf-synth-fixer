Create an AWS CDK TypeScript application that sets up a secure cloud environment with best practices. The infrastructure should include:

1. A VPC with public and private subnets across multiple availability zones
2. IAM roles and policies following least privilege principle 
3. EC2 instance deployed in the private subnet
4. Security group allowing SSH access from a specific IP range
5. S3 bucket with server-side encryption and versioning enabled

Requirements:
- Use us-west-2 region
- Follow organization naming convention with 'org-' prefix for all resources
- Deploy to AWS account 123456789012
- Implement AWS Security Hub controls for EC2 security compliance
- Use S3 Access Points with ABAC (Attribute-Based Access Control) for fine-grained permissions

The solution should generate CDK TypeScript code that passes 'cdk synth' validation and can be deployed with 'cdk deploy'. All infrastructure must follow AWS security best practices and production standards.

Please provide the complete infrastructure code with one code block per file.