Hey team,

We have a critical requirement from the business to implement a production-grade high availability solution for our infrastructure in a single AWS region. The goal is to achieve robust infrastructure with automated backups, monitoring, and alerting capabilities. The business needs this to ensure we can maintain operations and recover from failures quickly.

I've been asked to build this using **AWS CDK with TypeScript** and deploy it to us-east-1. The architecture needs to be comprehensive, covering our database layer, application tier, storage, and all the monitoring needed to detect and respond to issues.

The leadership team is particularly concerned about data protection, so we need automated backups with appropriate retention policies, health monitoring that can detect failures quickly, and visibility into the system's health through dashboards and immediate alerting when issues arise.

## What we need to build

Create a high availability solution using **AWS CDK with TypeScript** that implements infrastructure best practices in the us-east-1 region.

### Core Requirements

1. **Database Layer**
   - Deploy RDS Aurora PostgreSQL cluster with VER_15_6 engine version (Note: VER_15_5 is not supported by AWS; VER_15_6 is the correct version)
   - Enable automated backups with AWS Backup and 7-day retention
   - Use KMS CMK for encryption of snapshots and data at rest
   - Configure in VPC with private subnets for security

2. **Data Storage**
   - Create S3 bucket with versioning and encryption enabled
   - Use KMS encryption for S3 bucket
   - Enable lifecycle policies for cost optimization
   - Configure DynamoDB table for session management
   - Use on-demand billing for DynamoDB with point-in-time recovery enabled
   - Enable contributor insights for DynamoDB

3. **Application Infrastructure**
   - Deploy Application Load Balancer with proper target groups
   - Use AWS Certificate Manager certificates for ALB (assume certificate exists)
   - Configure ECS Fargate services as targets for the load balancer
   - Implement proper VPC configuration with public and private subnets
   - Set up security groups following least privilege principles

4. **Observability and Metrics**
   - Configure CloudWatch dashboards for monitoring key metrics
   - Create CloudWatch alarms that trigger SNS notifications
   - Set up CloudWatch Logs groups with 30-day retention
   - Monitor key metrics: database health, application availability, response times
   - Deploy SNS topics for alerting with multiple email endpoints

5. **Backup and Recovery**
   - Implement AWS Backup plans for RDS Aurora and DynamoDB
   - Configure 7-day retention period for all backups
   - Tag backup resources appropriately for cost tracking

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **RDS Aurora PostgreSQL VER_15_5** (not VER_15_3 which is unavailable)
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- IAM roles follow least privilege principles
- All resources must be destroyable (no DeletionPolicy.RETAIN or deletion protection)

### Constraints and Compliance

- RDS clusters must use encrypted snapshots with KMS Customer Managed Keys
- IAM roles must follow least privilege principles
- CloudWatch alarms must trigger SNS to multiple email endpoints
- S3 buckets must have versioning and encryption enabled
- ALB must use ACM certificates (assume certificates exist)
- DynamoDB tables must have contributor insights enabled
- All encryption uses AWS managed or customer managed KMS keys
- Proper tagging for cost allocation and resource management

### Cost Optimization

- Prefer serverless options: Aurora Serverless v2, Fargate
- Use on-demand billing for DynamoDB to optimize for variable workloads
- Implement lifecycle policies for S3 and backup retention
- Avoid NAT Gateways where possible (use VPC endpoints)

## Success Criteria

- **Functionality**: Complete high availability infrastructure with monitoring and backups
- **Reliability**: CloudWatch monitors key metrics and triggers alarms appropriately
- **Security**: All data encrypted at rest and in transit, IAM follows least privilege
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Observability**: CloudWatch dashboards show real-time infrastructure health metrics
- **Backup**: AWS Backup configured with 7-day retention for RDS and DynamoDB
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete **AWS CDK TypeScript** implementation across lib/ directory
- Separate stack classes for each logical component (network, database, compute, monitoring, storage, backup, KMS)
- Single-region deployment pattern in us-east-1
- Comprehensive unit tests for all stacks in test/ directory
- Integration tests to validate deployed infrastructure
- All AWS services properly integrated: Aurora, DynamoDB, S3, ALB, ECS Fargate, CloudWatch, SNS, AWS Backup, KMS, IAM, VPC
- Clear documentation of monitoring and backup approach
