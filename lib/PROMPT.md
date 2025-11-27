Hey team,

We need to create the infrastructure for the Turn Around Prompt (TAP) platform - a task assignment system that will help manage and distribute tasks across our team. This is a critical component for improving our workflow efficiency and ensuring tasks are properly assigned and tracked.

The TAP platform needs a simple but robust data storage solution that can handle task assignments, status updates, and basic metadata. We want to keep costs low while ensuring high availability and scalability.

## What we need to build

Create a CloudFormation infrastructure using **JSON** that implements the TAP (Turn Around Prompt) stack for task assignment management.

### Core Requirements

1. **Data Storage**
   - DynamoDB table for storing task assignments and related data
   - Simple primary key structure with `id` as the hash key
   - Pay-per-request billing mode for cost optimization
   - Environment-specific table naming

2. **Infrastructure Basics**
   - Single DynamoDB table as the core data store
   - Environment-specific resource naming using `EnvironmentSuffix` parameter
   - Proper CloudFormation outputs for table name and ARN
   - Stack name and environment suffix outputs for integration

3. **Cost Optimization**
   - Use DynamoDB on-demand (pay-per-request) pricing
   - Minimal resource footprint - just the DynamoDB table
   - No provisioned throughput to keep costs low

4. **Operational Requirements**
   - Deletion protection disabled for development flexibility
   - Standard DynamoDB table class
   - Basic table configuration suitable for task management

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

### Deployment Requirements (CRITICAL)

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
