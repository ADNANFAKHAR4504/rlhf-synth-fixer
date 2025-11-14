# Active-Passive Disaster Recovery Infrastructure

Hey team,

We need to build a disaster recovery solution for our payment processing system. Last quarter, we had a 4-hour outage in our primary region that resulted in significant revenue loss and customer impact. The business has asked us to set up a multi-region infrastructure with data replication capabilities.

I've been asked to implement this using **Pulumi with Python**. We need active-passive DR spanning us-east-1 as the primary region and us-east-2 as the disaster recovery region. The focus is on getting the infrastructure components properly deployed and tested.

The immediate priority is getting the core infrastructure automated with proper multi-region setup. We can iterate on advanced features like automated health checks and custom domains in future phases.

## What we need to build

Create a disaster recovery infrastructure using **Pulumi with Python** that spans two AWS regions (us-east-1 as primary, us-east-2 as DR) for a payment processing system.

### Core Requirements

1. **Database Tier - Aurora PostgreSQL Global Database**
   - Primary cluster in us-east-1
   - Secondary cluster in us-east-2 (part of global database)
   - Automated backups with 7-day retention
   - Resource names must include environmentSuffix for uniqueness

2. **Compute Tier - Lambda Functions**
   - Deploy identical payment processing Lambda functions in both regions
   - Configure IAM roles for Lambda execution
   - Functions should be deployable in both regions

3. **API Layer - API Gateway REST APIs**
   - Configure REST APIs in both us-east-1 and us-east-2
   - POST endpoint for payment processing
   - APIs should be identical in configuration

4. **DNS - Route 53**
   - Create hosted zone for DNS management
   - DNS records pointing to both regional API Gateway endpoints
   - Basic DNS configuration for both regions

5. **Object Storage - S3**
   - S3 buckets in both us-east-1 and us-east-2
   - Encryption at rest enabled (AES256)
   - Versioning enabled for both buckets

6. **Session State - DynamoDB Global Tables**
   - Global table for session state management
   - Replicas in both us-east-1 and us-east-2
   - Pay-per-request billing mode

7. **Monitoring**
   - CloudWatch dashboard aggregating metrics from both regions
   - SNS topics in both regions for notifications

8. **Networking**
   - VPCs in both regions with private subnets for databases
   - VPC configuration for Lambda functions
   - Security groups for Aurora and Lambda

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use Pulumi's ComponentResource pattern to organize regional deployments
- Primary region: us-east-1
- DR region: us-east-2
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Organize code into separate modules for primary region, DR region, and global resources

### AWS Services Required

- Amazon Aurora PostgreSQL (Global Database)
- AWS Lambda
- Amazon API Gateway
- Amazon Route 53
- Amazon S3
- Amazon DynamoDB (Global Tables)
- Amazon CloudWatch
- Amazon SNS
- AWS IAM
- Amazon VPC

### Constraints

- Primary region must be us-east-1, DR region must be us-east-2
- Use Aurora Global Database for cross-region database replication
- All Lambda functions must be deployed to both regions
- CloudWatch dashboard should show metrics from both regions
- All resources must be destroyable (no Retain policies or deletion protection)
- Tag all resources with Environment=DR, CostCenter=Operations, and Criticality=High
- S3 buckets must have versioning and encryption enabled

## Success Criteria

- Functionality: Complete active-passive DR setup with all components deployed in both regions
- Multi-Region Setup: Infrastructure successfully deployed to both us-east-1 and us-east-2
- Data Layer: Aurora Global Database with primary and secondary clusters configured
- Session Management: DynamoDB global tables replicate session state across regions
- Monitoring: CloudWatch dashboard shows metrics from both regions
- Security: Encryption enabled for S3 buckets, IAM roles properly configured
- Resource Naming: All resources include environmentSuffix for deployment isolation
- Compliance: Resources tagged with Environment=DR, CostCenter=Operations, Criticality=High
- Code Quality: Python code organized with ComponentResource pattern, well-structured
- Testing: Unit tests covering all major components

## What to deliver

- Complete Pulumi Python program organized with ComponentResource pattern
- Primary region component (primary_region.py) with:
  - Aurora Global Database primary cluster
  - Lambda payment processing functions
  - API Gateway REST API
  - S3 bucket with versioning and encryption
  - VPC and networking
  - IAM roles for Lambda and S3
  - Security groups
  - SNS topic for notifications
  
- DR region component (dr_region.py) with:
  - Aurora secondary cluster (part of global database)
  - Lambda functions (identical to primary)
  - API Gateway REST API
  - S3 bucket with versioning and encryption
  - VPC and networking
  - IAM roles
  - Security groups
  - SNS topic
  
- Global resources component (global_resources.py) with:
  - Route 53 hosted zone and DNS records
  - DynamoDB global table for session state
  - CloudWatch dashboard aggregating both regions
  
- Main stack file (tap_stack.py) orchestrating all components
- Entry point (tap.py) with Pulumi exports
- Unit tests achieving >90% coverage
