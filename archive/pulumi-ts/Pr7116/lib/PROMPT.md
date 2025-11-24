# Financial Analytics Platform Infrastructure

Hey team,

We've been asked to build the foundational cloud infrastructure for a financial services startup launching their real-time trading analytics platform. This is their first production environment on AWS, and they need it to handle high-frequency data ingestion and processing while meeting strict financial compliance requirements. The platform will process market data in real-time and serve analytics dashboards to traders.

The business requirements are clear - they need a production-ready environment that can scale automatically, minimize costs through smart resource allocation, and maintain the security posture required for handling financial data. The architecture needs to support containerized microservices, handle streaming data ingestion, and provide a robust data lake for analytics.

What makes this project interesting is the balance between cost optimization and reliability. They want to use Fargate Spot instances to reduce compute costs, but still maintain high availability across multiple availability zones. They're also keen on avoiding NAT gateway costs by using VPC endpoints wherever possible.

## What we need to build

Create a production-ready cloud infrastructure using **Pulumi with TypeScript** for a financial analytics platform deployed in the us-east-2 region.

### Core Infrastructure Requirements

1. **Network Foundation**
   - VPC spanning 3 availability zones for high availability
   - Public subnets for load balancers and bastion hosts
   - Private subnets for all compute and data resources
   - All compute resources must run in private subnets with no direct internet access

2. **Compute Layer**
   - ECS cluster with Fargate Spot capacity providers for cost optimization
   - ECS tasks must use Fargate Spot instances with minimum 2 vCPU and 4GB memory
   - IAM roles with least-privilege policies for ECS tasks

3. **Data Storage**
   - Aurora PostgreSQL Serverless v2 cluster for transactional data
   - Database backups encrypted with customer-managed KMS keys
   - Backup retention period of exactly 35 days
   - S3 buckets for raw data ingestion and processed analytics
   - S3 versioning enabled with lifecycle policies to transition objects older than 90 days to Glacier

4. **Security and Encryption**
   - Customer-managed KMS keys for encrypting database backups and CloudWatch logs
   - Security groups allowing only necessary inter-service communication
   - All inter-service communication must use VPC endpoints instead of NAT gateways

5. **Observability**
   - CloudWatch log groups for all services with KMS encryption
   - CloudWatch log retention period of exactly 30 days

6. **Networking Optimization**
   - VPC endpoints for S3, ECS, ECR, and CloudWatch to avoid NAT costs
   - No NAT gateways should be deployed

7. **Stack Outputs**
   - Export all critical resource ARNs and endpoints as stack outputs

### Optional Enhancements

If time permits and they add value to the solution:

- Kinesis Data Streams for real-time data ingestion to enable streaming analytics
- AWS Secrets Manager for database credentials rotation to improve security posture
- AWS Backup for centralized backup management to simplify compliance reporting

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** parameter for uniqueness across deployments
- Follow naming convention: `resource-type-${environmentSuffix}`
- All resources must be destroyable - no RETAIN deletion policies or deletion protection
- Include proper error handling and logging throughout

### Deployment Requirements (CRITICAL)

1. **environmentSuffix Parameter**: ALL named resources (S3 buckets, ECS clusters, RDS clusters, KMS keys, CloudWatch log groups) must include the environmentSuffix in their names to prevent conflicts in CI/CD. Use the pattern: `resource-name-${environmentSuffix}`

2. **Destroyability**: All resources must be fully destroyable for testing:
   - S3 buckets: No retention policies that prevent deletion
   - RDS clusters: skipFinalSnapshot: true, deletionProtection: false
   - KMS keys: Enable key deletion with appropriate waiting period
   - No RemovalPolicy.RETAIN or DeletionPolicy: Retain

3. **Service-Specific Warnings**:
   - GuardDuty: Do NOT create GuardDuty detectors - they are account-level resources (one per account/region)
   - AWS Config: If used, IAM role must use the correct managed policy `service-role/AWS_ConfigRole`
   - Lambda: For Node.js 18+, AWS SDK v2 is not available by default - use SDK v3 or extract data from event objects

### Constraints

- All compute resources must run in private subnets with no direct internet access
- Database backups must be encrypted with customer-managed KMS keys and retained for exactly 35 days
- ECS tasks must use Fargate Spot instances with a minimum of 2 vCPU and 4GB memory
- All inter-service communication must use VPC endpoints instead of NAT gateways
- CloudWatch log groups must have a retention period of exactly 30 days with KMS encryption
- S3 buckets must have versioning enabled and lifecycle policies to transition objects older than 90 days to Glacier

## Success Criteria

- **Functionality**: Infrastructure supports containerized microservices, data lake storage, and streaming ingestion
- **Performance**: Auto-scaling Fargate Spot instances, serverless Aurora for cost optimization
- **Reliability**: Multi-AZ deployment across 3 availability zones, automated backups
- **Security**: Customer-managed encryption, least-privilege IAM, private subnets, security groups
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed for testing
- **Cost Optimization**: VPC endpoints instead of NAT gateways, Fargate Spot instances
- **Code Quality**: TypeScript with proper typing, well-tested, comprehensive documentation

## What to deliver

- Complete Pulumi TypeScript implementation in index.ts
- Pulumi.yaml project configuration
- package.json with all required dependencies
- Comprehensive unit tests achieving 100% coverage
- Integration tests validating deployed resources
- Complete documentation including deployment instructions
- All AWS services properly integrated: VPC, ECS Fargate, Aurora PostgreSQL Serverless v2, KMS, S3, VPC Endpoints, Security Groups, CloudWatch Logs, IAM
