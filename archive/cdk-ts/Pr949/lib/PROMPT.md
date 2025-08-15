Create a secure production environment on AWS using CDK TypeScript. I need to deploy multiple integrated AWS services with the following requirements:

1. Deploy EC2 instances (t3.medium), RDS databases, S3 buckets, and Application Load Balancer
2. Encrypt all data at rest using KMS keys  
3. Set up IAM roles for services - no root account usage
4. Deploy across two availability zones for high availability
5. Restrict SSH access to EC2 instances to specific IP ranges
6. Ensure S3 buckets block all public access
7. Configure CloudWatch logging and monitoring for all services
8. Auto-scale EC2 instances when CPU utilization exceeds 70%
9. Use Application Load Balancer for traffic distribution
10. Create VPC with public and private subnets following security best practices
11. Configure RDS with Multi-AZ deployment and encryption in transit
12. Include CDK outputs for database connection strings and access keys

Use AWS Application Signals for enhanced application monitoring and AWS Shield network security posture management for network security analysis. Additionally, integrate AWS Lambda Powertools for TypeScript v2 for enhanced observability with structured logging, distributed tracing, and custom metrics collection. Implement Amazon VPC Lattice for secure service-to-service communication between application components without requiring traditional load balancers. Tag all resources with Environment:Production.

Please provide infrastructure code with one code block per file. Make sure all components integrate properly and follow AWS security best practices.