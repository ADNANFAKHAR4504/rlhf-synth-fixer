Create a secure and compliant AWS infrastructure setup using AWS CDK with TypeScript. The infrastructure should include:

1. An S3 bucket with default encryption enabled using AES-256. The bucket should have access logging configured to a specific logging bucket and must not be publicly accessible. Configure proper bucket policies for security compliance.

2. An EC2 instance deployed within a VPC with a security group that allows HTTPS traffic only on port 443. The instance must have a 'Project' tag with value 'Internal'.

3. A Lambda function with an IAM role that has least privilege permissions. The function should have permissions to trigger automatic backups to the S3 bucket with proper error handling and monitoring.

All resources should be deployed in the us-west-2 region and include the 'Project' tag with value 'Internal' for organizational requirements. The infrastructure should follow AWS security best practices and use recent AWS features like S3 Object Ownership controls and AWS Certificate Manager for TLS certificates.

Please provide the complete infrastructure code with one code block per file.