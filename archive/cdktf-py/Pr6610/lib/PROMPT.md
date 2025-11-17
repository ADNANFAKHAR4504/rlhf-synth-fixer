Hey team,

We need to build a comprehensive multi-region disaster recovery system for our transaction processing application. The business has made it clear that downtime is not acceptable, and we need automated failover capabilities that can handle regional outages without manual intervention. I've been asked to implement this using CDKTF with Python to maintain consistency with our infrastructure-as-code standards.

The key challenge here is ensuring that when our primary region goes down, we can automatically failover to our secondary region within 5 minutes with minimal data loss. This means we need to carefully orchestrate Aurora Global Database replication, Route 53 DNS failover, cross-region Auto Scaling Groups, and comprehensive health monitoring. The business wants the secondary region to stay in a minimal-cost standby mode until needed.

This isn't just about setting up resources in two regions. We need bidirectional S3 replication with Replication Time Control to ensure configuration files are synchronized, Lambda functions constantly validating both database and application health, CloudWatch dashboards showing real-time RTO and RPO metrics, and SNS notifications keeping the operations team informed of any issues. All of this needs to be automated and resilient.

## What we need to build

Create a multi-region disaster recovery infrastructure using **CDKTF with Python** for a transaction processing application that spans us-east-1 (primary) and us-east-2 (secondary).

### Core Requirements

1. **Aurora Global Database**
   - Primary Aurora cluster in us-east-1 with automated backups enabled
   - Secondary read replica cluster in us-east-2 for disaster recovery
   - Point-in-time recovery (PITR) enabled on both clusters
   - Proper subnet groups and security groups for network isolation

2. **Compute Infrastructure**
   - Auto Scaling Groups configured in both regions
   - Launch templates with region-specific AMI references
   - Primary region at full capacity, secondary at minimum capacity (standby mode)
   - Proper IAM instance profiles for EC2 instances

3. **Load Balancing**
   - Application Load Balancers deployed in both us-east-1 and us-east-2
   - Target groups pointing to respective Auto Scaling Group instances
   - Health checks configured on target groups
   - Security groups allowing appropriate traffic

4. **DNS and Failover**
   - Route 53 hosted zone with weighted routing policy
   - 100% weight to primary region, 0% to secondary during normal operations
   - Health checks monitoring primary application endpoints
   - Automatic DNS failover to secondary when health checks fail

5. **Health Monitoring**
   - Lambda functions validating database connectivity in both regions
   - Lambda functions validating application responsiveness
   - Functions scheduled to run every 60 seconds using EventBridge
   - Integration with Route 53 health checks
   - SNS notifications sent on health check failures

6. **Data Replication**
   - S3 buckets in both us-east-1 and us-east-2
   - Bidirectional replication rules between buckets
   - Replication Time Control (RTC) enabled for guaranteed replication SLA
   - Versioning enabled on both buckets
   - Store application artifacts and configuration files

7. **Monitoring and Alerting**
   - CloudWatch dashboards showing RTO and RPO metrics
   - Replication lag monitoring for Aurora Global Database
   - Health check status displays
   - CloudWatch alarms for critical thresholds
   - SNS topics in both regions for failure notifications
   - Email subscriptions configured for operations team

8. **Configuration Management**
   - Systems Manager Parameter Store entries for database endpoints
   - Store primary and secondary region configuration values
   - Secure string parameters for sensitive data
   - Lambda functions and applications retrieve configuration from Parameter Store

9. **Security and Access Control**
   - IAM roles following least-privilege principle
   - Separate roles for Lambda execution, EC2 instances, and replication
   - Cross-region resource access policies
   - Proper trust relationships for all services
   - Security groups restricting traffic appropriately

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **Aurora Global Database** for multi-region database replication
- Use **Auto Scaling Groups** with launch templates for compute
- Use **Application Load Balancers** for traffic distribution
- Use **Route 53** for DNS-based failover with health checks
- Use **Lambda** functions for health monitoring
- Use **S3** with cross-region replication and RTC
- Use **CloudWatch** for dashboards, metrics, and alarms
- Use **SNS** for notifications in both regions
- Use **Systems Manager Parameter Store** for configuration
- Use **IAM** for all access control and permissions
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environmentSuffix or resource-type-region-environmentSuffix
- Deploy primary resources to us-east-1, secondary to us-east-2
- All resources must be destroyable without retention policies

### Constraints

- RTO (Recovery Time Objective) must be less than or equal to 5 minutes
- RPO (Recovery Point Objective) must be less than 1 minute data loss
- Secondary region must remain in standby mode with minimal compute until failover
- S3 replication must use Replication Time Control (RTC) for guaranteed replication times
- Lambda health check functions must run every 60 seconds
- CloudWatch alarms must trigger SNS notifications for RTO/RPO threshold breaches
- IAM policies must follow least-privilege principle with service-specific roles
- All resources must be tagged with Environment, DR-Role (primary or secondary), and Cost-Center
- Aurora clusters must have automated backups and PITR enabled
- Route 53 health checks must monitor application endpoints and trigger automatic failover
- Include proper error handling and logging in all Lambda functions
- Security groups must restrict access to required ports only

## Success Criteria

- Functionality: Complete multi-region disaster recovery solution with automated failover
- Performance: RTO less than or equal to 5 minutes, RPO less than 1 minute
- Reliability: Health monitoring detects failures within 60 seconds, automatic DNS failover
- Security: Least-privilege IAM policies, encrypted data at rest and in transit, proper network isolation
- Resource Naming: All resources include environmentSuffix and follow naming conventions
- Monitoring: CloudWatch dashboards showing RTO/RPO metrics, replication lag, and health status
- Alerting: SNS notifications sent for all critical failures and threshold breaches
- Code Quality: Python, modular structure, well-tested, comprehensive documentation

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- Aurora Global Database with primary and secondary clusters
- Auto Scaling Groups and Launch Templates for both regions
- Application Load Balancers with target groups and health checks
- Route 53 hosted zone with weighted routing and health checks
- Lambda functions for database and application health monitoring
- S3 buckets with bidirectional replication and RTC
- CloudWatch dashboards, metrics, and alarms
- SNS topics and email subscriptions for both regions
- Systems Manager Parameter Store entries for configuration
- IAM roles and policies for all services
- Unit tests for infrastructure components
- Documentation in lib/IDEAL_RESPONSE.md
