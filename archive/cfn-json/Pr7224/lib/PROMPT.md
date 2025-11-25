# Aurora Global Database for Disaster Recovery

Hey team,

We need to build a robust disaster recovery solution for our critical database workloads. The business has asked us to implement an Aurora Global Database that can survive regional failures and provide fast recovery capabilities. I've been asked to create this infrastructure using CloudFormation in JSON format.

The main goal here is to ensure business continuity even if an entire AWS region goes down. Aurora Global Database gives us cross-region replication with low latency and the ability to promote a secondary region to primary in under a minute during a disaster. This is critical for our production systems that can't afford extended downtime.

We've seen some challenges with similar implementations before - things like empty subnet arrays, wrong service types (regular Aurora vs Global), and circular dependencies between Route 53 and monitoring resources. We need to be extra careful to avoid these pitfalls.

## What we need to build

Create a disaster recovery infrastructure using **CloudFormation with JSON** for Aurora Global Database spanning two AWS regions.

### Core Requirements

1. **Aurora Global Database Architecture**
   - Deploy Aurora Global Database (NOT regular Aurora cluster)
   - Primary cluster in us-east-1
   - Secondary cluster in us-east-2 for disaster recovery
   - Cross-region replication with low latency
   - Fast failover capability (sub-minute RTO target)

2. **Network Infrastructure**
   - VPC in primary region (us-east-1) with public and private subnets
   - VPC in secondary region (us-east-2) with public and private subnets
   - DB subnet groups with proper subnet associations (NO empty arrays)
   - Security groups for database access
   - Multi-AZ subnet distribution for high availability

3. **Database Configuration**
   - Aurora Global Cluster as the top-level resource
   - Primary Aurora cluster attached to global cluster
   - Secondary Aurora cluster attached to global cluster
   - DB instances in both regions
   - Proper engine version and instance classes
   - Automated backups configured

4. **Secrets Management**
   - Master credentials stored in AWS Secrets Manager
   - Automatic credential rotation capability
   - Secure credential retrieval for database access

5. **Failover and Monitoring**
   - Route 53 health checks for database endpoints
   - CloudWatch alarms for replication lag
   - CloudWatch alarms for database health metrics
   - Avoid circular dependencies (don't make Route 53 records depend on alarms)

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS Aurora** with Global Database capability
- Use **VPC** for network isolation
- Use **Secrets Manager** for credential management
- Use **Route 53** for DNS-based failover
- Use **CloudWatch** for monitoring and alerting
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{environmentSuffix}
- Deploy to **us-east-1** region (with secondary in us-east-2)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - NO DeletionPolicy: Retain
- All resources must be destroyable - NO DeletionProtection: true on RDS clusters
- DB subnet groups MUST have actual subnet IDs (NO empty arrays)
- Aurora Global Database architecture (NOT regular Aurora cluster)
- Proper resource dependencies to avoid circular references
- Valid CloudFormation JSON syntax throughout

### Constraints

- Must survive complete regional failure
- Replication lag should be minimal (under 1 second target)
- Failover should be automated where possible
- All credentials must be encrypted at rest
- Database must be in private subnets only
- No public database endpoints
- Must support clean teardown for testing
- All resources must include environmentSuffix for naming

### Known Risk Areas

Based on similar task failures, pay special attention to:
- DB subnet groups with empty subnet arrays (causes immediate deployment failure)
- Using regular Aurora cluster instead of Global Database
- Route 53 failover record syntax errors
- Circular dependencies between Route 53 records and CloudWatch alarms
- Missing resource associations between clusters and global cluster
- Hardcoded values instead of using environmentSuffix parameter

## Success Criteria

- **Functionality**: Complete Aurora Global Database spanning two regions
- **Reliability**: Can survive and recover from regional failure
- **Performance**: Replication lag under 1 second under normal conditions
- **Security**: All credentials in Secrets Manager, databases in private subnets
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Clean stack deletion without manual intervention
- **Code Quality**: Valid CloudFormation JSON, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template (TapStack.json)
- Aurora Global Cluster resource definition
- Primary Aurora cluster in us-east-1
- Secondary Aurora cluster in us-east-2
- VPC and networking resources in both regions
- DB subnet groups with proper subnet arrays
- Security groups for database access
- Secrets Manager for credential storage
- Route 53 health checks and failover records
- CloudWatch monitoring and alarms
- Parameter for environmentSuffix throughout
- Documentation covering deployment and failover procedures
