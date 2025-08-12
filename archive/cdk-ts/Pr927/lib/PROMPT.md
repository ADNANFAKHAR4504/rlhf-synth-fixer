I need help creating AWS infrastructure that handles sensitive user data securely. Can you create CDK TypeScript code for the following requirements:

1. Set up S3 buckets with AES-256 encryption - make sure they're properly secured
2. Deploy EC2 instances in private subnets within a VPC - no public access
3. Create IAM roles with minimal permissions needed 
4. Enable comprehensive logging across all services for audit purposes

Also include some newer AWS security features like GuardDuty S3 Protection for malware scanning and Amazon Inspector for vulnerability scanning. The application will be deployed in us-east-1.

Please provide the infrastructure code in separate files that I can deploy.