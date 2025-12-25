Hey team,

We have a critical requirement to build a multi-region disaster recovery architecture for our payment processing system. This is a production-grade system that handles financial transactions, so we need to ensure business continuity, meet strict recovery objectives, and align with payment processing compliance standards like PCI-DSS.

The business has asked us to implement this solution in **CloudFormation with YAML** to maintain consistency with our existing infrastructure tooling. Our primary region is ap-southeast-1 in Singapore, and we need to establish a secondary disaster recovery region, likely ap-southeast-2 in Sydney or ap-northeast-1 in Tokyo, for geographic redundancy.

The key challenge here is designing an architecture that can fail over between regions within 1 hour with RTO while ensuring we lose no more than 5 minutes of transaction data with RPO. This means we need robust cross-region replication, automated failover capabilities, and comprehensive monitoring to detect failures quickly.

## What we need to build

Create a multi-region disaster recovery payment processing system using **CloudFormation with YAML** that ensures business continuity across AWS regions.

### Core Requirements

1. **Multi-Region Architecture**
   - Primary region: ap-southeast-1 in Singapore
   - Secondary DR region: ap-southeast-2 in Sydney or ap-northeast-1 in Tokyo
   - Full infrastructure replication between regions
   - Active-passive failover pattern with automated promotion

2. **Payment Processing Components**
   - Transaction processing service connects to Lambda functions that process requests and write to databases
   - Payment gateway integration endpoints via API Gateway that routes to Lambda for transaction validation
   - Relational database connects through cross-region read replicas for transaction records that sync continuously
   - Queue system using SQS connects to Lambda for asynchronous transaction processing with automatic retries
   - API Gateway with custom domain connects to payment endpoints that forward to backend services
   - Application Load Balancer distributes traffic to multiple Lambda targets across availability zones

3. **Disaster Recovery Capabilities**
   - Recovery Time Objective with RTO: Less than 1 hour
   - Recovery Point Objective with RPO: Less than 5 minutes
   - Automated failover mechanisms using Route53 health checks that monitor primary region and switch DNS
   - Cross-region data replication for RDS connects to read replicas and DynamoDB syncs with Global Tables
   - Read replica promotion capability for RDS in DR region enables fast database failover

4. **Data Layer**
   - RDS database in primary region with automated backups that replicate to secondary region
   - Cross-region read replica in DR region connects to primary for fast promotion during failover
   - DynamoDB Global Tables sync session state and metadata across both regions automatically
   - S3 cross-region replication connects buckets to copy transaction logs and backups continuously

5. **Security and Compliance**
   - PCI-DSS alignment considerations in architecture design with encryption and logging
   - Encryption at rest using KMS connects to resources with customer-managed keys for data protection
   - Encryption in transit for all data transfer between services and regions
   - Network isolation using VPC with private subnets that restrict access to resources
   - Secrets retrieved from existing Secrets Manager entries that Lambda accesses at runtime
   - Comprehensive audit logging via CloudTrail that captures all API calls and writes to S3
   - Centralized logging to CloudWatch Logs that aggregates application and infrastructure logs

6. **High Availability Within Each Region**
   - Multi-AZ deployment for all stateful services across availability zones
   - Auto-scaling for Lambda and compute resources based on traffic patterns
   - Application Load Balancer with health checks that monitor backend service health
   - SQS for reliable message processing connects to Lambda with dead-letter queues for failed messages
   - CloudWatch alarms connect to SNS for proactive monitoring and alerting

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** with public and private subnets across multiple AZs that isolate resources
- Use **RDS** with Aurora MySQL or PostgreSQL with cross-region read replica that syncs data
- Use **DynamoDB Global Tables** for distributed session management that replicates automatically
- Use **SQS** standard queues for transaction processing that connect to Lambda consumers
- Use **Lambda** functions for serverless transaction processing that integrate with API Gateway
- Use **API Gateway** for RESTful payment endpoints that route to Lambda functions
- Use **Application Load Balancer** for traffic distribution that forwards to Lambda targets
- Use **Route53** for DNS with failover routing policies and health checks that monitor endpoints
- Use **CloudFront** as global CDN for static assets that serves content from S3
- Use **KMS** for encryption key management in both regions that encrypts data at rest
- Use **Secrets Manager** for retrieving existing database credentials that Lambda reads securely
- Use **CloudWatch** for metrics, logs, and alarms that monitor infrastructure health
- Use **CloudTrail** for audit logging that tracks all API activity to S3
- Deploy primary infrastructure to **ap-southeast-1** region
- Deploy DR infrastructure to **ap-southeast-2** region
- All resource names must include environmentSuffix parameter for uniqueness
- Follow naming convention: resource-type-purpose-environmentSuffix

### Constraints

- Follow AWS Well-Architected Framework security best practices
- Use least privilege IAM policies for all services with specific resource ARNs
- All resources must be destroyable with no Retain deletion policies unless critical
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
- **Naming Convention**: All resources include environmentSuffix parameter
- **Code Quality**: Valid YAML CloudFormation templates, well-documented, tested
- **Testing**: Unit tests for validation, integration tests for cross-region failover

## What to deliver

- Complete CloudFormation YAML implementation with nested stacks or modular templates
- Primary region stack in ap-southeast-1 with full infrastructure
- DR region stack in ap-southeast-2 with replicated infrastructure
- Route53 failover routing configuration that switches between regions
- VPC connects to RDS, DynamoDB Global Tables, SQS connects to Lambda, API Gateway routes to ALB
- KMS encryption configuration for both regions that protects data
- IAM roles and policies with least privilege that grant specific permissions
- CloudWatch alarms and dashboards that monitor metrics
- Unit tests for template validation
- Integration tests for failover scenarios
- Documentation for deployment and disaster recovery procedures
