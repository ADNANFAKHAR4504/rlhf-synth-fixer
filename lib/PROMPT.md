Hey team,

We need to build a scalable video processing infrastructure for StreamTech Japan, one of our major media streaming clients in Tokyo. They're processing thousands of video files daily and need a robust system to handle metadata extraction, storage, and quick access to popular content. This is critical for their operations since they must comply with Japanese broadcasting regulations and maintain low latency for their AP region customers.

The business challenge is that their current manual processing system can't keep up with the volume, and they're losing customers due to slow content delivery. They need an automated pipeline that can process videos, store metadata efficiently, and serve frequently accessed content with minimal latency. The infrastructure should be deployable to multiple AWS regions.

I've been asked to create this using **AWS CDK with Python**. The business wants a solution that can scale automatically and maintain high availability across multiple availability zones.

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
   - Note: EFS volume mounting to containers is optional and can be enabled when using compatible container images

5. **API Layer**
   - Amazon API Gateway REST API for metadata access
   - Integrate with backend services for data retrieval

6. **Security and Secrets**
   - AWS Secrets Manager for managing database passwords and API keys
   - Create database secrets within the stack for automated deployment
   - Use secret references for RDS database credentials

7. **Encryption**
   - AWS KMS customer managed key for encryption at rest
   - Apply KMS encryption to RDS and EFS
   - ElastiCache: at-rest encryption enabled, transit encryption disabled for development ease

8. **Monitoring and Logging**
   - Amazon CloudWatch for logging and monitoring
   - Create log groups for ECS tasks and API Gateway
   - Set retention policies for cost optimization

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon ECS** for video processing workloads
- Use **Amazon RDS PostgreSQL** (Multi-AZ) for metadata storage
- Use **Amazon ElastiCache Redis** (minimum 2 nodes, Multi-AZ) for caching
- Use **Amazon EFS** for temporary video processing storage (with optional container mounting)
- Use **Amazon API Gateway** for metadata access endpoint
- Use **AWS KMS** for encryption at rest on RDS and EFS
- Use **Amazon CloudWatch** for logging and monitoring
- Resource names must include a **string suffix** (environmentSuffix) for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Infrastructure should be deployable to any AWS region

### Constraints

- Infrastructure must be region-agnostic and deployable to any AWS region
- Multi-AZ configuration required for RDS and ElastiCache
- ElastiCache cluster must have at least 2 cache nodes for high availability
- Database credentials should be auto-generated and stored in Secrets Manager
- Implement encryption at rest for RDS and EFS using KMS
- ElastiCache: at-rest encryption enabled, transit encryption can be disabled for development
- EFS volume mounting to containers is optional and can be enabled based on container image compatibility
- ECS Fargate service should include circuit breaker for fast failure detection and rollback
- Follow IAM least privilege principle for all roles and policies
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging via CloudWatch
- Tag all resources appropriately for cost tracking and compliance

## Success Criteria

- **Functionality**: ECS cluster processes tasks, RDS stores metadata, ElastiCache caches data, EFS provides shared storage, API Gateway exposes endpoints
- **High Availability**: RDS is Multi-AZ, ElastiCache has 2+ nodes across AZs
- **Security**: KMS encryption enabled for RDS and EFS, IAM least privilege
- **Deployment Resilience**: Circuit breaker enabled for ECS service to detect and rollback failed deployments
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Monitoring**: CloudWatch logs and metrics enabled for key services
- **Destroyability**: Stack can be fully deleted without manual cleanup
- **Code Quality**: Python, well-tested with 90%+ coverage, properly documented

