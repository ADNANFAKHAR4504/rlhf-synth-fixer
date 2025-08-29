Create a comprehensive AWS CDK infrastructure for a web application backend that includes:

1. VPC with multi-AZ configuration and proper subnetting (public, private, isolated)
2. RDS MySQL database with encryption, automated backups, and secrets management
3. Lambda functions for API processing and database operations
4. API Gateway with CORS configuration and comprehensive routing
5. S3 bucket for data storage and backups with lifecycle policies
6. Security groups with appropriate ingress and egress rules
7. IAM roles and policies following least privilege principle
8. CloudWatch logging for monitoring and troubleshooting
9. VPC Flow Logs for network analysis
10. All resources should support easy cleanup for development environments

Requirements:
- Use TypeScript for the CDK implementation
- Ensure all resources have unique naming to prevent conflicts
- Include proper error handling in Lambda functions
- Configure the infrastructure for high availability across multiple AZs
- Implement security best practices including encryption and access controls
- Provide comprehensive stack outputs for integration testing
- Structure the code for maintainability and following CDK best practices