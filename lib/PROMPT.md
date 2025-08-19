I need help setting up a cloud environment using AWS CDK TypeScript with proper environment separation and security best practices. Can you create the infrastructure code that includes the following components:

**Core Infrastructure Requirements:**
1. Set up separate configuration for production and staging environments
2. Deploy AWS EC2 instances with CloudWatch monitoring enabled
3. Create S3 buckets with versioning enabled and appropriate tagging
4. Establish RDS instances with encryption at rest
5. Configure IAM roles with least-privilege access principles
6. Implement security groups that only allow HTTP/HTTPS traffic
7. Deploy in us-west-2 region
8. Add 'Environment' and 'Owner' tags to all resources for identification

**Modern AWS Features to Include:**
9. Use AWS Systems Manager Parameter Store for environment-specific configuration management
10. Implement ECS Fargate service with Application Load Balancer using the ApplicationLoadBalancedFargateService construct for containerized workloads

**Technical Requirements:**
- Write CDK code in TypeScript using construct patterns for organization
- Ensure all resources support controlled destruction through 'cdk destroy'
- Enable encryption for all data at rest
- Use environment-specific configurations
- Implement basic CloudWatch monitoring for EC2 instances
- Structure the code for maintainability and best practices

Please provide the complete infrastructure code with one code block per file, making sure each file can be created by copy-pasting the content. Focus on creating a minimal but complete solution that meets all the requirements above.