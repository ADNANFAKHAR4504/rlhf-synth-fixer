# Aurora PostgreSQL Production Database Infrastructure

Hey team,

I've been asked to set up a production-ready database infrastructure for our financial services transaction processing system. The business needs something that can handle variable traffic patterns throughout the day while keeping costs in check. They want high availability, automated backups, and secure credential management all baked in from the start.

The ops team has been pushing for Aurora Serverless v2 since it auto-scales based on load, which should work well for our transaction patterns. We're seeing traffic spikes during business hours but things quiet down in the evening. The serverless approach means we only pay for what we use instead of overprovisioning for peak times.

I need to build this using **CloudFormation with JSON** and deploy everything to the us-east-1 region. The security team has already signed off on the approach as long as we follow their requirements around encryption and credential storage.

## What we need to build

Create a production Aurora PostgreSQL database cluster using **CloudFormation with JSON** for a financial services transaction processing workload.

### Core Requirements

1. **Aurora Serverless v2 Cluster**
   - PostgreSQL engine version 15.4
   - Minimum capacity: 0.5 ACUs
   - Maximum capacity: 1 ACU
   - Auto-scaling enabled based on workload

2. **High Availability and Reliability**
   - Deploy across exactly 2 availability zones
   - DB subnet group using existing subnet IDs (provided as parameters)
   - Enable deletion protection on the cluster
   - Configure automated backups with 7-day retention
   - Set preferred backup window: 03:00-04:00 UTC

3. **Security and Encryption**
   - Enable encryption at rest using AWS managed KMS keys
   - Store master username and password in AWS Secrets Manager
   - Automatic credential rotation disabled
   - Security groups for controlled database access

4. **Logging and Monitoring**
   - Custom DB cluster parameter group with log_statement set to 'all'
   - CloudWatch alarm triggering when cluster CPU exceeds 80% for 5 minutes
   - Comprehensive monitoring for database performance metrics

5. **Outputs for Application Integration**
   - Cluster endpoint address
   - Reader endpoint address
   - Secrets Manager ARN for credentials

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon Aurora (RDS)** for the database cluster
- Use **AWS Secrets Manager** for credential management
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **AWS KMS** for encryption (AWS managed keys)
- Use **Amazon VPC** resources (DB subnet group)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Use Aurora Serverless v2 for automatic scaling between 0.5 and 1 ACU
- Enable deletion protection on the Aurora cluster
- Configure automated backups with a 7-day retention period
- Use AWS Secrets Manager for database credentials management
- Implement parameter groups with slow query logging enabled
- Deploy the cluster across exactly 2 availability zones
- Enable encryption at rest using AWS managed keys
- Configure CloudWatch alarms for CPU utilization above 80%
- All resources must be destroyable (no Retain policies)
- Include proper error handling and resource dependencies

## Success Criteria

- **Functionality**: Complete Aurora cluster deployment with all specified configurations
- **Performance**: Serverless v2 auto-scaling working correctly with 0.5-1 ACU range
- **Reliability**: Multi-AZ deployment with automated backups and 7-day retention
- **Security**: Encryption enabled, credentials in Secrets Manager, secure access patterns
- **Monitoring**: CloudWatch alarms functional for CPU > 80% threshold
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Valid JSON CloudFormation template, well-structured, documented
- **Integration**: Outputs available for application configuration (endpoints, secret ARN)

## What to deliver

- Complete CloudFormation JSON template implementation
- Aurora Serverless v2 PostgreSQL 15.4 cluster
- AWS Secrets Manager secret for database credentials
- CloudWatch alarm for CPU monitoring
- DB cluster parameter group with logging configuration
- DB subnet group for multi-AZ deployment
- Proper resource dependencies and tags
- Parameters section for subnet IDs and environmentSuffix
- Outputs section with cluster endpoints and secret ARN
- All resources tagged with Environment=Production and ManagedBy=CloudFormation
