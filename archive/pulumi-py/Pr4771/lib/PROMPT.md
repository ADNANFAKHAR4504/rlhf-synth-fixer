# Industrial IoT Data Processing Infrastructure

Hey team,

We need to build a secure data processing infrastructure for a manufacturing company that collects sensor data from industrial equipment across multiple facilities. The data includes sensitive operational metrics like machine temperature, pressure readings, vibration data, and production counters. These need to be stored securely while allowing real-time analytics for predictive maintenance and operational insights.

The challenge here is balancing real-time data ingestion with strict security requirements. Manufacturing environments often deal with sensitive operational data that could reveal trade secrets or operational capabilities, so we need encryption everywhere. Additionally, industrial compliance standards require proper backup retention and network isolation.

I've been asked to create this in Python using Pulumi. The system needs to handle high-velocity sensor data streams while maintaining data integrity and security.

## What we need to build

Create an industrial IoT data processing infrastructure using **Pulumi with Python** for secure sensor data collection and analytics.

### Core Requirements

1. **Real-time Data Ingestion**
   - Kinesis Data Stream for ingesting sensor telemetry from industrial equipment
   - Must handle continuous data streams from multiple facilities
   - Enable encryption in transit and at rest

2. **Persistent Data Storage**
   - RDS Aurora cluster (PostgreSQL or MySQL) for storing processed sensor data
   - Must be encrypted at rest using AWS KMS
   - Backup retention must be at least 30 days for compliance
   - Consider using Aurora Serverless v2 for cost optimization and faster provisioning

3. **Real-time Data Processing Cache**
   - ElastiCache Redis cluster for real-time data processing and caching
   - Must be encrypted at rest and in transit
   - Network isolated within VPC with security groups

4. **Credentials Management**
   - AWS Secrets Manager for database credentials and sensitive configuration
   - Automatic credential rotation support
   - KMS encryption for secrets

5. **Network Infrastructure**
   - VPC with public and private subnets across multiple availability zones
   - Security groups with minimum required access (no 0.0.0.0/0 except for specific cases)
   - VPC endpoints for AWS services to avoid NAT Gateway costs where possible

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Amazon Kinesis Data Streams** for real-time data ingestion
- Use **Amazon RDS Aurora** (PostgreSQL or MySQL) for persistent storage
- Use **Amazon ElastiCache Redis** for real-time processing
- Use **AWS Secrets Manager** for credential management
- Use **AWS KMS** for encryption keys (separate keys for different services)
- Resource names must include a **string suffix** for uniqueness (environment_suffix)
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **sa-east-1** region (South America - Sao Paulo)
- All data at rest must be encrypted using KMS
- Network access restricted using security groups

### Constraints

- All data at rest must be encrypted using AWS KMS keys
- Network access must be restricted using security groups with minimum required access
- Database backup retention period must be set to 30 days minimum
- All resources must be destroyable (no Retain policies, skip_final_snapshot=True)
- Include proper error handling and logging
- Use Aurora Serverless v2 for faster deployment times
- Minimize NAT Gateway usage (prefer VPC endpoints)

## Success Criteria

- **Functionality**: Kinesis stream can receive and buffer sensor data
- **Functionality**: Aurora database is accessible from within VPC and properly configured
- **Functionality**: ElastiCache Redis cluster is accessible from within VPC
- **Functionality**: Database credentials stored securely in Secrets Manager
- **Security**: All data encrypted at rest using KMS (Kinesis, RDS, ElastiCache, Secrets Manager)
- **Security**: Network access properly restricted with security groups
- **Security**: No overly broad security group rules (no 0.0.0.0/0 except where required)
- **Compliance**: RDS backup retention set to 30 days minimum
- **Resource Naming**: All resources include environment_suffix for uniqueness
- **Code Quality**: Python, well-tested, properly documented
- **Destroyability**: All resources can be cleanly destroyed without manual intervention

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- VPC with subnets and security groups
- Amazon Kinesis Data Stream with encryption
- Amazon RDS Aurora cluster with KMS encryption and 30-day backup retention
- Amazon ElastiCache Redis cluster with encryption
- AWS Secrets Manager secret for database credentials
- AWS KMS keys for each service
- Integration tests verifying the infrastructure deployment
- Proper Pulumi outputs for resource identifiers
