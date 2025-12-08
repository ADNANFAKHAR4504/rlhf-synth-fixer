Hey team,

We need to build a multi-region disaster recovery infrastructure for a healthcare platform that handles patient records. The business has strict requirements around HIPAA compliance and demands 99.99% uptime with automatic failover capabilities. I've been asked to create this using Python with CDKTF (Terraform CDK).

This healthcare SaaS platform processes sensitive patient data and audit logs that must remain available even if an entire AWS region goes down. The system needs to maintain real-time replication between regions, automatic health monitoring, and seamless failover without manual intervention. Recovery Time Objective is under 5 minutes and Recovery Point Objective is under 1 minute, which means our replication and failover mechanisms need to be rock solid.

The infrastructure spans two AWS regions - us-east-1 as primary with 70% traffic weight, and us-west-2 as secondary with 30% weight. All data must be encrypted at rest using customer-managed KMS keys with annual rotation, and we need comprehensive monitoring for replication lag, health checks, and failover events. The solution must support VPC peering for cross-region communication while maintaining proper security group configurations.

## What we need to build

Create a comprehensive disaster recovery infrastructure using **CDKTF with Python** that provides multi-region failover for a healthcare platform with HIPAA compliance requirements.

### Core Requirements

1. **DynamoDB Global Tables**
   - Create global tables for patient_records and audit_logs
   - Deploy across us-east-1 (primary) and us-west-2 (secondary)
   - Enable point-in-time recovery for both tables
   - Configure encryption using customer-managed KMS keys

2. **Lambda Functions**
   - Deploy Lambda functions in both regions
   - Configure with 3GB memory and 30-second timeout
   - Create IAM roles with cross-region assume permissions
   - Ensure functions can access DynamoDB and S3 in both regions

3. **S3 Buckets with Cross-Region Replication**
   - Create S3 buckets in both regions
   - Enable cross-region replication from primary to secondary
   - Configure KMS encryption with customer-managed keys
   - Set up proper IAM roles for replication

4. **Route 53 Weighted Routing**
   - Configure weighted routing policy
   - Set 70% weight to primary region (us-east-1)
   - Set 30% weight to secondary region (us-west-2)
   - Create health checks that trigger on 3 consecutive failures
   - Configure automatic failover based on health check status

5. **KMS Encryption Keys**
   - Create customer-managed KMS keys in both regions
   - Enable annual key rotation
   - Use keys for S3, DynamoDB, and Lambda encryption
   - Configure proper key policies for cross-region access

6. **CloudWatch Monitoring**
   - Create dashboards for replication lag monitoring
   - Create dashboards for failover metrics
   - Set up alarms for health check failures
   - Monitor DynamoDB replication lag between regions
   - Track Route 53 health check status

7. **SNS Topics and Alerts**
   - Create SNS topics in both regions
   - Configure subscriptions for failover alerts
   - Send notifications on health check failures
   - Alert on replication lag threshold breaches

8. **VPC and Networking**
   - Set up VPC peering between us-east-1 and us-west-2
   - Configure security groups allowing necessary cross-region traffic
   - Ensure proper network connectivity for Lambda, DynamoDB access
   - Set up routing tables for VPC peering

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **DynamoDB** for global tables (patient_records, audit_logs)
- Use **Lambda** for compute in both regions
- Use **S3** with cross-region replication
- Use **Route 53** for weighted routing and health checks
- Use **KMS** for customer-managed encryption keys
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for alerting
- Use **VPC** for networking and peering
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 (primary) and us-west-2 (secondary)

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix parameter in names
- No RemovalPolicy.RETAIN or deletion_protection enabled
- All resources must be destroyable for CI/CD cleanup
- Lambda functions must use Node.js 18+ or Python runtime (note: Node.js 18+ requires AWS SDK v3)
- IAM roles must follow least privilege principle
- All data encrypted at rest with customer-managed KMS keys

### Constraints

- RTO (Recovery Time Objective): Under 5 minutes
- RPO (Recovery Point Objective): Under 1 minute
- Uptime target: 99.99% availability
- HIPAA compliance requirements must be met
- All data encrypted at rest and in transit
- Health checks must trigger failover on 3 consecutive failures
- Primary region weight: 70%, Secondary region weight: 30%
- Proper error handling and comprehensive logging required
- Security groups must allow necessary cross-region traffic only

### Resource Tagging

All resources must include these tags:
- Environment=Production
- DisasterRecovery=Enabled

## Success Criteria

- Functionality: Multi-region infrastructure deployed successfully in both us-east-1 and us-west-2
- Performance: RTO under 5 minutes, RPO under 1 minute
- Reliability: 99.99% uptime with automatic failover capabilities
- Security: All data encrypted with customer-managed KMS keys, IAM least privilege
- Monitoring: CloudWatch dashboards showing replication lag and failover metrics
- Alerting: SNS notifications for health check failures and replication issues
- Resource Naming: All resources include environmentSuffix parameter
- Code Quality: Python code, well-structured, properly typed, documented

## What to deliver

- Complete CDKTF Python implementation
- DynamoDB global tables (patient_records, audit_logs) with point-in-time recovery
- Lambda functions deployed in both regions with proper IAM roles
- S3 buckets with cross-region replication and KMS encryption
- Route 53 weighted routing with health checks (70/30 split)
- KMS customer-managed keys in both regions with annual rotation
- CloudWatch dashboards and alarms for monitoring
- SNS topics for alerting in both regions
- VPC peering and security groups for cross-region communication
- Unit tests for all components
- Documentation and deployment instructions
