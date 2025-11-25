# Deploy Containerized Inventory Management Application

Hey team,

We need to build infrastructure for our retail company's inventory management web application. The business has asked us to deploy a highly available Node.js backend API that can handle variable traffic patterns throughout the day. I've been tasked to create this using **CloudFormation with JSON**.

The application needs to run in containers on ECS Fargate, backed by a resilient Aurora MySQL database. The business requires high availability across multiple availability zones and wants to support automated deployments. Traffic needs to be distributed through an Application Load Balancer with path-based routing for API and health check endpoints.

Security is important here - database credentials must be stored in Secrets Manager, and we need proper IAM roles for the ECS cluster to access ECR and CloudWatch Logs. The infrastructure needs to be production-ready and deployed in us-east-1 across three availability zones.

## What we need to build

Create a highly available containerized web application infrastructure using **CloudFormation with JSON** for a retail inventory management system.

### Core Requirements

1. **Container Orchestration**
   - ECS cluster
   - Task definition configured with 1 vCPU and 2GB memory
   - Health check configurations with custom thresholds

2. **Database Layer**
   - RDS Aurora MySQL cluster with one writer instance
   - Deletion protection disabled for destroyability
   - Connection string stored in Secrets Manager

3. **Networking**
   - VPC with 2 public and 2 private subnets across different availability zones
   - NAT Gateways for outbound internet access from private subnets
   - Application Load Balancer in public subnets
   - ECS cluster and RDS in private subnets

4. **Security and Access**
   - IAM task execution role with permissions for ECR and CloudWatch Logs
   - Database credentials in Secrets Manager with automatic rotation disabled
   - Security groups for ALB, ECS cluster, and RDS

5. **Optional Enhancements** (if time permits)
   - CloudFront distribution for static asset caching
   - SNS topic for deployment notifications
   - Route 53 hosted zone with custom domain

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** for container orchestration
- Use **RDS Aurora MySQL** for data persistence
- Use **Application Load Balancer** for traffic distribution
- Use **Secrets Manager** for database credentials
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{ResourceType}-{EnvironmentSuffix}`
- Deploy to **us-east-1** region across 3 availability zones
- All resources must be tagged for cost tracking

### Deployment Requirements (CRITICAL)

- **Resource Naming**: All resources MUST accept and use an `EnvironmentSuffix` parameter to ensure unique naming across deployments
- **Destroyability**: Set RDS deletion protection to false. Do NOT use Retain deletion policies. All resources must be destroyable via stack deletion
- **Dependencies**: Configure proper DependsOn relationships between resources
- **Outputs**: Include ALB DNS name and RDS endpoint as stack outputs

### Constraints

- All resources must use specific naming conventions with environment prefixes
- ECS cluster
- Application Load Balancer must implement path-based routing for /api/\* and /health
- Database credentials must be stored in AWS Secrets Manager with automatic rotation disabled
- CloudFormation stack must include custom resource tags for cost tracking
- Infrastructure must support automated deployments and blue-green deployment patterns

## Success Criteria

- **Functionality**: ECS successfully runs containers with database connectivity
- **Performance**: Load balancer distributes traffic across multiple availability zones
- **Reliability**: Infrastructure survives single AZ failure
- **Security**: Database credentials secured in Secrets Manager, proper IAM roles configured
- **Resource Naming**: All resources include EnvironmentSuffix parameter
- **Code Quality**: Valid JSON CloudFormation template, well-documented

## What to deliver

- Complete CloudFormation template in JSON format
- ECS Fargate cluster configuration
- RDS Aurora MySQL cluster with proper networking
- Application Load Balancer with path-based routing
- VPC with public and private subnets
- IAM roles and security groups
- Secrets Manager configuration
- Stack outputs for ALB DNS name and RDS endpoint
- Deployment instructions and documentation
