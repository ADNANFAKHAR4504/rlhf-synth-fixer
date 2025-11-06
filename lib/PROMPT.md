Hey team,

We need to build a multi-region disaster recovery infrastructure for a payment processing system. A financial services company recently experienced a major outage that caused significant revenue loss, and they need an active-passive DR strategy with automated failover capabilities to maintain payment processing continuity.

The business has set strict requirements for recovery time and point objectives. They need to be able to recover from a complete regional failure in under 15 minutes with less than 5 minutes of data loss. This is critical for maintaining customer trust and regulatory compliance in the financial services industry.

I've been asked to create this in Python using AWS CDK. The infrastructure needs to span two regions: us-east-1 as the primary and us-east-2 as the disaster recovery region. The system should automatically detect failures and failover to the DR region without manual intervention.

## What we need to build

Create a disaster recovery infrastructure using **AWS CDK with Python** for a payment processing system that can automatically failover between regions.

### Core Requirements

1. **Database Layer**
   - Aurora PostgreSQL Global Database with primary cluster in us-east-1 and secondary in us-east-2
   - Support for automatic replication between regions
   - Meet RPO of under 5 minutes

2. **Application Layer**
   - ECS Fargate services in both regions for payment processing
   - Primary region: auto-scaling from 10-50 tasks
   - DR region: minimal capacity (2-50 tasks) for cost optimization
   - Application Load Balancers with target groups in each region

3. **DNS and Routing**
   - Route 53 failover routing policy
   - Health checks for automatic failover detection
   - Automatic DNS update when primary region fails

4. **Serverless Processing**
   - Lambda functions deployed in both regions for payment validation
   - Cross-region invocation capabilities

5. **Storage and Replication**
   - S3 buckets for transaction logs
   - Cross-region replication enabled
   - Versioning and lifecycle policies

6. **Monitoring and Alerting**
   - CloudWatch alarms for database replication lag
   - CloudWatch alarms for ALB health status
   - CloudWatch alarms for ECS task counts
   - SNS topics for failover event notifications

7. **Networking**
   - VPCs in both regions with private subnets across 3 availability zones
   - NAT gateways for outbound connectivity
   - Proper security groups and network ACLs

8. **Identity and Access Management**
   - IAM roles for ECS tasks
   - IAM roles for Lambda functions
   - Cross-region permission policies
   - Least privilege access controls

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon Aurora Global Database** for PostgreSQL replication across regions
- Use **Amazon ECS Fargate** for containerized payment processing applications
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon Route 53** for DNS failover routing with health checks
- Use **AWS Lambda** for payment validation logic
- Use **Amazon S3** with cross-region replication for transaction logs
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **Amazon SNS** for alerting and notifications
- Use **AWS IAM** for access control and permissions
- Use **Amazon VPC** for network isolation in both regions
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy primary region to us-east-1 and DR region to us-east-2
- Use AWS CDK 2.x with Python 3.8 or higher

### Constraints

- RTO (Recovery Time Objective) must be under 15 minutes
- RPO (Recovery Point Objective) must be under 5 minutes
- Primary region: us-east-1
- DR region: us-east-2
- Route 53 health checks must trigger automatic failover
- Aurora Global Database handles data replication
- S3 cross-region replication must be enabled
- Lambda functions must be deployed to both regions
- CloudWatch alarms must trigger SNS notifications
- DR region should run minimal capacity until failover for cost optimization
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging
- Use encryption at rest and in transit
- Follow security best practices with least privilege IAM policies

## Success Criteria

- Functionality: Complete multi-region DR infrastructure that supports automatic failover from us-east-1 to us-east-2
- Performance: RTO under 15 minutes, RPO under 5 minutes
- Reliability: Automated health checks and failover without manual intervention
- Security: Encryption enabled, least privilege IAM roles, network isolation
- Cost Optimization: DR region runs minimal capacity (2 tasks) until failover
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Python code following best practices, well-structured, documented

## What to deliver

- Complete AWS CDK Python implementation spanning two regions
- Aurora Global Database (PostgreSQL) with primary and secondary clusters
- ECS Fargate services with auto-scaling in both regions
- Application Load Balancers in both regions
- Route 53 failover routing with health checks
- Lambda functions for payment validation in both regions
- S3 buckets with cross-region replication
- CloudWatch alarms and SNS topics for monitoring
- IAM roles and policies for cross-region access
- VPC infrastructure in both regions
- Documentation explaining the DR strategy and failover process
- Deployment instructions for both regions
