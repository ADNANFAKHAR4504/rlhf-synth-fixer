# MODEL_RESPONSE.md Intentional Failures

This document lists the intentional errors included in MODEL_RESPONSE.md for training purposes.

## Critical Errors

### 1. Missing Secondary Region Infrastructure
**Issue**: The template only creates resources for the primary region (us-east-1) but completely omits the secondary region (eu-west-1) infrastructure.

**What's Missing**:
- Secondary KMS key for eu-west-1
- Secondary DB subnet group for eu-west-1
- Secondary Aurora cluster in eu-west-1
- Secondary DB instances (at least 2 read replicas as required)
- Secondary Lambda health check function in eu-west-1

**Impact**: Cannot achieve multi-region failover without secondary cluster.

### 2. Hardcoded Subnet IDs
**Issue**: DBSubnetGroup uses hardcoded placeholder subnet IDs ("subnet-12345678", "subnet-23456789").

**What's Wrong**:
- These are not real subnet IDs
- Template will fail during deployment
- Should use Parameters or import from existing VPC infrastructure

**Impact**: Stack creation will fail immediately.

### 3. Hardcoded Master Password in Template
**Issue**: MasterUserPassword is hardcoded as "MyPassword123!" in the template.

**What's Wrong**:
- Security vulnerability - password visible in template
- Should use AWS Secrets Manager or NoEcho parameter
- Violates security best practices

**Impact**: Severe security risk, credentials exposed.

### 4. Incomplete Backtrack Configuration
**Issue**: Backtrack is not enabled on the primary cluster, violating constraint requirement.

**What's Missing**:
- BacktrackWindow property set to 86400 (24 hours in seconds)

**Impact**: Missing required constraint from specifications.

### 5. Missing Parameter Group with Binary Log Disabled
**Issue**: No custom parameter group created, and binary logging not disabled for read replicas.

**What's Missing**:
- AWS::RDS::DBClusterParameterGroup resource
- Parameter to disable binlog_format for replicas

**Impact**: Violates explicit constraint requirement.

### 6. Incomplete Subnet Configuration
**Issue**: DBSubnetGroup only has 2 subnets, but requirement states "at least 3 availability zones per region".

**What's Wrong**:
- Only 2 subnets specified
- Should have minimum 3 subnets across 3 AZs

**Impact**: Violates availability zone constraint.

## Moderate Errors

### 7. Lambda Timeout Exceeds Requirement
**Issue**: Lambda function timeout is set to 10 seconds, but requirement states "must complete within 5 seconds timeout".

**What's Wrong**:
- Timeout: 10 (should be 5)

**Impact**: Violates performance constraint.

### 8. Incomplete Lambda Health Check Logic
**Issue**: Lambda function has stub implementation that doesn't actually perform database health checks.

**What's Wrong**:
- Just returns success without testing connection
- Missing environment variables (CLUSTER_ID, DB_USER, DB_PASSWORD)
- Missing pymysql dependency layer

**Impact**: Health checks won't work properly.

### 9. Wrong EventBridge Schedule
**Issue**: HealthCheckSchedule uses "rate(1 minute)" instead of 30 seconds as required.

**What's Wrong**:
- Schedule runs every 60 seconds
- Requirement states "every 30 seconds"

**Impact**: Health checks run at wrong interval.

### 10. Missing Lambda Permission for EventBridge
**Issue**: No AWS::Lambda::Permission resource to allow EventBridge to invoke the Lambda function.

**What's Wrong**:
- EventBridge cannot invoke Lambda without permission
- Template will deploy but health checks won't trigger

**Impact**: Health monitoring system won't function.

### 11. Incomplete Route 53 Health Check
**Issue**: Route 53 health check doesn't have ResourcePath or proper domain configuration.

**What's Missing**:
- ResourcePath for the endpoint to check
- IPAddress or FullyQualifiedDomainName property
- Missing actual endpoint reference

**Impact**: Health check cannot monitor anything useful.

### 12. Missing Route 53 Weighted Routing Policy
**Issue**: No Route 53 hosted zone or record sets configured for weighted routing and failover.

**What's Missing**:
- AWS::Route53::RecordSet resources
- Weighted routing policy configuration
- Primary and secondary endpoint DNS records

**Impact**: No DNS-based failover capability.

### 13. Incomplete CloudWatch Alarm
**Issue**: ReplicationLagAlarm doesn't have Dimensions property to specify which cluster to monitor.

**What's Wrong**:
- Missing Dimensions property with DBClusterIdentifier

**Impact**: Alarm won't monitor any specific cluster.

### 14. Missing Second DB Instance
**Issue**: Only one DB instance (PrimaryInstance1) created for primary cluster, but high availability typically needs at least 2.

**What's Wrong**:
- Should have PrimaryInstance2 for redundancy

**Impact**: Reduced availability in primary region.

## Minor Errors

### 15. Overly Permissive IAM Role
**Issue**: LambdaExecutionRole uses "AmazonRDSFullAccess" managed policy, violating least-privilege principle.

**What's Wrong**:
- Full RDS access is excessive
- Should only have rds:DescribeDBClusters permission

**Impact**: Security concern, excessive permissions.

### 16. Missing Tags on Resources
**Issue**: No tags defined on any resources for organization and cost tracking.

**What's Missing**:
- Tags property on all resources
- Should include Environment, Application, ManagedBy tags

**Impact**: Poor resource management and cost tracking.

### 17. Missing VPC Security Group
**Issue**: No security group defined for Aurora cluster, database instances, or Lambda functions.

**What's Missing**:
- AWS::EC2::SecurityGroup for Aurora
- VPCSecurityGroupIds property on cluster

**Impact**: Network connectivity issues.

### 18. Incomplete Outputs Section
**Issue**: Outputs section missing critical information like reader endpoint, KMS key ARN, Lambda function ARN.

**What's Missing**:
- Reader endpoint output
- KMS key ARN
- Lambda function details

**Impact**: Difficult to reference resources after deployment.

### 19. Missing DependsOn Relationships
**Issue**: No explicit DependsOn properties to ensure correct resource creation order.

**What's Wrong**:
- PrimaryCluster should depend on GlobalCluster being fully created
- Lambda schedule should depend on Lambda permission

**Impact**: Potential race conditions during stack creation.

### 20. No Rollback Configuration
**Issue**: Template doesn't include any rollback monitoring or alarms.

**What's Missing**:
- CloudFormation stack policy
- Rollback triggers

**Impact**: Failed deployments may leave infrastructure in bad state.

## Summary

Total Errors: 20
- Critical: 6 (prevent basic functionality)
- Moderate: 9 (prevent full requirements compliance)
- Minor: 5 (best practices and operational concerns)

The IDEAL_RESPONSE.md will address all these issues with a complete, production-ready implementation.
