# Healthcare Platform Multi-Region Disaster Recovery

Hey team,

We need to build a multi-region disaster recovery infrastructure for a healthcare SaaS platform. The business requirement is critical - we need to maintain 99.99% uptime and meet HIPAA compliance for data availability. I've been asked to create this using **CDKTF with Python**. The platform processes patient records and needs automatic failover between us-east-1 (primary) and us-west-2 (secondary) regions.

The business wants recovery time under 5 minutes and data loss under 1 minute. They need confidence that if one region goes down, the system seamlessly switches to the backup region without manual intervention. This is patient data, so encryption and compliance are non-negotiable.

We're implementing this across two AWS regions with DynamoDB global tables for patient data, Lambda functions for API processing, S3 for medical document storage, and Route 53 for DNS failover. The architecture needs VPC peering between regions for secure communication and comprehensive monitoring dashboards.

## What we need to build

Create a disaster recovery infrastructure using **CDKTF with Python** for a healthcare platform that requires 99.99% uptime with automatic multi-region failover.

### Core Requirements

1. **DynamoDB Global Tables**
   - Set up DynamoDB global tables across us-east-1 and us-west-2
   - Create patient_records table with appropriate schema
   - Create audit_logs table for compliance tracking
   - Enable point-in-time recovery on all DynamoDB tables

2. **Lambda Functions for API**
   - Create Lambda functions in both regions for API endpoints
   - Configure with 3GB memory and 30-second timeout
   - Implement IAM roles with cross-region assume permissions for Lambda
   - DO NOT set AWS_REGION in Lambda environment variables (it is automatically available)

3. **S3 Cross-Region Replication**
   - Configure S3 buckets with cross-region replication for medical documents
   - Enable versioning on BOTH source and destination buckets BEFORE configuring replication
   - Ensure encryption at rest with KMS customer-managed keys
   - Set force_destroy=True on all S3 buckets for testing/teardown

4. **Route 53 DNS Failover**
   - Implement Route 53 hosted zone with weighted routing policy
   - Configure 70% traffic to primary region, 30% to secondary
   - Create health check alarms that trigger failover when 3 consecutive checks fail
   - DO NOT use reserved domains like example.com - use healthcare-dr-${environmentSuffix}.com

5. **KMS Encryption**
   - Set up KMS customer-managed keys in both regions
   - Enable key rotation for compliance
   - Configure appropriate key policies for cross-region access

6. **CloudWatch Monitoring**
   - Configure CloudWatch dashboards showing replication lag and failover metrics
   - Set up alarms for critical thresholds

7. **SNS Notifications**
   - Set up SNS topics in both regions for failover notifications
   - Configure subscriptions for operations team alerts

8. **VPC Networking**
   - Configure VPC peering between us-east-1 and us-west-2 for secure communication
   - Set up appropriate security groups for Lambda and data services
   - All route table routes MUST specify cidr_block parameter (e.g., "0.0.0.0/0" for internet gateway)

9. **Resource Tagging**
   - Tag all resources with Environment=Production and DisasterRecovery=Enabled

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **DynamoDB** for patient_records and audit_logs with global tables
- Use **Lambda** for API endpoints in both regions
- Use **S3** with cross-region replication for medical documents
- Use **Route 53** for DNS failover with health checks
- Use **KMS** customer-managed keys in both regions with rotation enabled
- Use **CloudWatch** for monitoring dashboards and alarms
- Use **IAM** roles with cross-region permissions
- Use **SNS** topics in both regions for notifications
- Use **VPC** peering for cross-region secure connectivity
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** (primary) and **us-west-2** (secondary) regions

### Deployment Requirements (CRITICAL)

1. **IAM Role Policy Attachments**
   - When attaching IAM policies to roles, use role.name NOT role.arn
   - Correct: role=lambda_role.name
   - Wrong: role=lambda_role.arn

2. **Lambda Environment Variables**
   - DO NOT set AWS_REGION in Lambda environment variables
   - AWS_REGION is a reserved variable automatically available to Lambda functions
   - Remove any environment={"AWS_REGION": "..."} configurations

3. **Route53 Domain Names**
   - DO NOT use example.com domain (reserved by AWS and will fail deployment)
   - Use pattern: healthcare-dr-${environmentSuffix}.com or similar non-reserved domain

4. **VPC Route Tables**
   - All route table route resources MUST specify cidr_block parameter
   - For internet gateway routes, use cidr_block="0.0.0.0/0"
   - Never leave route destination undefined

5. **S3 Replication Dependencies**
   - Enable versioning on DESTINATION bucket BEFORE configuring replication
   - Add explicit depends_on=[destination_versioning] to replication configuration
   - Ensure both source and destination buckets have versioning enabled first

6. **Resource Destroyability**
   - All S3 buckets must have force_destroy=True for testing/teardown
   - No deletion protection on any resources
   - All resources must be cleanly destroyable

### Constraints

- Primary region must be us-east-1 with failover to us-west-2
- RTO (Recovery Time Objective) must be under 5 minutes
- RPO (Recovery Point Objective) must be under 1 minute
- All data must be encrypted at rest using AWS KMS customer-managed keys
- Route 53 health checks must trigger automatic DNS failover
- DynamoDB global tables must have point-in-time recovery enabled
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: All 9 core requirements implemented with automatic failover
- **Performance**: RTO under 5 minutes, RPO under 1 minute
- **Reliability**: 99.99% uptime with automatic region switching
- **Security**: KMS encryption, HIPAA compliance, proper IAM roles
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: CDKTF Python code, well-structured, documented
- **Deployment**: All 5 deployment fixes applied, infrastructure synthesizes and deploys successfully

## What to deliver

- Complete CDKTF Python implementation with multi-region stacks
- DynamoDB global tables for patient_records and audit_logs
- Lambda functions with proper IAM roles and NO AWS_REGION in environment
- S3 buckets with cross-region replication and proper versioning dependencies
- Route 53 hosted zone with non-reserved domain and health checks
- VPC peering with properly configured route tables (cidr_block specified)
- KMS keys in both regions with rotation enabled
- CloudWatch dashboards and alarms
- SNS topics for notifications
- IAM roles using role.name for policy attachments
- Unit tests for infrastructure validation
- Documentation and deployment instructions
