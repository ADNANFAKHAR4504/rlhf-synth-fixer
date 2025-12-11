Hey team,

We need to build a highly available infrastructure for a payment processing system in a single region. A financial services company needs a robust, production-ready setup with multi-AZ deployment to maintain payment processing continuity and meet their availability SLAs.

The business has set strict requirements for availability and data durability. They need a system that can handle regional availability zone failures while maintaining operations with less than 5 minutes of data loss. This is critical for maintaining customer trust and regulatory compliance in the financial services industry.

I've been asked to create this in Python using AWS CDK. The infrastructure needs to be deployed to us-east-1 with resources distributed across multiple availability zones for high availability.

## What we need to build

Create a highly available infrastructure using **AWS CDK with Python** for a payment processing system with multi-AZ deployment in us-east-1.

### Core Requirements

1. **Database Layer**
   - Aurora PostgreSQL cluster in us-east-1 with multi-AZ deployment
   - Support for automatic failover between availability zones
   - Meet RPO of under 5 minutes with automated backups

2. **Application Layer**
   - ECS Fargate services in us-east-1 for payment processing
   - Auto-scaling from 10-50 tasks based on demand
   - Application Load Balancer with target groups across multiple AZs

3. **Serverless Processing**
   - Lambda functions deployed in region us-east-1 for payment validation
   - Cross-AZ availability

4. **Storage**
   - S3 buckets for transaction logs
   - Versioning and lifecycle policies
   - Server-side encryption enabled

5. **Monitoring and Alerting**
   - CloudWatch alarms for database replication lag
   - CloudWatch alarms for ALB health status
   - CloudWatch alarms for ECS task counts
   - SNS topics for alert notifications

6. **Networking**
   - VPC in us-east-1 with private subnets across 3 availability zones
   - NAT gateways for outbound connectivity
   - Proper security groups and network ACLs

7. **Identity and Access Management**
   - IAM roles for ECS tasks
   - IAM roles for Lambda functions
   - Least privilege access controls

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **Amazon Aurora PostgreSQL** with multi-AZ deployment
- Use **Amazon ECS Fargate** for containerized payment processing applications
- Use **Application Load Balancer** for traffic distribution across AZs
- Use **AWS Lambda** for payment validation logic
- Use **Amazon S3** with versioning for transaction logs
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **Amazon SNS** for alerting and notifications
- Use **AWS IAM** for access control and permissions
- Use **Amazon VPC** for network isolation with multi-AZ subnets
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy all resources to us-east-1
- Use AWS CDK 2.x with Python 3.8 or higher

### Constraints

- RPO (Recovery Point Objective) must be under 5 minutes
- Region: us-east-1
- Aurora must support multi-AZ automatic failover
- S3 versioning must be enabled
- Lambda functions must be deployed with proper IAM roles
- CloudWatch alarms must trigger SNS notifications
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging
- Use encryption at rest and in transit
- Follow security best practices with least privilege IAM policies
- Use 3 availability zones for high availability

## Success Criteria

- Functionality: Complete highly available infrastructure in us-east-1 with multi-AZ deployment
- Performance: RPO under 5 minutes with automated backups
- Reliability: Automated health checks and multi-AZ failover
- Security: Encryption enabled, least privilege IAM roles, network isolation
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Python code following best practices, well-structured, documented
- High Availability: Resources distributed across 3 availability zones

## What to deliver

- Complete AWS CDK Python implementation for us-east-1
- Aurora PostgreSQL cluster with multi-AZ deployment
- ECS Fargate services with auto-scaling (10-50 tasks)
- Application Load Balancer with multi-AZ target groups
- Lambda functions for payment validation
- S3 buckets with versioning enabled
- CloudWatch alarms and SNS topics for monitoring
- IAM roles and policies with least privilege
- VPC infrastructure with 3 availability zones
- Documentation explaining the high availability strategy
- Deployment instructions for us-east-1
