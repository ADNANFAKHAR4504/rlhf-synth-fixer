# Disaster Recovery Solution for StreamFlix

Hey team,

We need to build a comprehensive disaster recovery system for StreamFlix, a media streaming company that stores metadata in RDS and media assets in EFS. The business is concerned about data loss and system downtime, especially given the competitive nature of the streaming market. We've been asked to implement this using CloudFormation with YAML to ensure their operations can continue even during regional outages.

StreamFlix currently runs everything in a single region, and their leadership is worried about the potential impact of an AWS regional failure. They need a solution that can recover within 15 minutes with minimal data loss. The company stores terabytes of media content and metadata about millions of users, so we need to be smart about replication and failover strategies.

The regulatory requirements for media companies are strict, particularly around data protection and encryption. Everything needs to be encrypted at rest and in transit, and we need proper audit trails for compliance purposes.

## What we need to build

Create a disaster recovery infrastructure for StreamFlix using **CloudFormation with yaml** that implements a warm standby pattern with cross-region replication for all critical data components.

### Core Requirements

1. **Database Replication**
   - RDS Multi-AZ database in primary region for metadata storage
   - Cross-region read replica for disaster recovery
   - Automated backups with point-in-time recovery
   - Encryption at rest using AWS KMS

2. **File Storage Replication**
   - EFS file system for media asset storage
   - Cross-region replication to DR region
   - Encryption at rest and in transit
   - Lifecycle policies for cost optimization

3. **Caching Layer**
   - ElastiCache cluster for session management
   - Redis engine with Multi-AZ configuration
   - Encryption at rest and in transit
   - Backup and restore capabilities

4. **Application Infrastructure**
   - ECS clusters in both primary and DR regions
   - Auto-scaling configuration for resilience
   - Load balancers for traffic distribution
   - Container definitions with health checks

5. **Disaster Recovery Capabilities**
   - Warm standby pattern with minimal compute in DR region
   - Automated failover procedures
   - RTO of 15 minutes or less
   - Near-zero RPO through continuous replication

### Technical Requirements

- All infrastructure defined using **CloudFormation with yaml**
- Primary deployment region: **eu-west-2**
- DR region: **us-east-1** for cross-region redundancy
- Use **RDS** for relational database with Multi-AZ and read replicas
- Use **EFS** for shared file storage with cross-region replication
- Use **ElastiCache** for session management and caching
- Use **ECS** for container orchestration
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- All resources must use proper tagging for cost allocation
- Deploy VPC infrastructure with proper network segmentation

### Security Constraints

- All RDS databases must use encryption at rest with KMS
- All EFS file systems must use encryption at rest and in transit
- ElastiCache must use encryption at rest and in transit
- Implement proper security groups with least privilege access
- Use IAM roles for service-to-service authentication
- No hardcoded credentials or secrets
- Enable CloudTrail logging for audit purposes

### Operational Constraints

- All resources must be destroyable without retention policies
- No DeletionPolicy: Retain on any resource
- Support parameterization for different environments
- Include proper resource dependencies for correct stack creation
- Implement appropriate timeouts for stack operations
- Use CloudFormation outputs for resource references

### Compliance Requirements

- Tag all resources with Environment, Application, and CostCenter tags
- Maintain encryption at rest for all data storage components
- Maintain encryption in transit for all data transfers
- Implement proper backup retention policies
- Enable detailed monitoring and logging

## Success Criteria

- **Functionality**: Complete DR solution with automated replication
- **Performance**: RTO of 15 minutes, near-zero RPO
- **Reliability**: Multi-AZ configuration in primary region, warm standby in DR
- **Security**: All data encrypted at rest and in transit, proper IAM roles
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Valid CloudFormation YAML, well-documented, deployable

## What to deliver

- Complete CloudFormation YAML template implementation
- RDS Multi-AZ database with cross-region read replica
- EFS file system with replication configuration
- ElastiCache Redis cluster with encryption
- ECS cluster infrastructure in both regions
- VPC and networking components
- Security groups and IAM roles
- Comprehensive parameter definitions
- Clear outputs for resource references
- Unit tests validating template structure
- Integration tests for deployment validation
- Documentation covering architecture and failover procedures
