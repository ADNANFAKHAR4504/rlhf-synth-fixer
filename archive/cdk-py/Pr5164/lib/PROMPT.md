Hey team,

We need to build a secure data processing infrastructure for a Canadian government agency that handles sensitive information. I've been asked to create this in Python using AWS CDK. The agency needs to meet FedRAMP High compliance standards, which means we have to implement multiple layers of security controls, comprehensive audit logging, and ensure everything is properly encrypted both at rest and in transit.

The deployment needs to be in the London region (eu-west-2) to meet data residency requirements for Canadian government operations. This is a critical system that will process sensitive data, so we need to get the security architecture right from the ground up. The agency has been very clear that they need multi-AZ high availability, automated disaster recovery, and complete visibility into all system activities for their compliance audits.

This is a complex build because we're not just setting up infrastructure. We need to demonstrate FedRAMP High compliance, which involves implementing mandatory access controls, network isolation, continuous monitoring, and a whole suite of security controls. The good news is that AWS provides most of the services we need. We just have to orchestrate them correctly and ensure they're all configured to meet those stringent federal requirements.

## What we need to build

Create a FedRAMP High compliant data processing infrastructure using **AWS CDK with Python** for secure government data handling.

### Core Requirements

1. **Multi-Layer Security Controls**
   - Implement encryption at rest using AWS KMS with automatic key rotation
   - Enforce TLS 1.2 or higher for all data in transit
   - Configure private networking with no direct internet access
   - Implement multi-layer security groups and network ACLs
   - Enable least privilege IAM access patterns

2. **Network Isolation and Access Controls**
   - Deploy VPC with private subnets across multiple availability zones
   - Implement secure VPC endpoints for AWS service communication
   - Configure bastion host or Systems Manager for secure access
   - No resources should have direct internet connectivity
   - Implement proper subnet segmentation for different workload tiers

3. **Audit Logging and Monitoring**
   - Enable AWS CloudTrail for comprehensive audit logging
   - Configure AWS Config for compliance monitoring and drift detection
   - Set up CloudWatch for metrics, logs, and alerting
   - Implement log aggregation with encryption
   - Enable VPC Flow Logs for network traffic analysis

4. **High Availability Architecture**
   - Multi-AZ deployment for all critical components
   - Automated failover capabilities
   - Data backup and restoration procedures
   - Disaster recovery mechanisms

5. **Data Processing Infrastructure**
   - Implement serverless data processing using Lambda or ECS
   - Configure S3 buckets with encryption, versioning, and lifecycle policies
   - Use Aurora Serverless or RDS with encryption for database workloads
   - Implement Secrets Manager for credential management
   - Set up proper error handling and dead letter queues

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **AWS KMS** for encryption key management with automatic rotation
- Use **AWS CloudTrail** for audit logging to encrypted S3 bucket
- Use **AWS Config** for continuous compliance monitoring
- Use **VPC** with private subnets in multiple AZs for network isolation
- Use **CloudWatch** for monitoring, logging, and alerting
- Use **S3** with encryption and versioning for data storage
- Use **Lambda** or **ECS** for data processing workloads
- Use **Secrets Manager** for secure credential storage
- Use **Systems Manager** for secure instance access
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **eu-west-2** region
- All IAM policies must follow least privilege principle
- Enable AWS Security Hub for centralized security findings

### Constraints

- All resources MUST be deployed in eu-west-2 region
- MUST meet FedRAMP High compliance standards
- Data encryption at rest and in transit is mandatory
- Network isolation with no direct internet access required
- Complete audit trail for all API calls and configuration changes required
- All resources must be destroyable (no Retain deletion policies)
- Multi-AZ deployment for high availability required
- Automated failover and disaster recovery capabilities required
- Include proper error handling, logging, and monitoring
- Use serverless services where possible for cost optimization
- All secrets must be stored in Secrets Manager, never hardcoded

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in eu-west-2 region
- **Security**: All FedRAMP High security controls are properly configured
- **Compliance**: AWS Config rules validate compliance requirements
- **Audit**: CloudTrail captures all API calls and management events
- **Encryption**: All data encrypted at rest with KMS and in transit with TLS
- **Network**: Proper network isolation with private subnets and no internet access
- **High Availability**: Multi-AZ deployment with automated failover
- **Monitoring**: Comprehensive CloudWatch logging and alerting configured
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Well-structured Python CDK code with proper documentation

## What to deliver

- Complete AWS CDK Python implementation in lib/tap_stack.py
- VPC with private subnets across multiple AZs
- KMS keys with automatic rotation for encryption
- CloudTrail configuration for audit logging
- AWS Config rules for compliance monitoring
- CloudWatch dashboards and alarms for monitoring
- S3 buckets with encryption and versioning
- Lambda functions or ECS tasks for data processing
- Secrets Manager for credential management
- IAM roles and policies following least privilege
- Security groups and NACLs for network security
- Documentation of security controls and compliance measures
