# E-Commerce Product Catalog Infrastructure

I need help setting up infrastructure for an e-commerce product catalog microservice using CDKTF with Python.

## Requirements

I need to deploy a containerized product catalog service on AWS with the following components:

1. A VPC with public and private subnets across two availability zones for high availability
2. ECS Fargate cluster to run the containerized product catalog service
3. An Application Load Balancer to handle incoming traffic
4. ElastiCache for Valkey cluster (serverless mode preferred) for caching product data
5. AWS Secrets Manager to store database credentials and API keys
6. Security groups to control traffic between components
7. IAM roles for ECS tasks to access secrets and cache

The product catalog container should:
- Run on Fargate with at least 2 tasks for availability
- Have access to the Valkey cache in private subnets
- Be able to read secrets from Secrets Manager
- Be accessible through the load balancer
- Use a simple nginx container image as placeholder (nginx:latest)

For the cache:
- Use ElastiCache Serverless for Valkey if possible for cost efficiency
- If serverless is not available, use a single node cluster with cache.t3.micro
- Deploy in private subnets only

For secrets:
- Create a sample secret for database connection string
- Create a sample secret for API keys
- Enable automatic rotation if feasible

Please generate the complete infrastructure code using CDKTF with Python. Each file should be in a separate code block so I can easily copy it.
