Hey team,

We need to build a comprehensive multi-region disaster recovery infrastructure for our payment processing system. The business has asked us to ensure that our critical payment operations can survive a complete regional failure without service interruption. This is mission-critical infrastructure that needs to handle automatic failover between us-east-1 and us-east-2 while keeping all transaction data synchronized in real-time.

The challenge here is creating a fully automated DR setup where if our primary region goes down, traffic seamlessly fails over to the secondary region with zero manual intervention. We need to ensure that transaction logs, payment processing state, and all operational data are continuously replicated across both regions so that the secondary region can pick up exactly where the primary left off.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The architecture needs to support automatic health-based failover, cross-region data replication, and comprehensive monitoring to catch any replication lag issues before they impact operations.

## What we need to build

Create a multi-region disaster recovery system using **Pulumi with TypeScript** for a payment processing platform that automatically fails over between us-east-1 and us-east-2.

### Core Requirements

1. **Global Data Layer**
   - DynamoDB global tables configured for multi-region replication
   - Enable on-demand billing for automatic scaling
   - Enable point-in-time recovery for data protection
   - All table names must include **environmentSuffix** for uniqueness

2. **Payment Processing Functions**
   - Deploy identical Lambda functions in both us-east-1 and us-east-2
   - Functions must handle payment processing workloads
   - Proper IAM roles with least-privilege permissions
   - Environment variables configured per region

3. **API Gateway Configuration**
   - REST APIs deployed in both regions
   - Custom domain names for each regional API
   - Consistent API structure across regions
   - Integration with regional Lambda functions

4. **DNS and Traffic Management**
   - Route 53 hosted zone for domain management
   - Health checks monitoring each regional API endpoint
   - Failover routing policies configured for automatic traffic switching
   - Primary region: us-east-1, Secondary region: us-east-2

5. **Transaction Log Storage**
   - S3 buckets in both us-east-1 and us-east-2
   - Cross-region replication configured for transaction logs
   - Bucket versioning enabled for data protection
   - All bucket names must include **environmentSuffix** for uniqueness

6. **Monitoring and Alerting**
   - CloudWatch alarms monitoring DynamoDB replication lag
   - Alert when replication lag exceeds 30 seconds
   - Alarms for API health check failures
   - Comprehensive visibility into cross-region operations

7. **Configuration Management**
   - SSM parameters storing region-specific endpoints
   - Configuration for primary and secondary API URLs
   - Database connection strings per region
   - Easily accessible configuration for operational teams

8. **Error Handling Infrastructure**
   - SQS dead letter queues in both regions
   - Failed transaction capture and retry capability
   - Message retention configured appropriately
   - Integration with Lambda functions for error handling

9. **Security and Access Control**
   - IAM roles with least-privilege permissions for all services
   - Service-specific policies limiting access to required resources
   - Cross-region IAM role configuration
   - Proper trust relationships between services

10. **Comprehensive Outputs**
    - Primary API endpoint URL
    - Secondary API endpoint URL
    - Health check URLs for both regions
    - CloudWatch alarm ARNs
    - DynamoDB global table name
    - S3 bucket names for both regions

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **DynamoDB** for global data replication with automatic multi-region sync
- Use **Lambda** for serverless payment processing compute
- Use **API Gateway** for REST API endpoints in both regions
- Use **Route 53** for DNS management and health-based failover routing
- Use **S3** with cross-region replication for transaction log storage
- Use **CloudWatch** for monitoring replication lag and service health
- Use **SSM Parameter Store** for configuration management
- Use **SQS** for dead letter queues and failed transaction handling
- Use **IAM** for security roles and permissions
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resourceType-environmentSuffix
- Deploy primary resources to **us-east-1** region
- Deploy secondary resources to **us-east-2** region
- All resources must be destroyable (no RemovalPolicy RETAIN)

### Deployment Requirements (CRITICAL)

- All resource names MUST include **environmentSuffix** parameter to ensure uniqueness
- Pattern: bucketName-environmentSuffix, tableName-environmentSuffix, etc
- All resources MUST be destroyable - use RemovalPolicy DELETE where applicable
- FORBIDDEN: Any RemovalPolicy.RETAIN or DeletionPolicy Retain configurations
- Lambda functions must use Node.js 18.x or higher runtime
- For Node.js 18+, avoid aws-sdk v2 (not included by default), use SDK v3 or extract data from event
- Cross-region resources require explicit region configuration in provider
- Route 53 health checks must specify protocol, port, and path explicitly

### Constraints

- Support automatic failover without manual intervention
- Maintain data consistency across regions during replication
- Ensure sub-minute failover times for critical payment operations
- Monitor and alert on replication lag to prevent data inconsistency
- Implement least-privilege IAM permissions - no wildcard resource policies
- All resources must be fully teardown-able for testing and CI/CD
- Handle Lambda cold starts gracefully in payment processing logic
- Ensure S3 cross-region replication is configured correctly with proper IAM roles

## Success Criteria

- **Functionality**: Complete multi-region DR infrastructure deployed and operational in both regions
- **Failover**: Automatic traffic routing to secondary region when primary health checks fail
- **Data Replication**: DynamoDB global tables replicating data between regions with monitoring
- **Transaction Logs**: S3 cross-region replication ensuring transaction logs available in both regions
- **Monitoring**: CloudWatch alarms configured and triggering on replication lag thresholds
- **Configuration**: SSM parameters populated with all regional endpoints and configurations
- **Resource Naming**: All resources include environmentSuffix in their names
- **Security**: IAM roles follow least-privilege principle with service-specific permissions
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean Pulumi TypeScript code, properly typed, well-structured, documented

## What to deliver

- Complete Pulumi TypeScript implementation in index.ts
- DynamoDB global table configuration with on-demand billing
- Lambda functions deployed to both us-east-1 and us-east-2
- API Gateway REST APIs in both regions with proper integration
- Route 53 hosted zone with health checks and failover routing
- S3 buckets with cross-region replication configured
- CloudWatch alarms for replication lag monitoring
- SSM parameters for region-specific configuration
- SQS dead letter queues in both regions
- IAM roles and policies for all services
- Stack outputs for all endpoints, ARNs, and resource identifiers
- Unit tests for all infrastructure components
- Documentation covering architecture and deployment instructions
