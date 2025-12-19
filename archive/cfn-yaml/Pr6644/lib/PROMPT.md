# Deploy Highly Available Aurora Global Database

Hey team,

We've been asked to build a mission-critical database infrastructure for a financial services company that's dealing with transaction processing across multiple regions. They need absolute confidence that even if an entire AWS region goes down, their database stays up with minimal data loss. This is the kind of system where downtime is measured in millions of dollars per minute, so we need to get it right.

The business wants a solution that spans us-east-1 as the primary region and us-west-2 for disaster recovery. They need automated failover capabilities, point-in-time recovery, and the ability to backtrack if something goes wrong. We're talking about strict RPO/RTO requirements here, so every detail matters.

I've been asked to create this infrastructure using **CloudFormation with YAML**. The architecture needs to demonstrate AWS best practices for high availability and disaster recovery while keeping operations simple enough for their team to manage.

## What we need to build

Create a highly available Aurora Global Database using **CloudFormation with YAML** for multi-region transaction processing with automated disaster recovery capabilities.

### Core Requirements

1. **Aurora Global Database Architecture**
   - Primary Aurora cluster in us-east-1 region
   - Secondary Aurora cluster in us-west-2 for disaster recovery
   - Use Aurora MySQL 5.7 compatible engine
   - Deploy with db.r5.large instance class
   - Configure writer and reader endpoints in primary region
   - Enable cross-region replication with lag monitoring

2. **Data Protection and Recovery**
   - Enable automated backups with 35-day retention period
   - Configure backtrack with 24-hour window for quick recovery
   - Implement point-in-time recovery with 5-minute granularity
   - Set deletion_protection to true for all database instances
   - Enable copy_tags_to_snapshot for consistent tagging

3. **Security and Encryption**
   - Implement KMS encryption using customer-managed keys
   - Separate KMS keys for each region (us-east-1 and us-west-2)
   - Enable storage encryption at rest
   - Configure secure VPC networking with private subnets
   - Deploy across 3 Availability Zones in each region

4. **High Availability Configuration**
   - Configure automatic failover with promotion tier priorities
   - Set up Multi-AZ deployment for primary cluster
   - Enable enhanced monitoring with 10-second intervals
   - Create CloudWatch alarms for replication lag
   - Monitor cluster health and performance metrics

5. **Infrastructure Outputs**
   - Export connection strings for writer and reader endpoints
   - Provide clear failover instructions for operations team
   - Document manual promotion procedures for secondary region
   - Output monitoring dashboard URLs
   - Include KMS key ARNs for both regions

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **Aurora MySQL** for the global database cluster
- Use **RDS** service for cluster and instance management
- Use **KMS** for encryption key management in both regions
- Use **CloudWatch** for monitoring and alerting
- Resource names must include **EnvironmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- Deploy primary cluster to **us-east-1** region
- Deploy secondary cluster to **us-west-2** region
- All resources must be destroyable (no DeletionPolicy: Retain)

### Optional Enhancements

- Add **Lambda** function for automated failover testing (enables regular DR drills)
- Implement **SNS** notifications for replication lag alerts (improves incident response)
- Create **Route 53** health checks for automatic DNS failover (reduces RTO)

### Constraints

- Use Aurora Global Database with at least one secondary region
- Configure automatic failover with promotion tier priorities
- Enable backtrack capability with minimum 24-hour window
- Implement point-in-time recovery with 5-minute granularity
- Set up cross-region read replicas with lag monitoring
- Configure automated backups with 35-day retention
- Use KMS encryption with customer-managed keys in each region
- Enable enhanced monitoring with 10-second granularity
- Configure deletion protection on all production instances
- All resources must support clean teardown for testing

## Success Criteria

- **Functionality**: Aurora Global Database deployed across two regions with active replication
- **Performance**: Replication lag under 1 second for global database
- **Reliability**: Automatic failover capability with clear promotion procedures
- **Security**: KMS encryption enabled with customer-managed keys in both regions
- **Monitoring**: Enhanced monitoring configured with 10-second intervals
- **Resource Naming**: All resources include EnvironmentSuffix parameter for uniqueness
- **Recovery**: 35-day backup retention with 24-hour backtrack window
- **Documentation**: Clear connection strings and failover instructions provided

## What to deliver

- Complete **CloudFormation YAML** template implementation
- Primary Aurora cluster in us-east-1 with writer/reader instances
- Secondary Aurora cluster in us-west-2 for disaster recovery
- KMS keys for encryption in both regions
- Enhanced monitoring and CloudWatch alarms
- Comprehensive outputs with connection strings and failover instructions
- Clear documentation for operations team
