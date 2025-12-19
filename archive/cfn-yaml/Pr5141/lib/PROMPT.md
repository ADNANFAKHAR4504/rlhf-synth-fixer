Hey team,

SmartFactory Inc. is scaling up their manufacturing operations, and we need to build out a robust IoT sensor data processing platform for them. They've got manufacturing equipment all over their factory floor sending out sensor data, and they need us to create infrastructure that can handle approximately 10,000 sensor readings per minute while maintaining everything for 90 days. The kicker is that this needs to meet ISO 27001 compliance requirements for data handling and audit logging, so security and traceability are paramount.

The current setup they have is pretty basic, and they're running into issues with data storage, processing capacity, and compliance auditing. They need a production-grade solution that can securely ingest data from their sensors, process it in real-time, store it reliably, and maintain comprehensive audit trails for their compliance teams. We're talking about critical manufacturing data here, so encryption, access control, and monitoring are non-negotiable.

## What we need to build

Create a complete IoT sensor data processing platform using **CloudFormation with YAML** that handles sensor data ingestion, processing, storage, and monitoring for a manufacturing environment.

### Core Requirements

1. **Data Ingestion Layer**
   - Kinesis Data Streams for high-throughput sensor data ingestion
   - API Gateway for external system integration and RESTful endpoints
   - Handle 10,000 sensor readings per minute sustained throughput

2. **Processing and Storage**
   - ECS cluster for containerized data processing applications
   - RDS instance for structured sensor data storage with Multi-AZ deployment
   - ElastiCache Redis cluster for real-time sensor data caching and quick lookups
   - Data retention period of 90 days minimum

3. **Security and Compliance**
   - Secrets Manager for database credentials with automatic rotation enabled
   - KMS keys for encryption of all data at rest
   - IAM roles and policies following least privilege principle
   - Security groups with proper network isolation

4. **Network Architecture**
   - VPC with public and private subnets across multiple Availability Zones
   - Proper subnet isolation for data tier and application tier
   - Security groups configured for least privilege access

5. **Monitoring and Audit Logging**
   - CloudWatch Logs for comprehensive audit trails
   - CloudWatch metrics and alarms for system monitoring
   - Logging for all data access and modifications per ISO 27001 requirements

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Deploy to **eu-west-2** region
- Use **ECS** for container orchestration
- Use **RDS** (PostgreSQL or MySQL) for structured data storage
- Use **ElastiCache Redis** for caching layer
- Use **Kinesis Data Streams** for data ingestion
- Use **API Gateway** for API endpoints
- Use **Secrets Manager** with automatic rotation for credentials
- Use **KMS** for encryption keys
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-type-${EnvironmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- All resources must be deployed in eu-west-2 region
- All database credentials managed through Secrets Manager with automatic rotation enabled
- Data at rest must be encrypted using KMS keys
- Infrastructure must support audit logging for all data access and modifications
- Multi-AZ deployment for high availability where applicable
- No retention policies that prevent resource deletion
- Proper error handling and resource dependencies

## Success Criteria

- **Functionality**: Complete IoT data pipeline from ingestion through storage
- **Performance**: Can handle 10,000+ sensor readings per minute
- **Reliability**: Multi-AZ deployment for RDS and ECS with auto-recovery
- **Security**: KMS encryption, Secrets Manager rotation, IAM least privilege, security groups
- **Compliance**: Audit logging via CloudWatch Logs for all data operations
- **Monitoring**: CloudWatch metrics, alarms, and dashboards configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Well-structured CloudFormation YAML, proper dependencies, comprehensive outputs

## What to deliver

- Complete CloudFormation template in YAML format
- VPC with public and private subnets across multiple AZs
- ECS cluster with proper IAM roles and task definitions
- RDS instance with KMS encryption and Multi-AZ
- ElastiCache Redis cluster with encryption
- Kinesis Data Stream for sensor data ingestion
- API Gateway REST API with proper integration
- Secrets Manager secret for database credentials with rotation
- KMS keys for encryption
- CloudWatch Logs log groups for audit trails
- Security groups and network ACLs
- IAM roles and policies for all services
- CloudFormation outputs for all critical resources
- Proper resource dependencies using DependsOn
- Parameter for EnvironmentSuffix with validation
