Hey team,

We have an exciting project from a financial services company that's modernizing their trading application. They're moving away from their monolithic architecture to containerized microservices running on AWS ECS Fargate. This is a production environment that will handle real customer trading data, so we need to build it with enterprise-grade security, high availability, and observability from day one.

The business is looking for a multi-service architecture with strict isolation requirements between different customer workloads. They want automatic scaling based on demand, comprehensive logging for audit compliance, and the ability to do blue-green deployments without downtime. The infrastructure team has specifically requested that we use **Pulumi with TypeScript** for all infrastructure code.

Their application consists of three main services: a web frontend that customers interact with, an API gateway that handles authentication and routing, and a processing service that executes trades. Each service needs to be independently scalable and must communicate through secure internal channels only. The company operates in the us-east-1 region and needs everything deployed across multiple availability zones for resilience.

## What we need to build

Create a complete containerized microservices platform using **Pulumi with TypeScript** that orchestrates a multi-service application on ECS Fargate with full production-grade features.

### Core Infrastructure Requirements

1. **Network Foundation**
   - VPC spanning 3 availability zones for maximum resilience
   - Public subnets for load balancers in each AZ
   - Private subnets for container workloads in each AZ
   - Proper routing tables configured for public and private subnet tiers
   - NAT gateways deployed for outbound connectivity from private subnets
   - Internet gateway attached for public subnet internet access

2. **Container Registry**
   - ECR repositories for three services: frontend, api-gateway, and processing-service
   - Tag immutability enabled to prevent accidental overwrites
   - Lifecycle policies to manage image retention and control costs
   - Proper IAM permissions for ECS task execution role to pull images

3. **ECS Cluster Configuration**
   - ECS cluster with capacity providers configured
   - Fargate capacity provider for on-demand workloads
   - Fargate Spot capacity provider for cost-optimized non-critical tasks
   - Proper capacity provider strategy weights

4. **Task Definitions and Services**
   - Task definition for frontend service with appropriate CPU and memory allocations
   - Task definition for api-gateway service with its resource requirements
   - Task definition for processing-service with backend-appropriate resources
   - Environment variables configured for each service
   - ECS services with desired count configured
   - Auto-scaling policies based on CPU utilization with min 2 and max 10 tasks
   - Health check grace periods configured appropriately for each service

5. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Target groups created for frontend and api-gateway services
   - HTTP/HTTPS listeners configured on ALB
   - Health check configurations with appropriate thresholds for each target group
   - Cross-zone load balancing enabled

6. **Service Discovery**
   - AWS Cloud Map namespace for internal service communication
   - Service discovery services registered for each ECS service
   - DNS-based service discovery configuration for backend services

7. **IAM Configuration**
   - Task execution roles with permissions to pull ECR images and fetch secrets
   - Task roles with service-specific permissions following least privilege
   - Separate IAM roles for each service type with only required permissions
   - Policies allowing CloudWatch Logs access

8. **Logging and Monitoring**
   - CloudWatch log groups for each ECS service
   - 30-day retention policy on all log groups
   - Container logging drivers configured in task definitions
   - Proper log stream prefixes for organization

9. **Secrets Management**
   - AWS Secrets Manager secrets for application configuration
   - Database credentials stored in Secrets Manager
   - API keys stored in Secrets Manager
   - Task definitions reference secrets securely without exposing values

10. **Security Groups**
    - Security group for ALB allowing internet traffic on ports 80 and 443
    - Security group for frontend containers allowing traffic only from ALB
    - Security group for api-gateway containers with internal-only access
    - Security group for processing-service containers isolated from public traffic
    - Strict ingress and egress rules between service tiers

11. **Stack Outputs**
    - ALB DNS name for accessing public-facing services
    - Service ARNs for all three ECS services
    - Cluster name and ARN
    - VPC ID and subnet IDs for integration with other stacks
    - ECR repository URLs for CI/CD integration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{service-name}-{environmentSuffix}`
- Use Pulumi AWS Classic provider v6.x or higher
- Multi-AZ deployment across 3 availability zones
- All resources must be destroyable (no Retain deletion policies or deletion protection)

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix parameter to prevent naming collisions
- Pattern for resource names: `{service}-{environmentSuffix}` or `{resource-type}-{environmentSuffix}`
- No RemovalPolicy.RETAIN or deletionProtection flags allowed
- All resources must support complete stack teardown after testing
- Blue-green deployment capability through ALB target group configurations
- Support for traffic shifting during deployments

### Constraints

- Each service must run in its own ECS task definition with specific CPU and memory allocations
- Frontend service: 512 CPU units, 1024 MB memory
- API Gateway service: 1024 CPU units, 2048 MB memory
- Processing service: 2048 CPU units, 4096 MB memory
- Task execution roles must follow least-privilege principle with service-specific permissions
- Services must communicate through internal load balancers or service discovery only
- Secrets must be stored in AWS Secrets Manager and injected as environment variables
- Network isolation must prevent direct internet access for backend services
- Container logs must stream to CloudWatch Log Groups with 30-day retention
- Container images must be stored in private ECR repositories with lifecycle policies
- Health checks must be implemented with specific thresholds for each service type
- Auto-scaling must be configured based on CPU utilization with min 2 and max 10 tasks per service
- No hardcoded values - all configuration through environmentSuffix parameter
- Proper error handling and comprehensive logging throughout

### Security and Compliance

- IAM roles with least-privilege access
- Secrets stored in AWS Secrets Manager, not in code or environment variables directly
- Private ECR repositories with scan on push enabled
- Network segmentation with security groups preventing unauthorized access
- Container tasks run in private subnets with no direct internet access
- ALB in public subnets as the only public-facing entry point
- VPC flow logs for network traffic auditing and compliance
- All data encrypted in transit and at rest where applicable

## Success Criteria

- **Functionality**: Complete multi-service ECS Fargate platform with frontend, api-gateway, and processing-service deployed and accessible
- **Performance**: Auto-scaling policies respond to CPU load appropriately, services maintain desired task counts
- **Reliability**: Multi-AZ deployment ensures high availability, health checks maintain service health
- **Security**: IAM least privilege enforced, secrets managed properly, network isolation prevents unauthorized access
- **Observability**: CloudWatch logs capture all container output, service discovery enables internal communication
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Destroyability**: Complete stack can be destroyed and redeployed without manual intervention
- **Deployment**: Blue-green deployment capability through ALB configuration
- **Code Quality**: Clean TypeScript code, well-structured, properly typed, comprehensive tests

## What to deliver

- Complete **Pulumi TypeScript** implementation
- VPC with public and private subnets across 3 AZs
- NAT gateways and internet gateway for connectivity
- ECR repositories for frontend, api-gateway, and processing-service
- ECS cluster with Fargate and Fargate Spot capacity providers
- Task definitions for all three services with proper resource allocations
- ECS services with auto-scaling policies configured
- Application Load Balancer with target groups and listeners
- AWS Cloud Map namespace and service discovery configuration
- IAM roles and policies for task execution and task roles
- CloudWatch log groups with 30-day retention for all services
- AWS Secrets Manager secrets and references in task definitions
- Security groups with strict ingress/egress rules
- Stack outputs for ALB DNS, service ARNs, and infrastructure IDs
- Unit tests for all infrastructure components
- Integration tests validating service deployment and connectivity
- Documentation for deployment and operational procedures
