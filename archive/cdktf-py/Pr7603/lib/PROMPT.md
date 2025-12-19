# Video Processing Pipeline Infrastructure

Hey team,

We need to build a video processing pipeline infrastructure for StreamFlix, a European media streaming company that needs to automate their video processing operations. I've been asked to create this using **CDKTF with Python**. The business wants a scalable solution that can handle large video files, process metadata, and maintain processing state information while staying compliant with EU media regulations.

StreamFlix currently processes video content manually, which is slow and error-prone. They need an automated system that can ingest raw video content through a streaming pipeline, process it using containerized workloads, and store all metadata and processing state in a managed database. Security is paramount - all sensitive configuration like database credentials and API keys must be properly managed through AWS services.

The solution needs to be resilient with proper error handling and recovery mechanisms for failed processing jobs. Since they're dealing with media content that falls under EU regulations, we need to ensure proper content tracking and compliance throughout the pipeline.

## What we need to build

Create a video processing pipeline infrastructure using **CDKTF with Python** for a streaming media company. The system will handle video ingestion, processing, and metadata storage.

### Core Requirements

1. **Video Ingestion Pipeline**
   - Implement Kinesis data stream for ingesting raw video content
   - Configure appropriate shard count for scalability
   - Set up retention period for video data buffering

2. **Container-Based Processing**
   - Deploy ECS cluster for video processing workloads
   - Configure ECS task definitions with appropriate resource limits
   - Set up auto-scaling policies for processing containers
   - Implement container logging and monitoring

3. **Metadata Storage**
   - Provision RDS instance for storing video metadata and processing state
   - Use managed database service (RDS Aurora Serverless preferred for cost optimization)
   - Configure database security groups and subnet placement
   - Set up automated backups and maintenance windows

4. **Secrets Management**
   - Store all sensitive configuration in AWS Secrets Manager
   - Manage database credentials securely
   - Configure API keys and access tokens
   - Grant appropriate IAM permissions for secret access

5. **Error Handling and Recovery**
   - Implement dead-letter queues for failed processing jobs
   - Set up retry mechanisms with exponential backoff
   - Configure CloudWatch alarms for monitoring failures
   - Implement job state tracking in the database

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Kinesis** for video stream ingestion
- Use **ECS** for containerized video processing
- Use **RDS Aurora Serverless** for metadata storage (cost-optimized managed database)
- Use **SecretsManager** for all sensitive configuration
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (use DESTROY removal policy, no RETAIN policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST include a configurable environment suffix for deployment uniqueness
- **Destroyability**: All resources must use RemovalPolicy DESTROY or equivalent - FORBIDDEN to use RETAIN policies
- **RDS Considerations**:
  - Prefer Aurora Serverless v2 for cost optimization and faster deployment
  - If using standard RDS, ensure DeletionProtection is false
  - Set skip_final_snapshot to true for test/dev environments
- **ECS Considerations**:
  - Use FARGATE launch type for serverless containers
  - Configure task execution role with permissions for Secrets Manager and CloudWatch
  - Ensure proper VPC configuration with public/private subnets
- **Secrets Manager**:
  - Generate database credentials automatically using Secrets Manager
  - Configure rotation policies where applicable
  - Grant ECS tasks read access to required secrets

### Constraints

- ALL sensitive configuration (database credentials, API keys) MUST be stored in AWS Secrets Manager
- Solution MUST include error handling and failed job recovery mechanisms
- Must be scalable for large video files
- Must comply with EU media regulations for content tracking
- Must maintain processing state information in the database
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging via CloudWatch

## Success Criteria

- **Functionality**: Complete video ingestion pipeline using Kinesis, processing via ECS, metadata storage in RDS
- **Security**: All secrets managed via Secrets Manager, proper IAM roles and security groups
- **Scalability**: Auto-scaling ECS tasks, appropriate Kinesis shard configuration
- **Reliability**: Error handling with DLQ, retry mechanisms, CloudWatch monitoring
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be fully destroyed without manual intervention
- **Code Quality**: Python, well-tested, properly documented

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- Kinesis data stream for video ingestion
- ECS cluster with Fargate tasks for video processing
- RDS Aurora Serverless instance for metadata storage
- Secrets Manager secrets for credentials management
- IAM roles and policies for service permissions
- VPC, subnets, and security groups configuration
- CloudWatch log groups for monitoring
- Unit tests for all components
- Documentation and deployment instructions in lib/README.md
