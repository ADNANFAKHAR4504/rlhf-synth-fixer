Hey team,

We've got an exciting migration project on our hands. A fintech startup has been running their payment processing system on EC2 instances with manual deployments, and it's time to modernize. They need to move to a containerized environment using ECS Fargate while keeping their service running without any downtime during the transition. This is a critical production system handling payments, so we need to get this right.

The current setup is fairly traditional - they've got an Application Load Balancer, RDS PostgreSQL 14.x running in Multi-AZ configuration, and an ElastiCache Redis cluster. Everything's in us-east-2, spanning 3 availability zones with the standard public and private subnet setup. The challenge here is that we need to import their existing VPC infrastructure from a legacy Pulumi stack and build the new containerized platform alongside it.

I've been asked to create this infrastructure using **Pulumi with Python**. The migration needs to be smooth, with proper monitoring and auto-scaling from day one. They want to use Secrets Manager for database credential rotation, which is smart for a payment processing system. The business is particularly concerned about security, so everything needs to stay in private subnets with proper encryption.

## What we need to build

Create a containerized payment processing platform using **Pulumi with Python** for migrating from EC2 to ECS Fargate in the us-east-2 region.

### Core Requirements

1. **Infrastructure Import and Setup**
   - Import existing VPC, subnets, and security groups from legacy Pulumi stack named 'legacy-infrastructure'
   - Create ECS cluster optimized for Fargate workloads
   - All resource names must include environmentSuffix parameter for uniqueness
   - Follow naming convention: resource-type-environment-suffix

2. **Container Registry and Image Management**
   - Set up ECR repository for payment-processor container images
   - Configure lifecycle policies to retain only the last 10 images
   - Enable vulnerability scanning on the repository
   - Ensure repository is private with proper access controls

3. **ECS Task and Service Configuration**
   - Define task definition for payment-processor:latest container
   - Allocate 2 vCPU and 4GB memory per task
   - Configure container to pull database credentials from Secrets Manager at runtime
   - Create ECS service with 3 desired tasks distributed across availability zones
   - Support both blue/green and rolling update deployment strategies

4. **Load Balancing and Health Checks**
   - Set up target group for ECS service
   - Configure health checks on /health endpoint
   - Require X-Health-Check: true header in health check requests
   - Output load balancer DNS name for client integration

5. **Auto-Scaling Configuration**
   - Configure auto-scaling to maintain 3-10 tasks
   - Set up CPU-based scaling at 70% threshold
   - Set up memory-based scaling at 80% threshold
   - Ensure scaling policies work together effectively

6. **Logging and Monitoring**
   - Create CloudWatch log groups with encryption enabled
   - Set 30-day retention for application logs
   - Centralize all ECS task logs in CloudWatch
   - Ensure logs are accessible for debugging and audit

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **ECS** with **Fargate** launch type for container orchestration
- Use **ECR** for private container image storage
- Use **Secrets Manager** for database credential management with rotation support
- Use **Application Auto Scaling** for ECS service scaling
- Use **Elastic Load Balancing** for traffic distribution
- Use **CloudWatch** for logging and monitoring
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Use Pulumi stack references to import from legacy-infrastructure stack

### Constraints

- Must use Pulumi's stack references to read outputs from existing legacy stack
- ECS service must support both blue/green and rolling update deployment strategies
- Database connections must use AWS Secrets Manager for credential rotation
- Application logs must be centralized in CloudWatch Logs with 30-day retention
- Load balancer health checks must have custom HTTP endpoints with specific headers
- Container images must be stored in private ECR repository with vulnerability scanning enabled
- Network traffic between services must remain within private subnets
- Auto-scaling policies must be based on both CPU and memory metrics
- All resources must be tagged with environment, team, and cost-center tags
- All resources must be destroyable (no Retain policies allowed)
- Include proper error handling and logging throughout

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter for environment isolation
- Resources MUST be created with RemovalPolicy.DESTROY or equivalent (no Retain policies)
- ECS tasks must be able to pull from ECR without internet gateway (use VPC endpoints if needed)
- Secrets Manager integration must not hard-code credentials in task definitions
- Auto-scaling must respond to both CPU and memory independently
- Health checks must use custom headers to prevent unauthorized health check abuse

## Success Criteria

- Functionality: ECS Fargate service runs 3 payment-processor tasks with database connectivity via Secrets Manager
- Performance: Auto-scaling maintains 3-10 tasks based on CPU (70%) and memory (80%) thresholds
- Reliability: Tasks distributed across multiple availability zones with health monitoring
- Security: Private ECR repository, encrypted CloudWatch logs, credentials from Secrets Manager, private subnet traffic only
- Resource Naming: All resources include environmentSuffix parameter
- Integration: Load balancer DNS and ECR repository URI exported for CI/CD pipelines
- Migration Support: Stack references successfully import VPC/subnet/security group from legacy stack
- Code Quality: Python code, well-tested, documented, production-ready

## What to deliver

- Complete Pulumi Python implementation
- ECS cluster, task definition, and service with Fargate launch type
- ECR repository with lifecycle policies and vulnerability scanning
- Application Auto Scaling policies for CPU and memory
- CloudWatch log groups with encryption and retention
- Secrets Manager integration for database credentials
- Target group and load balancer integration with custom health checks
- Stack reference configuration to import legacy infrastructure
- Unit tests for all components
- Documentation and deployment instructions
- All resource names using environmentSuffix parameter
