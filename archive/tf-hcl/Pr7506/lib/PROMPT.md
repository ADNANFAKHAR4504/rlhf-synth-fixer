Hey team,

We need to build a robust multi-region disaster recovery architecture for our transaction processing application. This is a critical business requirement to ensure we can maintain operations even if an entire AWS region becomes unavailable. The business has seen too many regional outages lately and wants proper failover capabilities that can kick in automatically.

I've been asked to create this using **Terraform with HCL**. We need to implement active-passive DR across two regions with automatic failover, complete with database replication, backup management, and health monitoring. The goal is to achieve an RTO of under 5 minutes and RPO of under 1 minute.

The architecture needs to handle production transaction loads, which means we can't have single points of failure anywhere. Everything needs to be redundant, monitored, and ready to failover automatically. We also need to make sure we can recover from data corruption or accidental deletions.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Terraform with HCL** for a transaction processing application.

### Core Requirements

1. **Aurora Global Database**
   - Deploy Aurora Global Database spanning two regions (us-east-1 primary, us-west-2 secondary)
   - Primary cluster must have at least one read replica for high availability
   - Secondary region must have at least one read replica
   - Enable automatic failover for the global database
   - Configure appropriate instance sizing for transaction processing workloads

2. **Route 53 Health Checks and DNS Failover**
   - Implement Route 53 health checks for both regional endpoints
   - Configure automatic DNS failover between regions based on health status
   - Set appropriate health check intervals and failure thresholds
   - Use failover routing policy to direct traffic to healthy region

3. **S3 Cross-Region Replication**
   - Configure S3 bucket in primary region with replication to secondary region
   - Enable Replication Time Control (RTC) for 99.99% replication within 15 minutes
   - Configure S3 bucket versioning on both buckets
   - Implement appropriate lifecycle policies
   - Enable encryption for data at rest and in transit

4. **Auto Scaling Compute Resources**
   - Deploy Auto Scaling Groups in both regions
   - Minimum 2 instances per region for high availability
   - Configure launch templates with appropriate instance types
   - Implement proper health checks (EC2 and ELB)
   - Set up scaling policies based on CPU and request metrics

5. **Point-in-Time Recovery**
   - Enable point-in-time recovery for Aurora with 7-day retention
   - Configure automated backups with 7-day retention window
   - Enable continuous backups for DynamoDB if used
   - Ensure all data stores support recovery to any point within retention window

6. **AWS Backup Centralized Management**
   - Create backup vault in each region
   - Configure backup plans for all data stores (Aurora, S3, EC2)
   - Set backup frequency and retention policies
   - Enable cross-region backup copy for additional protection
   - Tag all backup resources appropriately

7. **CloudWatch Cross-Region Monitoring**
   - Implement CloudWatch alarms in both regions
   - Set up cross-region alarm aggregation for failover events
   - Monitor Aurora replication lag between regions
   - Monitor S3 replication metrics
   - Monitor Auto Scaling health and capacity
   - Configure SNS topics for alarm notifications in both regions

8. **Resource Tagging**
   - All resources must include 'Environment' tag
   - All resources must include 'Region' tag
   - All resources must include 'DR-Role' tag (primary/secondary/global)
   - Use consistent tagging scheme across all resources

9. **Terraform Workspace Management**
   - Use Terraform workspaces to manage multi-region deployments
   - Structure code to support workspace-based region selection
   - Document workspace creation and usage patterns
   - Ensure state isolation between workspaces

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora** for global database with automatic failover
- Use **Route 53** for DNS health checks and failover routing
- Use **S3** with RTC-enabled cross-region replication
- Use **EC2 Auto Scaling** with minimum 2 instances per region
- Use **AWS Backup** for centralized backup management
- Use **CloudWatch** for cross-region monitoring and alarms
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-type-environment-suffix`
- Deploy to **us-east-1** (primary) and **us-west-2** (secondary) regions
- All resources must be tagged with Environment, Region, and DR-Role

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no DeletionPolicy: Retain or deletion_protection: true)
- Resource names must include environmentSuffix to avoid collisions: `resource-name-${var.environment_suffix}`
- Set Aurora skip_final_snapshot = true for easy teardown
- Set RDS backup_retention_period = 7 (as specified, not minimum 1)
- Use SSE-S3 encryption for S3 buckets (simpler than KMS for synthetic tasks)
- Include proper error handling and logging
- All configurations must be parameterized through variables

### Constraints

- Multi-region deployment required: us-east-1 (primary) and us-west-2 (secondary)
- Minimum 2 compute instances per region for high availability
- 7-day point-in-time recovery retention for all data stores
- S3 replication must have RTC enabled
- Auto Scaling minimum capacity must be 2 in each region
- All resources must be tagged consistently
- Use Terraform workspaces for region management
- Infrastructure must support automatic failover without manual intervention

## Success Criteria

- **Functionality**: Aurora Global Database replicates successfully between regions with read replicas
- **DNS Failover**: Route 53 automatically fails over to secondary region when primary is unhealthy
- **Data Replication**: S3 replication with RTC achieves sub-15-minute replication times
- **High Availability**: Auto Scaling maintains minimum 2 instances per region
- **Recovery**: All data stores support 7-day point-in-time recovery
- **Backup Management**: AWS Backup successfully backs up resources in both regions
- **Monitoring**: CloudWatch alarms detect and alert on failover events
- **Resource Naming**: All resources include environmentSuffix parameter
- **Tagging**: All resources tagged with Environment, Region, and DR-Role
- **Workspace**: Terraform workspaces successfully isolate multi-region state
- **Destroyability**: All resources can be destroyed without errors
- **Code Quality**: Well-structured HCL, modular design, comprehensive documentation

## What to deliver

- Complete **Terraform HCL** implementation with proper module structure
- Provider configurations for both us-east-1 and us-west-2 regions
- Aurora Global Database with read replicas in both regions
- Route 53 health checks and failover routing configuration
- S3 buckets with RTC-enabled cross-region replication
- Auto Scaling Groups with launch templates in both regions
- AWS Backup vaults and plans for both regions
- CloudWatch alarms and SNS topics for monitoring
- Terraform workspace configuration and documentation
- Variables file with all configurable parameters including environmentSuffix
- Outputs file exposing critical resource identifiers
- README with deployment instructions and workspace usage
- All resources properly tagged with Environment, Region, DR-Role
