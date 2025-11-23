# Deploy Customer Portal on ECS Fargate

Hey team,

We need to build the infrastructure for our fintech startup's customer portal application. The business wants this deployed as a containerized application on AWS using ECS Fargate. The application needs to handle variable traffic throughout the day, so we need proper load balancing and auto-scaling capabilities. They're asking for high availability across multiple availability zones to ensure the portal is always accessible to customers.

I've been asked to create this in Python using CDKTF. The platform team has already built the container image and pushed it to ECR, so we just need to handle the infrastructure side. The app needs to communicate with some backend services, so we'll need to configure a few environment variables for the containers.

## What we need to build

Create a container orchestration platform using **CDKTF with Python** for deploying a web application on AWS ECS Fargate with load balancing and auto-scaling.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 2 availability zones
   - Public subnets for the Application Load Balancer
   - Private subnets for ECS tasks (containers must not be publicly accessible)
   - NAT gateway for outbound internet access from private subnets

2. **Container Platform**
   - ECS cluster using Fargate launch type
   - Enable container insights for monitoring
   - ECS service with 2 desired tasks initially
   - Deploy containers from ECR repository: account-id.dkr.ecr.ap-southeast-1.amazonaws.com/webapp:latest
   - Container specifications: 512 CPU units and 1024 MiB memory
   - Use Fargate platform version 1.4.0 or latest compatible

3. **Load Balancing**
   - Application Load Balancer in public subnets
   - HTTP listener on port 80
   - Target group with health checks on /health endpoint
   - Health check intervals: 30 seconds
   - Health check timeout: 5 seconds
   - Enable sticky sessions with 1-hour duration

4. **Auto-Scaling**
   - Scale between 2-10 tasks based on CPU utilization
   - Scale-out threshold: 70% CPU
   - Scale-in threshold: 30% CPU
   - Cooldown period: 300 seconds

5. **Logging and Monitoring**
   - CloudWatch log groups with /ecs/customer-portal prefix
   - Log retention: 7 days
   - Container insights enabled for detailed metrics

6. **Container Configuration**
   - Environment variables: API_ENDPOINT, DB_CONNECTION_STRING, REDIS_HOST
   - Proper IAM roles for task execution and task operations

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to **ap-southeast-1** region
- Use **ECS Fargate** for serverless container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: resource-name-environment-suffix
- All resources must be taggable with proper metadata

### Constraints

- ECS tasks must run in private subnets only (no public IP assignment)
- ALB must use HTTP listener on port 80
- Container CPU must be 512 units and memory 1024 MiB
- CloudWatch logs must use /ecs/customer-portal prefix
- Auto-scaling cooldown period must be 300 seconds
- ALB stickiness must be enabled with 1-hour duration
- All resources must be destroyable (no Retain policies)
- Include proper error handling and security groups

### Resource Tagging

All resources must be tagged with:
- Environment: production
- Application: customer-portal

## Success Criteria

- **Functionality**: Complete ECS Fargate deployment with load balancing
- **High Availability**: Application accessible across 2 availability zones
- **Auto-Scaling**: Automatic scaling based on CPU metrics (2-10 tasks)
- **Monitoring**: CloudWatch logs and container insights enabled
- **Security**: Tasks in private subnets with proper security group rules
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Code Quality**: Clean Python code, well-structured, documented

## What to deliver

- Complete CDKTF Python implementation
- VPC with public/private subnets across 2 AZs
- ECS cluster with Fargate launch type
- ECS task definition with container specifications
- ECS service with desired count and auto-scaling policies
- Application Load Balancer with target group and health checks
- Security groups for ALB and ECS tasks
- IAM roles for ECS task execution and operations
- CloudWatch log groups with proper retention
- NAT gateway for private subnet internet access
- Proper resource tagging and naming conventions
