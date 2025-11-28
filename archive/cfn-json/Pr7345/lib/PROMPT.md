# ECS Fargate Fraud Detection Service

Hey team,

We've been tasked with deploying a containerized fraud detection system for one of our financial services clients. They're processing real-time transaction data and need a highly available solution that can scale automatically based on demand. The business is asking us to build this using **CloudFormation with JSON** to match their existing infrastructure-as-code standards.

The current situation is that they have container images ready in ECR and need a complete standalone deployment. What they need from us is the complete ECS Fargate infrastructure with proper load balancing, auto-scaling, monitoring, and a fully self-contained VPC. The system needs to be production-ready with high availability across multiple availability zones.

Their operations team has been clear about the constraints - they need Fargate platform version 1.4.0 specifically, strict health check requirements, and least-privilege IAM policies with no wildcards allowed. They're also particular about maintaining exactly 2 tasks during deployments to ensure zero downtime.

## What we need to build

Create a complete ECS Fargate deployment infrastructure using **CloudFormation with JSON** for a fraud detection service that processes financial transactions in real-time.

### Core Requirements

1. **Complete VPC Infrastructure**
   - Create a new VPC with CIDR 10.0.0.0/16
   - Enable DNS hostnames and DNS support
   - Create 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across availability zones
   - Create 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across availability zones
   - Configure Internet Gateway for public subnet access
   - Configure NAT Gateway for private subnet outbound access
   - Set up proper route tables for public and private subnets

2. **ECS Cluster Configuration**
   - Define an ECS cluster with containerInsights enabled for monitoring
   - Must support Fargate launch type with platform version 1.4.0

3. **Task Definition**
   - Create ECS task definition with 2 vCPU and 4GB memory allocation
   - Configure fraud-detector container from ECR repository
   - Container must expose port 80 for application traffic (configurable via parameter)
   - Use public nginx image as default: public.ecr.aws/nginx/nginx:1.27-alpine

4. **Load Balancing**
   - Configure Application Load Balancer for traffic distribution
   - Implement target group with health checks on root path (/)
   - Use least_outstanding_requests routing algorithm
   - Deploy ALB in public subnets across availability zones

5. **Service Deployment**
   - Deploy ECS service with desired count of 2 tasks
   - Distribute tasks across availability zones using private subnets
   - Maintain exactly 2 tasks during deployments (minimumHealthyPercent: 100, maximumPercent: 200)
   - Enable deployment circuit breaker with rollback

6. **Auto Scaling**
   - Implement auto-scaling policy based on CPU utilization
   - Scale between minimum 2 and maximum 10 tasks
   - Trigger scaling at 70% average CPU utilization
   - Configure 2-minute cooldown period between scaling actions

7. **Logging and Monitoring**
   - Configure CloudWatch log group with 30-day retention
   - Encrypt container logs using customer-managed KMS key
   - Enable CloudWatch Container Insights for cluster monitoring

8. **Network Security**
   - Create security groups for ALB and ECS tasks
   - Allow ALB to accept HTTP (80) and HTTPS (443) traffic from internet
   - Allow ALB to communicate with ECS tasks on container port
   - Configure proper ingress and egress rules

9. **IAM Roles and Policies**
   - Define ECS task execution role with least-privilege permissions
   - Define ECS task role for application permissions
   - No wildcard actions allowed in IAM policies (except for specific cases like ecr:GetAuthorizationToken)
   - Include permissions for ECR, CloudWatch Logs, and KMS

10. **Outputs**
    - Export ALB DNS name for application access
    - Export ECS cluster ARN and name for reference
    - Export ECS service name
    - Export Task definition ARN
    - Export CloudWatch log group name
    - Export environment suffix

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** as the compute platform
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch Logs** for centralized logging
- Use **Auto Scaling** for dynamic capacity management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: fraud-detection-{resource-type}-${EnvironmentSuffix}
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- **Container health checks must fail after 3 consecutive failures with 30-second intervals**
- **All resources must be destroyable** - use DeletionPolicy: Delete and UpdateReplacePolicy: Delete
- **Platform version must be 1.4.0** for Fargate tasks
- **IAM policies must use least-privilege** with specific actions only
- **Self-contained VPC** - create all networking infrastructure within the template

### Constraints

- ECS tasks must use Fargate launch type with platform version 1.4.0 exactly
- Container health checks configured with 3 retries and 30-second intervals
- ALB target group must use least_outstanding_requests routing algorithm
- ECS service must maintain 2 healthy tasks during deployments
- All container logs must be encrypted using customer-managed KMS key
- ECS task execution role must not have wildcard actions in IAM policies (except ecr:GetAuthorizationToken)
- Auto-scaling triggers at 70% CPU utilization with 2-minute cooldown
- All resources must be destroyable without retention policies

### Environment Details

- **Region**: us-east-1 with 3 availability zones (dynamically selected via Fn::GetAZs)
- **VPC**: New VPC created with 10.0.0.0/16 CIDR
- **Subnets**: Private subnets for ECS tasks, public subnets for ALB and NAT Gateway
- **Container Image**: Configurable via parameter, defaults to nginx alpine
- **Container Port**: Configurable via parameter, defaults to 80
- **Monitoring**: CloudWatch Container Insights enabled

## Success Criteria

- **Functionality**: Complete ECS Fargate deployment with VPC, ALB, auto-scaling, and monitoring
- **High Availability**: Tasks distributed across 3 availability zones with health checks
- **Scalability**: Auto-scaling between 2-10 tasks based on CPU utilization
- **Security**: Least-privilege IAM roles, encrypted logs, proper security groups
- **Monitoring**: CloudWatch logs with 30-day retention and container insights
- **Resource Naming**: All resources include environmentSuffix parameter
- **Deployability**: Zero-downtime deployments maintaining 2 healthy tasks
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template in lib/TapStack.json
- Complete VPC infrastructure (VPC, subnets, NAT gateway, route tables)
- ECS cluster with containerInsights enabled
- ECS task definition with 2 vCPU, 4GB memory, Fargate 1.4.0
- Application Load Balancer with health checks and proper routing
- ECS service with 2 tasks distributed across availability zones
- Auto-scaling policy for CPU-based scaling (2-10 tasks)
- CloudWatch log group with 30-day retention and KMS encryption
- Security groups for ALB and ECS communication
- IAM roles with least-privilege policies (no wildcards)
- Outputs for ALB DNS name, ECS cluster ARN, and other key resources
- Integration test updates in test/tap-stack.int.test.ts
- Unit test updates in test/tap-stack.unit.test.ts
- Documentation with deployment instructions
