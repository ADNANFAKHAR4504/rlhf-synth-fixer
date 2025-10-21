# Healthcare SaaS Platform CI/CD Infrastructure

I need to build infrastructure for a patient management system that handles Protected Health Information. The system must meet HIPAA compliance requirements and deploy containerized applications securely

## Infrastructure Requirements

I need infrastructure that includes:

1. A VPC with both public and private subnets across two availability zones
2. NAT Gateway in the public subnet to allow private subnet resources to access the internet
3. An ECS cluster running Fargate tasks in the private subnets
4. A serverless Aurora PostgreSQL database in private subnets with automated backups
5. KMS encryption keys for encrypting data at rest
6. AWS Secrets Manager to store database credentials with automatic rotation every 30 days
7. Security groups that restrict access between components
8. IAM roles with least privilege access for ECS tasks

## Security and Compliance Requirements

The infrastructure must meet HIPAA compliance standards:

- All data must be encrypted at rest using AWS KMS customer managed keys
- Database connections must use SSL/TLS for encryption in transit
- Database credentials must be stored in AWS Secrets Manager and rotated automatically every 30 days
- ECS tasks must run in private subnets with no direct internet access
- Use NAT Gateway for outbound internet connectivity from private subnets
- Enable CloudWatch logging for all components
- Implement proper network segmentation using security groups

## Deployment Details

- Deploy in the us-east-1 region
- Use ECS with Fargate launch type for easier management
- Use Aurora Serverless v2 for the database to reduce costs and deployment time
- Enable automated backups with 7 day retention
- Configure managed rotation for database credentials in Secrets Manager
- Tag all resources with Environment and Application tags

## Latest AWS Features to Include

Use ECS built-in blue/green deployment capability for safer application updates. Configure Secrets Manager managed rotation for the RDS credentials to automatically handle the rotation without requiring a Lambda function.

Please provide the complete infrastructure code that creates all these resources with proper dependencies and security configurations. Each file should be in a separate code block with the filename clearly marked.
