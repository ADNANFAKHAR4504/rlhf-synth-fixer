Hey team,

We need to build out infrastructure for a containerized web application that runs on AWS. The marketing agency has a client dashboard application built with Node.js that needs to be deployed with proper load balancing, auto-scaling, and database connectivity. They want this deployed to the ap-southeast-1 region using **CDKTF with TypeScript**.

The business wants a solution that can handle traffic spikes automatically and provides proper monitoring. Their application has a backend API that needs to connect to a PostgreSQL database, and they need everything containerized using ECS Fargate for easier management.

## What we need to build

Create infrastructure using **CDKTF with TypeScript** for deploying a containerized web application on AWS ECS Fargate with load balancing and RDS database connectivity.

### Core Requirements

1. **Networking Infrastructure**
   - VPC with public and private subnets across 2 availability zones
   - Internet Gateway for public subnets
   - NAT gateways to enable outbound internet access for private subnets
   - Proper route tables for both subnet types

2. **Container Orchestration**
   - ECS cluster using Fargate for serverless container management
   - ECR repository with lifecycle policies to retain only the last 5 images
   - ECS service running minimum 2 tasks
   - Container health checks using HTTP GET /health endpoint with 30-second intervals
   - Tasks must use AWS Linux 2 platform version LATEST

3. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Health checks configured for backend services
   - Stickiness enabled with 1-hour duration for session persistence
   - Deletion protection enabled

4. **Database**
   - RDS PostgreSQL instance using db.t3.micro
   - Deployed in private subnets for security
   - Automated backups configured
   - Encryption at rest enabled
   - Deletion protection enabled
   - Database password generated and stored in Secrets Manager
   - Removal policy set to SNAPSHOT (not DESTROY)

5. **Auto-Scaling**
   - ECS service auto-scaling configured for 2-10 tasks based on CPU utilization
   - Scale up when CPU usage is high
   - Scale down when CPU usage is low

6. **Security**
   - Security groups allowing ALB to communicate with ECS tasks on port 3000
   - ECS tasks only accessible from ALB
   - RDS only accessible from ECS tasks
   - All resources properly isolated in private subnets except ALB

7. **Configuration Management**
   - Environment variables for database connection in ECS task definition
   - Database credentials from Secrets Manager
   - All sensitive data properly secured

8. **Monitoring and Logging**
   - CloudWatch logs for container output
   - 7-day retention period for logs
   - Log groups properly configured for ECS tasks

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use AWS provider for all resources
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- All resources must be tagged with Environment=production and Project=client-dashboard
- Use removal policy DESTROY for all resources except RDS (use SNAPSHOT)

### Constraints

- NAT gateways required for private subnet outbound access (ECS tasks need to pull images from ECR)
- ECS service must use Fargate launch type (no EC2 instances)
- Container must expose port 3000 for the API
- ALB must be internet-facing in public subnets
- Database must not be publicly accessible
- All resources must be properly connected with correct security group rules
- Include proper error handling and validation in the code

## Success Criteria

- **Functionality**: Complete working infrastructure that deploys ECS Fargate service with ALB and RDS
- **Security**: Proper network isolation, encryption enabled, secrets managed correctly
- **Scalability**: Auto-scaling configured and working based on CPU metrics
- **Reliability**: Multi-AZ deployment for high availability
- **Resource Naming**: All named resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch logs configured with proper retention
- **Code Quality**: Clean TypeScript code, well-structured, properly documented

## What to deliver

- Complete CDKTF TypeScript implementation in lib/tap-stack.ts
- VPC with public and private subnets across 2 AZs
- ECS Fargate cluster and service with auto-scaling
- Application Load Balancer with health checks and stickiness
- RDS PostgreSQL instance with Secrets Manager integration
- ECR repository with lifecycle policies
- Security groups for ALB, ECS tasks, and RDS
- CloudWatch log groups with 7-day retention
- Environment variables configured in ECS task definition
- All resources properly tagged
- Documentation explaining the architecture and deployment
