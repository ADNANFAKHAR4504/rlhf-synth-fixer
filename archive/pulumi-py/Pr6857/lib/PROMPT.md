# Multi-Region Active-Passive Database with Automated Failover

Hey team,

We need to build a multi-region database architecture with automated failover capabilities for production workloads. The business is concerned about regional outages and wants to ensure our databases remain available even if an entire AWS region goes down. I've been asked to create this using **Pulumi with Python** for our infrastructure as code approach.

The core challenge here is setting up a primary database in us-east-1 with a secondary replica in us-west-2, and implementing intelligent failover that happens automatically when the primary region experiences issues. We need Route53 health checks monitoring the primary database, CloudWatch alarms tracking replication lag, and DNS-based routing that seamlessly redirects traffic to the secondary region when needed.

This is an expert-level task requiring careful attention to security, encryption, and proper resource naming for our CI/CD pipelines. All infrastructure must be fully destroyable for automated testing, and we need to ensure proper credential management through Secrets Manager.

## What we need to build

Create a high availability database system using **Pulumi with Python** that implements an active-passive architecture across multiple AWS regions with automated failover capabilities.

### Core Requirements

1. **Multi-Region Database Architecture**
   - Deploy Aurora Global Database or RDS with cross-region read replicas
   - Primary database in us-east-1 (active)
   - Secondary database in us-west-2 (passive)
   - Configure VPC networking in both regions with proper subnet groups
   - Use Aurora Global Database for optimal performance or RDS with read replicas as alternative

2. **High Availability Configuration**
   - Configure backup retention period of exactly 1 day (minimum for RDS)
   - Enable encryption at rest using AWS KMS with customer-managed keys
   - Enable encryption in transit using TLS/SSL
   - Set skip_final_snapshot to True for automated testing compatibility
   - Set deletion_protection to False to ensure resources are fully destroyable
   - Configure appropriate instance sizes for primary and replica

3. **Automated Failover System**
   - Implement Route53 health checks monitoring the primary database endpoint
   - Configure DNS failover routing policies with primary and secondary records
   - Set up CloudWatch alarms for replication lag monitoring
   - Create CloudWatch alarms for database connectivity checks
   - Configure health check failure detection with appropriate thresholds
   - Ensure automated DNS failover triggers when health checks fail

4. **Security and Access Control**
   - Create security groups with least privilege access rules
   - Use Secrets Manager for database credentials (reference existing secrets, do not create new ones)
   - Implement proper IAM roles following principle of least privilege
   - Enable CloudWatch logging for database and system monitoring
   - Tag all resources with environment, project, and cost allocation tags

5. **Monitoring and Observability**
   - Configure CloudWatch alarms for replication lag exceeding thresholds
   - Set up alarms for database connection failures
   - Monitor Route53 health check status
   - Enable enhanced monitoring for RDS/Aurora instances
   - Create alarms for CPU, memory, and storage metrics

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Aurora Global Database** for multi-region replication (preferred) or RDS with cross-region read replicas
- Use **Route53** for health checks and DNS-based failover routing
- Use **VPC** resources for networking in both regions with proper subnet configuration
- Use **CloudWatch** for monitoring, alarms, and logging
- Use **KMS** for encryption key management in both regions
- Use **Secrets Manager** to reference existing database credentials (fetch, do not create)
- Use **IAM** for roles and policies with least privilege access
- Resource names must include environmentSuffix for uniqueness and CI/CD compatibility
- Follow naming convention: resource-name-environment-suffix
- Deploy primary resources to us-east-1 region
- Deploy secondary resources to us-west-2 region

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in their names
- Pattern: resource-name-${environment_suffix}
- Examples: db-cluster-${environment_suffix}, db-sg-${environment_suffix}, db-${environment_suffix}.example.com
- backup_retention_period must be exactly 1 (minimum for RDS)
- skip_final_snapshot must be True for all RDS/Aurora instances
- deletion_protection must be False for all RDS/Aurora instances
- All resources must be fully destroyable with no RemovalPolicy.RETAIN
- Support environment-specific deployments via stack configuration

### Constraints

- Must use Pulumi with Python exclusively (non-negotiable)
- Primary region locked to us-east-1, secondary to us-west-2
- All database credentials must be fetched from existing Secrets Manager secrets
- Never hardcode credentials in code
- Security groups must follow least privilege principle
- All resources must be cleanly destroyable for automated testing
- No DeletionPolicy: Retain or RemovalPolicy.RETAIN on any resource
- Follow infrastructure security best practices
- Implement proper error handling and validation
- Include comprehensive resource tagging

## Success Criteria

- **Functionality**: Complete multi-region database deployment with working automated failover
- **Performance**: Replication lag under acceptable thresholds with proper monitoring
- **Reliability**: Automated failover triggers correctly when primary region fails
- **Security**: Encryption at rest and in transit, proper IAM roles, secure credential management
- **Resource Naming**: All resources include environmentSuffix following naming convention
- **Destroyability**: All resources can be cleanly destroyed without manual intervention
- **Code Quality**: Clean Python code, well-documented, follows Pulumi best practices

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- VPC configuration for both regions with appropriate subnet groups
- Aurora Global Database or RDS with cross-region read replicas
- Route53 health checks and failover routing configuration
- CloudWatch alarms for replication lag, connectivity, and health checks
- Security groups with proper ingress/egress rules
- KMS encryption configuration for both regions
- Secrets Manager integration for credential management
- IAM roles and policies with least privilege access
- Comprehensive unit tests in tests/unit/test_tap_stack.py
- Integration tests validating failover behavior in tests/integration/test_tap_stack.py
- Proper resource tagging across all components
- Documentation and configuration guidance in code comments
