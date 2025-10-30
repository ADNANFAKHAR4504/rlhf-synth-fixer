Hey team,

We've been working with HealthTech Inc., and they've got a serious challenge on their hands. They're processing sensitive patient monitoring data from medical devices across Canadian hospitals - we're talking 100,000 events per minute and about 5TB of patient data. Right now they need a disaster recovery solution that can maintain data integrity while staying HIPAA compliant and ensuring business continuity. The stakes are high because any downtime or data loss could directly impact patient care.

The business requirements are clear: they need zero data loss with Recovery Point Objective under 15 minutes and Recovery Time Objective under 1 hour. This isn't just about backing up data - it's about building a system that can automatically failover when something goes wrong, replicate everything across regions, and maintain compliance throughout.

I've been asked to build this using **AWS CDK with Javascript** and deploy to the ca-central-1 region. The infrastructure needs to handle real-time patient data processing while meeting strict healthcare compliance standards.

## What we need to build

Create a highly available disaster recovery solution using **AWS CDK with Javascript** for HealthTech Inc.'s patient data processing pipeline.

### Core Requirements

1. **Real-time Data Ingestion**
   - Use Kinesis Data Streams for handling 100,000+ events per minute
   - Configure stream for high throughput with appropriate shard count
   - Enable server-side encryption for data at rest

2. **Database Infrastructure**
   - Primary RDS cluster for patient data storage
   - Read replica RDS cluster for disaster recovery
   - Configure automated backups with point-in-time recovery
   - Enable encryption at rest using KMS
   - Support for approximately 5TB of data

3. **Data Processing Layer**
   - ECS Fargate clusters for processing patient monitoring data
   - Configure auto-scaling based on workload
   - Implement proper task definitions with health checks
   - Use least privilege IAM roles for tasks

4. **Persistent Storage**
   - EFS filesystem for shared persistent storage
   - Configure multi-AZ deployment for high availability
   - Enable encryption at rest and in transit
   - Appropriate performance mode for workload

5. **Session and Cache Management**
   - ElastiCache cluster for session management
   - Configure Redis or Memcached with automatic failover
   - Enable encryption in transit and at rest
   - Multi-AZ deployment

6. **API and External Integration**
   - API Gateway for external system integrations
   - Configure proper authentication and authorization
   - Enable CloudWatch logging and monitoring
   - Throttling and rate limiting to protect backend

7. **Automated DR Testing**
   - CodePipeline for automated disaster recovery testing
   - Include stages for building, testing, and validating DR procedures
   - Automated testing of failover scenarios
   - Integration with monitoring and alerting

8. **Security and Secrets Management**
   - SecretsManager integration for credentials and sensitive data
   - Automatic rotation of database credentials
   - Least privilege access policies
   - Audit logging of secret access

### Technical Requirements

- All infrastructure defined using **AWS CDK with Javascript**
- Use **Kinesis Data Streams** for real-time data ingestion
- Use **RDS** with primary and replica clusters for database layer
- Use **ECS Fargate** for containerized data processing
- Use **EFS** for persistent shared storage
- Use **ElastiCache** for session management
- Use **API Gateway** for external integrations
- Use **CodePipeline** for automated DR testing
- Use **SecretsManager** for credential management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **ca-central-1** region
- All resources must be cross-region aware for DR scenarios

### Security and Compliance Constraints

- Encrypt all data at rest using AWS KMS with automatic key rotation
- Encrypt all data in transit using TLS 1.2 or higher
- Implement IAM roles following least privilege principle
- Enable CloudWatch logging for all services with appropriate retention
- Maintain HIPAA compliance with full audit logging
- Enable AWS CloudTrail for API audit logging
- Configure VPC with private subnets for data processing
- Implement security groups with minimal required access
- All resources must support cross-region replication for DR

### Disaster Recovery Requirements

- Recovery Point Objective (RPO) must be less than 15 minutes
- Recovery Time Objective (RTO) must be less than 1 hour
- Implement automated failover mechanisms
- Configure cross-region replication for critical data stores
- Enable automated backups with appropriate retention
- Document and automate DR testing procedures
- Monitor replication lag and alert on threshold breaches

### Infrastructure Constraints

- All resources must be destroyable (no Retain policies)
- Include proper error handling and retry logic
- Tag all resources with Environment, Project, and Compliance tags
- Use CloudWatch alarms for monitoring critical metrics
- Implement proper lifecycle policies for data management
- Configure appropriate timeouts and connection limits
- All Lambda functions (if used) should have error handling and logging

## Success Criteria

- **Functionality**: Complete DR solution with all required AWS services integrated
- **Performance**: Handles 100,000+ events per minute with RPO under 15 minutes and RTO under 1 hour
- **Reliability**: Multi-AZ deployment with automated failover and cross-region replication
- **Security**: HIPAA compliant with encryption at rest and in transit, full audit logging
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Code Quality**: Javascript code following CDK best practices, well-tested, fully documented
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Monitoring**: CloudWatch dashboards and alarms for all critical components

## What to deliver

- Complete AWS CDK Javascript implementation
- Kinesis Data Streams for real-time ingestion
- RDS primary and replica clusters with automated backups
- ECS Fargate clusters with auto-scaling
- EFS filesystem with multi-AZ deployment
- ElastiCache cluster for session management
- API Gateway with proper security controls
- CodePipeline for automated DR testing
- SecretsManager integration for credentials
- KMS keys for encryption with automatic rotation
- VPC with proper network segmentation
- Security groups and IAM roles
- CloudWatch monitoring and alarms
- Unit tests for all infrastructure components
- Integration tests validating end-to-end workflows
- Documentation and deployment instructions