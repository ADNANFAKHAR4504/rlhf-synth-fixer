# Multi-Region Disaster Recovery Solution - Implementation Guide

This document explains the ideal implementation approach for a multi-region disaster recovery solution using CDKTF with Python.

## Solution Overview

The implementation provides a complete active-passive disaster recovery architecture across two AWS regions (us-east-1 as primary and us-west-2 as secondary) for a payment processing application. The solution ensures business continuity with minimal data loss through automated health monitoring and failover capabilities.

## Architecture Design Decisions

### 1. Multi-Region Strategy

**Decision**: Active-passive configuration with automated health checks
**Rationale**:
- Primary region (us-east-1) handles all write traffic
- Secondary region (us-west-2) maintains read replicas for fast failover
- Cost-effective compared to active-active while meeting RTO/RPO requirements
- Automated health checks enable rapid detection of failures

### 2. Networking Architecture

**Decision**: Separate VPCs per region with VPC peering
**Rationale**:
- Isolation provides security and fault tolerance
- VPC peering enables secure cross-region communication for replication
- 3 AZs per region ensures high availability within each region
- Private subnets protect databases and Lambda functions
- NAT Gateways provide secure outbound internet access

**Implementation Details**:
- Primary VPC: 10.0.0.0/16 CIDR
- Secondary VPC: 10.1.0.0/16 CIDR (non-overlapping)
- 3 private subnets per region for workloads
- 3 public subnets per region for NAT Gateways
- One NAT Gateway per AZ for high availability

### 3. Database Layer

**Decision**: RDS Aurora PostgreSQL 14.x Global Database
**Rationale**:
- Global Database provides sub-second replication lag between regions
- Aurora PostgreSQL 14.x offers excellent performance and compatibility
- Automated backups with 7-day retention meet compliance requirements
- Read replicas in secondary region enable fast promotion during failover

**Implementation Details**:
- Global cluster with writer in primary, reader in secondary
- 2 instances per cluster (db.r6g.large) for high availability
- Automated backups scheduled during low-traffic windows
- skip_final_snapshot=True for easier testing/cleanup
- Security groups restrict access to VPC CIDR ranges only

### 4. Compute Layer

**Decision**: Lambda functions in both regions
**Rationale**:
- Serverless eliminates infrastructure management overhead
- 1GB memory provides sufficient resources for payment processing
- Identical deployment in both regions ensures consistent behavior
- VPC integration allows secure database and service access

**Implementation Details**:
- Python 3.11 runtime for latest features and performance
- Environment variables configure region-specific settings
- IAM roles follow least-privilege principle
- lifecycle ignore_changes prevents accidental code overwrites

### 5. Session Storage

**Decision**: DynamoDB Global Tables
**Rationale**:
- Automatic multi-region replication with sub-second latency
- On-demand billing scales automatically with load
- Point-in-time recovery provides additional data protection
- Serverless reduces operational overhead

**Implementation Details**:
- Primary table in us-east-1 with replica in us-west-2
- DynamoDB streams enable replication
- Point-in-time recovery enabled on both replicas
- session_id as partition key for optimal distribution

### 6. DNS and Failover

**Decision**: Route 53 failover routing with health checks
**Rationale**:
- Automatic failover based on health check status
- Low TTL (60 seconds) enables fast DNS propagation
- CloudWatch metric-based health checks provide application-level monitoring
- Private hosted zone suitable for internal applications

**Implementation Details**:
- Primary record with PRIMA RY routing policy
- Secondary record with SECONDARY routing policy
- Health checks monitor Lambda invocations
- 30-second check intervals for fast failure detection

### 7. Monitoring and Alerting

**Decision**: CloudWatch Alarms with SNS notifications
**Rationale**:
- Real-time monitoring of replication lag
- Proactive alerting on Lambda errors
- Email notifications ensure rapid response
- Integration with existing AWS monitoring infrastructure

**Implementation Details**:
- Replication lag alarm threshold: 1000ms (1 second)
- Lambda error alarm threshold: 5 errors in 5 minutes
- SNS topic for centralized notification management
- Alarms in primary region for simplified management

### 8. Security

**Decision**: Secrets Manager with cross-region replication
**Rationale**:
- Secure storage of database credentials
- Automatic replication ensures secondary region has access
- Rotation capabilities for enhanced security
- IAM-based access control

**Implementation Details**:
- Database credentials stored in JSON format
- Replica region automatically created in us-west-2
- IAM policies grant Lambda functions access to secrets
- Resource-specific ARNs prevent unauthorized access

## Resource Naming Convention

All resources follow a consistent naming pattern:
```
{service}-{resource-type}-{region-suffix}-{environment-suffix}
```

Examples:
- `payment-vpc-use1-dev` (Primary VPC)
- `payment-lambda-role-usw2-prod` (Secondary Lambda IAM role)
- `payment-cluster-use1-dev` (Primary Aurora cluster)

**Benefits**:
- Easy identification of resource purpose and location
- Consistent naming across all infrastructure
- Environment isolation through suffix
- Supports multiple deployments without conflicts

## environmentSuffix Usage

The `environment_suffix` parameter (passed via kwargs) is used throughout the implementation:

1. **Resource Names**: All resources include the suffix for uniqueness
2. **Tags**: Resources are tagged with the environment
3. **State Files**: Terraform state files are organized by environment
4. **Isolation**: Different environments (dev, staging, prod) can coexist

Example from code:
```python
environment_suffix = kwargs.get('environment_suffix', 'dev')

# Used in resource names
vpc = Vpc(
    self,
    "primary_vpc",
    tags={"Name": f"payment-vpc-use1-{environment_suffix}"}
)

# Used in state file paths
S3Backend(
    self,
    key=f"{environment_suffix}/{construct_id}.tfstate"
)
```

## Multi-Provider Configuration

The implementation uses CDKTF provider aliases for multi-region deployment:

```python
# Primary region provider
primary_provider = AwsProvider(
    self,
    "aws_primary",
    region="us-east-1",
    alias="primary"
)

# Secondary region provider
secondary_provider = AwsProvider(
    self,
    "aws_secondary",
    region="us-west-2",
    alias="secondary"
)
```

**Key Points**:
- Single CDKTF stack manages resources in both regions
- Provider aliases ensure resources deploy to correct regions
- Simplified dependency management across regions
- Unified state file for both regions

## Dependency Management

Critical dependencies are explicitly defined:

1. **Global Cluster → Primary Cluster**: Global cluster must exist first
   ```python
   primary_cluster = RdsCluster(
       depends_on=[global_cluster]
   )
   ```

2. **Primary Cluster → Secondary Cluster**: Primary must be writer
   ```python
   secondary_cluster = RdsCluster(
       depends_on=[primary_cluster]
   )
   ```

3. **NAT Gateways → EIPs**: Elastic IPs must be allocated first
   (Implicit dependency through resource references)

## Security Best Practices

### 1. Network Security

- **Private Subnets**: Databases and Lambda functions in private subnets
- **Security Groups**: Minimal required access only
- **VPC Peering**: Secure cross-region communication without internet exposure

### 2. IAM Security

- **Least Privilege**: Lambda IAM policies grant only required permissions
- **Resource-Specific**: ARNs reference specific resources, not wildcards
- **Assume Role Policies**: Standard Lambda service principal

Example IAM policy:
```python
policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
        ],
        "Resource": db_secret.arn  # Specific resource, not "*"
    }]
})
```

### 3. Data Security

- **Encryption at Rest**: Aurora storage encryption enabled
- **Encryption in Transit**: TLS enforced for database connections
- **Secrets Management**: Credentials never hardcoded in code

## Cost Optimization

### Implemented Optimizations

1. **Serverless Services**:
   - Lambda: Pay per invocation
   - DynamoDB: On-demand billing
   - No always-on compute resources

2. **Right-Sized Resources**:
   - Aurora: db.r6g.large (ARM-based, cost-effective)
   - Lambda: 1GB memory (sufficient for payment processing)

### Cost Considerations

**High-Cost Resources** (adjust for production):
- **NAT Gateways**: $0.045/hour × 6 = ~$194/month
  - Consider: Reduce to 1 per region for dev environments
- **Aurora Instances**: db.r6g.large × 4 = ~$600/month
  - Consider: Use Aurora Serverless v2 for variable workloads

**Cost-Effective Resources**:
- Lambda: Pay per invocation (~$0.20 per 1M requests)
- DynamoDB: On-demand scales to zero when not in use
- Route 53: Minimal cost for hosted zones and health checks

## Disaster Recovery Testing

### Failover Testing Procedure

1. **Verify Baseline**:
   ```bash
   # Check replication lag
   aws cloudwatch get-metric-statistics \
     --namespace AWS/RDS \
     --metric-name AuroraGlobalDBReplicationLag \
     --dimensions Name=DBClusterIdentifier,Value=payment-cluster-usw2-dev
   ```

2. **Simulate Primary Failure**:
   ```bash
   # Stop primary Lambda
   aws lambda update-function-configuration \
     --function-name payment-webhook-handler-use1-dev \
     --environment '{"Variables":{"ENABLED":"false"}}'
   ```

3. **Monitor Failover**:
   - Check Route 53 health check status (should go unhealthy)
   - Verify DNS resolves to secondary endpoint
   - Test Lambda invocation in secondary region

4. **Restore Primary**:
   ```bash
   # Re-enable primary Lambda
   aws lambda update-function-configuration \
     --function-name payment-webhook-handler-use1-dev \
     --environment '{"Variables":{"ENABLED":"true"}}'
   ```

### Expected RTO/RPO

- **RTO (Recovery Time Objective)**: ~2 minutes
  - DNS propagation: 60 seconds (TTL)
  - Health check detection: 30 seconds
  - Application restart: minimal (Lambda)

- **RPO (Recovery Point Objective)**: <1 second
  - Aurora Global Database replication lag typically <1 second
  - DynamoDB global tables typically <1 second

## Deployment Workflow

### Initial Deployment

1. **Prerequisites Check**:
   ```bash
   # Verify CDKTF installation
   cdktf --version  # Should be 0.19.0+

   # Verify Python version
   python --version  # Should be 3.9+

   # Verify AWS credentials
   aws sts get-caller-identity
   ```

2. **Install Dependencies**:
   ```bash
   pipenv install
   cdktf get
   ```

3. **Create Lambda Package**:
   ```bash
   cd lib/lambda
   zip -r ../../lambda_placeholder.zip .
   cd ../..
   ```

4. **Synthesize**:
   ```bash
   cdktf synth
   # Review generated Terraform in cdktf.out/
   ```

5. **Deploy**:
   ```bash
   cdktf deploy
   # Approve resource creation when prompted
   ```

6. **Verify Outputs**:
   ```bash
   cdktf output
   # Note endpoints, ARNs, and other important values
   ```

### Updates and Changes

1. **Code Changes**:
   - Modify lib/tap_stack.py
   - Run `cdktf synth` to preview changes
   - Run `cdktf deploy` to apply changes

2. **Lambda Updates**:
   ```bash
   # Package new Lambda code
   cd lib/lambda
   zip -r ../../lambda_deployment.zip .
   cd ../..

   # Update functions
   aws lambda update-function-code \
     --function-name payment-webhook-handler-use1-dev \
     --zip-file fileb://lambda_deployment.zip
   ```

### Cleanup

```bash
# Destroy all resources
cdktf destroy

# Clean up generated files
rm -rf cdktf.out/ .terraform/
```

## Troubleshooting Common Issues

### Issue 1: Replication Lag Too High

**Symptoms**: CloudWatch alarm triggered for replication lag

**Possible Causes**:
- High write volume on primary database
- Network connectivity issues between regions
- Secondary cluster undersized

**Resolution**:
1. Check CloudWatch metrics for write IOPS
2. Verify VPC peering connection status
3. Consider scaling up secondary cluster instances

### Issue 2: Lambda Function Timeout

**Symptoms**: Lambda execution times exceed 30 seconds

**Possible Causes**:
- Database connection not reused
- Cold start overhead
- Inefficient query patterns

**Resolution**:
1. Implement connection pooling
2. Increase Lambda timeout if needed
3. Optimize database queries
4. Enable Lambda provisioned concurrency for critical functions

### Issue 3: DynamoDB Replication Delays

**Symptoms**: Data not appearing in secondary region immediately

**Expected Behavior**: Sub-second replication is typical, but can vary

**Resolution**:
1. Check DynamoDB streams are enabled
2. Verify table configuration in both regions
3. Monitor CloudWatch metrics for replication lag
4. Consider eventual consistency in application logic

### Issue 4: Route 53 Not Failing Over

**Symptoms**: Traffic continues to primary despite health check failure

**Possible Causes**:
- DNS caching on client side
- Health check threshold not met
- Incorrect failover policy configuration

**Resolution**:
1. Clear DNS cache on client
2. Review health check evaluation periods
3. Verify failover routing policies are correctly set
4. Test with dig/nslookup to verify DNS resolution

## Production Recommendations

### Before Going Live

1. **Security Hardening**:
   - Replace placeholder database passwords with Secrets Manager-generated values
   - Enable AWS Config for compliance tracking
   - Implement AWS WAF if exposing APIs publicly
   - Enable CloudTrail for audit logging

2. **Monitoring Enhancements**:
   - Add custom CloudWatch dashboards
   - Configure PagerDuty/Opsgenie for SNS alerts
   - Implement application-level health checks
   - Set up synthetic monitoring (Canary tests)

3. **Backup Verification**:
   - Test backup restoration procedures
   - Document backup retention policies
   - Verify cross-region backup replication

4. **Disaster Recovery Testing**:
   - Schedule regular DR drills (quarterly)
   - Document failover procedures
   - Train operations team on manual failover
   - Test complete region failure scenarios

5. **Cost Optimization**:
   - Right-size Aurora instances based on actual load
   - Consider Aurora Serverless v2 for variable workloads
   - Reduce NAT Gateways to 1 per region if appropriate
   - Implement cost alerts and budgets

6. **Performance Tuning**:
   - Load test the application
   - Optimize Lambda memory allocation
   - Tune database parameters
   - Implement caching where appropriate

### Compliance Considerations

- **PCI DSS**: If processing payment cards, ensure PCI compliance
- **GDPR/Data Residency**: Verify data storage locations meet requirements
- **SOC 2**: Implement necessary controls and logging
- **HIPAA**: If handling health data, enable additional encryption

## Conclusion

This implementation provides a robust, production-ready multi-region disaster recovery solution for payment processing. Key strengths include:

- **Reliability**: Multi-region architecture with automated failover
- **Security**: Least-privilege IAM, encrypted data, private networking
- **Scalability**: Serverless components scale automatically
- **Cost-Effective**: Serverless services reduce operational costs
- **Maintainable**: Clear resource naming, comprehensive outputs, well-documented

The solution successfully meets all mandatory requirements while providing a solid foundation for future enhancements and production deployment.
