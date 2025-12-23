# Container Orchestration Platform for Microservices

Hey team,

We're building a production-ready container orchestration platform for a fintech startup that's moving to microservices. They're processing real-time financial transactions and need a system that can scale automatically, deploy without downtime, and keep services isolated from each other. The business is looking for something that can handle their growing transaction volume while maintaining strict service boundaries.

The architecture needs to support at least three independent microservices, each with its own scaling behavior and deployment lifecycle. They want blue-green deployments so they can push updates during business hours without any customer impact. The platform also needs comprehensive monitoring so the operations team can spot issues before customers do.

I've been asked to build this using **AWS CDK with Python** to leverage infrastructure as code best practices. The team wants to deploy in us-east-1 with proper high availability across multiple zones.

## What we need to build

Create a complete ECS-based container orchestration platform using **AWS CDK with Python** that supports microservices architecture with service mesh, automated deployments, and comprehensive observability.

### Core Requirements

1. **ECS Cluster Configuration**
   - ECS cluster with Fargate and Fargate Spot capacity providers
   - Each service must run minimum 2 tasks using Fargate Spot for cost optimization
   - CloudWatch Container Insights enabled for cluster-level monitoring
   - Deploy across 3 availability zones for high availability

2. **Service Mesh Setup**
   - AWS App Mesh with virtual nodes and services for service discovery
   - Service-to-service communication with mTLS encryption enabled
   - Configure mesh for at least 3 microservices

3. **Load Balancing and Routing**
   - Application Load Balancer with path-based routing to different services
   - Dedicated target groups per service with health checks every 10 seconds
   - Deploy ALB in public subnets with proper security groups

4. **Container Registry**
   - Private ECR repositories for container images
   - Vulnerability scanning enabled on image push
   - Lifecycle policies to retain only the last 10 images per repository

5. **Deployment Strategy**
   - Blue-green deployment using ECS deployment circuit breaker
   - Zero-downtime deployments with automatic rollback on failure
   - Independent deployment lifecycles for each microservice

6. **Task Configuration**
   - Task definitions with 1 vCPU and 2GB memory per service
   - IAM task roles with least-privilege policies for S3 and DynamoDB access
   - Container logs streamed to CloudWatch Logs with encryption using customer-managed KMS keys

7. **Auto-Scaling**
   - Auto-scaling policies based on CPU utilization with 70% target
   - Independent scaling for each microservice
   - Scale out/in based on transaction volume

8. **Secrets Management**
   - AWS Secrets Manager for database credentials
   - Automatic credential rotation every 30 days
   - Secrets injected into task definitions securely

9. **Monitoring and Observability**
   - CloudWatch dashboards showing service health and performance metrics
   - Container-level metrics for CPU, memory, and network
   - Service mesh metrics for request rates and latencies

10. **Resource Tagging**
    - All resources tagged with Environment, Team, and CostCenter
    - Tags used for billing allocation and resource organization

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **ECS Fargate** for container orchestration
- Use **AWS App Mesh** for service mesh
- Use **Application Load Balancer** for ingress traffic
- Use **ECR** for container registry
- Use **CloudWatch** for logging and monitoring
- Use **Secrets Manager** for credential management
- Use **KMS** for encryption keys
- Resource names must include **environmentSuffix** for uniqueness and parallel deployments
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- VPC with public subnets for ALBs and private subnets for ECS tasks
- NAT Gateways for outbound internet access from private subnets

### Deployment Requirements (CRITICAL)

- All resources must be **destroyable** - no RemovalPolicy.RETAIN, no deletion_protection
- All named resources must include **environmentSuffix** parameter for CI/CD parallel deployments
- ECS services must use **RemovalPolicy.DESTROY** to ensure clean deletion
- S3 buckets must use **auto_delete_objects=True** and **RemovalPolicy.DESTROY**
- RDS/database resources must use **skip_final_snapshot=True** and **RemovalPolicy.DESTROY**
- No account-level resources that cause conflicts (GuardDuty detectors)
- Lambda functions using Node.js 18+ must use AWS SDK v3 or extract data from event context

### Constraints

- Each ECS service runs on Fargate Spot instances (minimum 2 tasks)
- Service mesh requires mTLS encryption for all service-to-service communication
- Health checks configured for 10-second intervals
- Container logs encrypted with customer-managed KMS keys
- Database credentials stored in Secrets Manager with 30-day rotation
- All resources include proper error handling and logging
- Infrastructure must be fully deployable and destroyable via CDK

## Success Criteria

- **Functionality**: Complete ECS cluster with App Mesh service mesh supporting 3+ microservices
- **Deployment**: Blue-green deployment with circuit breaker and automatic rollback
- **Scalability**: Auto-scaling based on CPU utilization for each service independently
- **Security**: mTLS encryption, IAM least privilege, encrypted logs and secrets
- **Monitoring**: CloudWatch Container Insights and custom dashboards with service metrics
- **Resource Naming**: All resources include environmentSuffix for parallel deployments
- **Destroyability**: All resources can be deleted without manual intervention
- **Code Quality**: Python CDK code, well-tested with unit tests, properly documented

## What to deliver

- Complete AWS CDK Python implementation in lib/ directory
- ECS cluster with Fargate and Fargate Spot capacity providers
- AWS App Mesh configuration with virtual nodes and services
- Application Load Balancer with path-based routing
- ECR repositories with scanning and lifecycle policies
- ECS services with blue-green deployment and circuit breaker
- Task definitions (1 vCPU, 2GB memory) with proper IAM roles
- Auto-scaling policies (70% CPU target) per service
- Secrets Manager for database credentials with rotation
- CloudWatch Container Insights and custom dashboards
- KMS keys for log encryption
- Comprehensive unit tests for all constructs
- Documentation with deployment instructions and architecture overview