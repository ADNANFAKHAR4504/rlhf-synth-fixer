# Cloud Environment for Transaction Processing

Hey team,

We need to build out a cloud environment for our financial services transaction processing system. The business is expanding their transaction workload and needs a proper AWS infrastructure that can handle high-throughput data processing while keeping everything secure and cost-efficient.

I've been asked to set this up using **Pulumi with Python** with strict typing enabled. The environment needs to support containerized transaction processing services running on ECS Fargate, backed by an Aurora PostgreSQL database cluster for persistent storage. The business wants this deployed in us-east-1 with proper network isolation, load balancing, and comprehensive monitoring.

The key challenge here is getting all the networking right - we need public and private subnets across two availability zones, proper security group configurations to lock down traffic between components, and we need to make sure ECS tasks can talk to RDS and S3 without exposing unnecessary access. They also want CloudWatch logging set up from day one with 30-day retention for compliance purposes.

## What we need to build

Create a complete cloud environment using **Pulumi with Python** for transaction processing workloads. The infrastructure should support containerized services on ECS Fargate with Aurora PostgreSQL for data persistence, proper networking with public/private subnet architecture, load balancing for incoming traffic, and comprehensive logging and monitoring.

## Core Requirements

1. **Networking Infrastructure**
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets and 2 private subnets across 2 availability zones
   - NAT Gateways for outbound traffic from private subnets
   - VPC Endpoints for S3 and DynamoDB to reduce data transfer costs
   - Internet Gateway for public subnet access

2. **Container Orchestration**
   - ECS cluster configured for Fargate compute
   - Target groups for Application Load Balancer integration
   - All compute resources must use ARM-based instances for cost optimization

3. **Database Layer**
   - RDS Aurora PostgreSQL cluster with one writer and one reader instance
   - Deployed in private subnets only
   - Proper security group configuration for database access

4. **Load Balancing**
   - Application Load Balancer in public subnets
   - Target groups configured for ECS services
   - Health checks for service availability

5. **Access Management**
   - IAM roles for ECS tasks with least-privilege access
   - ECS task roles can access RDS and S3
   - No overly permissive wildcard permissions

6. **Storage**
   - S3 bucket for application logs
   - S3 bucket for processed transaction data
   - Proper encryption and access controls

7. **Monitoring and Logging**
   - CloudWatch Log Groups for all services (ECS, RDS, ALB)
   - 30-day retention period for all log groups
   - Proper log streaming from ECS tasks

8. **Security**
   - Security groups allowing only necessary traffic between components
   - ECS tasks in private subnets
   - RDS in private subnets with no public access
   - ALB in public subnets for ingress

## Technical Requirements

- All infrastructure defined using **Pulumi with Python** (strict typing enabled)
- Deploy to **us-east-1** region
- Use **VPC** for network isolation (CIDR: 10.0.0.0/16)
- Use **ECS with Fargate** for container orchestration
- Use **RDS Aurora PostgreSQL** with writer and reader instances
- Use **Application Load Balancer** for traffic distribution
- Use **IAM** for least-privilege access control
- Use **S3** for logs and processed data
- Use **CloudWatch Logs** with 30-day retention
- Use **Security Groups** for network access control
- Use **NAT Gateways** for private subnet outbound connectivity
- Use **VPC Endpoints** for S3 and DynamoDB

## Deployment Requirements (CRITICAL)

**Resource Naming with environmentSuffix**:
- ALL named resources MUST include an `environment_suffix` parameter for uniqueness
- Use pattern: `{resource-type}-{environment-suffix}` or `f"{resource_name}-{environment_suffix}"`
- Examples: `f"transaction-vpc-{environment_suffix}"`, `f"app-logs-{environment_suffix}"`
- This prevents resource conflicts during parallel CI/CD deployments

**Destroyability Requirements**:
- All resources MUST be destroyable after testing
- Do NOT use deletion protection on any resources
- Do NOT use RemovalPolicy RETAIN
- RDS clusters must use `skip_final_snapshot=True`
- S3 buckets should allow deletion
- This is critical for CI/CD cleanup automation

**Service-Specific Warnings**:
- RDS Aurora: Prefer Aurora Serverless v2 for faster provisioning if possible, otherwise use standard Aurora with minimal backup retention (1 day)
- NAT Gateway: Only create 1 NAT Gateway (not one per AZ) to minimize costs (~$32/month each)
- Lambda: If adding Lambda functions later, ensure Node.js 18+ compatibility (AWS SDK v3 required)

## Constraints

- All resources deployed in us-east-1 region
- Python code with strict typing enabled for all Pulumi resources
- VPC CIDR must be 10.0.0.0/16 with exactly 4 subnets (2 public, 2 private)
- All compute resources must use ARM-based instances (Graviton) for cost optimization
- Enable deletion protection on production resources only (for this synthetic task, deletion protection should be disabled)
- Resource names must follow pattern: `{service}-{environment-suffix}`
- No hardcoded environment names like "prod" or "dev"
- All resources must include proper tagging

## Success Criteria

- **Functionality**: Complete VPC with public/private subnets, ECS cluster, Aurora PostgreSQL, ALB, proper IAM roles
- **Networking**: Proper security group rules, NAT Gateway for private subnet egress, VPC Endpoints for S3/DynamoDB
- **Security**: Least-privilege IAM policies, no public database access, encrypted storage
- **Monitoring**: CloudWatch Log Groups with 30-day retention for all services
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Destroyability**: No Retain policies, no deletion protection, all resources can be destroyed
- **Code Quality**: Python with type hints, well-structured, readable

## What to deliver

- Complete Pulumi Python implementation with all required AWS services
- VPC with 2 public and 2 private subnets across 2 AZs
- ECS cluster with Fargate configuration and target groups
- RDS Aurora PostgreSQL with writer and reader instances
- Application Load Balancer with proper target group configuration
- IAM roles for ECS tasks with least-privilege access to RDS and S3
- S3 buckets for application logs and processed transaction data
- CloudWatch Log Groups with 30-day retention
- Security groups with proper traffic rules
- Stack outputs for ALB DNS name, RDS endpoint, and S3 bucket names
- Documentation with deployment instructions
