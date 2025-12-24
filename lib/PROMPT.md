# Multi-Region Disaster Recovery Solution

Hey team,

We need to build a comprehensive disaster recovery solution for a financial services company that experienced a serious 6-hour outage last quarter. The business lost significant revenue during that incident, and leadership wants us to implement an active-passive multi-region setup with automated failover. I've been asked to create this using CloudFormation with JSON to ensure we have a robust, production-ready DR infrastructure.

The transaction processing system is critical to their operations, handling about 10,000 transactions per second with sub-second latency requirements. We need to set up infrastructure across two AWS regions with primary operations in us-east-1 and failover capabilities to us-west-2. The business has strict requirements around recovery objectives - RTO must be under 15 minutes and RPO under 5 minutes. This means our replication and failover mechanisms need to be tight.

The architecture needs to include global data replication through DynamoDB Global Tables, cross-region document storage replication using S3, intelligent DNS failover with Route 53, and Lambda functions deployed in both regions for transaction processing. Everything must be encrypted at rest using KMS customer managed keys, and we need comprehensive monitoring and alerting across both regions.

## What we need to build

Create a multi-region disaster recovery infrastructure using CloudFormation with JSON for a transaction processing system spanning us-east-1 as primary and us-west-2 as secondary.

### Core Requirements

1. **Data Layer - Global Replication**
   - Configure DynamoDB Global Tables with on-demand billing mode
   - Enable point-in-time recovery for all DynamoDB tables
   - Set up S3 buckets in both regions with cross-region replication enabled
   - Enable versioning on all S3 buckets
   - Configure S3 Transfer Acceleration for cross-region replication

2. **DNS Failover and Routing**
   - Implement Route 53 hosted zone with failover routing policy
   - Configure health checks monitoring both regions continuously
   - Set up DNS records pointing to primary region with automatic failover to secondary

3. **Compute Layer for Processing Requests**
   - Create Lambda functions in both regions for transaction processing
   - Configure environment variables for region-specific configuration
   - Set reserved concurrency of at least 100 for Lambda functions
   - Deploy identical code to both regions for consistency

4. **Encryption and Security**
   - Configure KMS customer managed keys in each region
   - Create KMS alias 'alias/transaction-encryption' in both regions
   - Implement IAM roles with cross-region assume role permissions
   - Ensure all data encrypted at rest using KMS CMKs

5. **Monitoring and Alerting**
   - Set up CloudWatch alarms for DynamoDB throttling in both regions
   - Configure alarms for S3 replication lag monitoring
   - Create alarms for Lambda error rates and invocation failures
   - Configure CloudWatch Logs with cross-region log group subscriptions
   - Create SNS topics in both regions for operational alerts
   - Ensure CloudWatch alarms trigger SNS notifications for failover events

6. **Stack Outputs and Configuration**
   - Add stack outputs for primary region endpoints
   - Add stack outputs for secondary region endpoints
   - Export resource ARNs and identifiers for cross-stack references

### Technical Requirements

- All infrastructure defined using CloudFormation with JSON
- Use **DynamoDB** for global transaction data replication
- Use **S3** with cross-region replication for document storage
- Use **Route 53** for DNS failover routing
- Use **Lambda** for transaction processing in both regions
- Use **KMS** for encryption key management in each region
- Use **CloudWatch** for monitoring and log aggregation
- Use **SNS** for alerting and notifications
- Use **IAM** for cross-region access control
- Include environmentSuffix parameter in all resource names for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Primary region: us-east-1
- Secondary region: us-west-2

### Constraints and Requirements

- RTO must be under 15 minutes
- RPO must be under 5 minutes
- All data must be encrypted at rest using AWS KMS CMKs
- Route 53 health checks must monitor both regions continuously
- DynamoDB global tables must have point-in-time recovery enabled
- Lambda functions must use reserved concurrency of at least 100
- Cross-region replication must use S3 Transfer Acceleration
- CloudWatch alarms must trigger SNS notifications for any failover events
- VPCs in both regions required with private subnets and VPC peering connection
- Support 10,000 TPS with sub-second latency requirements

### Deployment Requirements

- Include environmentSuffix parameter in all infrastructure names for environment isolation
- Set DeletionPolicy to Retain for all infrastructure to prevent accidental data loss during stack deletion
- Template must be valid JSON format with proper structure
- Must support multi-region deployment (primary and secondary stacks)
- Include comprehensive parameter definitions for customization
- All Lambda functions must specify runtime, handler, and code locations
- IAM roles must grant specific permissions needed for each service
- KMS keys must have appropriate key policies for service access

### Success Criteria

- **Functionality**: Complete disaster recovery solution with automated failover between regions
- **Performance**: RTO under 15 minutes, RPO under 5 minutes, support 10,000 TPS
- **Reliability**: Automatic health check monitoring and DNS failover without manual intervention
- **Security**: Data encrypted at rest with KMS, IAM roles with appropriate cross-region access
- **Naming Convention**: All resources include environmentSuffix for environment isolation
- **Monitoring**: Comprehensive CloudWatch alarms and SNS notifications for all failure scenarios
- **Code Quality**: Valid JSON CloudFormation template, well-structured, properly documented

## What to deliver

- Complete CloudFormation JSON template for multi-region disaster recovery infrastructure
- DynamoDB Global Tables configuration with point-in-time recovery
- S3 buckets with cross-region replication and versioning
- Route 53 hosted zone with failover routing and health checks
- Lambda functions for transaction processing in both regions
- KMS encryption keys with proper aliases and policies
- CloudWatch alarms for throttling, replication lag, and errors
- SNS topics for operational alerts in both regions
- IAM roles with cross-region assume role permissions
- CloudWatch Logs configuration with cross-region subscriptions
- Stack outputs for primary and secondary region endpoints
- Parameters for environmentSuffix and region-specific configuration
- Comprehensive resource naming following conventions
- Documentation within the template using descriptions
