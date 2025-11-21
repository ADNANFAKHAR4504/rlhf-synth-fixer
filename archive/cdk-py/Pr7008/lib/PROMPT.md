# Transaction Processing Application Infrastructure

Hey team,

We have a financial services startup that needs to deploy their transaction processing web application with strict compliance requirements. The business needs high availability, automated database failover, and granular access controls for their development team. They want to implement blue-green deployment capabilities to minimize downtime during releases and ensure smooth rollbacks if issues occur.

The application is containerized and needs to run on a scalable platform that can handle variable transaction volumes throughout the day. The database must be highly available with automatic failover to prevent any data loss during failures. We also need comprehensive monitoring to track application health and database performance in real-time.

## What we need to build

Create a complete containerized application infrastructure using **AWS CDK with Python** for deploying a transaction processing web application with blue-green deployment capabilities.

### Core Requirements

1. **Container Orchestration**
   - Deploy ECS Fargate service with task definition using 2 vCPU and 4GB memory
   - Configure task definitions with proper resource allocation
   - Use awslogs driver with log group retention of 3 days

2. **Database Layer**
   - Create RDS Aurora PostgreSQL cluster with 2 instances across different AZs
   - Configure automatic failover between availability zones
   - Set up automatic RDS snapshots with 7-day retention period
   - Database must have deletion_protection=False for testing environments

3. **Load Balancing and Traffic Management**
   - Configure Application Load Balancer with target group health checks every 30 seconds
   - Implement weighted target groups for blue-green deployments with 80/20 traffic split
   - Use internet-facing scheme with IPv4 addressing only

4. **Network Architecture**
   - Set up VPC with 3 private subnets and 3 public subnets across 3 AZs
   - Database subnet group must span exactly 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
   - Deploy NAT Gateways for private subnet internet access

5. **Monitoring and Observability**
   - Create custom CloudWatch dashboard showing ECS task count and RDS connections
   - Configure CloudWatch Logs integration for ECS tasks
   - Set up metrics for application and database performance

6. **Outputs**
   - Output ALB DNS name for application configuration
   - Output database endpoint for application configuration
   - Include all connection endpoints as stack outputs

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon ECS Fargate** for container orchestration
- Use **Amazon RDS Aurora PostgreSQL** for database
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon VPC** for network isolation
- Use **Amazon CloudWatch** for monitoring and logging
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Requires AWS CDK 2.x with Python 3.9+

### Deployment Requirements (CRITICAL)

- **ALL named resources MUST include environmentSuffix variable** for uniqueness across deployments
- **ALL resources MUST be destroyable** - use `removal_policy=RemovalPolicy.DESTROY`
- **RDS Configuration for Fast Cleanup**:
  - Prefer Aurora Serverless v2 for faster provisioning and destruction
  - Use `backup_retention_period=1` (minimum) instead of 7 days for faster cleanup
  - Use `skip_final_snapshot=True` to avoid snapshot delays during destruction
  - Set `deletion_protection=False` explicitly
- **Cost Optimization**:
  - Consider using 1 NAT Gateway instead of per-AZ deployment to reduce costs
  - Alternatively, use VPC Endpoints where possible to avoid NAT Gateway charges

### Constraints

- All resources must use `removal_policy=RemovalPolicy.DESTROY` for easy cleanup
- Security groups must follow least privilege with explicit port definitions
- All IAM roles must avoid wildcard permissions except for CloudWatch Logs
- Stack must include CfnOutput for all connection endpoints
- ECS tasks must use awslogs driver with proper log retention
- RDS cluster must be easily destroyable for testing environments
- All resources must be production-ready and deployable

## Success Criteria

- **Functionality**: Complete ECS Fargate deployment with RDS Aurora backend
- **High Availability**: Multi-AZ deployment for both compute and database layers
- **Blue-Green Deployment**: Weighted target groups enable gradual traffic shifting
- **Monitoring**: CloudWatch dashboard provides real-time visibility into system health
- **Security**: Proper VPC isolation with security groups following least privilege
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be completely destroyed without manual intervention
- **Code Quality**: Clean Python code, well-structured, properly documented

## What to deliver

- Complete AWS CDK Python implementation
- ECS Fargate service with task definitions
- RDS Aurora PostgreSQL cluster with multi-AZ configuration
- Application Load Balancer with weighted target groups for blue-green deployments
- VPC with proper subnet configuration across 3 availability zones
- CloudWatch dashboard and logging configuration
- Security groups and IAM roles with least privilege access
- Stack outputs for application configuration
- Comprehensive README with deployment instructions
