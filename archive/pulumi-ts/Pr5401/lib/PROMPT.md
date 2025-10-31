Hey team,

We need to deploy a containerized product catalog API for our growing e-commerce platform. The business is seeing increased traffic and needs a robust, scalable solution that can handle variable load patterns efficiently. I've been asked to create this infrastructure using Pulumi with TypeScript to manage our AWS deployment.

The application team has their Node.js product catalog API containerized and ready to go in ECR. What they need from us is the complete infrastructure to run this service reliably in production with proper load balancing, auto-scaling, and observability. The service needs to handle customer requests 24/7 with minimal latency and automatic recovery from failures.

The business is concerned about costs, so we need to optimize where we can while maintaining reliability. They also want proper logging so the dev team can debug production issues quickly when they arise.

## What we need to build

Create a complete containerized application deployment using **Pulumi with TypeScript** for AWS ECS Fargate infrastructure.

### Core Requirements

1. **Network Infrastructure**
   - VPC with proper network isolation
   - 2 public subnets for load balancer across different availability zones
   - 2 private subnets for ECS tasks across different availability zones
   - NAT gateway for outbound connectivity from private subnets
   - Internet gateway for public subnet access

2. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Health checks configured on /health endpoint
   - Sticky sessions enabled using application-based cookies
   - HTTP traffic on port 80 from internet
   - Security groups allowing only necessary traffic

3. **Container Orchestration**
   - ECS cluster using Fargate launch type
   - ECS task definition with 512 CPU units and 1024 MB memory
   - Container configured to use 'product-catalog-api' image from ECR
   - ECS service with 3 desired tasks behind the load balancer
   - Tasks deployed in private subnets for security

4. **Auto Scaling**
   - Service auto-scaling configured between 3-10 tasks
   - Scaling triggers based on 70% CPU utilization
   - Fargate spot capacity for cost optimization with 50% base capacity

5. **Health and Monitoring**
   - Container health checks with 30-second intervals
   - 3 retry attempts before marking unhealthy
   - CloudWatch log group with 7-day retention for container logs
   - Proper log streaming from containers

6. **Outputs**
   - ALB DNS name for accessing the application

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS VPC for network isolation
- Use Application Load Balancer for traffic distribution
- Use ECS Fargate for container orchestration
- Use Application Auto Scaling for dynamic scaling
- Use CloudWatch Logs for centralized logging
- Use Security Groups for network access control
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to ap-southeast-1 region
- All resources tagged with Environment=production and ManagedBy=pulumi

### Constraints

- Security groups must restrict access appropriately (HTTP port 80 only from internet to ALB)
- ECS tasks must run in private subnets with NAT gateway for outbound access
- Container health checks required with specific thresholds
- Fargate spot capacity must be used for cost optimization
- All resources must be destroyable with no Retain policies
- Include proper error handling and logging throughout
- ALB must have sticky sessions configured

## Success Criteria

- Functionality: Complete deployment of containerized application with working load balancer endpoint
- Performance: Auto-scaling responds to CPU utilization maintaining 70% target
- Reliability: Health checks detect and replace unhealthy containers automatically
- Security: Network isolation with proper security group rules, tasks in private subnets
- Resource Naming: All resources include environmentSuffix for environment isolation
- Code Quality: TypeScript code that is well-structured, type-safe, and documented
- Observability: CloudWatch logs capturing container output with 7-day retention
- Cost Optimization: Fargate spot capacity properly configured with base capacity protection

## What to deliver

- Complete Pulumi TypeScript implementation with proper type definitions
- VPC with public and private subnets across multiple availability zones
- Application Load Balancer with health checks and sticky sessions
- ECS Fargate cluster with task definition and service
- Auto-scaling configuration based on CPU metrics
- CloudWatch log group for container logs
- Security groups with minimal required access
- NAT gateway and internet gateway for connectivity
- Unit tests for all infrastructure components
- Documentation with deployment instructions and architecture overview
- Output of ALB DNS name for application access
