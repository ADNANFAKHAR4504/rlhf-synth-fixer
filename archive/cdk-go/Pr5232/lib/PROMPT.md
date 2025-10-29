Hey team,

We need to build a secure content processing pipeline for StreamSecure, a growing media streaming company that handles pre-release movies and shows. I've been asked to create this infrastructure in Go using AWS CDK. The business requires strict security controls, audit trails, and the capability to handle high-throughput content processing while meeting media industry compliance requirements.

This is a production system dealing with sensitive content, so we need to get the security right from the start. The platform needs to support digital rights management, maintain comprehensive audit trails, and ensure all data is properly encrypted. We also need multi-AZ deployment for critical services to meet our availability targets.

Make sure to use a unique suffix in all resource names to avoid conflicts when deploying to different environments. All resources should be deployable to the eu-central-1 region.

## What we need to build

Create a secure media processing platform using **AWS CDK with Go** for handling sensitive content processing and digital rights management.

### Core Requirements

1. **Container Processing Infrastructure**
   - ECS cluster running on Fargate or EC2 for content processing workloads
   - EFS file system for shared storage across ECS tasks
   - Proper IAM roles for ECS task execution and task roles
   - Task definitions with appropriate CPU and memory limits
   - Mount targets in multiple availability zones

2. **Database Layer**
   - Aurora PostgreSQL or MySQL cluster for metadata storage
   - Multi-AZ deployment with automated failover
   - Automated backups with point-in-time recovery
   - Encryption at rest using customer-managed KMS keys
   - Proper security group configuration for database access

3. **Caching and Session Management**
   - ElastiCache Redis cluster for session data and caching
   - Multi-node cluster configuration for high availability
   - Encryption in transit and at rest
   - Subnet group spanning multiple availability zones

4. **Real-Time Analytics Pipeline**
   - Kinesis Data Streams for real-time event processing
   - Appropriate shard count based on expected throughput
   - Data retention policies for compliance
   - IAM roles for stream producers and consumers

5. **API Layer**
   - API Gateway with RESTful API design
   - Rate limiting and throttling to protect backend services
   - API key authentication or IAM authorization
   - Integration with Lambda or ECS backend services
   - Stage configuration with proper deployment settings

6. **Secrets and Key Management**
   - AWS Secrets Manager for encryption keys and database credentials
   - Automatic rotation configuration for database passwords
   - KMS encryption for secrets
   - Proper IAM policies restricting secret access
   - Separate secrets for different service components

7. **Network Architecture**
   - Multi-AZ VPC with public and private subnets
   - Internet Gateway attached to public subnets
   - NAT Gateways in public subnets for outbound internet access from private subnets
   - Route tables properly configured for public and private subnet traffic
   - Security groups following least privilege principle
   - Network ACLs if additional network-level security is needed

8. **Encryption Infrastructure**
   - Customer-managed KMS keys for different services
   - Automatic key rotation enabled for all KMS keys
   - Key policies granting service access
   - Separate KMS keys for RDS, EFS, Secrets Manager, and ElastiCache

### Technical Requirements

- All infrastructure defined using **AWS CDK with Go**
- Deploy to **eu-central-1** region
- Use **ECS** with EFS for container workloads
- Use **Aurora** for relational database needs
- Use **ElastiCache Redis** for caching and sessions
- Use **Kinesis Data Streams** for real-time analytics
- Use **API Gateway** for RESTful API endpoints
- Use **AWS Secrets Manager** for credential storage
- Use **NAT Gateway** for secure outbound connectivity
- Use **KMS** for encryption key management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `streamsecure-resource-type-suffix`
- All resources must be destroyable with no retention policies

### Constraints

- All data at rest must be encrypted using customer-managed KMS keys
- All KMS keys must have automatic rotation enabled
- All database credentials must be stored in AWS Secrets Manager
- Security groups must implement least privilege access
- Private subnets for all data layer resources
- No hardcoded credentials or sensitive values
- Enable encryption in transit for ElastiCache and RDS connections
- Multi-AZ deployment required for Aurora and ElastiCache
- Include proper error handling and logging
- All resources properly tagged for cost tracking and compliance

## Success Criteria

- **Functionality**: Complete media processing pipeline with all required services operational
- **Security**: All encryption requirements met, credentials in Secrets Manager, least privilege IAM
- **Reliability**: Multi-AZ deployment for critical services with automated failover
- **Performance**: High-throughput content processing capability with appropriate scaling
- **Compliance**: Audit trails enabled, encryption standards met, network isolation implemented
- **Resource Naming**: All resources include environmentSuffix for environment identification
- **Code Quality**: Go, well-structured, properly documented with clear comments

## What to deliver

- Complete AWS CDK Go implementation
- ECS cluster with EFS integration
- Aurora cluster in Multi-AZ mode
- ElastiCache Redis cluster
- Kinesis Data Streams configuration
- API Gateway with proper integrations
- AWS Secrets Manager setup with rotation
- NAT Gateway configuration
- VPC with proper networking and security groups
- KMS keys for all encryption needs
- IAM roles and policies for all services
- CloudWatch logging configuration
- Documentation explaining the architecture and deployment process
