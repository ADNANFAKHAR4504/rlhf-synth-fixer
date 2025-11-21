# Multi-Region Disaster Recovery for PostgreSQL Database

## Platform and Language
**MANDATORY**: Use **Terraform with HCL** for this implementation.

## Task Overview
Create a Terraform configuration to implement multi-region disaster recovery for a PostgreSQL database with automated failover capabilities.

## Business Context
A financial services company needs to implement disaster recovery for their critical trading database. They require automated failover capabilities with minimal data loss and downtime. The solution must detect failures and reroute traffic within 2 minutes while maintaining transaction integrity.

## Infrastructure Requirements

### Environment
Multi-region AWS deployment spanning:
- **Primary Region**: us-east-1
- **DR Region**: us-west-2

### Core Components
- PostgreSQL 15.x with db.r6g.large instances
- Route53 hosted zone for failover DNS
- Lambda functions for health monitoring
- VPCs in both regions with private subnets across 3 AZs
- VPC peering for cross-region connectivity

### Technical Requirements
- Terraform 1.5+
- AWS provider 5.x
- Python 3.9 runtime for Lambda
- Production account with cross-region replication permissions

## MANDATORY REQUIREMENTS (Must Complete)

### 1. Multi-Region PostgreSQL Deployment
Deploy PostgreSQL RDS instances in both regions:
- **Primary**: us-east-1 with cross-region read replicas
- **Standby**: us-west-2 configured for failover
- Use **RDS PostgreSQL** (not Aurora) for cross-region replication

### 2. Route53 Failover Configuration
Configure Route53 for automatic DNS failover:
- Health checks monitoring database connectivity
- Health checks evaluating replication lag
- Failover routing policy for automatic DNS switching
- Must support RTO under 2 minutes

### 3. Lambda Monitoring Function
Create Lambda function to:
- Monitor replication lag using CloudWatch metrics
- Trigger automatic promotion if lag exceeds 60 seconds
- Use boto3 to check replica lag
- Handle failover orchestration

### 4. CloudWatch Monitoring
Set up CloudWatch alarms for:
- Database CPU utilization
- Database connections
- Replication lag metrics
- Automated alerting on threshold breaches

### 5. IAM Security Configuration
Implement least privilege IAM roles for:
- Lambda execution permissions
- Cross-region replication access
- Monitoring and CloudWatch access
- Secrets Manager access for credentials

### 6. Automated Backup Configuration
Configure backup strategy:
- 7-day retention period
- Point-in-time recovery (PITR) enabled
- Automated snapshots
- Cross-region backup replication

### 7. Dynamic Configuration
Use Terraform data sources to:
- Fetch latest PostgreSQL engine versions
- Discover availability zones
- Reference existing networking resources

### 8. Resource Tagging
Tag all resources with:
- `Environment=DR`
- `CostCenter=Infrastructure`
- `environmentSuffix=${var.environment_suffix}` (for uniqueness)

## OPTIONAL ENHANCEMENTS (If Time Permits)

### EventBridge Integration
- Add EventBridge rules to notify on failover events
- Improves incident response and tracking

### Step Functions Workflow
- Implement Step Functions for orchestrated failover workflow
- Adds controlled, auditable failover process

### AWS Backup Integration
- Configure AWS Backup for centralized backup management
- Simplifies backup governance and compliance

## Security Constraints

### Encryption Requirements
- RDS instances must use encrypted storage with customer-managed KMS keys
- Network traffic between regions must use VPC peering with encryption in transit
- All data at rest must be encrypted

### Credential Management
- All passwords must be stored in Secrets Manager with automatic rotation
- No hardcoded credentials in code
- IAM roles for service-to-service authentication

### Network Security
- Private subnets for database instances
- Security groups with minimal required access
- VPC peering with controlled routing

### Monitoring & Compliance
- RDS parameter groups must enable slow query logging
- Performance Insights enabled for monitoring
- CloudWatch logs retention for audit trail

### State Management
- Terraform state must be stored in S3 with DynamoDB locking enabled
- State encryption at rest
- Versioning enabled on state bucket

## Destroyability Requirements

All resources must be easily destroyable for synthetic task cleanup:
- No deletion protection on RDS instances
- Set `skip_final_snapshot = true` for RDS
- No retention policies that prevent cleanup
- All resources must include `environment_suffix` in naming

## Resource Naming Convention

All named resources must include `${var.environment_suffix}` for uniqueness:
```hcl
name = "trading-db-primary-${var.environment_suffix}"
```

## Expected Deliverables

### Terraform Configuration
- Modular structure with separate files for each component
- Well-documented variables and outputs
- Proper dependency management
- Remote state configuration

### Lambda Function Code
- Python 3.9 Lambda function for monitoring
- Boto3 for AWS SDK operations
- Error handling and logging
- Packaged for Terraform deployment

### Documentation
- Clear deployment instructions
- Failover testing procedures
- Recovery time objectives (RTO) documentation
- Recovery point objectives (RPO) documentation

## Success Criteria

1. Infrastructure deploys successfully in both regions
2. Route53 health checks properly monitor both regions
3. Lambda function correctly monitors replication lag
4. Automated failover occurs within 2 minutes during testing
5. All security constraints are satisfied
6. 100% test coverage achieved
7. All resources properly tagged and destroyable

## Multi-Region Validation (CRITICAL)

This is a **multi-region disaster recovery task**. Before proceeding with implementation:

1. **Verify different regions**: Primary (us-east-1) and DR (us-west-2) are DIFFERENT regions
2. **Cross-region replication**: Must be configured between us-east-1 and us-west-2
3. **VPC peering**: Must connect VPCs in different regions
4. **Route53 failover**: Must route between us-east-1 and us-west-2 endpoints

If regions are the same, this task CANNOT be implemented (VPC cannot peer with itself, cross-region replication is meaningless).

## Notes

- This is an **expert-level** task requiring deep understanding of multi-region architecture
- Focus on automated failover and minimal downtime
- Prioritize data integrity and transaction consistency
- Ensure all mandatory requirements are met before attempting optional enhancements
- Follow AWS Well-Architected Framework principles for reliability and security
