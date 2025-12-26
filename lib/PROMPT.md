Hey team,

We have a critical requirement to build a multi-region disaster recovery architecture for our payment processing system. This is production-grade and handles financial transactions, so we need business continuity and strict recovery objectives aligned with PCI-DSS compliance.

The business wants this implemented in CloudFormation with YAML to match our existing infrastructure tooling. Our primary region is ap-southeast-1, and we need a secondary DR region, probably ap-southeast-2 or ap-northeast-1.

The key challenge is designing an architecture that can fail over between regions within 1 hour RTO while ensuring we lose no more than 5 minutes of transaction data. This means robust cross-region replication, automated failover, and comprehensive monitoring to detect failures quickly.

## What we need to build

Create a multi-region disaster recovery payment processing system using CloudFormation with YAML that ensures business continuity across AWS regions.

### Core Requirements

1. **Multi-Region Architecture**
   - Primary region: ap-southeast-1
   - Secondary DR region: ap-southeast-2 or ap-northeast-1
   - Full infrastructure replication between regions
   - Active-passive failover pattern with automated promotion

2. **Payment Processing Components**
   - Transaction processing using Lambda functions
   - Payment gateway integration via API Gateway
   - Relational database with cross-region read replicas
   - SQS for asynchronous transaction processing
   - API Gateway with custom domain for payment endpoints
   - Application Load Balancer distributing traffic

3. **Disaster Recovery Capabilities**
   - RTO: Less than 1 hour
   - RPO: Less than 5 minutes
   - Route53 health checks monitor API Gateway endpoints every 30 seconds and automatically update DNS records to point to the DR region when the primary fails
   - CloudWatch alarms detect primary region failures by monitoring RDS connection metrics and Lambda error rates
   - Lambda functions in the DR region promote RDS read replicas to primary and activate standby DynamoDB streams when failover triggers
   - EventBridge rules trigger Step Functions that orchestrate the failover sequence: promoting read replicas, updating SQS queue policies, and notifying operations teams via SNS

4. **Service Integration Patterns**
   - API Gateway integrates with Lambda functions that query RDS databases and update DynamoDB session state for each transaction
   - Lambda functions consume messages from SQS queues and write transaction results to DynamoDB Global Tables that replicate across regions in near real-time
   - RDS uses automated cross-region read replicas that continuously sync from the primary region and can be promoted during failover
   - S3 buckets in each region replicate transaction logs and backups cross-region using S3 replication rules
   - KMS keys in each region encrypt RDS data, Lambda environment variables, S3 objects, and DynamoDB tables
   - Secrets Manager stores database credentials that Lambda functions retrieve at runtime using IAM role permissions

5. **Data Layer**
   - RDS database in primary region with automated backups
   - Cross-region read replica in DR region for fast promotion
   - DynamoDB Global Tables for session state and metadata
   - S3 cross-region replication for transaction logs and backups

6. **Security and Compliance**
   - Encryption at rest using KMS with customer-managed keys
   - Encryption in transit for all data transfer
   - Network isolation using VPC with private subnets
   - Lambda functions access Secrets Manager to retrieve existing database credentials rather than hardcoding them
   - IAM policies grant Lambda functions specific permissions to read from specific Secrets Manager secrets and DynamoDB tables
   - CloudTrail logs all API calls for audit compliance
   - CloudWatch Logs centralize all application and infrastructure logs

7. **High Availability Within Each Region**
   - Multi-AZ deployment for RDS and DynamoDB
   - Auto-scaling for Lambda concurrency
   - Application Load Balancer performs health checks on backend targets
   - SQS has dead-letter queues to capture failed messages
   - CloudWatch alarms notify on-call engineers when thresholds breach

### Technical Requirements

- All infrastructure defined using CloudFormation with YAML
- Use VPC with public and private subnets across multiple AZs
- Use RDS Aurora MySQL or PostgreSQL with cross-region read replica
- Use DynamoDB Global Tables for distributed session management
- Use SQS standard queues for transaction processing
- Use Lambda functions for serverless transaction processing
- Use API Gateway for RESTful payment endpoints
- Use Application Load Balancer for traffic distribution
- Use Route53 for DNS with failover routing policies and health checks
- Use CloudFront as global CDN for static assets
- Use KMS for encryption key management in both regions
- Use Secrets Manager for retrieving existing database credentials
- Use CloudWatch for metrics, logs, and alarms
- Use CloudTrail for audit logging
- Deploy primary infrastructure to ap-southeast-1 region
- Deploy DR infrastructure to ap-southeast-2 region
- Resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resourceType-purpose-environmentSuffix

### Constraints

- Follow AWS Well-Architected Framework security best practices
- IAM policies must grant specific permissions to specific resources rather than using wildcards
- All resources must be destroyable - no Retain deletion policies unless critical
- Secrets fetched from existing Secrets Manager entries, not created new
- Comprehensive CloudWatch logging and monitoring enabled
- All resources properly tagged with Environment, Project, and CostCenter
- Integration tests must reference cfn-outputs/flat-outputs.json
- Use nested stacks or modular approach for better organization
- Consider cost optimization by using serverless where possible

## Success Criteria

- **Functionality**: CloudFormation stack deploys successfully in both regions
- **Disaster Recovery**: Cross-region replication configured and functional
- **Performance**: API response times under 500ms, failover achievable within RTO
- **Reliability**: Multi-AZ deployment, automated health checks, 99.9% uptime target
- **Security**: Encryption enabled, network isolation, audit logging, PCI-DSS alignment
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Valid YAML CloudFormation templates, well-documented, tested
- **Testing**: Unit tests for validation, integration tests for cross-region failover

## What to deliver

- Complete CloudFormation YAML implementation with nested stacks or modular templates
- Primary region stack for ap-southeast-1 with full infrastructure
- DR region stack for ap-southeast-2 with replicated infrastructure
- Route53 failover routing configuration
- VPC, RDS, DynamoDB Global Tables, SQS, Lambda, API Gateway, ALB
- KMS encryption configuration for both regions
- IAM roles and policies with least privilege
- CloudWatch alarms and dashboards
- Unit tests for template validation
- Integration tests for failover scenarios
- Documentation for deployment and disaster recovery procedures
