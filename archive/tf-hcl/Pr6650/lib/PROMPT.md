# Active-Passive Disaster Recovery for Transaction Processing

Hey team,

We need to implement a disaster recovery solution for our transaction processing application. The business has been pushing for this after the recent regional outages we've seen across the industry. We're tasked with building this using **Terraform with HCL** to provision infrastructure across two AWS regions.

The application currently runs in us-east-1 and processes financial transactions around the clock. We need a passive failover region in us-west-2 that can take over if the primary region experiences issues. The architecture should be active-passive, meaning us-west-2 stays warm but doesn't serve production traffic unless we failover.

Our SLA commitments require minimal downtime and data loss. We're targeting a recovery time objective (RTO) of under 5 minutes and a recovery point objective (RPO) of 1 minute or less. These aren't arbitrary numbers - they directly impact customer experience and regulatory compliance.

## What we need to build

Create infrastructure using **Terraform with HCL** for an active-passive disaster recovery solution spanning us-east-1 (primary) and us-west-2 (secondary) regions.

### Core Requirements

1. **Multi-Region Database Replication**
   - RDS Aurora MySQL clusters in both regions with cross-region replication
   - Primary cluster in us-east-1 with read replicas across 3 availability zones
   - Secondary cluster in us-west-2 configured as replication target
   - Automated promotion of secondary cluster during failover
   - Backup retention of 7 days for compliance

2. **Automated Health Monitoring**
   - Lambda functions to continuously monitor primary region health
   - CloudWatch alarms for database replication lag monitoring
   - Health checks that detect both infrastructure and application-level failures
   - Automatic notification when thresholds are breached
   - Monitoring replication lag with alert threshold of 5 minutes

3. **DNS Failover Management**
   - Route 53 hosted zone with health-based failover routing policy
   - Health checks for primary and secondary endpoints
   - Automatic DNS cutover when primary becomes unhealthy
   - Failover trigger within 60 seconds of failure detection

4. **Cross-Region Data Replication**
   - S3 buckets in both regions with cross-region replication enabled
   - Versioning enabled on all buckets for data protection
   - Transaction logs and application data replicated continuously
   - Lifecycle policies for cost optimization

5. **Network Infrastructure**
   - VPC in each region with 3 availability zones
   - Public and private subnets for proper security segmentation
   - NAT Gateways in public subnets for Lambda internet connectivity
   - Security groups with least-privilege access
   - VPC endpoints where applicable to reduce costs

6. **Failover Automation**
   - Lambda functions to orchestrate failover procedures
   - Automated database promotion in secondary region
   - Route 53 health check status updates
   - SNS notifications to operations team
   - EventBridge rules for coordinating failover sequence

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora MySQL** for database with global cluster configuration
- Use **Lambda** (Python runtime) for health monitoring and failover automation
- Use **Route 53** for DNS failover with health checks
- Use **CloudWatch** for metrics, alarms, and dashboards
- Use **S3** with cross-region replication for object storage
- Use **KMS** customer-managed keys for encryption in both regions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy primary to **us-east-1** and secondary to **us-west-2**

### Security and Compliance

- All data encrypted at rest using KMS customer-managed keys
- All data encrypted in transit using TLS
- Database credentials stored in AWS Secrets Manager with rotation
- IAM roles with least-privilege permissions for Lambda functions
- All resources tagged with Environment, CostCenter, and DR-Role tags
- Security groups restricting traffic to required ports only
- No public database endpoints

### Operational Requirements

- All resources must be destroyable (no Retain deletion policies)
- CloudWatch dashboard showing replication health and failover readiness
- SNS topic for operational notifications and alerts
- Proper error handling and logging in Lambda functions
- Reserved concurrency on Lambda functions to prevent throttling
- Cost optimization through Aurora Serverless v2 where appropriate

## Success Criteria

- **Functionality**: Automated failover between regions within 5 minutes
- **Data Integrity**: Replication lag under 1 minute during normal operations
- **Reliability**: Health checks accurately detect failures within 60 seconds
- **Security**: All encryption and access controls properly configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Valid HCL syntax, well-tested, comprehensive documentation
- **Test Coverage**: Unit tests covering 90%+ of infrastructure components

## What to deliver

- Complete Terraform HCL implementation in modular structure
- Main configuration with provider setup for both regions
- Separate modules for CloudWatch, Route53, S3, and regional infrastructure
- Lambda function source code for health monitoring and failover
- VPC networking with NAT Gateways and proper routing
- RDS Aurora global cluster configuration
- Comprehensive unit and integration tests
- Variables file for parameterization
- Outputs for critical resource identifiers

The implementation should be production-ready with no deletion protection enabled, as we need to support automated testing and cleanup in our CI/CD pipeline.
