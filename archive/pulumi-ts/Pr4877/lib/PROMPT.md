# Global Banking Platform Deployment Prompt

**IMPORTANT: You must use Pulumi with TypeScript for this deployment.**

## Project Overview

Deploy a globally distributed, highly available banking platform with multi-region architecture, comprehensive security controls, and PCI-DSS compliance features using **Pulumi Ts**

## Infrastructure Requirements

### Regional Architecture

```
Primary Region: us-east-1
Replica Regions: eu-west-1, ap-southeast-1
```

Deploy the following infrastructure across all regions:

### 1. Network Infrastructure

- **VPC Configuration**
  - CIDR: `10.29.0.0/16` per region
  - Public and private subnets across multiple AZs
  - NAT Gateways for private subnet internet access
  - VPC Flow Logs enabled

- **Transit Gateway**
  - Deploy Transit Gateway in each region
  - Configure Transit Gateway peering between regions
  - Enable cross-region routing

### 2. Global Load Balancing & Traffic Management

- **AWS Global Accelerator**
  - Static anycast IP addresses
  - Route traffic to regional Application Load Balancers
  - Health checks and automatic failover

- **Application Load Balancer** (per region)
  - HTTPS listeners with TLS termination
  - Target groups for ECS services
  - Connection draining and sticky sessions

- **Route 53**
  - Geoproximity routing policy
  - Health checks for all endpoints
  - Failover routing configuration

### 3. Compute & Container Orchestration

- **ECS Fargate**
  - Service mesh using AWS App Mesh
  - Microservices architecture
  - Auto-scaling policies
  - Task definitions with proper IAM roles

- **App Mesh Configuration**
  - Virtual nodes for each microservice
  - Virtual routers and routes
  - Virtual services for service discovery
  - Envoy proxy sidecar containers

### 4. Database & Data Storage

- **Aurora Global Database**
  - PostgreSQL engine
  - Strong consistency configuration
  - Primary in us-east-1
  - Read replicas in eu-west-1 and ap-southeast-1
  - Automated backups and point-in-time recovery

- **DynamoDB Global Tables**
  - Session management data
  - Multi-region replication
  - On-demand capacity mode
  - Point-in-time recovery enabled

- **ElastiCache Redis Global Datastore**
  - Distributed caching layer
  - Primary in us-east-1
  - Secondary clusters in eu-west-1 and ap-southeast-1
  - Automatic failover

### 5. API & Serverless

- **API Gateway**
  - Regional REST APIs
  - Custom domain names
  - Mutual TLS authentication
  - Usage plans and API keys
  - Request validation

- **Lambda Functions**
  - Runtime: Java 17
  - Transaction processing handlers
  - Provisioned concurrency for low latency
  - VPC integration
  - Environment variables from Secrets Manager

### 6. Fraud Detection & Transaction Processing

- **Amazon Fraud Detector**
  - Real-time fraud scoring
  - Custom fraud detection models
  - Integration with transaction processing

- **Step Functions**
  - Complex financial workflow orchestration
  - State machines for transaction approval
  - Error handling and retry logic

### 7. Message Queuing & Event Streaming

- **SQS FIFO Queues**
  - Transaction ordering guarantee
  - Exactly-once processing
  - Message deduplication

- **Kinesis Data Streams**
  - Transaction log streaming
  - Real-time data ingestion
  - Multiple shards for parallelism

- **Kinesis Data Firehose**
  - Streaming data to S3 data lake
  - Data transformation
  - Automatic compression and encryption

- **EventBridge**
  - Cross-region event routing
  - Event buses per region
  - Event rules and targets

### 8. Storage & Archival

- **S3 Buckets**
  - Transaction archive storage
  - S3 Object Lock for WORM compliance
  - Versioning enabled
  - Lifecycle policies
  - Cross-region replication
  - Server-side encryption

### 9. Monitoring & Observability

- **CloudWatch**
  - Cross-region dashboards
  - Log groups for all services
  - Metric alarms
  - Log Insights queries

- **X-Ray**
  - Distributed tracing across microservices
  - Service maps
  - Trace analysis

- **SNS Topics**
  - Alert notifications
  - Multi-protocol subscriptions (email, SMS, Lambda)

### 10. Compliance & Audit

- **CloudTrail**
  - Organization trail
  - Log file validation
  - S3 bucket for log storage
  - Multi-region logging

- **AWS Config**
  - Configuration recording
  - PCI-DSS compliance rules
  - Automated remediation

### 11. Security Services

- **GuardDuty**
  - Threat detection across all regions
  - Integration with Security Hub

- **Security Hub**
  - Centralized security posture management
  - Security standards (PCI-DSS, CIS)
  - Automated compliance checks

- **WAF (Web Application Firewall)**
  - Managed rule groups
  - Rate limiting rules
  - IP reputation lists
  - Custom rule sets for banking security

### 12. Secrets & Key Management

- **Secrets Manager**
  - Database credentials
  - API keys
  - Cross-region secret replication
  - Automatic rotation

- **KMS (Key Management Service)**
  - Multi-region keys
  - Customer managed keys
  - Key policies for least privilege
  - Encryption for all data at rest

### 13. Identity & Access Management

- **Amazon Cognito**
  - User pools for customer authentication
  - Identity pools for AWS resource access
  - Advanced security features:
    - Adaptive authentication
    - Compromised credentials detection
    - Account takeover protection
  - Multi-factor authentication (MFA)
  - Custom authentication flows

- **Certificate Manager**
  - TLS/SSL certificates
  - Automatic renewal
  - Certificates per region for ALB and API Gateway

### 14. Backup & Disaster Recovery

- **AWS Backup**
  - Centralized backup management
  - Cross-region backup copying
  - Backup plans for:
    - Aurora databases
    - DynamoDB tables
    - EFS file systems
  - Point-in-time recovery

- **Disaster Recovery Automation**
  - Lambda functions for automated failover
  - Route 53 health check based failover
  - Runbook automation using Systems Manager

## Implementation Guidelines


### Code Structure

```typescript
// Organize Pulumi code into logical modules:
// - network/
// - compute/
// - database/
// - security/
// - monitoring/
// - serverless/
// - storage/
```

### Deployment Strategy

1. Deploy network infrastructure first (VPC, Transit Gateway)
2. Deploy security foundations (KMS, Secrets Manager, IAM)
3. Deploy data tier (Aurora, DynamoDB, ElastiCache)
4. Deploy compute tier (ECS, Lambda, App Mesh)
5. Deploy API Gateway and load balancers
6. Configure monitoring and security services
7. Enable backup and disaster recovery

### Configuration Management

- Use Pulumi stack configurations for environment-specific values
- Store sensitive values in Pulumi secrets
- Use stack references for cross-stack dependencies
- Tag all resources with environment, project, and compliance tags

### Security Best Practices

- Enable encryption at rest for all data stores
- Enable encryption in transit with TLS 1.2+
- Implement least privilege IAM policies
- Enable MFA delete on S3 buckets
- Use VPC endpoints for AWS service access
- Implement network segmentation
- Enable audit logging for all services

### Compliance Requirements

- PCI-DSS compliance controls
- Data residency considerations per region
- Audit trail retention (7 years minimum)
- Segregation of duties
- Change management workflows

## Expected Deliverables

1. Complete Pulumi TypeScript code
2. README with deployment instructions
3. Architecture diagram
4. Security compliance documentation
5. Disaster recovery runbook
6. Monitoring and alerting setup guide

## Success Criteria

- Multi-region deployment with automatic failover
- < 100ms latency for API Gateway requests
- 99.99% availability SLA
- All PCI-DSS compliance checks passing
- Complete audit trail for all transactions
- Real-time fraud detection operational
- Cross-region data replication < 1 second