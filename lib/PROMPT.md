# Product Catalog API Infrastructure

Hey team,

We need to build a production-ready infrastructure for our retail product catalog API. The business is preparing for seasonal sales traffic spikes and needs a robust, scalable deployment that can handle high volumes while maintaining consistent performance. I've been asked to create this using **CDKTF with Python** targeting the eu-north-1 region.

The API is containerized and runs on port 3000, serving product data from a PostgreSQL database. During peak seasons, traffic can increase dramatically, so the infrastructure needs to scale automatically while keeping response times low. We also need global content delivery to ensure customers worldwide get fast responses.

The technical team has specified that we must use CDK L2 constructs for better abstraction and maintainability. Database credentials need to be securely managed, and all components must have proper logging for troubleshooting. Cost optimization is important, so we're looking at using Fargate Spot instances where possible.

## What we need to build

Create a containerized API deployment infrastructure using **CDKTF with Python** for a product catalog service that can handle variable traffic patterns and maintain high availability.

### Core Requirements

1. **Container Orchestration**
   - ECS Fargate service running the API container on port 3000
   - Use FARGATE_SPOT capacity provider for cost optimization
   - Allocate 1 vCPU and 2GB memory per task
   - Configure environment variables for database connection in ECS tasks

2. **Load Balancing and Health Monitoring**
   - Application Load Balancer for distributing traffic
   - Health checks on /health endpoint
   - 30 seconds interval with 2 consecutive failures threshold

3. **Database Layer**
   - RDS Aurora PostgreSQL in private subnets
   - Minimum db.t3.medium instance class
   - Automatic backups enabled
   - Database password stored in Secrets Manager

4. **Content Delivery**
   - CloudFront distribution for global content delivery
   - Use managed caching policy for API endpoints

5. **Auto-scaling Configuration**
   - Minimum 2 tasks, maximum 10 tasks
   - Scale based on CPU utilization

6. **Networking and Security**
   - VPC with public and private subnets across 2 availability zones
   - Security groups following least privilege principle
   - Allow ALB to ECS traffic
   - Allow ECS to RDS traffic

7. **Observability**
   - CloudWatch logging for all components
   - S3 log buckets with 30-day lifecycle policy

8. **Resource Organization**
   - Tag all resources with Environment=production
   - Tag all resources with Project=catalog-api
   - All resource names must include **environmentSuffix** for uniqueness

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use CDK L2 constructs only (no L1 constructs)
- Resource naming convention: use f-strings with `{environment_suffix}` parameter
- Deploy to **eu-north-1** region
- Stack deployment must complete within 15 minutes
- All resources must be destroyable (no deletion protection, no retain policies)
- Follow naming convention: `resource-type-{environment_suffix}`

### Constraints

- ECS tasks must have exactly 1 vCPU and 2GB memory allocated
- RDS instance must use db.t3.medium class minimum
- CloudFront must use managed caching policy for API endpoints
- ALB health check settings: 30 seconds interval, 2 consecutive failures threshold
- S3 log buckets: 30-day lifecycle policy
- Security groups: least privilege principle
- Database password: stored in Secrets Manager
- ECS service: use FARGATE_SPOT capacity provider
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: ECS service successfully runs containers and connects to database
- **Performance**: Auto-scaling responds to CPU utilization changes
- **Reliability**: Multi-AZ deployment with health checks and automatic failover
- **Security**: Database credentials in Secrets Manager, proper security group isolation
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Python code, well-structured, properly typed, documented
- **Observability**: CloudWatch logs capture all component activity
- **Global Delivery**: CloudFront distributes content with proper caching

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- VPC with public and private subnets across 2 AZs
- ECS Fargate cluster and service with auto-scaling
- Application Load Balancer with health checks
- RDS Aurora PostgreSQL cluster with Secrets Manager integration
- CloudFront distribution
- Security groups for ALB, ECS, and RDS
- CloudWatch log groups
- S3 bucket for logs with lifecycle policy
- Stack outputs for CloudFront distribution URL and ALB DNS name
- Documentation and deployment instructions