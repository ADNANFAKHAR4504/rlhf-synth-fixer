# Payment Processing System on ECS

Hey team,

We need to build out infrastructure for our payment processing platform on AWS ECS. The business has decided to migrate our microservices architecture to containers to improve scalability and reduce operational overhead. I've been asked to create this using CDKTF with Python so we can leverage Infrastructure as Code best practices while maintaining our Python development standards.

The payment processing system consists of three critical microservices - a payment API that handles incoming transaction requests, a fraud detection service that analyzes transactions in real-time, and a notification service that sends alerts to customers. Each service needs to run independently with its own scaling characteristics, but they also need to communicate securely with each other. The business wants this deployed in production with full observability and automatic scaling to handle variable transaction volumes throughout the day.

We're using ECS Fargate to avoid managing EC2 instances, and the operations team has mandated that we use a mix of standard and spot capacity to optimize costs. Security is paramount since we're dealing with financial transactions, so everything must run in private subnets with tightly controlled security groups. We also need comprehensive logging and monitoring through CloudWatch, including Container Insights for deep visibility into container performance.

## What we need to build

Create a containerized payment processing platform using **CDKTF with Python** for deploying microservices on AWS ECS Fargate.

### Core Requirements

1. **ECS Cluster Configuration**
   - Deploy ECS cluster with Fargate capacity providers
   - Configure both standard Fargate and Fargate Spot capacity providers
   - Set Fargate Spot to handle at least 50% of capacity
   - Enable Container Insights for detailed monitoring

2. **Microservice Task Definitions**
   - Create task definitions for payment-api, fraud-detection, and notification-service
   - Allocate 2GB memory and 1 vCPU to each microservice
   - Use Fargate platform version 1.4.0
   - Pull container images from private ECR repositories
   - Configure health checks with 3 consecutive failures threshold and 30-second intervals
   - Send logs to CloudWatch with 30-day retention

3. **ECS Services**
   - Deploy separate ECS service for each microservice
   - Set desired count to 3 tasks per service
   - Distribute tasks across availability zones for high availability
   - Connect payment-api service to Application Load Balancer
   - Run all tasks in private subnets only

4. **Application Load Balancer**
   - Configure ALB with HTTPS listeners only
   - Use SSL/TLS certificates from ACM
   - Implement path-based routing to payment-api service
   - Allow traffic from ALB to ECS tasks on port 8080

5. **Auto-scaling Configuration**
   - Implement target tracking scaling policies for each service
   - Scale based on CPU utilization above 70%
   - Scale based on memory utilization above 80%
   - Set scaling range from 3 to 10 tasks per service

6. **Logging and Monitoring**
   - Create CloudWatch log groups for each service
   - Enable encryption on log groups using AWS-managed keys
   - Configure 30-day log retention policy
   - Enable Container Insights on ECS cluster

7. **IAM Roles and Permissions**
   - Create task execution roles with permissions for ECR image pulling
   - Grant CloudWatch Logs write permissions
   - Create task roles following least privilege principle
   - Use explicit resource ARNs in policies

8. **Security Groups**
   - Configure security group allowing ALB to ECS communication on port 8080
   - Define security groups for inter-service communication on specific ports
   - Ensure ECS tasks in private subnets have no direct internet access
   - Allow outbound connectivity through NAT gateways

9. **Container Registry**
   - Reference private ECR repositories for container images
   - Ensure image scanning is enabled on ECR repositories
   - Configure task definitions to pull from ECR

10. **Resource Tagging**
    - Tag all resources with Environment=production
    - Tag all resources with Team=payments
    - Tag all resources with CostCenter=engineering

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Amazon ECS** with Fargate for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon ECR** for private container registry
- Use **Amazon CloudWatch** for logging and monitoring
- Use **AWS IAM** for roles and permissions
- Use **Amazon VPC** with security groups and private subnets
- Use **AWS Auto Scaling** for ECS service scaling
- Use **AWS Certificate Manager** for SSL/TLS certificates
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Target 3 availability zones for high availability

### Constraints

- ECS cluster must use Fargate Spot for at least 50% of capacity
- ECS tasks must run in private subnets with no direct internet access
- ALB must use HTTPS listeners only with ACM certificates
- Service auto-scaling based on both CPU and memory metrics
- Security groups must explicitly define allowed ports between services
- Container logs sent to CloudWatch with 30-day retention
- Container health checks fail after 3 consecutive failures with 30-second intervals
- Container images stored in private ECR with image scanning enabled
- Task IAM roles must follow least privilege with explicit resource ARNs
- Each microservice must have dedicated ECS service and task definition
- All resources must be destroyable with no Retain policies
- Include proper error handling and validation

## Success Criteria

- Functionality: Three microservices deployed on ECS with independent scaling
- Performance: Auto-scaling responds to CPU above 70% or memory above 80%
- Reliability: Tasks distributed across availability zones with health checks
- Security: All tasks in private subnets, HTTPS-only ALB, least privilege IAM
- Observability: CloudWatch logs with 30-day retention, Container Insights enabled
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Python CDKTF code, well-structured, properly documented

## What to deliver

- Complete CDKTF Python implementation
- ECS cluster with Fargate and Fargate Spot capacity providers
- Task definitions for payment-api, fraud-detection, notification-service
- ECS services with auto-scaling policies for each microservice
- Application Load Balancer with HTTPS and path-based routing
- CloudWatch log groups with encryption and retention policies
- IAM roles for task execution and task permissions
- Security groups for ALB, ECS tasks, and inter-service communication
- Container Insights configuration
- ECR repository references with image scanning
- Complete resource tagging strategy
- Documentation for deployment and configuration
