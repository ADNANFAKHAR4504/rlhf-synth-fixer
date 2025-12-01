Hey team,

We need to build a robust multi-region disaster recovery solution for a financial services company's payment processing application. I've been asked to create this using **CDKTF with Python**. The business wants to ensure business continuity with minimal data loss if a region goes down, meeting strict RTO and RPO requirements.

The current setup spans two regions - us-east-1 as primary and us-west-2 as secondary. We're dealing with a payment processing system that's absolutely critical, so we need active-passive disaster recovery with automated health monitoring and the ability to fail over when needed.

The architecture includes RDS Aurora PostgreSQL for the database layer with global replication, Lambda functions for processing payment webhooks, DynamoDB global tables for session data, and Route 53 to handle failover routing. We also need health checks to monitor everything and CloudWatch alarms to alert us if replication lag gets too high.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CDKTF with Python** for a payment processing application. The solution must provide active-passive failover between us-east-1 and us-west-2 with automated health monitoring.

### Core Requirements

1. **Database Layer**
   - Deploy RDS Aurora PostgreSQL 14.x Global Database with writer in us-east-1 and reader in us-west-2
   - Enable automated backups and point-in-time recovery
   - Monitor replication lag and alert when exceeding thresholds

2. **Application Layer**
   - Create Lambda functions in both regions for payment webhook processing
   - Configure Lambda with 1GB memory and environment-specific configurations
   - Deploy identical code in both regions with region-aware settings

3. **Session Storage**
   - Create DynamoDB global tables for session storage with on-demand billing
   - Enable point-in-time recovery on all tables
   - Ensure automatic replication between regions

4. **DNS and Failover**
   - Configure Route 53 failover routing with primary and secondary record sets
   - Implement health checks monitoring both database connectivity and Lambda availability
   - Set health check intervals to 30 seconds

5. **Monitoring and Alerting**
   - Set up CloudWatch alarms for replication lag monitoring
   - Configure email notifications for alarm triggers
   - Monitor cross-region replication lag thresholds

6. **Security and Secrets**
   - Configure Secrets Manager to replicate database credentials to secondary region
   - Ensure secrets replicate within 5 minutes
   - Follow least-privilege principle for all IAM roles with no wildcard permissions

7. **Networking**
   - Set up VPCs in both regions with private subnets across 3 AZs each
   - Configure VPC peering for cross-region communication
   - Deploy NAT gateways for outbound traffic

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use RDS Aurora PostgreSQL 14.x for database
- Use Lambda for serverless compute
- Use DynamoDB for session storage with global tables
- Use Route 53 for DNS and failover routing
- Use CloudWatch for monitoring and alarms
- Use Secrets Manager for credential replication
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{region-suffix}-{environment-suffix}` where region suffix is use1 or usw2
- Primary region: us-east-1, Secondary region: us-west-2
- All resources must be destroyable with no Retain policies

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST include environmentSuffix in their names to ensure uniqueness across deployments. This should be passed as a stack parameter.
- **Destroyability**: All resources MUST be fully destroyable. Do NOT use RemovalPolicy.RETAIN or DeletionPolicy: Retain on any resources.
- **Multi-Region Architecture**: Deploy separate but linked stacks in us-east-1 and us-west-2
- **Service-Specific Warnings**:
  - Lambda functions using Node.js 18+: Must bundle AWS SDK v3 as aws-sdk is not available in runtime
  - RDS Aurora Global Database: Writer must be in primary region, reader in secondary
  - Secrets Manager: Use ReplicaRegions for automatic cross-region replication

### Constraints

1. Primary region must be us-east-1 with failover to us-west-2
2. RDS Aurora Global Database must use PostgreSQL 14.x with automated backups
3. Cross-region replication lag must not exceed 1 second under normal operations
4. Lambda functions must be deployed identically in both regions with environment-specific configurations
5. DynamoDB global tables must have point-in-time recovery enabled
6. Route 53 health checks must monitor both regions with 30-second intervals
7. All IAM roles must follow least-privilege principle with no wildcard permissions
8. Secrets Manager must replicate secrets to secondary region within 5 minutes
9. CloudWatch alarms must trigger notifications for replication lag exceeding thresholds
10. All resources must be destroyable - no Retain policies
11. Include proper error handling and logging

## Success Criteria

- **Functionality**: Multi-region architecture with automated failover capability
- **Performance**: Cross-region replication lag under 1 second
- **Reliability**: Health checks and monitoring in place with automated alerts
- **Security**: Least-privilege IAM roles, encrypted secrets, replicated credentials
- **Resource Naming**: All resources include environmentSuffix and region identifiers
- **Code Quality**: Clean Python code, well-structured CDKTF constructs, comprehensive documentation

## What to deliver

- Complete CDKTF Python implementation with multi-region support
- RDS Aurora PostgreSQL 14.x Global Database setup
- Lambda functions for payment processing in both regions
- DynamoDB global tables with point-in-time recovery
- Route 53 failover routing with health checks
- CloudWatch alarms for replication lag monitoring
- Secrets Manager with cross-region replication
- VPC configuration with peering and NAT gateways
- Comprehensive documentation and deployment instructions
