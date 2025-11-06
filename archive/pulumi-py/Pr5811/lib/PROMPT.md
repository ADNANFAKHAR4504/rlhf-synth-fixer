Hey team,

We have a growing e-commerce company that needs to deploy their new product catalog API to AWS. They've been running into scaling issues during peak shopping seasons, and they need a production-grade infrastructure that can handle variable load. The application is containerized using Docker and uses PostgreSQL as the backend database.

I've been asked to set this up using Pulumi with Python for our infrastructure as code. The business needs high availability with auto-scaling, proper security configurations, and comprehensive monitoring so the ops team can track what's happening in production.

The current setup is manual and doesn't scale well. During Black Friday last year, they had outages because they couldn't spin up new instances fast enough. We need to fix that with proper auto-scaling and a load balancer that can distribute traffic intelligently. They're also concerned about security - database credentials need to be properly managed, and all communication needs to be locked down with security groups.

## What we need to build

Create a containerized web application infrastructure using **Pulumi with Python** for an e-commerce product catalog API. This needs to be production-ready with high availability, auto-scaling, and proper monitoring.

### Core Requirements

1. Networking Infrastructure
   - VPC with 2 public subnets and 4 private subnets across 2 availability zones
   - Internet Gateway for public internet access
   - NAT Gateways for outbound internet from private subnets
   - Proper routing tables for public and private subnets

2. Container Orchestration
   - ECS cluster using Fargate launch type (no EC2 instance management)
   - Task definition for Flask API container running on port 5000
   - ECS service with auto-scaling configured (min 2, max 10 tasks)
   - CPU-based auto-scaling targeting 70% utilization
   - CloudWatch Container Insights enabled for monitoring

3. Database Layer
   - RDS PostgreSQL 14.x instance (db.t3.micro)
   - Multi-AZ deployment for high availability
   - Encrypted storage using AWS-managed keys
   - Deployed in private subnets

4. Load Balancing
   - Application Load Balancer in public subnets
   - Target group pointing to ECS Fargate tasks
   - Health checks configured for the API endpoints
   - Path-based routing for different API endpoints

5. Container Registry
   - ECR repository for storing Docker images
   - Lifecycle policy to retain only the 5 most recent images
   - Proper IAM permissions for CI/CD to push images

6. Security and Secrets
   - AWS Secrets Manager for database connection string
   - Database credentials injected as environment variables in ECS tasks
   - Security group allowing ALB to ECS tasks on port 5000
   - Security group allowing ECS tasks to RDS on port 5432
   - Security group allowing inbound HTTP/HTTPS to ALB

7. Monitoring and Logging
   - CloudWatch Container Insights for ECS cluster
   - CloudWatch log groups with 7-day retention
   - Log streams for each ECS task

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use AWS Fargate for ECS (serverless containers)
- Deploy to us-east-1 region
- PostgreSQL version 14.x on RDS
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain deletion policies)
- IAM roles and policies for ECS task execution and task roles
- Proper IAM permissions for accessing ECR, Secrets Manager, and CloudWatch

### Constraints

- Must use AWS Fargate - no EC2 instance management
- RDS must be Multi-AZ with encrypted storage
- Minimum 2 tasks, maximum 10 tasks for auto-scaling
- Auto-scaling based on CPU utilization at 70% target
- ECR lifecycle policy must keep only last 5 image versions
- CloudWatch log retention must be 7 days
- Security groups must follow least-privilege access model
- All sensitive data (database passwords) must use Secrets Manager
- Container insights must be enabled for production monitoring

## Success Criteria

- Functionality: Complete Pulumi stack that successfully deploys all AWS resources
- High Availability: Multi-AZ RDS, multiple ECS tasks across availability zones
- Auto-Scaling: ECS service scales between 2-10 tasks based on CPU load
- Security: Database credentials in Secrets Manager, proper security group isolation
- Monitoring: Container Insights enabled, logs retained for 7 days
- Resource Naming: All resources include environmentSuffix for unique identification
- Code Quality: Clean Python code, proper Pulumi resource definitions, well-documented

## What to deliver

- Complete Pulumi Python implementation with all resource definitions
- VPC with public and private subnets, Internet Gateway, NAT Gateways
- ECS Fargate cluster with auto-scaling service and task definition
- RDS PostgreSQL Multi-AZ instance with encryption
- Application Load Balancer with target group configuration
- ECR repository with lifecycle policy
- Secrets Manager secret for database credentials
- Security groups for ALB, ECS tasks, and RDS
- CloudWatch log groups and Container Insights configuration
- IAM roles for ECS task execution and task permissions
- Stack outputs: ALB DNS name and ECR repository URI
- Comprehensive unit tests for all Pulumi components
- Documentation with deployment instructions
