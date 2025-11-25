Hey team,

We have a critical requirement from one of our financial services clients. Their trading platform database needs disaster recovery capabilities, and they're understandably concerned about data loss and downtime. The business has strict RPO and RTO targets - under 1 minute for recovery point objective and under 5 minutes for recovery time objective. This is a mission-critical system that handles real-time trading data, so we need to get this right.

I've been asked to build this using **Pulumi with TypeScript**. The client specifically chose this stack for its strong typing and AWS integration capabilities. We need to implement a multi-region disaster recovery solution that spans us-east-1 as the primary region and eu-west-1 as the secondary. The system needs to handle automatic failover, database replication, and backup synchronization seamlessly.

The architecture involves Aurora Global Database for cross-region replication, Route 53 for intelligent DNS failover, S3 for backup synchronization, and CloudWatch for monitoring replication lag. We also need Lambda functions in both regions to continuously test database connectivity. The tricky part is ensuring all inter-region traffic goes through VPC peering connections rather than the public internet for security and performance reasons.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Pulumi with TypeScript** for a critical database workload with automatic failover capabilities.

### Core Requirements

1. **Database Infrastructure**
   - Deploy RDS Aurora Global Database with primary cluster in us-east-1 and secondary in eu-west-1
   - Use r6g.large instance type for Aurora clusters
   - Enable encrypted storage using **region-specific KMS keys** (required for cross-region encrypted replicas)
   - Store database password in **AWS Secrets Manager** (auto-generated, secure)
   - Configure automatic backups with 7-day retention
   - Enable point-in-time recovery

2. **DNS Failover and Health Monitoring**
   - Configure Route 53 health checks that evaluate both database connectivity AND replication lag
   - Set up failover routing between regions
   - Health checks must validate the system is truly healthy before allowing traffic

3. **Backup Management**
   - Implement S3 cross-region replication for database backups between us-east-1 and eu-west-1 buckets
   - Enable versioning on S3 buckets
   - Configure lifecycle policies to retain backups for exactly 30 days

4. **Monitoring and Alerting**
   - Set up CloudWatch alarms for replication lag exceeding 5 seconds
   - Monitor database connectivity in both regions
   - Alert on failover events

5. **Connectivity Testing**
   - Create Lambda functions in both regions to test database connectivity
   - Functions should run periodically to validate the disaster recovery setup

6. **Networking**
   - Configure VPC peering between us-east-1 and eu-west-1
   - All inter-region traffic must traverse VPC peering connections, not public internet
   - Set up private subnets for RDS in both regions
   - Configure public subnets for ALBs in both regions

7. **IAM and Security**
   - Implement IAM roles with cross-region assume role permissions for failover automation
   - Create **KMS keys** in both regions with proper policies for RDS encryption
   - Use **AWS Secrets Manager** for secure database password storage (auto-generated)
   - Follow principle of least privilege
   - Enable deletion protection on production resources but allow programmatic override

8. **Resource Management**
   - Tag all resources with Environment=production and DisasterRecovery=enabled
   - All resource names must include environmentSuffix for uniqueness
   - Follow naming convention: `{resource-type}-{environment-suffix}`

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **RDS Aurora Global Database** for cross-region replication
- Use **Route 53** for DNS failover with health checks
- Use **S3** for backup synchronization with cross-region replication
- Use **CloudWatch** for monitoring and alarms
- Use **Lambda** for connectivity testing
- Use **VPC** for secure networking with peering connections
- Use **IAM** for cross-region permissions
- Deploy to **us-east-1** (primary) and **eu-west-1** (secondary) regions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies or RETAIN removal policies)
- Use RemovalPolicy.DESTROY for all resources that support it
- NEVER use RemovalPolicy.RETAIN or DeletionPolicy: Retain
- All resources must include environmentSuffix in their names for multi-environment support
- Stack must be fully deployable and destroyable programmatically

### Constraints

- RDS Aurora clusters must use r6g.large instances with encrypted storage
- **KMS keys must be explicitly specified for cross-region encrypted replicas** (AWS requirement)
- Database password must be stored in AWS Secrets Manager (auto-generated, not passed from CI/CD)
- Environment suffix can be set via `ENVIRONMENT_SUFFIX` environment variable or Pulumi config (defaults to 'dev')
- Route 53 health checks must evaluate both database connectivity and replication lag before triggering failover
- S3 buckets must use versioning and lifecycle policies to retain backups for exactly 30 days
- All inter-region traffic must traverse VPC peering connections, not public internet
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- RPO target: Under 1 minute
- RTO target: Under 5 minutes

## Success Criteria

- **Functionality**: Aurora Global Database successfully replicates between regions with replication lag under 5 seconds
- **Failover**: Route 53 health checks correctly detect failures and trigger failover within 5 minutes
- **Backup**: S3 cross-region replication synchronizes backups successfully with 30-day retention
- **Monitoring**: CloudWatch alarms trigger when replication lag exceeds 5 seconds
- **Security**: All inter-region traffic flows through VPC peering, no public internet exposure
- **Connectivity**: Lambda functions successfully test database connectivity in both regions
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: All resources can be destroyed programmatically without manual intervention
- **Code Quality**: Well-structured TypeScript, properly typed, with comprehensive error handling

## What to deliver

- Complete Pulumi TypeScript implementation in tap-stack.ts
- RDS Aurora Global Database with primary and secondary clusters
- **KMS keys** for encryption in both regions (required for cross-region encrypted replicas)
- **AWS Secrets Manager** secret for database password (auto-generated)
- Route 53 health checks and failover routing
- S3 buckets with cross-region replication and lifecycle policies
- CloudWatch alarms for monitoring replication lag
- Lambda functions for connectivity testing in both regions
- VPC peering connection between regions
- IAM roles with cross-region permissions
- Proper resource tagging (Environment=production, DisasterRecovery=enabled)
- Stack exports including: primary and secondary database endpoints, S3 bucket names, Route 53 hosted zone ID, **database secret ARN**
- Environment suffix support via `ENVIRONMENT_SUFFIX` environment variable or Pulumi config
- Documentation and deployment instructions
