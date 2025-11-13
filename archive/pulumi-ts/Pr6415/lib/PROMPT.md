# Multi-Service ECS Fargate Application Deployment

Hey team,

We need to build a production-grade containerized infrastructure for a financial services company that's migrating their monolithic trading application to microservices. The business has specific requirements around security, scalability, and zero-downtime deployments. I've been asked to implement this using **Pulumi with TypeScript** in the us-east-1 region.

The challenge here is orchestrating multiple containerized services on ECS Fargate with strict isolation requirements. This trading platform handles sensitive customer data and high-frequency transactions, so we need proper network segmentation, secret management, and service discovery. The architecture needs to support blue-green deployments and automatic scaling during market hours when trading volume spikes.

The company wants to deploy three services initially: a web frontend for traders, an API gateway that handles all backend requests, and a processing service that executes trades. Each service needs its own security context, resource allocations, and health monitoring. The infrastructure must support rolling updates without disrupting active trading sessions.

## What we need to build

Create a complete ECS Fargate orchestration system using **Pulumi with TypeScript** that deploys a multi-service containerized application with proper networking, service discovery, load balancing, and security controls.

### Core Requirements

1. **VPC and Networking**
   - Create a VPC with public and private subnets across 3 availability zones for high availability
   - Deploy NAT gateways to enable outbound internet access for private subnets
   - Configure route tables with proper associations for public and private traffic
   - Implement internet gateway for public subnet connectivity

2. **Container Registry**
   - Set up ECR repositories for three container images: frontend, api-gateway, and processing-service
   - Enable tag immutability to prevent accidental overwrites of production images
   - Configure image scanning on push for vulnerability detection
   - Apply lifecycle policies to remove old images and control storage costs

3. **ECS Cluster Configuration**
   - Create an ECS cluster with capacity providers for both Fargate and Fargate Spot
   - Configure capacity provider strategies to optimize costs with spot instances
   - Enable Container Insights for cluster-level monitoring and metrics

4. **Task Definitions**
   - Define separate task definitions for frontend, api-gateway, and processing-service
   - Configure appropriate CPU and memory allocations per service (frontend: 512/1024, api-gateway: 1024/2048, processing: 2048/4096)
   - Set up environment variables for service configuration
   - Reference secrets from AWS Secrets Manager for database credentials and API keys
   - Configure CloudWatch log drivers for container stdout/stderr logging

5. **Application Load Balancer**
   - Deploy an internet-facing ALB for the frontend service
   - Create target groups with health checks configured for each public service
   - Set up listeners on port 80 (HTTP) and port 443 (HTTPS) if certificates are available
   - Configure routing rules to forward traffic to appropriate target groups

6. **ECS Services**
   - Deploy ECS services for each task definition with desired count of 2 tasks minimum
   - Configure service auto-scaling policies based on CPU utilization (target 70%, min 2, max 10 tasks)
   - Set health check grace periods to allow containers to warm up before health checks
   - Enable service discovery for internal service-to-service communication
   - Configure deployment settings for rolling updates with proper circuit breakers

7. **Service Discovery**
   - Create AWS Cloud Map private DNS namespace for service discovery
   - Register each ECS service with Cloud Map for internal resolution
   - Configure DNS records so services can communicate using friendly names

8. **IAM Roles and Policies**
   - Create task execution roles with permissions for ECR pull, CloudWatch logs, and Secrets Manager
   - Define task roles with service-specific permissions following least-privilege principle
   - Frontend task role: read-only access to S3 static assets
   - API Gateway task role: access to DynamoDB, SQS, and SNS for backend operations
   - Processing service task role: access to trading data stores and external API calls

9. **CloudWatch Logging**
   - Create dedicated log groups for each service with 30-day retention
   - Configure structured logging with JSON format for better querying
   - Set up log stream prefixes to organize logs by task ID

10. **Secrets Management**
    - Store database credentials, API keys, and service tokens in AWS Secrets Manager
    - Create secrets for: database connection string, third-party API keys, JWT signing key
    - Reference secrets in task definitions using secretsManagerArn
    - Grant task execution roles permission to read secrets

11. **Security Groups**
    - Create security groups with strict ingress and egress rules
    - ALB security group: allow inbound 80/443 from internet, outbound to ECS tasks
    - ECS task security group: allow inbound from ALB only, outbound HTTPS for API calls
    - Internal service security group: allow communication between services on specific ports
    - Processing service security group: isolated with minimal external access

12. **Resource Outputs**
    - Export ALB DNS name for frontend access
    - Export service ARNs for monitoring and automation
    - Export ECR repository URLs for CI/CD pipeline integration
    - Export Cloud Map namespace ID for service registration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** with public and private subnets across 3 AZs
- Use **ECR** for container image storage (3 repositories)
- Use **ECS Fargate** for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Cloud Map** for service discovery
- Use **Secrets Manager** for sensitive data
- Use **CloudWatch** for logging with 30-day retention
- Use **IAM** with least-privilege policies per service
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Each service must run in its own task definition with specific resource allocations
- Task execution roles must follow least-privilege principle with service-specific permissions
- Services must communicate through internal service discovery only
- Secrets must be stored in AWS Secrets Manager and injected as environment variables
- Network isolation must prevent direct internet access for backend services
- Container logs must stream to CloudWatch Log Groups with 30-day retention
- Container images must be stored in private ECR repositories
- Health checks must be implemented with appropriate thresholds for each service
- Auto-scaling must be configured based on CPU utilization with min 2 and max 10 tasks
- All resources must be destroyable with no Retain policies
- Use Fargate instead of EC2 instances to minimize infrastructure management
- Avoid NAT Gateway costs where possible by using VPC endpoints for AWS services

## Success Criteria

- **Functionality**: Complete multi-service ECS deployment with load balancing and service discovery
- **Networking**: VPC with proper subnet isolation and routing across 3 AZs
- **Security**: Least-privilege IAM, security groups with strict rules, secrets in Secrets Manager
- **Scalability**: Auto-scaling configured for all services based on CPU metrics
- **Observability**: CloudWatch logging with 30-day retention for all containers
- **Reliability**: Multi-AZ deployment with health checks and rolling update support
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: TypeScript with proper types, well-structured, production-ready

## What to deliver

- Complete Pulumi TypeScript implementation with TapStack component
- VPC with public and private subnets across 3 AZs with NAT gateways
- Three ECR repositories with tag immutability and image scanning
- ECS cluster with Fargate and Fargate Spot capacity providers
- Task definitions for frontend, api-gateway, and processing-service
- Application Load Balancer with target groups and listeners
- ECS services with auto-scaling policies and service discovery
- AWS Cloud Map namespace and service registrations
- IAM roles and policies with least-privilege permissions
- CloudWatch log groups with 30-day retention
- Secrets Manager secrets for sensitive configuration
- Security groups with strict ingress/egress rules
- Comprehensive unit tests with 100% coverage
- Integration tests using deployed resources
- Documentation and deployment instructions
