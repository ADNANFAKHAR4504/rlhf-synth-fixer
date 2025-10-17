Hey team,

We need to build a scalable video processing infrastructure for StreamTech Japan, one of our major media streaming clients in Tokyo. They're processing thousands of video files daily and need a robust system to handle metadata extraction, storage, and quick access to popular content. This is critical for their operations since they must comply with Japanese broadcasting regulations and maintain low latency for their AP region customers.

The business challenge is that their current manual processing system can't keep up with the volume, and they're losing customers due to slow content delivery. They need an automated pipeline that can process videos, store metadata efficiently, and serve frequently accessed content with minimal latency. The entire infrastructure must be deployable in the ap-northeast-1 region to meet their regulatory requirements.

I've been asked to create this using **AWS CDK with Python** for the ap-northeast-1 region. The business wants a solution that can scale automatically and maintain high availability across multiple availability zones.

## What we need to build

Create a video processing pipeline infrastructure using **AWS CDK with Python** for StreamTech Japan's media operations.

### Core Requirements

1. **Video Processing Layer**
   - Amazon ECS cluster to run containerized video processing tasks
   - ECS must support auto-scaling to handle variable workload
   - Use Fargate launch type for serverless container execution

2. **Metadata Storage**
   - Amazon RDS PostgreSQL database for storing video metadata
   - Multi-AZ deployment required for high availability
   - Enable automated backups with minimal retention period

3. **Caching Layer**
   - Amazon ElastiCache Redis cluster for caching popular content metadata
   - Cluster must maintain at least 2 nodes for high availability
   - Multi-AZ configuration required

4. **Temporary Storage**
   - Amazon EFS file system for temporary video processing storage
   - Mount targets in multiple availability zones
   - Enable encryption at rest

5. **API Layer**
   - Amazon API Gateway REST API for metadata access
   - Integrate with backend services for data retrieval

6. **Security and Secrets**
   - AWS Secrets Manager for managing database passwords and API keys
   - CRITICAL: Fetch existing secrets from Secrets Manager, do NOT create new secrets in the stack
   - Use secret references for RDS database credentials

7. **Encryption**
   - AWS KMS customer managed key for encryption at rest
   - Apply KMS encryption to RDS, EFS, and ElastiCache
   - Enable encryption in transit using TLS/SSL

8. **Monitoring and Logging**
   - Amazon CloudWatch for logging and monitoring
   - Create log groups for ECS tasks and API Gateway
   - Set retention policies for cost optimization

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon ECS** for video processing workloads
- Use **Amazon RDS PostgreSQL** (Multi-AZ) for metadata storage
- Use **Amazon ElastiCache Redis** (minimum 2 nodes, Multi-AZ) for caching
- Use **Amazon EFS** for temporary video processing storage
- Use **Amazon API Gateway** for metadata access endpoint
- Use **AWS Secrets Manager** to fetch existing secrets (not create them)
- Use **AWS KMS** for encryption at rest on all data stores
- Use **Amazon CloudWatch** for logging and monitoring
- Resource names must include a **string suffix** (environmentSuffix) for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy all resources to **ap-northeast-1** region

### Constraints

- All resources must be deployed in the ap-northeast-1 region
- Multi-AZ configuration required for RDS and ElastiCache
- ElastiCache cluster must have at least 2 cache nodes for high availability
- Database passwords and API keys must be retrieved from existing Secrets Manager entries
- Do NOT create secrets in the stack - fetch them using secret ARN or name
- Implement encryption at rest for RDS, EFS, and ElastiCache using KMS
- Enable encryption in transit using TLS/SSL for all data connections
- Follow IAM least privilege principle for all roles and policies
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging via CloudWatch
- Tag all resources appropriately for cost tracking and compliance

## Success Criteria

- **Functionality**: ECS cluster processes tasks, RDS stores metadata, ElastiCache caches data, EFS provides shared storage, API Gateway exposes endpoints
- **High Availability**: RDS is Multi-AZ, ElastiCache has 2+ nodes across AZs
- **Security**: KMS encryption enabled for all data stores, TLS/SSL in transit, secrets fetched from Secrets Manager, IAM least privilege
- **Regional Compliance**: All resources deployed to ap-northeast-1
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch logs and metrics enabled for key services
- **Destroyability**: Stack can be fully deleted without manual cleanup
- **Code Quality**: Python, well-tested with 90%+ coverage, properly documented

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- Amazon ECS cluster with Fargate support
- Amazon RDS PostgreSQL database with Multi-AZ configuration
- Amazon ElastiCache Redis cluster with 2+ nodes and Multi-AZ
- Amazon EFS file system with encryption
- Amazon API Gateway REST API
- AWS Secrets Manager integration (fetch existing secrets)
- AWS KMS customer managed key for encryption
- Amazon CloudWatch log groups and monitoring
- VPC with public and private subnets across multiple AZs
- Security groups with proper ingress/egress rules
- IAM roles and policies following least privilege
- Unit tests for all components in tests/ directory
- Integration tests using deployed resource outputs
- Documentation and deployment instructions
