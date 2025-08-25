I need to set up a CI/CD pipeline using CDK with Python to automate deployment of a containerized web application to AWS Fargate. Here are my specific requirements:

1. Use CDK with Python to define all infrastructure components
2. Deploy the application on AWS Fargate for serverless container management 
3. Set up GitHub Actions CI/CD pipeline that triggers on main branch updates
4. Implement auto-scaling using AWS Auto Scaling to handle varying traffic loads
5. Use environment variables for sensitive data like API keys and database credentials
6. Include automated tests in the deployment pipeline to validate infrastructure and scaling

The solution should include:
- VPC with public and private subnets across multiple AZs
- Application Load Balancer to distribute traffic
- ECS cluster and Fargate service for running containers
- Auto Scaling configuration with CloudWatch metrics
- IAM roles and security groups with least privilege access
- CloudWatch logging and monitoring setup
- Environment variable management using AWS Systems Manager Parameter Store
- Integration with new AWS features like EBS volume support for Fargate and CloudWatch metrics for CodePipeline

Please provide the complete infrastructure code with proper error handling and security best practices. Target region is us-west-2.