Hey team,

SmartFactory Solutions is expanding their IoT manufacturing platform that processes sensitive production line data from multiple facilities across the US. They need a robust infrastructure solution that can handle real-time sensor data from production lines while maintaining strict compliance with ISO 27001 standards. The challenge is building this with a complete CI/CD pipeline that safely deploys updates across multiple environments without disrupting operations.

I've been asked to create this infrastructure using AWS CDK with Python. The business wants a solution that can process at least 10,000 IoT sensor events per second with zero data loss, supports automated deployments through a multi-stage pipeline, and maintains separate staging and production environments with proper security controls.

The infrastructure needs to handle real-time data ingestion from thousands of IoT sensors, process this data through containerized applications, store operational data in a highly available database, and provide API access for external integrations. All of this must be done while ensuring database credentials rotate automatically and the deployment pipeline includes proper testing and approval gates.

## What we need to build

Create an IoT sensor data processing platform using **AWS CDK with Python** that integrates with a CI/CD pipeline for safe multi-environment deployments.

### Infrastructure Requirements

1. **Real-Time Data Ingestion**:
   - Kinesis Data Streams for ingesting sensor data from manufacturing facilities
   - Stream configured to handle at least 10,000 events per second
   - Data retention configured appropriately for processing needs

2. **Containerized Processing**:
   - ECS Fargate cluster for running containerized data processing applications
   - Auto-scaling configuration based on stream metrics
   - Tasks configured to process data from Kinesis streams
   - Container definitions with appropriate resource allocations

3. **Data Storage Layer**:
   - Multi-AZ RDS PostgreSQL instance for operational data storage
   - Automated backups and point-in-time recovery enabled
   - Parameter groups optimized for IoT workload
   - ElastiCache Redis cluster for caching frequently accessed data
   - Redis configured with appropriate node types and replica configuration

4. **Shared Storage**:
   - EFS file system for shared storage between containers
   - Mount targets across multiple availability zones
   - Appropriate performance mode for concurrent access

5. **API Layer**:
   - API Gateway for external system integrations
   - REST API with proper authentication and authorization
   - Integration with backend services for data access

6. **Security and Secrets Management**:
   - Secrets Manager for database credentials and API keys
   - Automatic rotation enabled with 30-day rotation schedule
   - Lambda functions for handling secrets rotation
   - Proper IAM roles and policies for accessing secrets

7. **CI/CD Integration** (reference lib/ci-cd.yml):
   - Infrastructure must support deployment through GitHub Actions workflow
   - Environment-specific configuration via CDK context parameters
   - Support for dev, staging, and prod environments
   - Blue-green deployment capability for zero-downtime updates
   - Security scanning integration with cdk-nag
   - Cross-account role assumptions for multi-account deployments
   - Proper IAM roles for OIDC authentication from GitHub

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- All resources must be destroyable with no RemovalPolicy.RETAIN or deletion protection
- Support for environment-specific configuration through CDK context
- VPC with public and private subnets across multiple availability zones
- Security groups with least-privilege access patterns
- CloudWatch logging enabled for all components
- Proper error handling and dead letter queues where applicable
- Tags for resource management and cost allocation

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST include an environmentSuffix parameter in their naming to ensure uniqueness when deploying multiple environments. Use pattern: `{resource-name}-{environmentSuffix}`
- **Destroyability**: All resources MUST use RemovalPolicy.DESTROY (Python) to ensure the stack can be torn down completely during testing. NO resources should use RemovalPolicy.RETAIN or have deletion protection enabled.
- **Multi-Environment Support**: Stack must accept environment parameter from CDK context to configure resources appropriately for dev/staging/prod
- **Secrets Rotation**: The secrets rotation Lambda must be properly configured with rotation schedules and the correct IAM permissions
- **RDS Deletion**: RDS instances must have deletion_protection=False and skip_final_snapshot=True for test environments

### Constraints

- All database credentials and API keys managed through Secrets Manager with 30-day rotation
- Multi-environment support with automated blue-green deployments
- Infrastructure must process 10,000 IoT sensor events per second minimum
- High availability across multiple availability zones
- ISO 27001 compliance considerations for data handling
- Proper encryption at rest and in transit for all data stores
- Network isolation with private subnets for data processing
- No data loss during processing or deployments

### Service-Specific Requirements

- **Kinesis Data Streams**: Configure with sufficient shards to handle 10,000 events/second (each shard handles 1,000 records/second or 1 MB/second)
- **ECS Fargate**: Use recent platform version, configure task definitions with proper CPU/memory, enable CloudWatch Container Insights
- **RDS PostgreSQL**: Multi-AZ deployment, automated backups, parameter groups for PostgreSQL optimization
- **ElastiCache Redis**: Cluster mode enabled for scalability, automatic failover configured
- **EFS**: Bursting or provisioned throughput mode based on workload requirements
- **CodePipeline**: Not deployed by this stack but infrastructure must be compatible with pipeline deployment patterns
- **API Gateway**: Stage variables for environment-specific configuration, request validation, throttling configured

## Success Criteria

- **Functionality**: All eight AWS services properly integrated and functional
- **Performance**: System handles 10,000+ events per second without data loss
- **High Availability**: Multi-AZ deployment with automatic failover capabilities
- **Security**: All credentials rotated automatically every 30 days via Secrets Manager
- **CI/CD Compatibility**: Infrastructure deploys successfully through GitHub Actions pipeline with environment parameters
- **Multi-Environment**: Same code deploys to dev, staging, and prod with appropriate configurations
- **Destroyability**: Entire stack can be destroyed and recreated without manual intervention
- **Resource Naming**: All resources include environmentSuffix in their names for environment isolation
- **Code Quality**: Python code following CDK best practices, proper type hints, well-documented

## What to deliver

- Complete AWS CDK Python implementation with all eight AWS services
- Kinesis Data Streams configured for high-throughput ingestion
- ECS Fargate cluster with task definitions and auto-scaling
- Multi-AZ RDS PostgreSQL and ElastiCache Redis clusters
- EFS file system with multi-AZ mount targets
- API Gateway with proper integration
- Secrets Manager with automatic 30-day rotation including rotation Lambda
- VPC with proper networking and security groups
- IAM roles and policies for all services
- CloudWatch logging and monitoring configuration
- Support for environment-specific parameters via CDK context
- Documentation on deployment and environment configuration
