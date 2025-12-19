I need help creating infrastructure code for a product catalog service for an e-commerce platform in Brazil. The service should handle high traffic during events like Black Friday and comply with Brazilian data protection laws.

Requirements:
1. Use CDKTF with Python to define all infrastructure
2. Deploy everything in the sa-east-1 region for low latency to Brazilian customers
3. Create an ECS Fargate cluster to run the containerized catalog service
4. Set up ElastiCache Redis for caching product data with encryption at rest and in-transit for compliance
5. Use ElastiCache Serverless for automatic scaling without managing infrastructure
6. Configure AWS Secrets Manager to store sensitive configuration like database credentials
7. Set up an Application Load Balancer to distribute traffic to the ECS tasks
8. Create a VPC with public and private subnets across multiple availability zones for high availability
9. Configure security groups to control traffic between components
10. Use ECS Service Connect for simplified service-to-service communication
11. Make sure all data is encrypted and the setup follows security best practices

The infrastructure should be production-ready, scalable, and secure. Please provide the complete CDKTF Python code with all necessary imports and configurations.
