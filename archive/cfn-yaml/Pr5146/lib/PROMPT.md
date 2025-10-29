# HIPAA-Compliant Event Processing Pipeline

Hey team,

We need to build a real-time event processing system for MedTech Solutions GmbH that handles patient vital signs data from medical devices across multiple hospitals. The company operates in Germany and needs infrastructure that processes approximately 1000 events per second during peak times while maintaining strict HIPAA compliance. I've been asked to create this using **CloudFormation with YAML** for the infrastructure deployment in the us-east-1 region.

The business problem is straightforward but critical: medical devices at hospitals are generating vital signs data continuously, and we need to capture, process, and store this information in real-time. The data includes heart rate, blood pressure, oxygen levels, and other measurements that doctors and nurses rely on for patient care. Any delays or data loss could impact patient safety, so reliability and performance are non-negotiable.

Given the sensitive nature of healthcare data, we're working under HIPAA regulations which means encryption everywhere, strict access controls, and comprehensive audit logging. The infrastructure also needs to be highly available since hospitals operate around the clock. We're looking at Multi-AZ deployments to ensure the system stays up even if an entire availability zone goes down.

## What we need to build

Create a HIPAA-compliant event processing pipeline using **CloudFormation with YAML** that ingests real-time patient vital signs data from medical devices, processes it through containerized workloads, and stores the results in a secure database for analytics.

### Core Requirements

1. **Real-Time Data Ingestion**
   - Use Kinesis Data Streams to handle approximately 1000 events per second during peak times
   - Configure sufficient shard capacity to handle the throughput
   - Enable encryption at rest using KMS keys for all data in the stream

2. **Data Processing Layer**
   - Deploy ECS Fargate cluster for running data processing containers
   - Configure tasks to read from Kinesis, transform the data, and write to storage
   - Implement auto-scaling based on stream backlog metrics
   - Use Multi-AZ deployment for high availability

3. **Secure Data Storage**
   - Use RDS Aurora with encryption enabled for storing processed patient data
   - Configure Multi-AZ deployment for database high availability
   - Enable automated backups with appropriate retention
   - Store database credentials in AWS Secrets Manager

4. **Temporary Data Caching**
   - Deploy ElastiCache Redis cluster for caching frequently accessed data
   - Enable encryption in transit and at rest
   - Configure Multi-AZ with automatic failover

5. **External System Integration**
   - Implement API Gateway to allow external systems to query processed data
   - Secure all API endpoints with authentication
   - Enable request/response logging for audit trails

6. **Secrets Management**
   - Use AWS Secrets Manager to store and rotate database credentials
   - Configure automatic rotation policies
   - Grant least-privilege access to ECS tasks for secret retrieval

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Deploy to **us-east-1** region
- Use **Kinesis Data Streams** for real-time ingestion
- Use **ECS Fargate** for serverless container processing
- Use **RDS Aurora** with encryption for data persistence
- Use **ElastiCache Redis** for caching layer
- Use **Secrets Manager** for credential management
- Use **API Gateway** for external integrations
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies or DeletionProtection flags

### Security and Compliance Constraints

- HIPAA compliance is mandatory
- All data must be encrypted at rest using AWS KMS customer-managed keys
- All data must be encrypted in transit using TLS 1.2 or higher
- Implement least-privilege IAM roles and policies for all services
- Enable CloudWatch Logs for all components with appropriate retention
- Configure VPC with private subnets for database and cache resources
- Use security groups with minimal required access
- Enable AWS CloudTrail for audit logging
- No public access to databases or cache clusters

### Performance Requirements

- Handle 1000 events per second during peak times
- Multi-AZ deployment for high availability
- Auto-scaling for ECS tasks based on workload
- Redis cluster mode for horizontal scaling
- Aurora auto-scaling for read replicas if needed

### Destroyability Requirements

- No DeletionPolicy: Retain on any resources
- No DeletionProtection enabled on RDS clusters
- Enable skip_final_snapshot equivalent for Aurora
- All resources should be fully removable through stack deletion

## Success Criteria

- **Functionality**: All six AWS services deployed and integrated correctly
- **Performance**: System handles 1000 events/second without data loss or throttling
- **Reliability**: Multi-AZ configuration ensures high availability
- **Security**: HIPAA-compliant with encryption at rest and in transit, proper IAM policies, audit logging
- **Resource Naming**: All resources include environmentSuffix parameter for unique naming
- **Code Quality**: Clean CloudFormation YAML, well-structured, with proper parameters and outputs
- **Compliance**: All audit and monitoring requirements met for healthcare data processing

## What to deliver

- Complete CloudFormation YAML implementation in a single template or nested stacks
- Kinesis Data Streams configuration with appropriate shard count and encryption
- ECS Fargate cluster with task definitions for data processing
- RDS Aurora cluster with Multi-AZ, encryption, and Secrets Manager integration
- ElastiCache Redis cluster with encryption and Multi-AZ failover
- API Gateway REST API with secure endpoints
- Secrets Manager secret for database credentials
- KMS keys for encryption at rest
- VPC with public and private subnets, security groups, and routing
- IAM roles and policies following least-privilege principles
- CloudWatch log groups for monitoring and audit trails
- Parameters for environmentSuffix and other configurable values
- Outputs for key resource identifiers (stream name, cluster ARN, database endpoint, API URL)
