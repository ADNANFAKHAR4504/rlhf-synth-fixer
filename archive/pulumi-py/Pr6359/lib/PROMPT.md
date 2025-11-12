Hey team,

We've got an exciting project from a fast-growing e-commerce startup. They're scaling rapidly and need to deploy their Python Flask API to AWS using infrastructure as code. The API handles product catalog queries and needs to stay highly available during those crazy peak shopping periods like Black Friday. The team has decided to use Pulumi with Python for managing their infrastructure, which makes sense since it keeps everything consistent with their application codebase.

The current situation is that they have their Flask API containerized and ready to go, but they need the entire AWS infrastructure set up properly. They're expecting high traffic volumes and can't afford any downtime during peak shopping hours. The architecture needs to be production-ready from day one with proper high availability, security, monitoring, and the ability to scale automatically based on demand.

## What we need to build

Create a production-grade infrastructure using **Pulumi with Python** to deploy a containerized Flask API on AWS ECS Fargate with full high availability and auto-scaling capabilities.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 2 public and 2 private subnets across 2 availability zones for high availability
   - NAT gateways to enable outbound internet access for containers in private subnets
   - Internet gateway for public subnet connectivity
   - Proper route tables for public and private subnet traffic routing

2. **Container and Compute**
   - ECS cluster for managing containerized workloads
   - ECS service running the Flask API container on Fargate launch type
   - Task definition configured with 1 vCPU and 2GB memory
   - ECR repository to store the Flask API Docker image with image scanning enabled
   - Private ECR repository with secure access controls

3. **Load Balancing and Traffic Management**
   - Application Load Balancer in public subnets for traffic distribution
   - Target group with health checks on /health endpoint
   - HTTPS listener using ACM certificate for the domain api.example.com
   - Route53 A record aliasing api.example.com to the ALB

4. **Database Infrastructure**
   - RDS Aurora PostgreSQL cluster with one writer and one reader instance
   - Database deployed in private subnets across availability zones
   - Database passwords stored securely in AWS Secrets Manager

5. **Security Configuration**
   - Security groups allowing ALB to communicate with ECS tasks on port 5000
   - Security groups for database access restricted to ECS tasks only
   - IAM roles and policies for ECS task execution and task role
   - Proper least-privilege access controls

6. **Monitoring and Logging**
   - CloudWatch log groups for ECS container logs with 7-day retention
   - CloudWatch log groups for ALB access logs with 7-day retention
   - Proper log stream configuration for debugging and monitoring

7. **Auto-Scaling**
   - ECS service auto-scaling based on CPU utilization
   - Scale between 2 and 10 tasks to handle traffic spikes
   - Target tracking scaling policy for optimal resource usage

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** with public and private subnets across 2 availability zones
- Use **ECS Fargate** for serverless container execution
- Use **Application Load Balancer** for traffic distribution with HTTPS
- Use **RDS Aurora PostgreSQL** for database with writer and reader instances
- Use **ECR** for private container registry with image scanning
- Use **Security Groups** to control network access between components
- Use **IAM** for roles and policies with least-privilege access
- Use **CloudWatch** for centralized logging with 7-day retention
- Use **Auto Scaling** for ECS service based on CPU metrics
- Use **Route53** for DNS record management
- Use **Secrets Manager** for secure database password storage
- Use **ACM** for SSL/TLS certificate management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{purpose}-{environment-suffix}
- Deploy to **eu-south-1** region
- All resources must be tagged with Environment='production' and Project='ecommerce-api'

### Constraints

- The ECS task definition must use Fargate launch type with exactly 1 vCPU and 2GB memory
- Database passwords must be stored in AWS Secrets Manager and referenced securely in task definitions
- The ALB must use HTTPS with an ACM certificate for the domain api.example.com
- Container images must be stored in a private ECR repository with image scanning enabled
- All logs must be sent to CloudWatch with a 7-day retention policy
- All resources must be destroyable without Retain policies for testing environments
- Infrastructure must span exactly 2 availability zones for cost-effective high availability
- Private subnets for ECS tasks and database, public subnets for ALB
- Include proper error handling and validation in the code

## Success Criteria

- **Functionality**: Complete infrastructure deploys successfully with all components connected
- **High Availability**: Resources distributed across 2 availability zones with automatic failover
- **Scalability**: Auto-scaling configured to handle 2-10 tasks based on CPU utilization
- **Security**: HTTPS enabled, secrets managed properly, security groups restrict access appropriately
- **Monitoring**: All logs flowing to CloudWatch with proper retention policies
- **Resource Naming**: All resources include environmentSuffix parameter for uniqueness
- **Outputs**: ALB DNS name, ECR repository URI, and RDS cluster endpoint exported for development team
- **Code Quality**: Clean Python code, well-structured, properly documented

## What to deliver

- Complete Pulumi Python implementation in __main__.py
- VPC with subnets, route tables, NAT gateways, and internet gateway
- ECS cluster, service, and task definition for Flask API on Fargate
- Application Load Balancer with HTTPS listener, target group, and health checks
- RDS Aurora PostgreSQL cluster with writer and reader instances
- ECR repository for container images with scanning enabled
- Security groups for ALB, ECS tasks, and database
- IAM roles and policies for ECS task execution and task role
- CloudWatch log groups for ECS and ALB with 7-day retention
- Auto-scaling configuration for ECS service based on CPU
- Route53 A record for api.example.com
- Secrets Manager secret for database password
- ACM certificate reference for HTTPS
- Pulumi outputs exporting ALB DNS, ECR URI, and RDS endpoint
- Proper resource tagging throughout
