Hey team,

We have an urgent project to migrate a payment processing system from our on-premises datacenter to AWS. The business critical requirement here is zero downtime during the migration. The legacy monolithic application that currently handles credit card transactions needs to be modernized as part of this move, but we cannot afford any service interruption.

The finance team is understandably nervous about this migration given the sensitive nature of payment data and the revenue impact if anything goes wrong. We need a solid rollback strategy and the ability to shift traffic gradually between the old and new environments. The CTO has made it clear that we need continuous data synchronization during the migration window and comprehensive monitoring to catch any issues immediately.

This is a complex migration involving multiple AWS services working together. We need database replication running continuously, load balancing configured for gradual traffic shifting, and proper VPC connectivity between our migration environment and the existing production network. The infrastructure also needs to handle static asset migration from our on-premises NFS storage to S3.

## What we need to build

Create a migration infrastructure using **CloudFormation with JSON** that enables zero-downtime migration of the payment processing system from on-premises to AWS.

### Core Requirements

1. **Database Tier**
   - RDS Aurora MySQL cluster with 2 instances across multiple availability zones for high availability
   - Enable point-in-time recovery with 7-day retention period
   - Database must support continuous replication from on-premises source

2. **Data Migration Services**
   - DMS replication instance configured for continuous data synchronization
   - DMS replication tasks to keep source and target databases in sync during migration
   - DataSync locations and tasks configured for migrating static assets from on-premises NFS to S3

3. **Traffic Management**
   - Application Load Balancer with target groups supporting blue-green deployment strategy
   - Route 53 hosted zone with weighted routing policies to enable 0-100% traffic split between environments
   - Gradual traffic shifting capability for controlled rollover

4. **Network Architecture**
   - VPC peering connection between migration VPC (10.0.0.0/16) and production VPC (10.1.0.0/16)
   - Proper subnet configuration across 3 availability zones with public and private subnets
   - Security groups configured for database, application, and load balancer tiers

5. **Security and Secrets Management**
   - Store all database passwords and sensitive parameters in Systems Manager Parameter Store
   - Use KMS encryption for all parameters stored in Parameter Store
   - No hardcoded credentials anywhere in the infrastructure

6. **Monitoring and Compliance**
   - CloudWatch dashboard with custom metrics for DMS replication lag
   - CloudWatch metrics for RDS performance monitoring
   - AWS Config rules to validate compliance requirements during migration

7. **Optional Enhancements**
   - AWS Lambda functions for automated traffic shifting based on error rate thresholds
   - SQS queues for decoupling payment processing components and improving scalability
   - AWS Backup configuration for automated cross-region backups providing disaster recovery capability

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS Aurora MySQL** for the database tier
- Use **DMS** for continuous database replication from on-premises
- Use **Application Load Balancer** for traffic distribution
- Use **Route 53** for DNS-based weighted routing and traffic shifting
- Use **DataSync** for migrating static files to S3
- Use **Systems Manager Parameter Store** with **KMS** encryption for secrets
- Use **CloudWatch** for monitoring and dashboards
- Use **AWS Config** for compliance validation
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention using CloudFormation Fn::Sub intrinsic function
- Deploy to **us-east-1** region
- All resources must be destroyable after testing (no Retain deletion policies)

### Deployment Requirements

- All named resources must use EnvironmentSuffix parameter for uniqueness
- Use CloudFormation Fn::Sub function: !Sub "resource-name-${EnvironmentSuffix}"
- No DeletionPolicy: Retain or UpdateReplacePolicy: Retain allowed
- No DeletionProtection enabled on any resources
- All resources must be fully destroyable for testing and validation

### Constraints

- VPC peering must connect migration VPC 10.0.0.0/16 with production VPC 10.1.0.0/16
- Aurora cluster must span multiple availability zones for high availability
- Point-in-time recovery required with minimum 7-day backup retention
- All database credentials stored in Parameter Store with SecureString type
- DMS replication must support continuous sync capability
- Route 53 weighted routing must support values from 0 to 100 for gradual traffic shifts
- CloudWatch dashboard must include DMS replication lag and RDS CPU/connection metrics
- Include proper error handling and logging for all components

## Success Criteria

- Functionality: Complete zero-downtime migration capability with continuous data sync and gradual traffic shifting
- Performance: Database replication lag under 5 seconds, load balancer health checks passing
- Reliability: Multi-AZ Aurora cluster providing automatic failover
- Security: All secrets encrypted in Parameter Store with KMS, no hardcoded credentials
- Resource Naming: All resources include EnvironmentSuffix parameter for uniqueness
- Code Quality: Valid JSON CloudFormation template, well-structured, properly documented
- Destroyability: All resources can be deleted cleanly without retention policies blocking cleanup

## What to deliver

- Complete CloudFormation template in JSON format with all core requirements
- RDS Aurora MySQL cluster configured for multi-AZ high availability
- DMS replication instance and tasks for continuous data synchronization
- Application Load Balancer and target groups for blue-green deployment
- Route 53 hosted zone with weighted routing policies
- VPC peering connection between migration and production VPCs
- DataSync configuration for S3 migration from on-premises NFS
- Systems Manager Parameter Store integration with KMS encryption
- CloudWatch dashboard with DMS and RDS metrics
- AWS Config rules for compliance validation
- Parameters for customization including EnvironmentSuffix, traffic weights, and VPC CIDRs
- Outputs exposing database endpoints, load balancer DNS, and monitoring dashboard URL
- Documentation with deployment instructions and architecture overview
