# Web Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a containerized web application on AWS ECS with Application Load Balancer. The configuration must: 1. Create an ECS cluster using Fargate for serverless container hosting. 2. Define a task definition with 512 CPU units and 1024 MB memory. 3. Configure an Application Load Balancer with health checks on /health endpoint. 4. Set up target group with deregistration delay of 30 seconds. 5. Deploy ECS service with 3 desired tasks across multiple AZs. 6. Enable auto-scaling between 3-10 tasks based on CPU utilization (target: 70%). 7. Configure CloudWatch log group with 7-day retention for container logs. 8. Tag all resources with Environment=production and Project=payment-api. 9. Output the load balancer DNS name for application access. Expected output: A fully deployed ECS service running the web application behind an ALB, with auto-scaling configured and CloudWatch logging enabled. The stack should output the ALB DNS endpoint.

---

## Additional Context

### Background
A growing fintech startup needs to deploy their payment processing web application with automatic scaling capabilities. The application runs in Docker containers and requires load balancing across multiple availability zones for reliability.

### Constraints and Requirements
- Use Fargate launch type exclusively - no EC2 instances
- Container image must be pulled from ECR in the same region
- ALB must use HTTPS listener on port 443 with ACM certificate
- ECS tasks must run in private subnets with NAT gateway access
- Enable container insights for enhanced monitoring
- Use awsx package for simplified ECS service creation

### Environment Setup
AWS

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
