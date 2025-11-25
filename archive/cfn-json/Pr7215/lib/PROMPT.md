# Multi-Environment Infrastructure Deployment

Hey team,

We've got a financial services client that's struggling with configuration drift across their dev, staging, and production environments. They need a rock-solid solution to keep their infrastructure consistent across all three environments while still allowing for environment-specific tweaks like instance sizing and access controls. The business is really concerned about compliance and wants everything automated so there's no chance of manual errors creeping in.

The key challenge here is that they're running separate AWS accounts for each environment linked through AWS Organizations, and they need the infrastructure to be identical in structure but flexible enough to handle different resource sizes. Dev should run on smaller instances to save costs, while production needs beefier resources to handle the actual workload.

I've been asked to build this using **CloudFormation with JSON** as the infrastructure definition language. The architecture needs to span multiple regions with us-east-1 as the primary and us-west-2 for disaster recovery.

## What we need to build

Create a comprehensive multi-environment infrastructure system using **CloudFormation with JSON** that deploys identical infrastructure patterns across development, staging, and production environments while maintaining environment-specific configurations.

### Core Requirements

1. **Nested Stack Architecture**
   - Design a master template that orchestrates deployment across environments
   - Create separate nested stack templates for VPC, database, and compute resources
   - Each nested stack should be reusable and parameterized

2. **Environment-Specific Configuration**
   - Create parameter mappings for instance sizes: t3.micro for dev, t3.small for staging, t3.medium for prod
   - Lambda memory allocation: 256MB for dev/staging, 512MB for production
   - Use CloudFormation Conditions to create NAT Gateways only in staging and production (not dev)

3. **Database Infrastructure**
   - Deploy RDS Aurora PostgreSQL clusters with encryption at rest enabled
   - Configure automated backups with minimum 7-day retention
   - Set up read replicas for high availability

4. **Compute and Serverless**
   - Configure Lambda functions with environment-specific memory allocations
   - Use environment variables for all Lambda configuration (no hardcoded values)
   - Ensure proper IAM roles and permissions

5. **Storage and Replication**
   - Set up S3 buckets with intelligent tiering storage class
   - Enable cross-region replication from us-east-1 to us-west-2
   - Configure versioning and lifecycle policies (30-day transition to Glacier)

6. **Networking**
   - Deploy VPC infrastructure with non-overlapping CIDR blocks (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod)
   - Create public and private subnets across 2 availability zones per environment
   - Implement VPC peering between environments with appropriate route tables and security groups

7. **Monitoring and Alerts**
   - Configure CloudWatch Alarms for RDS CPU utilization (threshold: 80%)
   - Set up Lambda error rate monitoring (threshold: 10 errors per minute)
   - Create SNS topics for critical metric alerts

8. **Resource Outputs**
   - Export critical resource ARNs for cross-stack references
   - Output database endpoints for application deployment pipelines
   - Provide VPC and subnet IDs for downstream integrations

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation with public/private subnet architecture
- Use **RDS Aurora PostgreSQL** with encryption and automated backups
- Use **Lambda** for serverless compute workloads
- Use **S3** with intelligent tiering and cross-region replication
- Use **NAT Gateway** conditionally for staging and production only
- Use **CloudWatch** and **SNS** for monitoring and alerting
- Use **CloudFormation StackSets** for cross-region deployment capability
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region with disaster recovery in **us-west-2**

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter in names to ensure uniqueness across deployments
- All resources must be destroyable - use DeletionPolicy: Delete (FORBIDDEN to use Retain)
- RemovalPolicy must be set to DESTROY for all resources
- No resources should prevent stack deletion
- All S3 buckets must allow deletion even with contents (use appropriate bucket policies)
- Database snapshots should not be retained on deletion for test environments

### Constraints

- VPC CIDR blocks must not overlap between environments
- All resources must be tagged with Environment, Project, and CostCenter tags
- RDS storage must be encrypted with automated backups (minimum 7 days retention)
- Lambda functions must use environment variables, never hardcoded configuration
- S3 buckets require versioning enabled and 30-day Glacier lifecycle policies
- Use nested stacks to organize infrastructure logically
- Implement parameter mappings to avoid hardcoding values
- Use CloudFormation Conditions for environment-specific resource creation
- Include proper error handling and CloudWatch logging
- All IAM roles must follow least privilege principle

### Service-Specific Warnings

- RDS Aurora: Ensure DeletionPolicy is set to Delete (not Snapshot) for test deployments to enable clean teardown
- S3 Cross-Region Replication: Requires versioning enabled on both source and destination buckets
- NAT Gateway: Use Conditions to create only in staging/production to reduce costs in dev environment
- VPC Peering: Ensure route tables are updated in both VPCs for bidirectional traffic flow
- Lambda with Node.js 18+: AWS SDK v3 is included by default, do not bundle SDK in deployment package

## Success Criteria

- Functionality: Infrastructure deploys successfully across all three environments with correct resource sizing
- Performance: RDS and Lambda resources sized appropriately for each environment workload
- Reliability: High availability through multi-AZ deployment and automated backups
- Security: All data encrypted at rest and in transit, security groups follow least privilege
- Resource Naming: All resources include environmentSuffix parameter for unique identification
- Monitoring: CloudWatch alarms trigger correctly for RDS CPU and Lambda errors
- Replication: S3 cross-region replication working from us-east-1 to us-west-2
- Code Quality: Clean JSON formatting, well-structured nested stacks, comprehensive documentation

## What to deliver

- Complete CloudFormation JSON implementation with master template
- Nested stack templates for VPC infrastructure (public/private subnets, NAT, security groups)
- Nested stack template for RDS Aurora PostgreSQL cluster with encryption and backups
- Nested stack template for Lambda functions with environment-specific configurations
- Nested stack template for S3 buckets with cross-region replication
- Parameter mappings for environment-specific values (instance types, memory allocations)
- CloudFormation Conditions for conditional resource creation (NAT Gateways)
- CloudWatch Alarms and SNS topics for monitoring
- Comprehensive outputs section with ARNs and endpoints
- Unit tests for template validation
- Documentation including deployment instructions and architecture diagrams
