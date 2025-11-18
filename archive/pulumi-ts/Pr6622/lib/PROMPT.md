# Multi-Region Disaster Recovery Infrastructure for Payment Processing

Hey team,

We've got a critical project from our financial services group. They need a comprehensive disaster recovery solution for their payment processing system that spans multiple AWS regions. The business is extremely concerned about downtime - even a few minutes of payment processing failure could cost millions and damage customer trust. They're operating in a highly regulated environment where availability and data integrity are non-negotiable.

The current payment system is single-region, and they've had several close calls during AWS service disruptions. The CFO and compliance team are pushing hard for a multi-region setup with automated failover. They need an RTO of 15 minutes and RPO of 5 minutes, and they want confidence that the system will actually work when disaster strikes. The architecture needs to handle automatic failover between us-east-1 and us-east-2 without manual intervention.

I've been asked to build this using **Pulumi with TypeScript** since that's our standard for infrastructure automation. The solution needs to be robust and production-ready, with proper monitoring and alerting throughout.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Pulumi with TypeScript** for a payment processing system with automated failover capabilities between us-east-1 (primary) and us-east-2 (disaster recovery).

### Core Requirements

1. **DynamoDB Global Tables**
   - Create DynamoDB global tables spanning both us-east-1 and us-east-2
   - Use on-demand billing mode for cost efficiency and automatic scaling
   - Enable point-in-time recovery for data protection
   - Store transaction data with automatic multi-region replication

2. **Lambda Functions in Both Regions**
   - Deploy identical Lambda functions in us-east-1 and us-east-2 for payment processing
   - Configure with appropriate memory and timeout settings
   - Include proper error handling and logging
   - Ensure functions can access DynamoDB tables in their respective regions

3. **API Gateway REST APIs**
   - Set up API Gateway REST APIs in both us-east-1 and us-east-2
   - Configure custom domain names for each regional API
   - Integrate with Lambda functions for payment processing endpoints
   - Enable request/response logging

4. **Route 53 DNS and Health Checks**
   - Create hosted zone for domain management
   - Set up health checks monitoring primary region API endpoint
   - Configure failover routing policies pointing to us-east-1 (primary) and us-east-2 (secondary)
   - Ensure automatic DNS failover when primary region becomes unavailable

5. **S3 Cross-Region Replication**
   - Create S3 buckets in both us-east-1 and us-east-2
   - Configure cross-region replication for transaction logs and backups
   - Enable versioning on both buckets
   - Implement lifecycle policies for cost optimization

6. **CloudWatch Monitoring**
   - Create CloudWatch alarms monitoring DynamoDB replication lag
   - Trigger alerts when replication lag exceeds 30 seconds
   - Monitor Lambda function errors and throttles
   - Set up alarms for API Gateway 5xx errors

7. **SSM Parameter Store**
   - Store region-specific API endpoints in SSM Parameter Store
   - Store configuration values for Lambda functions
   - Include parameters for database connection strings
   - Ensure parameters are accessible by Lambda functions

8. **SQS Dead Letter Queues**
   - Create SQS dead letter queues in both us-east-1 and us-east-2
   - Configure for failed transaction retry mechanism
   - Set appropriate message retention periods
   - Enable encryption at rest

9. **IAM Roles and Policies**
   - Create IAM roles for Lambda functions with least-privilege permissions
   - Grant DynamoDB read/write access to Lambda
   - Allow Lambda to write CloudWatch logs
   - Configure cross-region IAM permissions for replication

10. **Stack Outputs**
    - Export primary API endpoint URL (us-east-1)
    - Export secondary API endpoint URL (us-east-2)
    - Export Route 53 health check URLs
    - Export CloudWatch alarm ARNs for monitoring integration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **DynamoDB** global tables for transaction data storage
- Use **Lambda** for payment processing business logic
- Use **API Gateway** REST APIs for client-facing endpoints
- Use **Route 53** for DNS management and health-based failover
- Use **S3** with cross-region replication for transaction logs
- Use **CloudWatch** for monitoring and alerting
- Use **SSM Parameter Store** for configuration management
- Use **SQS** for dead letter queue implementation
- Use **IAM** for security and access control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Primary region: **us-east-1**
- Disaster recovery region: **us-east-2**

### Constraints

- DynamoDB tables must use on-demand billing mode
- Point-in-time recovery must be enabled on all DynamoDB tables
- S3 buckets must have versioning enabled for replication
- CloudWatch alarms must trigger when replication lag exceeds 30 seconds
- Lambda functions must have proper IAM roles with least privilege
- All encryption must use AWS managed keys (no custom KMS keys required)
- Route 53 health checks must monitor actual API endpoints, not just EC2 instances
- SQS queues must have encryption enabled
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging in all Lambda functions
- Follow principle of least privilege for all IAM policies

## Success Criteria

- **Functionality**: Complete disaster recovery system with automatic failover between regions
- **Performance**: RTO of 15 minutes, RPO of 5 minutes, replication lag under 30 seconds
- **Reliability**: Health checks accurately detect failures, DNS failover works automatically
- **Security**: All data encrypted at rest and in transit, least-privilege IAM policies
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Monitoring**: CloudWatch alarms configured for DynamoDB replication lag
- **Data Consistency**: Transaction data synchronized across both regions
- **Code Quality**: TypeScript implementation with proper types, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- DynamoDB global tables with on-demand billing and PITR
- Lambda functions in both us-east-1 and us-east-2
- API Gateway REST APIs with custom domain names
- Route 53 hosted zone with health checks and failover routing
- S3 buckets with cross-region replication
- CloudWatch alarms for replication lag monitoring
- SSM parameters for region-specific configurations
- SQS dead letter queues in both regions
- IAM roles and policies for all services
- Lambda function code in lib/lambda/ directory
- Stack outputs with API endpoints, health check URLs, and alarm ARNs
- Documentation of disaster recovery procedures
