# Payment Processing System Migration to AWS

Hey team,

We need to migrate our fintech startup's payment processing infrastructure from our legacy on-premises datacenter to AWS. This is a critical migration that needs to happen with minimal downtime during the migration window. I've been asked to create this infrastructure using **CDKTF with Python**. The business wants a phased migration approach that allows us to run both environments in parallel and gradually shift traffic while maintaining the ability to quickly rollback if we hit any issues.

The current setup uses dedicated database servers, application clusters, and load balancers in our on-premises datacenter. We need to replicate this architecture in AWS while adding modern cloud capabilities like auto-scaling and better monitoring. The architecture needs to support two distinct Terraform workspaces - one for the legacy sync environment and another for AWS production.

The migration strategy involves using AWS Database Migration Service to replicate our database to Aurora MySQL, while Route 53 weighted routing will let us gradually shift traffic from on-premises to AWS. We need comprehensive monitoring to track migration metrics and replication lag so we can make informed decisions during the cutover.

## What we need to build

Create a payment processing infrastructure using **CDKTF with Python** for migrating from on-premises to AWS with phased rollout capability.

### Core Requirements

1. **Multi-Environment Configuration**
   - Define separate Terraform workspaces for 'legacy-sync' and 'aws-production' environments
   - Support workspace-based configuration management
   - Resource names must include environmentSuffix for uniqueness across workspaces

2. **Network Infrastructure**
   - Create VPC in us-east-1 with 3 private subnets and 3 public subnets across different availability zones
   - Reference existing VPN connection to on-premises network using data sources
   - Proper routing tables and internet gateway configuration

3. **Database Tier**
   - Deploy RDS Aurora MySQL cluster with one writer instance and two reader instances
   - Configure for high availability across multiple AZs
   - Appropriate security groups and parameter groups

4. **Compute and Load Balancing**
   - Set up Auto Scaling group with minimum 3 and maximum 9 EC2 instances
   - Deploy Application Load Balancer in public subnets
   - Configure health checks and target groups

5. **Database Migration**
   - Configure AWS DMS replication instance for database migration
   - Set up DMS tasks for continuous replication from on-premises to Aurora
   - Monitor replication lag and migration status

6. **Traffic Management**
   - Implement Route 53 weighted routing policies for gradual traffic migration
   - Support progressive traffic shifting from on-premises to AWS

7. **Monitoring and Observability**
   - Create CloudWatch dashboards showing migration metrics and replication lag
   - Set up alarms for critical metrics
   - Automated health checks for all components

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider constructs from cdktf_cdktf_provider_aws
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Python type hints and proper construct patterns
- Follow Python naming conventions (snake_case)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or RemovalPolicy.RETAIN)
- Use RemovalPolicy.DESTROY or equivalent for all stateful resources
- Include environmentSuffix parameter in all resource names for uniqueness
- Support Terraform workspace-based environment isolation

### Constraints

- Must support quick rollback capability if migration issues arise
- Minimal downtime during migration window
- Secure communication between on-premises and AWS via VPN
- All database credentials must use secure parameter stores
- Auto Scaling must maintain minimum capacity during migration
- Include proper error handling and logging
- Requires Terraform 1.5+ and AWS CLI with appropriate IAM permissions

## Success Criteria

- Functionality: Complete infrastructure supporting phased migration with parallel environments
- Performance: Auto Scaling responds to load, RDS handles production traffic
- Reliability: High availability across multiple AZs, automated health checks
- Security: Secure VPN connectivity, encrypted data in transit and at rest
- Resource Naming: All resources include environmentSuffix for workspace isolation
- Code Quality: Clean Python code with type hints, well-tested, documented
- Monitoring: Comprehensive CloudWatch dashboards for migration tracking
- Migration: DMS successfully replicates data with minimal lag

## What to deliver

- Complete CDKTF Python implementation with workspace support
- VPC with public and private subnets across 3 AZs
- RDS Aurora MySQL cluster (1 writer, 2 readers)
- Auto Scaling group (min 3, max 9) behind Application Load Balancer
- AWS DMS replication instance and tasks
- Route 53 weighted routing configuration
- CloudWatch dashboards and alarms
- Data source references to existing VPN connection
- Outputs for ALB DNS name, RDS cluster endpoint, and DMS replication status
- Unit tests for all components
- Documentation and deployment instructions
