# Failure Recovery and High Availability

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ca-central-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a highly available web application with automatic failure recovery. The configuration must: 1. Create an Auto Scaling Group with a minimum of 2 instances and maximum of 6 instances across at least 2 availability zones. 2. Configure EC2 instances with Amazon Linux 2 AMI and t3.micro instance type. 3. Set up an Application Load Balancer with health checks on path /health returning HTTP 200. 4. Implement Auto Scaling policies to scale up when CPU utilization exceeds 70% for 2 minutes. 5. Configure scale-down policy when CPU utilization drops below 30% for 5 minutes. 6. Set health check grace period to 300 seconds for new instances. 7. Enable ELB health checks to automatically replace unhealthy instances. 8. Configure CloudWatch alarms for high CPU and unhealthy target count. 9. Implement instance replacement when health checks fail for 3 consecutive periods. 10. Tag all resources with Environment=production and ManagedBy=pulumi. Expected output: A Pulumi stack that creates a self-healing infrastructure where failed instances are automatically replaced, traffic is distributed across healthy instances, and the system scales based on CPU metrics while maintaining minimum availability requirements.

---

## Additional Context

### Background
A fintech startup needs to ensure their payment processing API remains available during instance failures or traffic spikes. The system must automatically detect unhealthy instances and replace them while maintaining service availability through health checks and automated recovery.

### Constraints and Requirements
- [Auto Scaling Group must span exactly 2 availability zones, Health check interval must be 30 seconds with timeout of 5 seconds, Use only t3.micro instances to minimize costs, CloudWatch alarm evaluation period must be 60 seconds, Target group deregistration delay must be set to 30 seconds, Auto Scaling cooldown period must be 300 seconds, Load balancer must use only HTTP (port 80) listeners, Instance user data must include a simple health check endpoint setup]

### Environment Setup
AWS region ca-central-1 with multi-AZ deployment across ca-central-1a and ca-central-1b. Infrastructure includes EC2 Auto Scaling Groups, Application Load Balancer, and CloudWatch monitoring. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS CLI configured with appropriate IAM permissions for EC2, ELB, Auto Scaling, and CloudWatch services. VPC with public subnets in each AZ for load balancer and private subnets for EC2 instances.

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
All resources should be deployed to: **ca-central-1**
