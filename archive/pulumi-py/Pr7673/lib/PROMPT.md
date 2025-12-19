# Deploy Product Catalog API Service to AWS

Hey team,

We need to build a production-grade deployment solution for our e-commerce platform's product catalog API service. The business is growing fast, and we're seeing traffic spikes during sales events that our current setup can't handle reliably. I've been asked to create this infrastructure using **Pulumi with Python** to ensure we can scale automatically and maintain high availability across multiple availability zones.

The product team wants this service to handle unpredictable traffic patterns gracefully. During normal operations we might have modest traffic, but when we launch a flash sale or major promotion, we can see 5-10x traffic increases within minutes. The current monolithic deployment struggles with this, so we're containerizing the API and need infrastructure that can scale with demand while keeping costs reasonable during quiet periods.

The API itself is straightforward - it serves product information, pricing, and inventory data to our web and mobile apps. But it's absolutely critical for the business. If this goes down, customers can't browse products or make purchases. That's why we need proper monitoring and alerting built in from day one, not bolted on later.

## What we need to build

Create a containerized application deployment platform using **Pulumi with Python** for a production e-commerce API service in AWS us-east-1.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public and 3 private subnets across different availability zones for fault tolerance
   - Internet Gateway for public subnet connectivity
   - NAT Gateways in each availability zone for outbound traffic from private subnets
   - Proper routing tables and security groups

2. **Container Registry and Management**
   - ECR repository for storing Docker images
   - Lifecycle policy to automatically retain only the 5 most recent images
   - Proper IAM permissions for pushing and pulling images

3. **Container Orchestration**
   - ECS cluster using Fargate for serverless container management
   - Task definition configured with 1 vCPU and 2GB memory
   - Tasks deployed in private subnets for security
   - Proper IAM roles with least privilege access

4. **Load Balancing and Health Checks**
   - Application Load Balancer in public subnets
   - Target group with health checks on port 8080 using /health endpoint
   - Proper security groups allowing traffic flow

5. **Auto Scaling Configuration**
   - ECS Fargate service with minimum 2 tasks for high availability
   - Maximum 10 tasks for scaling during traffic spikes
   - Auto-scaling policy based on CPU utilization threshold of 70%
   - Scale-up and scale-down actions for cost efficiency

6. **Logging Infrastructure**
   - CloudWatch log groups for application logs
   - 7-day retention policy for cost management
   - Proper log streaming from containers

7. **Monitoring and Alerting**
   - CloudWatch alarm for CPU utilization above 80%
   - CloudWatch alarm for healthy task count below 2
   - Alarms should trigger notifications for operational response

8. **Secrets Management**
   - Systems Manager Parameter Store for database connection strings
   - Secure storage for API keys and sensitive configuration
   - Proper IAM permissions for ECS tasks to access parameters

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **ECS Fargate** for serverless container management
- Use **Application Load Balancer** for traffic distribution
- Use **VPC** with multi-AZ deployment for high availability
- Use **ECR** for container image storage
- Use **CloudWatch** for monitoring and logging
- Use **Auto Scaling** for dynamic capacity management
- Use **IAM** for access control
- Use **Systems Manager Parameter Store** for secrets management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- Resource names MUST include environmentSuffix parameter for uniqueness
- All resources MUST be fully destroyable (RemovalPolicy: DESTROY, no Retain policies)
- Use proper dependencies between resources (ALB before ECS service, VPC before subnets, etc.)
- ECS tasks should reference container images from the ECR repository
- Auto-scaling policies should be properly attached to the ECS service
- CloudWatch alarms should reference the correct metrics and dimensions

### Constraints

- Must use Pulumi Python SDK version 3.x or higher
- Deploy application using ECS Fargate for serverless container management
- Implement auto-scaling with minimum 2 tasks and maximum 10 tasks
- Use Application Load Balancer with health checks on /health endpoint
- ECR lifecycle policies must retain only last 5 images
- CloudWatch alarms required for high CPU (above 80 percent) and low healthy task count (below 2)
- Use Parameter Store for storing database connection strings and API keys
- Implement proper IAM roles with least privilege access for ECS tasks
- All resources must be tagged appropriately for cost tracking
- Include proper error handling and validation in the code
- Ensure tasks run in private subnets with ALB in public subnets
- NAT Gateways required for outbound connectivity from private subnets

## Success Criteria

- **Functionality**: Fully deployed web application accessible via ALB DNS name
- **High Availability**: Service runs across 3 availability zones with minimum 2 tasks
- **Auto Scaling**: Automatic scaling based on CPU utilization (70 percent threshold)
- **Monitoring**: CloudWatch alarms configured for CPU and task health
- **Security**: Tasks in private subnets, proper IAM roles, secrets in Parameter Store
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean Python code, well-structured, properly documented

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- VPC with public and private subnets across 3 availability zones
- ECR repository with lifecycle policy
- ECS cluster with Fargate task definition and service
- Application Load Balancer with target group and health checks
- Auto-scaling configuration (2-10 tasks, 70 percent CPU threshold)
- CloudWatch log groups and alarms
- Systems Manager Parameter Store parameters for secrets
- IAM roles and policies for ECS tasks
- Stack outputs: ALB endpoint URL and ECR repository URI
- README with deployment instructions and architecture overview
