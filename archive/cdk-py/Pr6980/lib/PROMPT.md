# Transaction Processing System with High Availability

Hey team,

We need to build a reliable transaction processing system that can handle failures gracefully. Our product team wants a system that stays available even when individual components fail, recovers quickly from issues, and processes transactions without losing data. The business has been facing downtime during AZ failures, and we need to fix that.

I've been asked to create this using AWS CDK with Python. The focus is on high availability within a single region rather than complex multi-region DR. We want something production-ready that actually deploys and works reliably.

The system needs to handle transaction processing with automatic failover, data persistence across availability zone failures, and comprehensive monitoring to catch issues before they impact customers. We're targeting 99.9% availability with sub-5-minute recovery times.

## What we need to build

Create a high-availability transaction processing system using **AWS CDK with Python** that handles failures gracefully and recovers automatically.

### Core Requirements

1. **Database Layer - Aurora Serverless v2**
   - Multi-AZ PostgreSQL deployment across 2 availability zones
   - Version 15.8 specifically (verified available)
   - Automated backups with point-in-time recovery
   - Auto-scaling from 0.5 to 4 ACUs
   - Fast provisioning for quick recovery

2. **Application Layer - ECS Fargate**
   - Container-based transaction processors
   - Deploy across 2 availability zones for redundancy
   - Application Load Balancer with health checks
   - Target tracking auto-scaling based on CPU and memory
   - Automatic task replacement on failure

3. **Session Management - DynamoDB**
   - Single-region table with point-in-time recovery
   - On-demand billing for automatic scaling
   - Global secondary index for query performance
   - Session state preserved across AZ failures

4. **Transaction Logs - S3**
   - Versioning enabled for data protection
   - Lifecycle policies (transition to IA after 30 days)
   - Server-side encryption with SSE-S3
   - Immutable audit trail of all transactions

5. **Event Processing - Lambda**
   - Event-driven transaction validation
   - Built-in retry logic with exponential backoff
   - Circuit breaker pattern for failure handling
   - Dead letter queue for failed events
   - Process events from transaction queue

6. **Monitoring and Alerting - CloudWatch**
   - Dashboard showing all service metrics
   - Alarms for critical conditions (DB CPU, ECS health, Lambda errors)
   - Log aggregation from all services
   - SNS notifications for alerts

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- VPC with 2 availability zones
- Public subnets for ALB
- Private subnets for ECS and Lambda
- Isolated subnets for Aurora and DynamoDB VPC endpoints
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **us-east-1** region
- All resources must be destroyable (RemovalPolicy.DESTROY, no Retain policies)
- Use KMS encryption for data at rest
- IAM roles with least privilege access
- Security groups with minimal required access

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL resource names must include environmentSuffix parameter for CI/CD compatibility
- **Destroyability**: All resources must use RemovalPolicy.DESTROY (no RETAIN policies)
- **No deletion protection**: Set deletion_protection=False on Aurora, ALB, and other protected resources
- **Fast provisioning**: Use Aurora Serverless v2 (not provisioned RDS) for 5-10 minute deployment times
- **Cost optimization**: Single NAT Gateway for testing (not one per AZ), serverless services preferred

### Constraints

- Single region deployment (us-east-1)
- Multi-AZ for high availability (2 AZs)
- No cross-region replication or global tables
- No Route 53 failover (single region)
- Aurora Serverless v2 PostgreSQL version 15.8 specifically
- Security groups must allow required traffic only
- Include proper error handling and retry logic
- CloudWatch log retention 7 days (cost optimization)

## Success Criteria

- **Functionality**: All 6 services deploy successfully and integrate properly
- **Performance**: Deployment completes in under 15 minutes (Aurora Serverless v2)
- **Reliability**: Services survive AZ failure with automatic failover
- **Security**: Data encrypted at rest and in transit, IAM least privilege
- **Monitoring**: CloudWatch dashboard shows all critical metrics
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: Stack can be destroyed completely without manual intervention
- **Code Quality**: Python, well-structured, production-ready, documented
- **Testing**: Unit tests with 100% coverage

## What to deliver

- Complete AWS CDK Python implementation
- VPC with 2 AZs (public, private, isolated subnets)
- Aurora Serverless v2 PostgreSQL 15.8 (Multi-AZ)
- ECS Fargate with Application Load Balancer
- DynamoDB table with GSI and PITR
- S3 bucket with versioning and lifecycle
- Lambda functions with retry logic and DLQ
- CloudWatch dashboard, alarms, and log groups
- Security groups and IAM roles
- Unit tests for all infrastructure components
- README with deployment and usage instructions