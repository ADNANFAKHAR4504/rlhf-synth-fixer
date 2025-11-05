# Task: Web Application Deployment

## Background
A growing e-commerce company needs to deploy their new product catalog API to AWS. The application uses containerized microservices with PostgreSQL for data persistence and requires auto-scaling capabilities to handle peak shopping seasons.

## Problem Statement
Create a Pulumi Python program to deploy a containerized web application with database backend on AWS. The configuration must:

1. Create a VPC with 2 public subnets and 4 private subnets across 2 availability zones.
2. Set up an ECS cluster using Fargate launch type with a task definition for the Flask API container.
3. Deploy an RDS PostgreSQL instance (db.t3.micro) with Multi-AZ enabled and encrypted storage using AWS-managed keys.
4. Configure an Application Load Balancer in public subnets with target group pointing to ECS tasks.
5. Create an ECR repository with lifecycle policy to retain only the 5 most recent images.
6. Set up auto-scaling for ECS service with CPU-based scaling (target 70%, min 2, max 10 tasks).
7. Store database connection string in AWS Secrets Manager and reference it in ECS task definition.
8. Configure security groups to allow ALB to reach ECS tasks on port 5000, and ECS tasks to reach RDS on port 5432.
9. Enable CloudWatch Container Insights for the ECS cluster and set log retention to 7 days.
10. Output the ALB DNS name and ECR repository URI for CI/CD integration.

## Environment
Production deployment in us-east-1 with high availability requirements. Infrastructure includes ECS Fargate cluster running containerized Python Flask API, RDS PostgreSQL 14.x Multi-AZ database, Application Load Balancer distributing traffic across multiple containers. VPC with 2 public and 4 private subnets across 2 availability zones. NAT Gateways for outbound internet access from private subnets. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate permissions for ECS, RDS, VPC, IAM, ECR, and Secrets Manager services.

## Constraints
1. Use AWS Fargate for container orchestration without managing EC2 instances
2. Deploy RDS PostgreSQL in Multi-AZ configuration with encrypted storage
3. Configure Application Load Balancer with path-based routing for different API endpoints
4. Implement auto-scaling based on CPU utilization with minimum 2 and maximum 10 tasks
5. Store container images in ECR with lifecycle policies to keep only last 5 versions
6. Use AWS Secrets Manager for database credentials and inject them as environment variables
7. Enable CloudWatch Container Insights for monitoring and configure log retention to 7 days

## Expected Output
A fully functional Pulumi stack that deploys the web application infrastructure with proper networking, security, and monitoring configurations. The stack should output the load balancer URL for accessing the API and the ECR repository URI for pushing container images.
