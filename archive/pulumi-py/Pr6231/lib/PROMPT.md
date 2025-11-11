# Containerized Flask Application Deployment

Hey team,

We need to build out infrastructure for our Flask web application that's currently running on a single EC2 instance. The business is experiencing serious performance issues during flash sales, and we've been asked to modernize this with a proper containerized architecture that can auto-scale. I've been assigned to create this using **Pulumi with Python** for the us-east-2 region.

The current setup is causing us real problems. During our last flash sale, the single EC2 instance couldn't handle the load, and we lost revenue because customers couldn't complete checkouts. The leadership team wants a solution that can automatically scale up during high traffic periods and scale back down to save costs during quiet times. They also want proper load balancing, managed databases, and secure credential management.

The application itself is a Python Flask API that needs to connect to a PostgreSQL database for primary data storage and use DynamoDB for managing user sessions. We need to containerize this application, store the images in ECR, and run everything on ECS Fargate so we don't have to manage any servers ourselves.

## What we need to build

Create a highly available containerized Flask application infrastructure using **Pulumi with Python** for deployment to AWS us-east-2. The system needs to handle variable traffic loads with automatic scaling and include proper networking, load balancing, container orchestration, and managed database services.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 2 public subnets (10.0.1.0/24, 10.0.2.0/24) for load balancers
   - VPC with 2 private subnets (10.0.3.0/24, 10.0.4.0/24) for application and database
   - Distribute subnets across us-east-2a and us-east-2b availability zones
   - NAT Gateways to provide outbound internet access for private resources

2. **Load Balancing**
   - Application Load Balancer deployed in public subnets
   - Target group with health checks on /health endpoint every 30 seconds
   - Path-based routing for /api/* and /health endpoints

3. **Container Orchestration**
   - ECS Fargate service running Flask container (image: webapp:latest)
   - 2 desired tasks initially
   - Each task with 512 CPU units and 1024 MB memory
   - Tasks deployed in private subnets

4. **Auto-Scaling**
   - Auto-scaling policy for ECS service
   - Scale between minimum 2 tasks and maximum 10 tasks
   - Trigger scaling at 70% average CPU utilization
   - 300 second cooldown period between scaling actions

5. **Database Services**
   - RDS PostgreSQL instance (db.t3.micro) in private subnets
   - Automated backups enabled with 5-day retention period
   - DynamoDB table named 'user-sessions' for session management
   - TTL enabled on 'expiry' attribute in DynamoDB table

6. **Container Registry**
   - ECR repository for storing container images
   - Image scanning enabled on push
   - Lifecycle policy to keep only 5 most recent images

7. **Logging and Monitoring**
   - CloudWatch log groups for ECS tasks
   - 7-day retention policy for logs
   - Log streams organized by task definition family

8. **Security Configuration**
   - Security group allowing ALB to communicate with ECS tasks on port 5000
   - Security group allowing ECS tasks to reach RDS on port 5432
   - Database connection string stored in AWS Secrets Manager
   - Database credentials injected as environment variables in ECS task definition

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation
- Use **Application Load Balancer** for traffic distribution
- Use **ECS Fargate** for container orchestration (not EC2-based ECS)
- Use **RDS PostgreSQL** for primary data storage
- Use **DynamoDB** for session management
- Use **ECR** for private container image storage
- Use **CloudWatch Logs** for application logging
- Use **Secrets Manager** for credential storage (automatic rotation disabled)
- Resource names must include **environmentSuffix** for uniqueness across PR environments
- Follow naming convention pattern: resource-type-environment-suffix
- Deploy all resources to **us-east-2** region
- Target Python 3.8+ and Pulumi 3.x or higher

### Constraints

- Use ECS Fargate exclusively, not EC2-based ECS cluster
- All database credentials must be stored in Secrets Manager, not hardcoded
- Container images must be in private ECR repositories with lifecycle management
- VPC must have exactly 2 public and 2 private subnets across different AZs
- CloudWatch Logs must retain logs for 7 days
- Auto-scaling trigger at 70% CPU with 300 second cooldown
- All resources must be fully destroyable for CI/CD workflows
- Secrets should be fetched from existing Secrets Manager entries, not created by stack
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Enable appropriate logging and monitoring
- ALB must use path-based routing for /api/* and /health paths

## Success Criteria

- **Functionality**: Application accessible via ALB DNS name, health checks passing, auto-scaling responding to CPU load
- **Performance**: Tasks can scale from 2 to 10 based on demand, proper load distribution across tasks
- **Reliability**: High availability with resources distributed across multiple AZs, automated backups for database
- **Security**: All credentials in Secrets Manager, proper security group isolation, encryption enabled
- **Resource Naming**: All resources include environmentSuffix variable for multi-environment support
- **Code Quality**: Clean Python code, well-structured Pulumi program, proper resource dependencies

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- VPC with proper subnet configuration across multiple AZs
- Application Load Balancer with target group and health checks
- ECS Fargate service with task definition and container configuration
- Auto-scaling configuration with CloudWatch alarms
- RDS PostgreSQL instance with backup configuration
- DynamoDB table with TTL configuration
- ECR repository with scanning and lifecycle policies
- CloudWatch log groups with retention policies
- Security groups with appropriate ingress/egress rules
- IAM roles and policies for ECS task execution
- Secrets Manager integration for database credentials
- Stack outputs including ALB DNS name
- Unit tests for infrastructure components
- Documentation with deployment instructions and architecture overview
