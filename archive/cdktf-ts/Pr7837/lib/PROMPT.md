# Containerized Trading Application Infrastructure

Hey team,

We need to migrate our monolithic trading application to a containerized microservices architecture. The business is pushing hard on this because our current setup can't scale during high trading volumes, and we're losing competitive edge. I've been asked to build this using **CDKTF with TypeScript** to leverage our existing infrastructure-as-code practices.

The application has three main components: a web frontend for traders, an API gateway that handles all the business logic, and a processing service that handles the heavy lifting for trade execution and data analytics. Right now everything runs on a single server, and when one component has issues, the whole system goes down. The business wants strict isolation between customer data processing workloads for compliance reasons.

We're deploying to us-east-1 and need this to support zero-downtime deployments because any trading system downtime literally costs money. The security team is also on our case about secrets management and network isolation.

## What we need to build

Create a containerized application platform using **CDKTF with TypeScript** for orchestrating multi-service ECS Fargate deployments with complete networking, security, and observability infrastructure.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 3 availability zones
   - Proper routing tables and NAT gateways for private subnet internet access
   - Network isolation preventing direct internet access for backend services

2. **Container Registry**
   - ECR repositories for frontend, api-gateway, and processing-service
   - Tag immutability enabled
   - Lifecycle policies to manage image retention

3. **ECS Cluster and Services**
   - ECS cluster with capacity providers for Fargate and Fargate Spot
   - Task definitions for each service with specific CPU and memory allocations
   - ECS services with desired count of 2, auto-scaling up to 10 tasks
   - Health check grace periods for service stabilization
   - Blue-green deployment support with traffic shifting capabilities

4. **Load Balancing**
   - Application Load Balancer for public-facing services
   - Target groups with health checks specific to each service type
   - Listeners configured for frontend and api-gateway access

5. **Service Discovery**
   - AWS Cloud Map namespace for internal service communication
   - Service discovery configuration for backend services
   - Internal communication through service mesh only

6. **Security and Access Management**
   - IAM task execution roles with least-privilege permissions per service
   - IAM task roles with service-specific permissions
   - Security groups with strict ingress/egress rules between services
   - Secrets stored in AWS Secrets Manager
   - Secrets injected as environment variables in task definitions

7. **Logging and Monitoring**
   - CloudWatch log groups for each service
   - Container logging drivers configured
   - 30-day log retention policy
   - CloudWatch metrics for monitoring

8. **Auto-scaling Configuration**
   - CPU utilization-based auto-scaling policies
   - Minimum 2 tasks, maximum 10 tasks per service
   - Scale-up and scale-down thresholds

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use **Amazon VPC** for networking
- Use **Amazon ECR** for container registry
- Use **Amazon ECS** with Fargate launch type
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Cloud Map** for service discovery
- Use **AWS IAM** for access management
- Use **Amazon CloudWatch** for logs and metrics
- Use **AWS Secrets Manager** for sensitive data
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{service-name}-{environmentSuffix}`

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL resources must include environmentSuffix in their names to enable multiple deployments in the same account
- **Destroyability**: NO deletion protection or retention policies - all resources must be fully destroyable
- **RemovalPolicy**: Use DESTROY for all stateful resources (log groups, ECR repositories)
- **DeletionPolicy**: Ensure no resources have Retain policies

### Constraints

- Task execution roles must follow least-privilege principle
- Backend services cannot have direct internet access
- All secrets must be in Secrets Manager, never hardcoded
- Container images must be in private ECR repositories
- All communication between services must use internal load balancers or service discovery
- Health checks must have specific thresholds appropriate for each service type
- Support zero-downtime deployments through ECS rolling updates

## Success Criteria

- **Functionality**: All three services (frontend, api-gateway, processing-service) deploy successfully to ECS Fargate
- **Networking**: VPC with proper public/private subnet configuration across 3 AZs
- **Security**: Services isolated with security groups, secrets in Secrets Manager, least-privilege IAM
- **High Availability**: Auto-scaling configured, multi-AZ deployment, health checks working
- **Observability**: CloudWatch logs streaming from all containers with 30-day retention
- **Load Balancing**: ALB routing traffic to frontend and api-gateway with health checks
- **Service Discovery**: Backend services discovering each other through Cloud Map
- **Deployments**: Blue-green deployment capability with traffic shifting
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript, well-structured, properly typed, documented

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with public/private subnets and routing
- ECR repositories for all three services with lifecycle policies
- ECS cluster with Fargate capacity providers
- Task definitions with proper resource limits and environment variables
- ECS services with auto-scaling configuration
- Application Load Balancer with target groups and listeners
- AWS Cloud Map namespace and service discovery
- IAM roles for task execution and task-level permissions
- CloudWatch log groups with container logging
- Secrets Manager secrets referenced in task definitions
- Security groups with proper ingress/egress rules
- Outputs for ALB DNS name and service ARNs
- Full deployment and testing documentation
