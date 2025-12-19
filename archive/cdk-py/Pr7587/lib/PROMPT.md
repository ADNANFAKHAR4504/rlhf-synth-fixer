# Video Processing Pipeline Infrastructure

Hey team,

We need to build a robust video processing infrastructure for StreamTech Japan, a media streaming company that handles thousands of video files daily. I've been asked to create this using **AWS CDK with Python** for deployment in the us-east-1 region. The business wants a scalable system that can process video metadata, store it efficiently, and provide quick access to frequently requested content.

StreamTech Japan processes media files for a Japanese entertainment company and needs to comply with broadcasting regulations while maintaining low latency access. The current manual processing workflow is hitting capacity limits, and they need an automated, scalable solution that can handle peak loads during content releases.

The infrastructure needs to support the entire video processing lifecycle, from ingestion through metadata extraction to caching popular content. The system must be highly available with multi-AZ deployment where applicable, and all sensitive data like database passwords and API keys must be properly secured through AWS Secrets Manager.

## What we need to build

Create a video processing pipeline infrastructure using **AWS CDK with Python** that handles media file processing, metadata storage, and content caching for a high-traffic streaming platform.

### Core Requirements

1. **Container Orchestration**
   - ECS cluster to run video processing tasks
   - Support for containerized workloads with auto-scaling capabilities
   - Multi-AZ deployment for high availability

2. **Data Storage**
   - RDS PostgreSQL database for storing video metadata
   - Multi-AZ configuration for database resilience
   - Automated backups and point-in-time recovery

3. **Caching Layer**
   - ElastiCache Redis cluster for caching popular content metadata
   - Minimum 2-node cluster for high availability
   - Support for read-heavy workloads with low latency

4. **File Storage**
   - EFS file system for temporary video processing storage
   - Shared storage accessible across multiple ECS tasks
   - Lifecycle policies for cost optimization

5. **API Access**
   - API Gateway for external access to metadata
   - RESTful endpoints for querying video information
   - Integration with backend services

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon ECS** for container orchestration
- Use **Amazon RDS PostgreSQL** for metadata persistence
- Use **Amazon ElastiCache Redis** for caching layer
- Use **Amazon EFS** for shared file storage
- Use **Amazon API Gateway** for API endpoints
- Use **AWS Secrets Manager** for credentials management
- Use **Amazon VPC** for network isolation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- Multi-AZ configuration where applicable

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (use RemovalPolicy.DESTROY, no RemovalPolicy.RETAIN)
- Database passwords must be stored in Secrets Manager
- API keys and sensitive credentials must use Secrets Manager
- ElastiCache cluster must maintain at least 2 nodes
- Resource naming must include environmentSuffix parameter
- VPC must support multi-AZ deployment with proper subnet configuration

### Constraints

- Region constraint: us-east-1 only
- ElastiCache minimum nodes: 2 for high availability
- RDS must use multi-AZ deployment
- All secrets managed through AWS Secrets Manager
- No hardcoded credentials in code
- Proper security groups and network isolation
- All resources must support clean teardown
- Include proper error handling and logging
- Tag all resources appropriately

### Cost Optimization

- Use RDS PostgreSQL (not Aurora unless serverless) for predictable workloads
- Consider ECS Fargate for simplified container management
- Use appropriate instance sizes based on workload requirements
- Enable deletion protection where appropriate in production

## Success Criteria

- **Functionality**: Complete video processing pipeline with all components integrated
- **Performance**: Low latency access to cached metadata, efficient video processing
- **Reliability**: Multi-AZ deployment, automated failover, backup strategies
- **Security**: Secrets Manager integration, VPC isolation, security groups configured
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: Clean Python code, well-tested, comprehensive documentation
- **Deployability**: Stack synthesizes and deploys successfully, resources can be destroyed cleanly

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- VPC with proper subnet configuration (public, private, isolated tiers)
- ECS cluster with task definitions for video processing
- RDS PostgreSQL database with multi-AZ deployment
- ElastiCache Redis cluster with minimum 2 nodes
- EFS file system with proper mount targets
- API Gateway with RESTful endpoints
- Secrets Manager secrets for all credentials
- Security groups and IAM roles with least privilege access
- Unit tests for all components with comprehensive coverage
- Documentation including architecture overview and deployment instructions
