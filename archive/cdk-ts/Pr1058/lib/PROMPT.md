I need help setting up a secure AWS infrastructure using CDK TypeScript that follows best practices. Here's what I'm trying to build:

I need a VPC with public and private subnets across two availability zones. The private subnets need NAT gateways for internet access but should be secured properly. I want to make sure the security groups and NACLs are configured to only allow necessary traffic.

For IAM, I need roles that follow least privilege principles. I'm also looking to secure S3 buckets with versioning and encryption enabled. Since this is for production use, I need proper state management using S3 backend with DynamoDB locking.

I want CloudWatch monitoring on all EC2 instances with custom metrics and logging for compliance purposes. The RDS databases should only be accessible from within the VPC and need encryption at rest.

For sensitive data, I'd like to use KMS for encryption. Also, I need this to work across two regions - us-east-1 and us-west-2 for high availability.

I've heard about the new AWS Security Hub enhancements and CloudWatch Investigations feature from 2025 - can you include those for better security monitoring and troubleshooting?

Everything should be properly tagged with Environment, ProjectName, and CostCenter tags. Please use the naming convention project-environment-resource.

Can you provide the infrastructure code with proper resource organization? I need the complete CDK TypeScript implementation that I can deploy.