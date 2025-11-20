# Containerized Payment Processing System on ECS Fargate

Hey team,

We need to build a production-grade payment processing platform for a fintech startup. They're migrating from monolithic architecture to microservices and need everything running on AWS ECS Fargate. The business requirement is pretty clear - they need three containerized services that can scale automatically based on transaction volume throughout the day, with strict security and compliance requirements for handling financial data.

The platform consists of three microservices: an API gateway that handles all external requests from customers, a payment processor that orchestrates transaction workflows, and a fraud detector that validates transactions in real-time. All three need to communicate securely within the VPC, scale independently, and maintain high availability across multiple availability zones.

I've been asked to create this infrastructure using **Pulumi with TypeScript** for us-east-1. The challenge here is getting the service discovery right, ensuring proper auto-scaling behavior, and implementing least-privilege IAM permissions for each service. We also need comprehensive logging and monitoring to meet their compliance requirements.

## What we need to build

Create a containerized microservices platform using **Pulumi with TypeScript** that deploys three payment processing services on AWS ECS Fargate with full observability, auto-scaling, and service discovery.

### Core Requirements

1. **ECS Cluster Configuration**
   - ECS cluster with Fargate compute capacity
   - Deploy across 3 availability zones for high availability
   - Enable container insights for monitoring and observability
   - All tasks must run in private subnets with no direct internet access

2. **Container Registry and Images**
   - Create ECR repositories for three services: api-gateway, payment-processor, fraud-detector
   - Enable vulnerability scanning for all container images
   - Configure lifecycle policies for image management

3. **Service Definitions**
   - Three ECS task definitions with 1 vCPU and 2GB memory each
   - Health checks configured for each service
   - Each service gets dedicated IAM task roles with least-privilege permissions
   - CloudWatch log groups with encryption enabled and 30-day retention

4. **Service Discovery**
   - AWS Cloud Map service discovery namespace for inter-service communication
   - Private DNS names for internal service-to-service calls
   - No public endpoints for payment-processor and fraud-detector services

5. **Auto-Scaling Configuration**
   - Each service scales from min: 2 to max: 10 tasks
   - Target tracking policies based on 70% CPU and memory thresholds
   - Automatic scale-in and scale-out based on load

6. **Load Balancing**
   - Application Load Balancer for api-gateway service
   - Target groups with health check configuration
   - Security groups allowing only required ports

7. **Secrets Management**
   - AWS Secrets Manager secrets for database connection strings
   - API keys for third-party integrations
   - Automatic secret rotation capability

8. **Network Security**
   - Security groups restricting traffic between services
   - Private subnets for all ECS tasks
   - NAT gateways for outbound connectivity
   - No direct internet access for containers

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon ECS Fargate** for container orchestration
- Use **Amazon ECR** for container registry
- Use **AWS Cloud Map** for service discovery
- Use **Application Load Balancer** for external access to api-gateway
- Use **CloudWatch Logs** for centralized logging with encryption
- Use **AWS Secrets Manager** for credential storage
- Use **IAM** for task-level permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must use Environment, Service, and CostCenter tags for compliance

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies, no DeletionProtection)
- Task definitions must specify resource limits and health checks
- Auto-scaling policies use 70% CPU/memory thresholds
- Container logs encrypted and retained for 30 days
- Blue/green deployment strategy with automated rollback on failures
- All named resources must include environmentSuffix parameter

### Constraints

- Network traffic between services must use Cloud Map service discovery
- All container images must be scanned for vulnerabilities before deployment
- Each service must have dedicated IAM task roles with least-privilege permissions
- Container logs must be encrypted at rest
- Services must auto-scale based on CPU and memory metrics
- All ECS tasks must run in private subnets only
- Include proper error handling and health checks
- No hardcoded values - use configuration parameters

## Success Criteria

- **Functionality**: Three microservices deployed and communicating via service discovery
- **Scalability**: Auto-scaling policies trigger correctly based on CPU/memory metrics
- **Security**: All tasks use least-privilege IAM roles, encrypted logs, secrets in Secrets Manager
- **Availability**: Services deployed across 3 AZs with minimum 2 tasks per service
- **Observability**: Container insights enabled, CloudWatch logs configured with 30-day retention
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Compliance**: All resources tagged with Environment, Service, CostCenter tags
- **Code Quality**: TypeScript, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with public and private subnets across 3 AZs
- ECS cluster with Fargate launch type
- Three ECR repositories with vulnerability scanning
- Three ECS services with task definitions
- AWS Cloud Map namespace for service discovery
- Application Load Balancer for api-gateway
- CloudWatch log groups with encryption
- IAM roles and policies for each service
- Security groups with least-privilege rules
- Auto-scaling policies for all services
- Secrets Manager secrets for credentials
- Unit tests for all components
- Documentation and deployment instructions
