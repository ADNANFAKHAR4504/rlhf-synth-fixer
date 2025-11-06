# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using terraform with hcl**
> 
> Platform: **terraform**  
> Language: **hcl**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Terraform configuration to deploy a containerized microservices architecture on Amazon ECS Fargate. The configuration must: 1. Define an ECS cluster named 'fintech-cluster' with container insights enabled. 2. Create three ECS services (payment-service, auth-service, analytics-service) each running 2 tasks minimum. 3. Configure task definitions with 512 CPU units and 1024 MiB memory for each service. 4. Set up an internal Application Load Balancer with separate target groups for each service. 5. Implement service auto-scaling policies triggered at 70% CPU or memory utilization. 6. Configure CloudWatch log groups with '/ecs/fintech/' prefix for each service. 7. Define IAM roles allowing tasks to pull from ECR and read from Parameter Store. 8. Create security groups restricting service communication to port 8080 internally only. 9. Enable ECS service circuit breaker for automatic rollback on deployment failures. 10. Configure health checks with 30-second intervals and service-specific paths (/health, /auth/health, /analytics/health). Expected output: A complete Terraform configuration that provisions the ECS cluster, services, load balancer, and supporting infrastructure. The configuration should be modular with separate files for ECS resources, networking, and IAM policies, using variables for environment-specific values.

---

## Additional Context

### Background
A fintech startup needs to migrate their microservices architecture from Docker Swarm to Amazon ECS. The services handle payment processing, user authentication, and transaction analytics, requiring strict network isolation and high availability across multiple availability zones.

### Constraints and Requirements
- [ECS tasks must run on Fargate to avoid EC2 instance management, Each service must have its own target group for independent scaling, Container images must be pulled from a private ECR repository, Services must communicate only through the internal load balancer, Task definitions must specify exact CPU and memory allocations, Environment variables must be loaded from AWS Systems Manager Parameter Store, Each service must have dedicated CloudWatch log groups with 7-day retention, Auto-scaling must be based on both CPU and memory utilization, Health checks must have custom paths matching each service's endpoints, All traffic between services must remain within private subnets]

### Environment Setup
Multi-AZ deployment in us-east-1 using ECS Fargate for container orchestration with three microservices: payment-service, auth-service, and analytics-service. Infrastructure includes VPC with private subnets across 3 availability zones, internal Application Load Balancer for service-to-service communication, and NAT gateways for outbound internet access. Requires Terraform 1.5+, AWS provider 5.x, and pre-existing ECR repositories with container images. Services need Systems Manager Parameter Store for configuration management and CloudWatch for centralized logging.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **ap-southeast-1**
