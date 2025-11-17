Hey team,

We need to deploy a production-ready containerized product catalog API with a robust database backend. The business wants a scalable, highly available infrastructure that can handle variable traffic loads while keeping operational costs under control. I've been asked to create this infrastructure using **CloudFormation with JSON** format.

The product catalog API will serve as the backbone for our e-commerce platform, providing fast access to product information, inventory status, and pricing data. We need this infrastructure to be resilient, secure, and easy to manage, following AWS best practices throughout.

## What we need to build

Create a complete production infrastructure using **CloudFormation with JSON** for deploying a containerized product catalog API with database backend.

### Core Requirements

1. **Container Platform**
   - Deploy using ECS Fargate (serverless container deployment)
   - Auto-scaling configuration based on CPU and memory metrics
   - Health checks to ensure application availability
   - Task definition with appropriate CPU and memory allocations
   - Container image pulled from ECR or Docker Hub

2. **Database Backend**
   - Amazon RDS Aurora Serverless v2 or PostgreSQL for product data storage
   - Multi-AZ deployment for high availability
   - Automatic backups with minimum retention period
   - Encryption at rest enabled
   - Database credentials stored securely in Secrets Manager

3. **Networking Infrastructure**
   - VPC with public and private subnets across multiple Availability Zones
   - Internet Gateway for public subnet internet access
   - NAT Gateway for private subnet outbound connectivity
   - Security groups with proper ingress/egress rules following least privilege
   - Subnet isolation between application and database tiers

4. **Load Balancing**
   - Application Load Balancer (ALB) for distributing traffic
   - Target group with health check configuration
   - Listener rules for HTTP/HTTPS traffic routing
   - Public-facing ALB in public subnets

5. **Security and Access Management**
   - IAM roles for ECS task execution (pulling images, logging)
   - IAM task roles for application access to AWS services
   - Security groups restricting database access to ECS tasks only
   - Secrets Manager for database credentials with automatic rotation support
   - Encryption for data at rest and in transit

6. **Observability**
   - CloudWatch log groups for application logs
   - CloudWatch log groups for database logs
   - Log retention policies to manage costs
   - Container insights for ECS monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** for serverless container orchestration
- Use **RDS Aurora Serverless v2 or PostgreSQL** for database
- Use **Application Load Balancer (ALB)** for traffic distribution
- Use **Secrets Manager** for credential management
- Use **CloudWatch Logs** for centralized logging
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resourceType-environmentSuffix
- Deploy to **us-east-1** region (parameterized)
- Use CloudFormation Parameters for environment-specific configuration
- Use CloudFormation Outputs for resource references and endpoint URLs

### Constraints

- All resources must be destroyable (no DeletionPolicy: Retain)
- No deletion protection on databases (skip_final_snapshot equivalent)
- Security groups must follow least privilege principle
- Database must not be publicly accessible
- ECS tasks must run in private subnets
- ALB must be in public subnets
- Include proper error handling and logging throughout
- Keep costs reasonable by using serverless options where possible
- Support multiple environments (dev, staging, prod) via parameters

## Success Criteria

- **Functionality**: Complete containerized API deployment with working database connectivity
- **High Availability**: Multi-AZ deployment for both application and database tiers
- **Security**: Proper IAM roles, security groups, encryption, and secrets management
- **Scalability**: Auto-scaling for ECS service based on demand
- **Observability**: CloudWatch logs and metrics for monitoring application health
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Destroyability**: All resources can be fully deleted without manual intervention
- **Code Quality**: Valid JSON CloudFormation template, well-structured, documented with descriptions

## What to deliver

- Complete CloudFormation JSON template implementation
- VPC with public and private subnets in multiple AZs
- Internet Gateway and NAT Gateway for network connectivity
- Security groups for ALB, ECS tasks, and RDS database
- Application Load Balancer with target group and listener
- ECS cluster, task definition, and service with Fargate
- RDS Aurora Serverless v2 or PostgreSQL database instance
- Secrets Manager secret for database credentials
- IAM roles and policies for ECS task execution and task roles
- CloudWatch log groups for application and database logs
- CloudFormation Parameters for customization
- CloudFormation Outputs for important resource identifiers
- Documentation explaining the architecture and deployment process
