# Payment Processing Infrastructure for US East Region

Hey team,

We're expanding into the US East market and need to build a robust payment processing environment in AWS Ohio (eu-south-2). Our fintech startup is handling real money transactions, so we need infrastructure that meets PCI DSS compliance requirements while delivering sub-second transaction processing at high throughput. The business wants this built using **Pulumi with TypeScript** to leverage our team's existing Node.js expertise.

The architecture needs to be production-grade from day one. We're talking about a distributed system that processes payments through API endpoints, validates transactions, processes them asynchronously, and notifies stakeholders. Everything needs proper monitoring, logging, and audit trails because we're dealing with financial data. The compliance folks are very particular about encryption, network isolation, and access controls.

We've got some specific technical debt to avoid here. Past payment systems suffered from cold start issues during peak loads, and we've had problems with resources that couldn't be torn down cleanly in development environments. The new infrastructure must handle both high availability and easy reproducibility across environments. Each deployment needs unique resource names using an environmentSuffix pattern so we can run multiple stacks without conflicts.

## What we need to build

Create a complete payment processing infrastructure using **Pulumi with TypeScript** for the AWS Ohio region (eu-south-2). The system should handle payment validation, processing, and notification workflows with full audit capabilities and comprehensive monitoring.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR block 10.0.0.0/16 spanning 3 availability zones
   - Public subnets for internet-facing resources (NAT Gateways)
   - Private subnets for all compute resources (Lambda functions)
   - NAT Gateways in each availability zone for outbound connectivity
   - VPC endpoints for S3 and DynamoDB to keep traffic within AWS network
   - VPC Flow Logs enabled and streaming to CloudWatch Logs
   - Transit Gateway attachment for future multi-region connectivity

2. **API Layer**
   - API Gateway REST API with Lambda proxy integration
   - Payments endpoint that triggers the payment validation workflow
   - Request throttling configured at 10,000 requests per minute
   - Proper IAM authorization for API access

3. **Compute Layer**
   - Three Lambda functions with distinct responsibilities:
     - payment-validator: Input validation and fraud checks
     - payment-processor: Core transaction processing logic
     - payment-notifier: Stakeholder notification handling
   - Each function configured with 512MB memory and 30-second timeout
   - Reserved concurrent executions to prevent cold starts
   - Functions must run in private subnets with no direct internet access
   - Environment variables for configuration (table names, bucket names, etc.)

4. **Data Storage**
   - DynamoDB table named "transactions" with:
     - Partition key: transactionId (String)
     - Sort key: timestamp (Number)
     - On-demand billing mode for automatic scaling
     - Point-in-time recovery enabled
     - Encryption at rest using AWS-managed keys
   - S3 bucket for audit logs with:
     - Server-side encryption using AWS-managed keys
     - Versioning enabled
     - Lifecycle policy for 90-day archival to Glacier
     - Public access blocked

5. **Monitoring and Alerting**
   - CloudWatch Log Groups for each Lambda function with 7-day retention
   - CloudWatch Dashboard displaying:
     - Lambda invocation counts per function
     - Lambda error rates
     - DynamoDB read/write capacity consumption
     - API Gateway request metrics
   - CloudWatch Alarms monitoring Lambda error rates
   - Alarm triggers SNS notification when errors exceed 1%

6. **Notification System**
   - SNS topic for payment notifications
   - Email subscription endpoint for stakeholder alerts
   - Integration with Lambda notifier function

7. **Security and Compliance**
   - Customer-managed KMS keys for database backup encryption
   - IAM roles with least-privilege access for each Lambda function
   - Session policies with maximum 1-hour session duration
   - Security groups with explicit port definitions
   - All compute resources isolated in private subnets

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **eu-south-2 (Ohio)** region
- Use Pulumi Component Resource pattern to organize related resources
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain policies on buckets or tables)
- Proper tagging with Environment, Project, and ManagedBy tags

### Constraints

- All compute resources must run in private subnets with no direct internet access
- CloudWatch alarms must trigger SNS notifications for any Lambda errors exceeding 1%
- Lambda functions must have reserved concurrent executions set to prevent cold starts
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- API Gateway must implement request throttling at 10,000 requests per minute
- S3 buckets must have versioning enabled and lifecycle policies for 90-day archival
- VPC flow logs must be enabled and sent to CloudWatch Logs
- All IAM roles must use session policies with maximum session duration of 1 hour
- Database backups must be encrypted with customer-managed KMS keys
- All security groups must follow least-privilege principle with explicit port definitions
- Must comply with PCI DSS requirements
- Must achieve sub-second latency for transaction processing
- All resources must support clean teardown for development environments

## Success Criteria

- **Functionality**: Complete payment workflow from API request through validation, processing, and notification
- **Performance**: Sub-second response times for payment validation and processing
- **Reliability**: High availability across 3 availability zones with automatic failover
- **Security**: PCI DSS compliance with encryption at rest and in transit, network isolation
- **Monitoring**: Comprehensive visibility into system health and transaction flows
- **Resource Naming**: All resources include environmentSuffix for multi-environment deployment
- **Code Quality**: Well-structured TypeScript code using Component Resource pattern
- **Destroyability**: All resources can be cleanly torn down without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation organized using Component Resources
- VPC with networking components (subnets, NAT gateways, VPC endpoints, flow logs, transit gateway)
- API Gateway REST API with throttling and Lambda integration
- Three Lambda functions with complete TypeScript implementation
- DynamoDB table with point-in-time recovery and encryption
- S3 bucket with versioning, lifecycle policies, and encryption
- CloudWatch Log Groups, Dashboard, and Alarms
- SNS topic with email subscription
- KMS keys for backup encryption
- IAM roles and policies following least-privilege principle
- Security groups with explicit rules
- Stack exports: API Gateway URL, S3 bucket name, DynamoDB table name, CloudWatch dashboard URL
- Unit tests for infrastructure components
- Integration tests for the complete deployment
- README documentation with deployment instructions and architecture overview
