Hey team,

We need to build a highly available payment processing API with automatic regional failover for a financial services company. The business needs a disaster recovery solution that can automatically failover between AWS regions without any manual intervention during outages. This is critical infrastructure that handles payment transactions, so maintaining zero downtime and transaction integrity during regional outages is non-negotiable.

The current single-region setup is a major risk for the business. If us-east-1 goes down, we lose the ability to process payments completely. The company wants active-passive disaster recovery with automated health monitoring that can detect failures and switch traffic to the secondary region within 2 minutes. We need to implement this using **Pulumi with TypeScript** since that's our standard for infrastructure automation.

The key challenge here is building truly identical infrastructure stacks in both regions that stay synchronized. We need DynamoDB global tables for transaction data replication, S3 cross-region replication for audit logs, Secrets Manager replication for credentials, and Lambda functions deployed identically in both regions. Route53 needs to manage the failover routing based on continuous health checks of both API Gateway endpoints.

## What we need to build

Create a multi-region disaster recovery system using **Pulumi with TypeScript** that deploys a payment processing API infrastructure in both us-east-1 (primary) and us-east-2 (secondary) with automated failover capabilities.

### Core Requirements

1. **Multi-Region API Gateway Setup**
   - Deploy REST APIs in both us-east-1 and us-east-2
   - Configure custom domain names for both regions
   - Ensure identical Lambda backend integration in both regions
   - Set up proper stage configurations with deployment settings

2. **DynamoDB Global Tables**
   - Create global tables for transaction data storage
   - Enable point-in-time recovery for data protection
   - Configure cross-region replication between us-east-1 and us-east-2
   - Set up proper table schemas with partition and sort keys

3. **Route53 Health Checks and Failover**
   - Implement health checks monitoring API Gateway endpoints every 30 seconds
   - Configure failover routing policies switching to secondary within 2 minutes
   - Set up proper DNS records with weighted or failover routing
   - Ensure health check endpoints respond quickly

4. **Lambda Functions**
   - Deploy payment processing functions with 10 second timeout
   - Create health check response functions with 100ms timeout
   - Configure reserved concurrency to ensure availability
   - Deploy identical code and configuration to both regions
   - Use VPC configuration with private subnets for secure execution

5. **CloudWatch Synthetics Monitoring**
   - Deploy canaries testing API endpoints every 5 minutes in both regions
   - Configure synthetic tests validating end-to-end payment flow
   - Set up proper IAM roles for canary execution
   - Store canary results and logs for analysis

6. **S3 Cross-Region Replication**
   - Configure S3 buckets for transaction audit logs in both regions
   - Enable cross-region replication from primary to secondary
   - Implement lifecycle policies for log retention
   - Ensure proper versioning and replication rules

7. **SNS Failover Notifications**
   - Set up SNS topics in both regions for event notifications
   - Configure email subscriptions for failover alerts
   - Implement cross-region topic subscriptions
   - Ensure notification delivery during regional failures

8. **Secrets Manager Replication**
   - Store API keys and database credentials securely
   - Enable automatic cross-region replication of secrets
   - Configure proper IAM policies for secret access
   - Ensure Lambda functions can retrieve secrets in both regions

9. **CloudWatch Alarms**
   - Create alarms triggering when API latency exceeds 500ms
   - Set up alarms for error rate exceeding 1 percent
   - Configure alarm actions for SNS notifications
   - Monitor both regions independently

10. **Systems Manager Parameter Store**
    - Implement Parameter Store for configuration synchronization
    - Store shared configuration values across regions
    - Enable cross-region parameter access where needed
    - Use proper parameter naming conventions

11. **VPC Infrastructure**
    - Create VPCs in both us-east-1 and us-east-2
    - Configure private subnets for Lambda execution
    - Set up proper security groups and network ACLs
    - Ensure subnet availability across multiple AZs

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** (primary) and **us-east-2** (secondary) regions
- Use **API Gateway REST API** for HTTP endpoints
- Use **Lambda** with Node.js 18+ runtime for functions
- Use **DynamoDB Global Tables** for cross-region data replication
- Use **Route53** health checks with failover routing policies
- Use **CloudWatch Synthetics** for endpoint monitoring
- Use **S3** with cross-region replication for audit logs
- Use **SNS** for notifications in both regions
- Use **Secrets Manager** with automatic replication
- Use **CloudWatch Alarms** for monitoring metrics
- Use **Systems Manager Parameter Store** for configuration
- Use **VPC** with private subnets in both regions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-${environmentSuffix}`
- All resources must be destroyable (no Retain policies, no DeletionProtection)

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL named resources (S3 buckets, DynamoDB tables, Lambda functions, API Gateway APIs, SNS topics, Secrets Manager secrets, Parameter Store parameters) MUST include environmentSuffix for uniqueness
- **Destroyability**: ALL resources MUST be fully destroyable after testing - NO RemovalPolicy.RETAIN, NO DeletionProtection flags, NO retention policies that prevent cleanup
- **Multi-Region**: Deploy identical infrastructure to BOTH us-east-1 and us-east-2 - this requires proper Pulumi provider configuration for each region
- **Lambda Reserved Concurrency**: Be careful with reserved concurrency settings - setting too low can block deployments, setting too high wastes resources
- **Node.js 18+ Lambda**: Use Node.js 18.x or 20.x runtime - AWS SDK v3 is built-in, no need to bundle aws-sdk in Lambda code
- **S3 Replication Role**: Cross-region replication requires proper IAM role with replication permissions - ensure role has access to both source and destination buckets
- **Secrets Manager Replication**: Replication must be configured on the primary secret with proper replica regions specified
- **DynamoDB Global Tables**: Use proper global table API (not legacy replication) - requires streams enabled and proper IAM permissions
- **Route53 Health Checks**: Health check endpoints need fast response times - ensure Lambda health check functions have minimal cold start and execution time

### Constraints

- Must handle regional failures gracefully without data loss
- Failover must complete within 2 minutes of primary region failure
- All Lambda functions must use proper error handling and retries
- Transaction data must remain consistent across regions
- Security credentials must be encrypted at rest and in transit
- VPC Lambda functions require proper subnet configuration and NAT gateway access if calling AWS APIs
- CloudWatch Synthetics canaries need proper IAM execution roles
- API Gateway requires proper stage variables and deployment configuration
- All resources must follow AWS best practices for high availability

## Success Criteria

- **Functionality**: API Gateway endpoints respond successfully in both regions, Lambda functions process payment requests correctly, DynamoDB tables replicate data across regions, Route53 failover switches traffic when primary fails
- **Performance**: API latency stays under 500ms under normal load, health checks complete in under 100ms, failover completes within 2 minutes
- **Reliability**: System maintains 99.99 percent uptime across regions, zero data loss during failover, automated recovery without manual intervention
- **Security**: All credentials stored in Secrets Manager with replication, VPC isolation for Lambda functions, proper IAM roles with least privilege
- **Resource Naming**: All S3 buckets, DynamoDB tables, Lambda functions, API Gateway APIs, SNS topics, secrets, and parameters include environmentSuffix
- **Monitoring**: CloudWatch Synthetics canaries test endpoints every 5 minutes, alarms trigger for latency and error thresholds, SNS notifications sent on failover events
- **Code Quality**: TypeScript code with proper typing, comprehensive unit tests, clear documentation

## What to deliver

- Complete Pulumi TypeScript program deployable to both us-east-1 and us-east-2
- API Gateway REST APIs with Lambda backend integration in both regions
- DynamoDB global tables with point-in-time recovery enabled
- Route53 health checks and failover routing configuration
- Lambda functions for payment processing and health checks
- CloudWatch Synthetics canaries for endpoint monitoring
- S3 buckets with cross-region replication and lifecycle policies
- SNS topics in both regions with email subscriptions
- Secrets Manager with automatic cross-region replication
- CloudWatch alarms for latency and error monitoring
- Systems Manager Parameter Store for configuration sync
- VPC infrastructure with private subnets in both regions
- Unit tests for all infrastructure components
- Deployment instructions and architecture documentation
