# Cloud Infrastructure for Containerized Web Application

Hey team,

We need to build infrastructure for a digital marketing agency's client management application. They've got a React frontend and a Node.js API backend that need to run on AWS with proper load balancing and auto-scaling. I've been asked to create this using **Pulumi with TypeScript** to handle their variable traffic loads throughout the day.

The business wants a fully managed containerized solution that can scale automatically based on demand. They're worried about handling traffic spikes when campaigns go live, and they need separate scaling for the frontend and backend since the API gets hit harder during reporting periods.

## What we need to build

Create a containerized web application deployment using **Pulumi with TypeScript** for AWS ECS with Fargate. The application should be accessible via HTTPS at app.example.com with intelligent routing between frontend and backend services.

### Core Infrastructure Requirements

1. **Container Orchestration**
   - Set up an ECS cluster using Fargate launch type for serverless container execution
   - Deploy frontend service with 2 desired tasks and auto-scaling between 2-10 tasks
   - Deploy backend API service with 3 desired tasks and auto-scaling between 3-15 tasks
   - Configure ECS task definitions with 512 CPU units and 1024 MB memory for each service

2. **Load Balancing and Routing**
   - Create an Application Load Balancer with HTTPS support using ACM certificate
   - Configure separate target groups for frontend (port 3000) and backend (port 8080)
   - Set up path-based routing where '/*' routes to frontend and '/api/*' routes to backend
   - Implement health checks for both services with 30-second intervals
   - Enable deletion protection on the ALB

3. **DNS and Networking**
   - Create Route53 A records for 'app.example.com' pointing to the ALB
   - Deploy infrastructure across 2 availability zones in eu-west-2 region
   - Set up VPC with public subnets for ALB and private subnets for ECS tasks
   - Configure security groups following least privilege - only required ports open

4. **Container Registry and Logging**
   - Use private ECR repositories for container images
   - Set up CloudWatch log groups for container logs with 7-day retention
   - Ensure ECS task execution role has minimal permissions for ECR and CloudWatch

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **eu-west-2** region
- Use Fargate launch type exclusively - no EC2 instances
- ECS services must use rolling update deployment with 200% max, 100% min healthy
- Container environment variables must be passed via ECS task definition
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- All resources must be destroyable for testing (no Retain policies, no DeletionProtection)

### Constraints

- All container images pulled from private ECR repositories only
- Security groups must follow least privilege principles
- ECS task execution role with minimal IAM permissions
- Use Pulumi stack outputs to display ALB DNS name and Route53 record
- Infrastructure must span exactly 2 availability zones
- Proper error handling and logging throughout

## Success Criteria

- **Functionality**: Web application accessible via HTTPS at app.example.com with frontend and backend properly routed
- **Scalability**: Auto-scaling configured for both services with appropriate min/max thresholds
- **Reliability**: Health checks working, rolling deployments configured, multi-AZ deployment
- **Security**: HTTPS enabled, private subnets for tasks, least privilege security groups and IAM roles
- **Monitoring**: CloudWatch logs configured with retention policy
- **Resource Naming**: All resources include environmentSuffix for uniqueness and proper identification
- **Code Quality**: TypeScript implementation with proper types, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation with proper project structure
- ECS cluster with Fargate launch configuration
- Application Load Balancer with HTTPS listener and path-based routing rules
- Two ECS services (frontend and backend) with auto-scaling policies
- Target groups with health check configuration
- VPC, subnets, and security groups for network isolation
- IAM roles and policies for ECS task execution
- CloudWatch log groups with retention policies
- Route53 DNS records pointing to ALB
- ECR repository configuration
- Pulumi stack outputs for ALB DNS and Route53 records
- Documentation for deployment and operation
