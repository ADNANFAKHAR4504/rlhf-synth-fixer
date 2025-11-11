Hey team,

We've got an interesting project from a growing e-commerce company that needs to deploy their Flask-based product catalog API to AWS. They're seeing good traction with their mobile and web clients, and they need a solid, scalable infrastructure that can handle variable traffic patterns while keeping costs under control. I've been asked to build this out using **CDK with Python**.

The team has been running into issues with their current setup - they need better availability across multiple regions, automatic scaling during peak shopping hours, and they want to optimize costs by using Spot instances where possible. Their product catalog API is business-critical, serving thousands of requests per minute during peak times, so we need to make sure we build this right.

They're particularly interested in having visibility into application performance and the ability to trace requests across services. The operations team also wants proper alarming so they can respond quickly if something goes wrong. This is a production deployment going into the ap-southeast-2 region, so we need to follow best practices for security, monitoring, and resilience.

## What we need to build

Create a containerized Flask API deployment using **CDK with Python** that runs on ECS Fargate with automatic scaling and comprehensive observability.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 3 availability zones
   - NAT Gateways for outbound connectivity from private subnets
   - Proper subnet sizing and routing configuration

2. **Container Orchestration**
   - ECS cluster with Fargate capacity providers
   - Fargate Spot capacity provider configured at 70% weight for cost optimization
   - ECR repository for container images with lifecycle rules to keep only the last 10 images

3. **Load Balancing and Routing**
   - Application Load Balancer deployed in public subnets
   - Path-based routing rules to separate /api/* and /health endpoints
   - Target groups configured for blue-green deployment capability

4. **Application Service**
   - ECS service running Flask containers on Fargate Spot
   - Minimum 2 tasks, maximum 10 tasks for high availability
   - Health checks on /health endpoint with 30-second intervals
   - Proper security groups and IAM roles

5. **Auto Scaling**
   - CPU-based autoscaling targeting 70% utilization
   - 60-second cooldown period between scaling actions
   - Scaling policies for both scale-up and scale-down

6. **Database Layer**
   - RDS Aurora PostgreSQL cluster in private subnets
   - Automated backup configuration
   - Connection string stored in AWS Secrets Manager
   - Database credentials injected into containers via Secrets Manager

7. **Monitoring and Observability**
   - Container Insights enabled on ECS cluster
   - X-Ray sidecar containers for distributed tracing
   - CloudWatch alarms for high CPU (greater than 80%)
   - CloudWatch alarms for low available tasks (less than 2)
   - CloudWatch dashboard for centralized monitoring

### Technical Requirements

- All infrastructure defined using **CDK with Python**
- Deploy to **ap-southeast-2** region across 3 availability zones
- Use **ECS Fargate** with Fargate Spot for compute
- Use **Application Load Balancer** for traffic distribution
- Use **ECR** for container registry with lifecycle policies
- Use **RDS Aurora PostgreSQL** for the product database
- Use **AWS Secrets Manager** for database credentials and connection strings
- Use **CloudWatch** for monitoring, alarms, and Container Insights
- Use **AWS X-Ray** for distributed tracing
- Resource names must include **environmentSuffix** for uniqueness and test isolation
- Follow naming convention: {resource-type}-{purpose}-{environmentSuffix}
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- ECS tasks must run on Fargate Spot instances (70% weight) for cost optimization
- Implement encryption at rest and in transit for all data storage
- Follow least privilege principle for all IAM roles and policies
- Enable comprehensive logging for troubleshooting and compliance
- Secrets should be fetched from existing Secrets Manager (not created by stack)
- ALB must route /api/* traffic to application containers
- ALB must route /health traffic for health check monitoring
- Health checks must use 30-second intervals
- Autoscaling must maintain 70% CPU utilization target with 60-second cooldown
- ECR lifecycle policy must retain only the last 10 container images
- All resources must support clean destruction for testing environments

## Success Criteria

- **Functionality**: Flask API accessible via ALB DNS with proper path routing for /api/* and /health endpoints
- **Performance**: Automatic scaling maintains 70% CPU target with 2-10 tasks based on load
- **Reliability**: High availability across 3 AZs with minimum 2 running tasks at all times
- **Security**: Encryption enabled, least privilege IAM, secrets managed via Secrets Manager, private subnets for compute and data
- **Observability**: Container Insights and X-Ray tracing enabled, CloudWatch alarms trigger on CPU and task count thresholds
- **Cost Optimization**: Fargate Spot at 70% weight, ECR lifecycle policies, NAT Gateway per AZ
- **Resource Naming**: All resources include environmentSuffix for test isolation
- **Deployability**: Stack can be fully deployed and destroyed without manual cleanup
- **Code Quality**: Python code follows CDK best practices, includes proper error handling, well-documented

## What to deliver

- Complete CDK Python implementation in lib/ directory
- ECS cluster with Fargate and Fargate Spot capacity providers
- Application Load Balancer with target groups and path-based routing
- ECS service with Flask containers, health checks, and autoscaling
- ECR repository with lifecycle rules
- RDS Aurora PostgreSQL cluster with Secrets Manager integration
- VPC with public/private subnets and NAT Gateways across 3 AZs
- Container Insights and X-Ray tracing configuration
- CloudWatch alarms for CPU and task count monitoring
- Stack outputs for ALB DNS name, ECR repository URI, and CloudWatch dashboard URL
- Integration test configuration reading from cfn-outputs/flat-outputs.json
- Documentation and deployment instructions in README
