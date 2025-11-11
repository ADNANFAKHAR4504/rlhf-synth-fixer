# Blue-Green Deployment for Payment Processing Migration

Hey team,

We have a fintech startup that needs to migrate their payment processing infrastructure from an on-premises datacenter to AWS without any downtime. They're handling 50,000 transactions daily with strict PCI-DSS compliance requirements. The business team is asking for a blue-green deployment strategy where we can gradually shift traffic between the old environment and the new one with the ability to rollback instantly if something goes wrong.

The current on-premises system is showing its age with limited scalability during peak hours. The leadership wants to move to AWS but cannot afford any service disruption during the migration. They need both environments running in parallel, with the ability to sync data incrementally from blue to green, test thoroughly in the green environment, then gradually shift customer traffic over.

I've been asked to create this infrastructure using **Pulumi with TypeScript**. The solution needs to handle the complete migration process with proper isolation between environments, automated data synchronization, and the ability to route traffic based on weighted policies.

## What we need to build

Create a blue-green deployment infrastructure using **Pulumi with TypeScript** for migrating a payment processing system from on-premises to AWS with zero downtime and rollback capabilities.

### Core Requirements

1. **Network Architecture**
   - Create separate VPCs for blue environment (current on-premises mirror) and green environment (new AWS-native)
   - Deploy VPCs across at least 3 availability zones for high availability
   - Connect both VPCs using Transit Gateway for secure inter-environment communication
   - Configure VPC endpoints for S3 and DynamoDB to avoid internet routing
   - Set up private subnets for all application and database tiers

2. **Database Layer**
   - Deploy Aurora PostgreSQL 14.6 clusters in both blue and green environments
   - Enable automated failover with Multi-AZ deployment
   - Implement encryption at rest using customer-managed KMS keys
   - Configure automated backups with point-in-time recovery
   - Set up read replicas for scaling read traffic

3. **Application Services**
   - Deploy ECS Fargate services with task definitions for three microservices:
     - Payment API service
     - Transaction processor service
     - Reporting service
   - Configure auto-scaling based on CPU and memory utilization
   - Use AWS Secrets Manager for database credentials with 30-day rotation
   - Configure environment variables through AWS Systems Manager Parameter Store

4. **Load Balancing and Routing**
   - Set up Application Load Balancers in each environment
   - Implement path-based routing for different service endpoints
   - Configure health checks with appropriate thresholds
   - Enable connection draining for graceful service updates
   - Apply AWS WAF rules to protect against SQL injection and XSS attacks

5. **Data Storage**
   - Create S3 buckets for transaction logs with versioning enabled
   - Create S3 buckets for compliance documents with lifecycle policies
   - Enforce SSL/TLS for all S3 requests through bucket policies
   - Enable S3 encryption at rest with SSE-S3
   - Configure lifecycle transitions to Glacier for long-term retention

6. **Session Management and Rate Limiting**
   - Deploy DynamoDB tables for session management with global secondary indexes
   - Create DynamoDB table for API rate limiting with TTL enabled
   - Use on-demand billing mode for automatic scaling
   - Enable point-in-time recovery for all tables
   - Configure DynamoDB Streams for change data capture

7. **Data Migration**
   - Create Lambda functions to sync data from blue to green environment
   - Implement incremental sync logic to minimize data transfer
   - Handle schema transformations during migration
   - Configure retry logic with exponential backoff
   - Log all migration activities to CloudWatch

8. **Traffic Management**
   - Set up Route 53 weighted routing policies for gradual traffic shifting
   - Configure weighted distribution (start at 90% blue, 10% green)
   - Enable health checks to automatically route away from unhealthy environments
   - Implement DNS failover to blue environment if green fails

9. **Monitoring and Alerting**
   - Create CloudWatch dashboards showing:
     - Transaction throughput and latency metrics
     - Error rates per service
     - Database performance metrics
     - Migration progress indicators
   - Set up SNS topics for alert notifications
   - Configure CloudWatch alarms for:
     - High error rates (>1% over 5 minutes)
     - Database connection pool exhaustion
     - Migration job failures
     - ECS service health issues

10. **Security and Compliance**
    - Configure AWS Config rules to monitor PCI-DSS compliance
    - Implement IAM roles with least privilege access for all services
    - Enable cross-account role assumption for migration tooling
    - Set up CloudWatch Logs retention of 90 days for audit compliance
    - Configure AWS WAF rate limiting rules on ALB (10,000 req/sec)

11. **Network Security**
    - Configure security groups with minimal required ingress/egress rules
    - Use VPC Flow Logs for network traffic monitoring
    - Enable GuardDuty for threat detection (manual account-level setup)
    - Implement NACLs for additional network layer protection

12. **Resource Management**
    - Apply consistent tagging across all resources:
      - Environment: blue or green
      - Service: payment-processing
      - ManagedBy: Pulumi
      - CostCenter: fintech-migration
    - Resource names must include **environmentSuffix** for uniqueness
    - Follow naming convention: {resource-type}-{env}-{environmentSuffix}

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation across 3+ availability zones
- Use **Transit Gateway** for inter-VPC communication
- Use **Aurora PostgreSQL 14.6** for transaction database with encryption
- Use **ECS Fargate** for containerized microservices
- Use **Application Load Balancer** with WAF protection
- Use **S3** for document storage with versioning and encryption
- Use **DynamoDB** for session management with GSIs
- Use **Lambda** for data migration with Node.js 18.x runtime
- Use **Route 53** for weighted traffic routing
- Use **AWS Secrets Manager** for credential management with rotation
- Use **AWS Systems Manager Parameter Store** for non-sensitive configuration
- Use **CloudWatch** for dashboards, logs, and alarms
- Use **SNS** for alert notifications
- Use **AWS Config** for compliance monitoring
- Use **AWS WAF** for application protection
- Use **KMS** for encryption key management
- Use **IAM** for access control with least privilege
- Deploy to **eu-central-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-{env}-environmentSuffix

### Constraints

- All resources must include a string suffix (environmentSuffix) for unique naming
- Aurora PostgreSQL must use customer-managed KMS keys for encryption
- Deploy in at least 3 availability zones for high availability
- Secrets Manager must rotate database credentials every 30 days
- S3 bucket policies must enforce SSL/TLS for all requests
- VPC endpoints required for S3 and DynamoDB (no internet routing)
- Transit Gateway required for network isolation between environments
- AWS Config rules must monitor compliance with security policies
- CloudWatch Logs retention must be exactly 90 days for audit compliance
- AWS WAF must have rate limiting rules on the ALB
- IAM roles must follow principle of least privilege
- All resources must be destroyable (no Retain deletion policies)
- ECS tasks must fetch secrets from Secrets Manager, not create new secrets
- Lambda functions must use Node.js 18.x runtime
- DynamoDB must use on-demand billing mode for automatic scaling
- No GuardDuty resources in code (account-level service - manual setup only)

## Success Criteria

- **Functionality**: Complete blue-green infrastructure with all specified services deployed
- **Migration Support**: Lambda functions enable incremental data sync from blue to green
- **Traffic Control**: Route 53 weighted routing allows gradual traffic shifting
- **Rollback Capability**: Can revert to blue environment by adjusting Route 53 weights
- **Security**: PCI-DSS compliant with encryption, WAF protection, and least-privilege IAM
- **Monitoring**: CloudWatch dashboards show real-time transaction metrics and migration status
- **High Availability**: Multi-AZ deployment with automated failover across 3+ zones
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Cost Optimization**: Serverless components (Lambda, Aurora Serverless v2 preferred) where possible
- **Code Quality**: TypeScript implementation with proper typing, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- Separate VPC configurations for blue and green environments
- Transit Gateway connecting both environments
- Aurora PostgreSQL clusters in both environments with failover
- ECS Fargate services for payment API, transaction processor, and reporting
- Application Load Balancers with WAF rules and health checks
- S3 buckets for transaction logs and compliance documents
- DynamoDB tables for sessions and rate limiting with GSIs
- Lambda functions for data migration in lib/lambda/
- Route 53 weighted routing configuration
- CloudWatch dashboards, alarms, and SNS topics
- IAM roles and policies for all services
- Stack outputs: ALB endpoints, database connection strings, dashboard URL
- Unit tests for all Pulumi components
- Integration tests verifying the complete infrastructure
- Documentation with deployment and migration instructions