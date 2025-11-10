Hey team,

We need to build infrastructure for our new customer portal that's launching next quarter. The business wants a three-tier web application with a React frontend, Node.js API backend, and PostgreSQL database. I've been asked to create this infrastructure using **AWS CDK with TypeScript** so we can manage it as code and make updates easily.

The architecture team has specified that we need complete separation between the frontend and backend components. The frontend will be served from S3 through CloudFront for global distribution, while the backend runs on ECS Fargate for container orchestration. They also want to support blue-green deployments down the road, so we need to architect this with that capability in mind.

One critical requirement from the DevOps team is that all resource names must include an environmentSuffix parameter. This lets us deploy multiple isolated environments without naming conflicts. So instead of hardcoded names like "MyBucket", we'll use patterns like "frontend-bucket-dev" or "api-cluster-staging".

## What we need to build

Create a three-tier web application infrastructure using **AWS CDK with TypeScript** that deploys a React frontend, Node.js API backend, and PostgreSQL database with proper networking, security, and monitoring.

### Core Requirements

1. **Networking Foundation**
   - VPC with public and private subnets across 2 availability zones
   - NAT Gateway for private subnet outbound connectivity
   - Proper routing tables for internet access and internal communication

2. **Database Layer**
   - RDS PostgreSQL instance with Multi-AZ deployment for high availability
   - Encryption at rest enabled for data security
   - Database credentials stored in AWS Secrets Manager
   - Deployed in private subnets for security isolation

3. **Backend API Layer**
   - ECS Fargate cluster for containerized Node.js application
   - Auto-scaling configuration between 2 and 10 tasks based on demand
   - Application configuration stored in AWS Systems Manager Parameter Store
   - Task definitions with proper IAM roles for AWS service access
   - Deployed in private subnets with load balancer access

4. **Load Balancing**
   - Application Load Balancer for distributing traffic
   - Path-based routing to separate frontend and backend traffic
   - Health checks configured for backend tasks
   - Access logs enabled for troubleshooting

5. **Frontend Distribution**
   - S3 bucket for hosting static React application files
   - CloudFront distribution with Origin Access Control for secure S3 access
   - Two behaviors: /* routes to S3 for frontend, /api/* routes to ALB for backend
   - Proper caching policies for static assets

6. **Configuration Management**
   - AWS Secrets Manager for sensitive data like database credentials
   - AWS Systems Manager Parameter Store for application configuration
   - Proper IAM permissions for ECS tasks to access both services

7. **Observability**
   - CloudWatch log groups for ECS container logs
   - ALB access logging for request analysis
   - Proper retention policies on log groups

8. **Resource Organization**
   - Environment and Project tags on all resources for cost tracking
   - Consistent naming convention using environmentSuffix throughout

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **VPC** for network isolation
- Use **RDS PostgreSQL** for the database layer
- Use **ECS Fargate** for containerized backend
- Use **Application Load Balancer** for traffic distribution
- Use **S3** for frontend static file hosting
- Use **CloudFront** for CDN distribution
- Use **Secrets Manager** for database credentials
- Use **Parameter Store** for application configuration
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable with no Retain policies

### Constraints

- Database must be deployed in private subnets only
- Backend ECS tasks must be in private subnets
- Frontend S3 bucket must only be accessible through CloudFront
- Database credentials must never be hardcoded
- All resources must support clean teardown for testing
- Include proper IAM policies following least-privilege principle
- Enable encryption for data at rest where applicable

## Success Criteria

- Infrastructure deploys successfully via CDK
- Frontend CloudFront distribution serves static content from S3
- Backend API accessible through ALB at /api/* path
- Database accessible only from backend ECS tasks
- Auto-scaling responds to load changes
- All logs flowing to CloudWatch
- Tags applied consistently across all resources
- Resource names include environmentSuffix for isolation
- Infrastructure can be completely destroyed without manual cleanup

## What to deliver

- Complete AWS CDK TypeScript implementation in lib/tap-stack.ts
- VPC with public and private subnets across 2 AZs
- RDS PostgreSQL with Multi-AZ and Secrets Manager integration
- ECS Fargate cluster with auto-scaling configuration
- Application Load Balancer with path-based routing
- S3 bucket and CloudFront distribution with proper OAC
- IAM roles and policies for ECS task execution
- CloudWatch log groups with proper retention
- Unit tests for all CDK constructs
- Clear documentation of deployment steps
