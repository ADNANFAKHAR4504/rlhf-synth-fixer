# ECS Fargate Containerized Microservices Platform

Hey team,

We have a financial services company that's been running their fraud detection microservices on EC2 instances, and they've decided it's time to containerize everything. These services process real-time transaction data and they need high availability with automatic scaling based on resource utilization. The business is looking for a robust, production-ready solution that can handle their critical workloads.

The system needs to be built using **Terraform with HCL** and deployed to the us-east-1 region. We're targeting AWS ECS with Fargate as the compute engine, which will give them the serverless container experience they're looking for without managing cluster capacity.

The architecture involves two core microservices - a fraud detection service and a transaction processor service. Both need to communicate with each other, scale independently based on their own metrics, and be highly available across multiple availability zones. We'll be using Application Load Balancer to distribute traffic and AWS Cloud Map for service discovery between the services.

## What we need to build

Create a containerized microservices platform using **Terraform with HCL** that deploys two services on AWS ECS Fargate with auto-scaling, load balancing, and service discovery capabilities.

### Core Infrastructure Components

1. **ECS Cluster Configuration**
   - Create an ECS cluster with capacity providers configured for Fargate and Fargate Spot
   - Enable Container Insights for enhanced monitoring and observability
   - Configure the cluster to support multiple services with independent scaling

2. **Microservices Deployment**
   - Deploy two ECS services named 'fraud-detection' and 'transaction-processor'
   - Create task definitions for each service with explicit CPU and memory limits
   - Configure services to span at least 2 availability zones for high availability
   - Each service must use Fargate launch type exclusively
   - Container images must be pulled from private ECR repositories only

3. **Load Balancing and Traffic Management**
   - Set up an Application Load Balancer to distribute incoming traffic
   - Create separate target groups for each service
   - Configure ALB listener rules to route traffic to the appropriate target groups
   - Implement health checks using HTTP endpoint /health with 30-second intervals

4. **Auto Scaling Configuration**
   - Define auto-scaling policies that scale based on average CPU utilization above 70%
   - Add additional scaling policies for memory utilization above 80%
   - Configure scaling to maintain between 2 and 10 tasks per service
   - Use CloudWatch metrics to trigger scaling actions

5. **Service Discovery**
   - Implement AWS Cloud Map for inter-service communication
   - Create a private DNS namespace for service discovery
   - Register both services with Cloud Map for seamless communication

6. **Container Registry**
   - Create ECR repositories for storing container images
   - Implement lifecycle policies to keep only the last 10 images
   - Ensure repositories are private with appropriate access controls

7. **IAM Roles and Permissions**
   - Configure task execution roles with permissions to pull images from ECR and write logs to CloudWatch
   - Create task roles with appropriate permissions for S3 and DynamoDB access
   - Follow least privilege principle for all IAM policies

8. **Logging and Monitoring**
   - Set up CloudWatch log groups for each service
   - Configure 7-day retention period for container logs
   - Enable log streaming from containers to CloudWatch Logs

9. **Network Security**
   - Define security groups that allow traffic only from the ALB to containers on port 8080
   - Configure security group rules for service-to-service communication
   - Ensure proper network isolation and security boundaries

### Technical Requirements

- All infrastructure must be defined using **Terraform with HCL**
- Use ECS with Fargate launch type exclusively
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${var.environmentSuffix}`
- Services must span at least 2 availability zones
- Task definitions must specify both CPU and memory limits explicitly
- Container logs must stream to CloudWatch Logs with 7-day retention
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation

### Networking and VPC Requirements

- VPC configured with 2 public and 2 private subnets across 2 availability zones
- NAT gateways to enable outbound internet access for containers in private subnets
- Containers deployed in private subnets for security
- Load balancer deployed in public subnets for external access

### Constraints

- ECS tasks must use Fargate launch type exclusively
- Container images must be pulled from private ECR repositories only
- Each service must have its own target group and ALB listener rule
- Task definitions must specify both CPU and memory limits explicitly
- Services must span at least 2 availability zones
- Auto-scaling must trigger between 2 and 10 tasks based on CloudWatch metrics
- Container logs must stream to CloudWatch Logs with 7-day retention
- Task execution role must have minimal permissions following least privilege
- Health checks must use HTTP endpoint /health with 30-second intervals
- All resources must be tagged with Environment and Project tags
- All resources must be destroyable without manual intervention

## Success Criteria

- **Functionality**: Both services deploy successfully and are accessible through the ALB
- **Scalability**: Auto-scaling policies respond correctly to CPU and memory metrics
- **High Availability**: Services maintain availability even during AZ failures
- **Service Discovery**: Services can communicate with each other using Cloud Map DNS
- **Security**: All traffic flows through defined security groups with proper restrictions
- **Monitoring**: Container logs are captured in CloudWatch with proper retention
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Well-structured HCL code with proper variable definitions and outputs

## What to deliver

- Complete Terraform HCL implementation with all required resources
- ECS cluster with Fargate capacity providers
- Two ECS services (fraud-detection and transaction-processor) with task definitions
- Application Load Balancer with target groups and listener rules
- Auto-scaling policies based on CPU and memory metrics
- AWS Cloud Map service discovery configuration
- ECR repositories with lifecycle policies
- IAM roles and policies for task execution and task access
- CloudWatch log groups with 7-day retention
- Security groups with proper ingress/egress rules
- VPC with public and private subnets across multiple AZs
- Variable definitions for environmentSuffix and other configurable parameters
- Output values for ALB DNS name, service endpoints, and ECR repository URLs
- Documentation covering deployment and usage