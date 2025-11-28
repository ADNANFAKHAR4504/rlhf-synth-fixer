Hey team,

We need to build a multi-region Aurora Global Database infrastructure for a financial services company that demands zero-downtime database operations with automatic failover capabilities. Their transaction processing system must maintain sub-second switchover times during regional failures while preserving data consistency. I've been asked to create this using CloudFormation with JSON format.

The business is concerned about regional failures impacting their critical transaction processing systems. They need a database solution that can automatically failover to a secondary region within 30 seconds while maintaining data consistency and preserving all recent transactions. The RPO must be less than 1 second and the RTO must be under 30 seconds.

## What we need to build

Create a fault-tolerant Aurora infrastructure using **CloudFormation with JSON** for automated regional failover across us-east-1 and eu-west-1.

### Core Requirements

1. **Multi-Region Aurora Global Database**
   - Deploy Aurora MySQL 5.7 Global Database with primary cluster in us-east-1
   - Configure secondary cluster in eu-west-1 region
   - Set up writer and reader endpoints with connection pooling parameters
   - Secondary region must have at least 2 read replicas for load distribution

2. **Automated Health Monitoring**
   - Implement Lambda-based health checks monitoring cluster endpoints every 30 seconds
   - Lambda functions must complete within 5 seconds timeout
   - Deploy Lambda functions in both regions for monitoring
   - Create Route 53 health checks with 10-second intervals and 2-failure threshold
   - Route 53 health checks must use HTTPS protocol on port 3306

3. **DNS-Based Failover**
   - Configure weighted routing policy with automatic failover to secondary region
   - Integrate with Route 53 hosted zone for DNS failover management
   - Ensure sub-second DNS propagation during failover events

4. **CloudWatch Monitoring and Alarms**
   - Set up CloudWatch alarms for replication lag exceeding 1000ms
   - CloudWatch Logs must retain Aurora slow query logs for 30 days
   - Monitor both primary and secondary cluster health metrics

5. **Data Protection and Recovery**
   - Enable deletion protection on production clusters only
   - Implement point-in-time recovery with 7-day backup retention
   - Backtrack must be enabled with 24-hour window on primary cluster
   - Aurora clusters must use encrypted storage with customer-managed KMS keys

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon Aurora Global Database** (MySQL 5.7) for multi-region database
- Use **AWS Lambda** for health check automation
- Use **Amazon Route 53** for DNS-based failover
- Use **Amazon CloudWatch** for monitoring and alarms
- Use **AWS KMS** for encryption key management
- Use **Amazon VPC** for network infrastructure
- Use **AWS IAM** for access control and permissions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy primary cluster to us-east-1 region and secondary to eu-west-1
- Minimum db.r5.large instances for production workloads
- Subnet groups must span at least 3 availability zones per region
- VPCs with private subnets in both regions required

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- Use RemovalPolicy: Delete or DeletionPolicy: Delete for all resources
- Parameter groups must disable binary logging for read replicas
- Enable proper error handling and logging in Lambda functions
- Include tags for all resources

### Constraints

- Aurora clusters must use encrypted storage with customer-managed KMS keys
- Lambda health check functions must complete within 5 seconds timeout
- Route 53 health checks must use HTTPS protocol on port 3306
- Secondary region must have at least 2 read replicas for load distribution
- Backtrack must be enabled with 24-hour window on primary cluster
- Parameter groups must disable binary logging for read replicas
- Subnet groups must span at least 3 availability zones per region
- CloudWatch Logs must retain Aurora slow query logs for 30 days
- VPCs with private subnets and cross-region VPC peering must be established
- IAM roles must follow least-privilege principles

## Success Criteria

- Functionality: Multi-region Aurora Global Database deploys successfully in us-east-1 and eu-west-1
- Performance: RPO less than 1 second and RTO under 30 seconds during failover
- Reliability: Automated health checks detect failures within 30 seconds
- Security: All data encrypted at rest using customer-managed KMS keys
- Monitoring: CloudWatch alarms trigger on replication lag exceeding 1000ms
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Valid CloudFormation JSON template, well-documented

## What to deliver

- Complete CloudFormation JSON template implementation
- Aurora MySQL 5.7 Global Database with primary and secondary clusters
- Lambda functions for health monitoring in both regions
- Route 53 health checks and DNS failover configuration
- CloudWatch alarms and log retention policies
- KMS encryption keys for both regions
- IAM roles with least-privilege access
- VPC and subnet group configurations
- Documentation and deployment instructions
