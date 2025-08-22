I need to create a scalable web application deployment on AWS using CDK TypeScript. The application should be production-ready with high availability features.

Requirements:
- Application Load Balancer with HTTPS listener using ACM certificate
- Auto Scaling group spanning at least 2 availability zones
- RDS database with Multi-AZ deployment for high availability
- S3 bucket for static assets and ALB access logs
- Route 53 for custom domain configuration
- IAM roles with least privilege access
- All resources tagged with Environment: Production
- Deploy in us-west-2 region
- Database password as secure stack parameter
- Enable Route 53 Application Recovery Controller readiness checks for improved resilience
- Use RDS storage autoscaling for cost optimization

Please provide the complete CDK TypeScript infrastructure code. Each file should be in a separate code block with the file path clearly indicated.