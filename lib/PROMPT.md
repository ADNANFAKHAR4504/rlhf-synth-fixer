# Disaster Recovery Solution for GlobalStream

You are an expert AWS Infrastructure Engineer. Create infrastructure using **AWS CDK with Go**.

## Platform Requirements
- **Platform**: AWS CDK (Cloud Development Kit)
- **Language**: Go
- **Region**: ca-central-1 (primary region for DR solution pilot)

## Business Context
GlobalStream is a major streaming platform serving millions of users across South America with live and on-demand content. They need a disaster recovery solution in sa-east-1 that maintains business continuity during regional outages while ensuring compliance with local media regulations.

## Technical Requirements

### Recovery Objectives
- RPO (Recovery Point Objective): 15 minutes
- RTO (Recovery Time Objective): 1 hour
- Automated failover testing capability

### Required AWS Services

Implement ALL of the following services:

1. **RDS (Relational Database Service)**
   - Multi-AZ Aurora Serverless v2 cluster for PostgreSQL
   - Stores user and content metadata
   - Enable encryption at rest
   - Automated backups with 15-minute RPO

2. **ECS Fargate**
   - Cluster for media processing workloads
   - Task definitions for content transcoding and processing
   - Auto-scaling configuration
   - CloudWatch Logs integration

3. **EFS (Elastic File System)**
   - File system for content storage
   - Cross-region replication to sa-east-1
   - Encryption at rest and in transit
   - Automatic backups

4. **ElastiCache for Redis**
   - Session management and caching
   - Cluster mode enabled for high availability
   - Multi-AZ deployment
   - Automatic failover

5. **API Gateway**
   - REST API for content delivery
   - Stage for production deployment
   - Request validation
   - CloudWatch Logs integration

6. **Kinesis Data Stream**
   - Real-time analytics data ingestion
   - Capture viewing metrics and user interactions
   - Retention period of 24 hours

7. **CodePipeline**
   - Automated DR failover testing pipeline
   - Source stage from CodeCommit
   - Build stage using CodeBuild
   - Deploy stage to test failover procedures

8. **Secrets Manager**
   - Secure storage for API keys, database credentials, and encryption keys
   - Automatic rotation enabled where applicable
   - Cross-region replication to DR region

### Security and Compliance

1. **Encryption**
   - All data encrypted at rest using AWS managed keys
   - All data encrypted in transit using TLS
   - Secrets Manager for credential management

2. **LGPD Compliance (Brazil's Data Protection Law)**
   - Data residency in South America regions
   - Encryption requirements met
   - Audit logging enabled for all data access

3. **IAM Security**
   - Least privilege access policies
   - Service roles with minimal permissions
   - No hardcoded credentials

### Infrastructure Requirements

1. **Network Configuration**
   - VPC with public and private subnets across 2 availability zones
   - NAT Gateway for private subnet internet access (single NAT for cost optimization)
   - Security groups with minimal required access
   - VPC endpoints for S3 and other supported services to reduce NAT costs

2. **Resource Naming**
   - All resources must include environment suffix for uniqueness
   - Pattern: `{resource-type}-{environmentSuffix}`

3. **Destroyability**
   - All resources must be deletable without manual intervention
   - S3 buckets: autoDeleteObjects = true
   - RDS: skipFinalSnapshot = true
   - Removal policy: DESTROY for all resources

4. **Cost Optimization**
   - Use Aurora Serverless v2 instead of provisioned RDS
   - Single NAT Gateway instead of per-AZ
   - VPC endpoints where applicable
   - Appropriate CloudWatch Logs retention (7 days)

### Output Requirements

Provide the complete infrastructure code with one code block per file:

1. **lib/tap_stack.go** - Main stack that instantiates all constructs
2. **lib/network.go** - VPC, subnets, security groups
3. **lib/database.go** - RDS Aurora Serverless cluster
4. **lib/compute.go** - ECS Fargate cluster and task definitions
5. **lib/storage.go** - EFS file system configuration
6. **lib/cache.go** - ElastiCache Redis cluster
7. **lib/api.go** - API Gateway REST API
8. **lib/analytics.go** - Kinesis Data Stream
9. **lib/cicd.go** - CodePipeline for DR testing
10. **lib/secrets.go** - Secrets Manager secrets and configurations

Each file should:
- Use proper Go CDK constructs
- Include comprehensive inline comments
- Handle the environmentSuffix parameter correctly
- Export necessary properties for cross-resource references
- Follow AWS best practices for the service

Ensure all resources are properly integrated and can reference each other as needed.