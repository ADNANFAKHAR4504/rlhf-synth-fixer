# Application Deployment

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a containerized e-commerce web application on AWS. The configuration must: 1. Create a VPC with 3 public and 3 private subnets across availability zones. 2. Deploy an RDS PostgreSQL instance (db.t3.medium) with automated backups enabled. 3. Set up an ECS cluster with Fargate compute for running containers. 4. Create an ECR repository and build/push the application Docker image from local ./app directory. 5. Configure an ECS task definition with 1 vCPU and 2GB memory. 6. Deploy an ECS service running the containerized application with desired count of 3. 7. Configure an Application Load Balancer with target group health checks on /health endpoint. 8. Set up CloudWatch Log Group for container logs with specified retention period. 9. Store database connection string in Secrets Manager and inject as environment variable. 10. Configure auto-scaling policy to scale ECS tasks based on 70% CPU threshold. 11. Output the ALB DNS name and ECR repository URI. Expected output: A fully functional Pulumi stack that provisions the complete infrastructure, builds and deploys the container image, and returns the load balancer URL where the e-commerce application can be accessed over HTTPS.

---

## Additional Context

### Background
A growing e-commerce platform needs to modernize their monolithic PHP application by deploying it on AWS using container orchestration. The application serves product catalogs and handles customer orders, requiring both static asset hosting and dynamic API endpoints with database connectivity.

### Constraints and Requirements
- [Use AWS Fargate for ECS tasks to avoid EC2 instance management, Application Load Balancer must use path-based routing to separate API and static content, RDS PostgreSQL instance must be deployed in private subnets only, All container logs must be sent to CloudWatch Logs with 30-day retention, Use AWS Certificate Manager for HTTPS with automatic renewal, Environment variables for database credentials must use AWS Secrets Manager, Container images must be stored in private ECR repositories, Implement auto-scaling for ECS service based on CPU utilization (scale between 2-10 tasks)]

### Environment Setup
Production e-commerce infrastructure deployed in us-east-1 across 3 availability zones. Uses ECS Fargate for containerized PHP application, RDS PostgreSQL 14 for product and order data, Application Load Balancer for traffic distribution. VPC configured with public subnets for ALB and private subnets for ECS tasks and RDS. NAT Gateways enable outbound internet access from private subnets. Requires Node.js 16+, Pulumi CLI 3.x, AWS CLI configured with appropriate IAM permissions for ECS, RDS, VPC, and Secrets Manager services.

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
