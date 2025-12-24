Hey team,

We have a critical requirement to build a multi-region disaster recovery architecture for our payment processing system. This is a production-grade system that handles financial transactions, so we need to ensure business continuity, meet strict recovery objectives, and align with payment processing compliance standards like PCI-DSS.

The business has asked us to implement this solution in **CloudFormation with YAML** to maintain consistency with our existing infrastructure tooling. Our primary region is ap-southeast-1 (Singapore), and we need to establish a secondary disaster recovery region, likely ap-southeast-2 (Sydney) or ap-northeast-1 (Tokyo), for geographic redundancy.

The key challenge here is designing an architecture that can fail over between regions within 1 hour (RTO) while ensuring we lose no more than 5 minutes of transaction data (RPO). This means we need robust cross-region replication, automated failover capabilities, and comprehensive monitoring to detect failures quickly.

## What we need to build

Create a multi-region disaster recovery payment processing system using **CloudFormation with YAML** that ensures business continuity across AWS regions.

### Core Requirements

1. **Multi-Region Architecture**
   - Primary region: ap-southeast-1 (Singapore)
   - Secondary DR region: ap-southeast-2 (Sydney) or ap-northeast-1 (Tokyo)
   - Full infrastructure replication between regions
   - Active-passive failover pattern with automated promotion

2. **Payment Processing Components**
   - Transaction processing service using Lambda functions
   - Payment gateway integration endpoints via API Gateway
   - Relational database with cross-region read replicas for transaction records
   - Queue system (SQS) for asynchronous transaction processing
   - API Gateway with custom domain for payment endpoints
   - Application Load Balancer for distributing traffic

3. **Disaster Recovery Capabilities**
   - Recovery Time Objective (RTO): Less than 1 hour
   - Recovery Point Objective (RPO): Less than 5 minutes
   - Automated failover mechanisms using Route53 health checks
   - Cross-region data replication for RDS and DynamoDB
   - Read replica promotion capability for RDS in DR region

4. **Data Layer**
   - RDS database in primary region with automated backups
   - Cross-region read replica in DR region for fast promotion
   - DynamoDB Global Tables for session state and metadata
   - S3 cross-region replication for transaction logs and backups

5. **Security and Compliance**
   - PCI-DSS alignment considerations in architecture design
   - Encryption at rest using KMS with customer-managed keys
   - Encryption in transit for all data transfer
   - Network isolation using VPC with private subnets
   - Secrets retrieved from existing Secrets Manager entries (not created)
   - Comprehensive audit logging via CloudTrail
   - Centralized logging to CloudWatch Logs

6. **High Availability Within Each Region**
   - Multi-AZ deployment for all stateful services
   - Auto-scaling for Lambda and compute resources
   - Application Load Balancer with health checks
   - SQS for reliable message processing with dead-letter queues
   - CloudWatch alarms for proactive monitoring

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **VPC** with public and private subnets across multiple AZs
- Use **RDS** (Aurora MySQL or PostgreSQL) with cross-region read replica
- Use **DynamoDB Global Tables** for distributed session management
- Use **SQS** standard queues for transaction processing
- Use **Lambda** functions for serverless transaction processing
- Use **API Gateway** for RESTful payment endpoints
- Use **Application Load Balancer** for traffic distribution
- Use **Route53** for DNS with failover routing policies and health checks
- Use **CloudFront** as global CDN for static assets
- Use **KMS** for encryption key management in both regions
- Use **Secrets Manager** for retrieving existing database credentials
- Use **CloudWatch** for metrics, logs, and alarms
- Use **CloudTrail** for audit logging
- Deploy primary infrastructure to **ap-southeast-1** region
- Deploy DR infrastructure to **ap-southeast-2** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`

### Constraints

- Follow AWS Well-Architected Framework security best practices
- Use least privilege IAM policies for all services
- All resources must be destroyable (no Retain deletion policies unless critical)
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
- Primary region stack (ap-southeast-1) with full infrastructure
- DR region stack (ap-southeast-2) with replicated infrastructure
- Route53 failover routing configuration
- VPC, RDS, DynamoDB Global Tables, SQS, Lambda, API Gateway, ALB
- KMS encryption configuration for both regions
- IAM roles and policies with least privilege
- CloudWatch alarms and dashboards
- Unit tests for template validation
- Integration tests for failover scenarios
- Documentation for deployment and disaster recovery procedures
