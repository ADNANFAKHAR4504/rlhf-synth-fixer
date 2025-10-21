# CDKTF Python Infrastructure for Learning Management System

I need to deploy a containerized Learning Management System on AWS using CDKTF with Python. The application serves educational content to students and needs to handle concurrent access with session persistence.

## Requirements

Create infrastructure code that includes:

1. A VPC with public and private subnets across at least 2 availability zones in ca-central-1 region
2. An ECS Fargate cluster to run the LMS containerized application
3. An Application Load Balancer to distribute traffic to the ECS tasks
4. An ElastiCache Redis cluster for session management and content caching with encryption at rest and in transit
5. AWS Secrets Manager to store database credentials and Redis connection details
6. Security groups configured appropriately for ALB, ECS tasks, and Redis cluster
7. Multi-AZ deployment for high availability
8. Automatic failover enabled for the Redis cluster

## Technology Stack

- CDKTF with Python
- AWS ECS Fargate
- ElastiCache Redis
- Application Load Balancer
- AWS Secrets Manager
- Deploy to ca-central-1 region

## Specific Requirements

- Use ElastiCache Serverless for Redis to simplify management and enable automatic scaling
- Enable encryption at rest and in transit for Redis
- Configure automatic failover with Multi-AZ deployment
- ECS tasks should use Fargate for serverless container management
- Store sensitive credentials in Secrets Manager
- Use security groups to restrict access between components
- ALB should be internet-facing to accept student traffic
- ECS tasks should be in private subnets
- Redis cluster should be in private subnets

Please provide the complete CDKTF Python code with one code block per file. Include all necessary imports and configurations.
