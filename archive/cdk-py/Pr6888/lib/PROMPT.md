# Multi-Region Disaster Recovery Infrastructure for Payment Processing

Hey team,

We've been asked to build a comprehensive disaster recovery system for our payment processing infrastructure. The business is looking at expanding into new markets and our current single-region setup won't cut it anymore. We need to ensure that if our primary region goes down, we can failover to a secondary region within minutes without losing any payment data or session state.

The finance team is particularly concerned about regulatory compliance and data durability for payment transactions. They need to demonstrate to auditors that we have a robust DR strategy with automated failover capabilities. The operations team also wants visibility into replication lag and cross-region health metrics through centralized dashboards.

I've been asked to implement this using **AWS CDK with Python** to define all the infrastructure as code. The architecture needs to span two regions with full replication of our payment processing components.

## What we need to build

Create a multi-region disaster recovery infrastructure using **AWS CDK with Python** for a payment processing system that can withstand regional failures.

### Core Requirements

1. **Database Layer**
   - Aurora PostgreSQL Global Database with primary cluster in us-east-1 and secondary in us-east-2
   - DynamoDB Global Tables for session management with on-demand billing and point-in-time recovery
   - Automated replication with monitoring for lag thresholds

2. **Compute and API Layer**
   - Lambda functions deployed identically in both regions for payment validation, transaction processing, and notification services
   - API Gateway REST APIs in both regions with request validation and throttling at 10,000 requests per second
   - Custom domain names with regional endpoints for API Gateway

3. **Storage and Replication**
   - S3 buckets in both regions with cross-region replication enabled
   - Replication Time Control (RTC) for guaranteed replication within 15 minutes
   - Lifecycle policies to archive data to Glacier after 90 days

4. **DNS and Traffic Management**
   - Route 53 hosted zone with weighted routing policies (100% primary, 0% secondary initially)
   - Health checks monitoring API Gateway endpoints in both regions
   - Automatic DNS failover when primary region health checks fail

5. **Monitoring and Alerting**
   - CloudWatch alarms for RDS replication lag, Lambda errors, and API Gateway 5XX errors
   - SNS topics for alarm notifications
   - Cross-region CloudWatch dashboards showing database connections, API latency, and replication status

6. **Configuration Management**
   - Systems Manager Parameter Store for database endpoints, API URLs, and feature flags
   - Cross-region parameter synchronization
   - Encrypted parameters for sensitive configuration

7. **Automated Failover**
   - Lambda functions for failover orchestration
   - Step Functions state machine to promote secondary region to primary
   - Automated Route 53 weight updates during failover

8. **Networking**
   - VPC in each region with 3 availability zones
   - Private subnets for compute and database resources
   - Public subnets for NAT gateways and load balancers

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use AWS CDK 2.x with Python 3.9 or higher
- Resource names must include **environmentSuffix** parameter for uniqueness across environments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** as primary and **us-east-2** as secondary regions
- Tag all resources with 'DR-Role' tag set to either 'primary' or 'secondary'
- Use proper CDK constructs for cross-region resource references
- All resources must be destroyable (no Retain deletion policies)
- Include comprehensive inline comments explaining cross-region configurations

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: All resource names must include an environmentSuffix parameter to ensure uniqueness when deploying multiple instances. This prevents resource name conflicts during testing and deployment.
- **Destroyability**: All resources must use RemovalPolicy.DESTROY. Do NOT use RemovalPolicy.RETAIN or DeletionPolicy: Retain. This is critical for testing and cleanup. Even database resources should be destroyable in this implementation.
- **Cross-Region References**: Use CDK cross-region reference patterns properly, avoiding circular dependencies between regional stacks.
- **Lambda Runtime**: For Node.js Lambda functions, use runtime version 20.x or newer. Note that Node.js 18+ no longer includes aws-sdk v2 by default, so Lambda functions must either bundle SDK dependencies or use SDK v3.

### AWS Services to Implement

- Amazon Aurora (PostgreSQL Global Database)
- Amazon DynamoDB (Global Tables with bi-directional replication)
- AWS Lambda (payment validation, transaction processing, notification functions in both regions)
- Amazon S3 (cross-region replication with RTC)
- Amazon API Gateway (REST APIs in both regions)
- Amazon Route 53 (hosted zone, health checks, weighted routing)
- Amazon CloudWatch (alarms, dashboards, cross-region metrics)
- Amazon SNS (alarm notifications)
- AWS Systems Manager Parameter Store (cross-region configuration)
- AWS Step Functions (failover automation)
- Amazon VPC (networking in both regions)
- IAM (cross-region roles and policies)

### Constraints

- Primary region must be us-east-1, secondary must be us-east-2
- Failover capability must complete within 5 minutes
- Aurora Global Database must have automated backups enabled
- API Gateway throttling must be set to 10,000 requests per second
- S3 lifecycle policy must archive to Glacier after 90 days
- CloudWatch alarms must trigger SNS notifications
- All database credentials must be stored in Secrets Manager
- DynamoDB must use on-demand billing mode
- Lambda functions must have identical configurations in both regions
- Route 53 health checks must evaluate API Gateway endpoint health

## Success Criteria

- **Functionality**: All 10 required components successfully deployed and operational in both regions
- **Replication**: Aurora Global Database replicating with lag under 1 second, DynamoDB Global Tables with bi-directional sync
- **Failover**: Step Functions state machine can promote secondary to primary within 5 minutes
- **Monitoring**: CloudWatch dashboards display cross-region metrics accurately
- **Resource Naming**: All resources include environmentSuffix and DR-Role tags
- **Deployability**: CDK app synthesizes without errors and deploys to both regions successfully
- **Code Quality**: Python code follows PEP 8 style guide, well-commented, production-ready

## What to deliver

- Complete AWS CDK Python implementation with multi-region stacks
- app.py or tap.py entry point initializing stacks for both regions
- Stack class implementing all 10 required components
- Lambda function code for payment validation, transaction processing, and notifications
- Lambda function code for failover orchestration
- Step Functions state machine definition for automated failover
- Proper cross-region resource references and dependencies
- IAM roles and policies for all services
- CloudWatch dashboard configuration with cross-region metrics
- README with deployment instructions and architecture overview
- Unit tests validating stack synthesis
