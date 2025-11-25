# Anticipated Issues and Failure Modes

## Deployment Failures

### 1. Aurora Global Cluster Provisioning Time

**Issue**: Aurora db.r6g.large instances take 15-20 minutes to provision, which may cause deployment timeouts.

**Symptoms**:
- CDKTF deployment hangs at Aurora cluster creation
- Timeout errors after 15-20 minutes
- "Cluster is still being created" status

**Mitigation**:
- Increase CDKTF timeout configuration
- Use Aurora Serverless v2 for faster provisioning (if compatible)
- Deploy Aurora resources in separate stack first

**Code Fix**:
```python
# Consider Aurora Serverless v2 for faster provisioning
# However, this requires engine mode change
RdsCluster(
    self,
    "primary_aurora_cluster",
    engine_mode="provisioned",  # Current
    # vs
    # engine_mode="serverless",  # Alternative
    # serverless_v2_scaling_configuration={
    #     "min_capacity": 0.5,
    #     "max_capacity": 2
    # }
)
```

### 2. VPC Peering Cross-Region Dependencies

**Issue**: VPC peering accepter may fail if requester VPC is not fully created.

**Symptoms**:
- "VPC peering connection not found" errors
- Intermittent failures on first deployment
- Routes not created in secondary region

**Mitigation**:
- Explicit `depends_on` relationships already added
- May need retry logic for peering acceptance
- Ensure both providers are properly configured

**Resolution**: Code already includes proper dependencies:
```python
depends_on=[vpc_peering_accepter]
```

### 3. Lambda VPC Cold Start Issues

**Issue**: Lambda functions in VPC may experience 10-15 second cold starts.

**Symptoms**:
- Slow initial Lambda invocations
- Timeout errors on first request
- ENI creation delays

**Mitigation**:
- Increase Lambda timeout to 60 seconds (already configured)
- Consider provisioned concurrency for critical functions
- Use Lambda SnapStart (not available for Python yet)

**Impact**: Affects initial RTO but not steady-state performance.

### 4. S3 Replication Role Permissions

**Issue**: S3 replication may fail if IAM role is not fully propagated before replication configuration.

**Symptoms**:
- "Access Denied" errors on replication setup
- Replication status shows "Failed"
- Objects not replicating to secondary bucket

**Mitigation**:
- Code includes `depends_on=[s3_replication_policy]`
- IAM role has external ID validation
- May need 1-2 minute delay for IAM propagation

**Resolution**: Already handled with dependency chain.

## Configuration Issues

### 5. DynamoDB Global Table Region Conflicts

**Issue**: DynamoDB Global Tables cannot be created if table with same name exists in replica region.

**Symptoms**:
- "ResourceInUseException: Table already exists"
- Replication configuration fails
- Deployment rollback

**Mitigation**:
- Use unique table names with environment suffix (already implemented)
- Verify no conflicting tables in secondary region
- Clean up failed deployments completely

**Prevention**: Resource naming includes `environment_suffix`:
```python
name=f"dr-payment-sessions-{environment_suffix}"
```

### 6. Route 53 Health Check False Positives

**Issue**: Health checks may fail initially because Aurora endpoints aren't immediately accessible.

**Symptoms**:
- Health checks report "Unhealthy" status
- Failover triggers prematurely
- DNS points to secondary before primary is ready

**Mitigation**:
- Set appropriate failure threshold (3 checks = 90 seconds)
- Use TCP health checks instead of HTTPS during initial setup
- Monitor health check status during deployment

**Alternative Configuration**:
```python
# More lenient health check
Route53HealthCheck(
    self,
    "primary_health_check",
    type="TCP",  # Instead of HTTPS_STR_MATCH
    port=3306,   # Aurora port
    request_interval=30,
    failure_threshold=5,  # Increased from 3
)
```

### 7. Lambda Deployment Package Missing

**Issue**: Lambda functions reference `lambda_function.zip` which may not exist during first deployment.

**Symptoms**:
- "File not found: lambda_function.zip"
- Lambda creation fails
- Deployment aborted

**Mitigation**:
- Build script provided: `lib/lambda/build_lambda.sh`
- Create dummy zip file for initial deployment
- Use lifecycle ignore_changes (already configured)

**Pre-deployment Check**:
```bash
# Ensure Lambda package exists
bash lib/lambda/build_lambda.sh
ls -lh lambda_function.zip
```

### 8. Aurora Master Password in Code

**Issue**: Aurora master password is hardcoded in stack (security risk).

**Symptoms**:
- Password visible in Terraform state
- Non-compliant with security policies
- Secrets exposed in version control

**Mitigation**:
- Use AWS Secrets Manager for password storage
- Fetch secret at deployment time
- Rotate passwords regularly

**Improved Implementation**:
```python
# Fetch from Secrets Manager
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import (
    DataAwsSecretsmanagerSecretVersion
)

db_secret = DataAwsSecretsmanagerSecretVersion(
    self,
    "db_secret",
    secret_id="dr-aurora-master-password",
    provider=primary_provider,
)

primary_aurora_cluster = RdsCluster(
    # ...
    master_password=db_secret.secret_string,
)
```

## Runtime Failures

### 9. Aurora Replication Lag Exceeds Threshold

**Issue**: Network issues or heavy write load may cause replication lag > 60 seconds.

**Symptoms**:
- CloudWatch alarms trigger repeatedly
- SNS notifications flood operations team
- Secondary cluster falls behind

**Mitigation**:
- Scale up Aurora instance class
- Optimize write patterns in application
- Consider read replicas in primary region
- Review CloudWatch metrics for bottlenecks

**Monitoring**:
```bash
# Monitor replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=dr-payment-primary-{env}
```

### 10. EventBridge Rule Not Triggering Lambda

**Issue**: EventBridge events may not match pattern or Lambda permissions missing.

**Symptoms**:
- Payment events published but Lambda not invoked
- CloudWatch Logs show no Lambda executions
- EventBridge metrics show 0 invocations

**Mitigation**:
- Verify event pattern matches actual event structure
- Check Lambda permissions for EventBridge
- Enable EventBridge rule logging

**Debug Steps**:
```bash
# Check EventBridge rule
aws events describe-rule \
  --name dr-payment-event-rule-primary-{env} \
  --region us-east-1

# Check Lambda permissions
aws lambda get-policy \
  --function-name dr-payment-processor-primary-{env} \
  --region us-east-1

# Test event pattern
aws events put-events \
  --entries '[{"Source":"payment.service","DetailType":"Payment Transaction","Detail":"{}"}]'
```

### 11. S3 Replication Delays

**Issue**: S3 replication may take longer than 15 minutes for large files.

**Symptoms**:
- Objects not appearing in secondary bucket
- Replication metrics show high lag
- RTO target exceeded for object recovery

**Mitigation**:
- S3 Replication Time Control (RTC) already configured
- Monitor replication metrics
- Use smaller object sizes when possible
- Consider alternative storage for time-sensitive data

**Already Implemented**:
```python
replication_time={"status": "Enabled", "time": {"minutes": 15}}
```

### 12. DynamoDB Throttling on Global Table

**Issue**: High write volume may cause throttling even with on-demand billing.

**Symptoms**:
- "ProvisionedThroughputExceededException" errors
- Lambda functions retry repeatedly
- Increased latency for payment processing

**Mitigation**:
- On-demand billing already configured (handles bursts)
- Implement exponential backoff in Lambda code
- Monitor DynamoDB consumed capacity
- Consider provisioned capacity with auto-scaling

**Lambda Error Handling**:
```python
import time
from botocore.exceptions import ClientError

def write_to_dynamodb_with_retry(item, max_retries=3):
    for attempt in range(max_retries):
        try:
            dynamodb.put_item(TableName=table_name, Item=item)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'ProvisionedThroughputExceededException':
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
    return False
```

## Security Issues

### 13. IAM Role External ID Validation

**Issue**: External ID in assume role policy may be too predictable.

**Symptoms**:
- Potential unauthorized role assumption
- Security audit findings
- Compliance violations

**Mitigation**:
- Use cryptographically random external IDs
- Store in Secrets Manager
- Rotate periodically

**Current Implementation** (predictable):
```python
"sts:ExternalId": f"dr-replication-{environment_suffix}"
```

**Improved Implementation**:
```python
import secrets

external_id = secrets.token_urlsafe(32)
# Store in Secrets Manager and retrieve
```

### 14. Security Group Too Permissive

**Issue**: Aurora security group allows access from entire VPC CIDR blocks.

**Symptoms**:
- Overly broad network access
- Increased attack surface
- Compliance violations

**Mitigation**:
- Restrict to Lambda security group only
- Use security group references instead of CIDR blocks
- Implement network segmentation

**Improved Configuration**:
```python
SecurityGroupIngress(
    from_port=3306,
    to_port=3306,
    protocol="tcp",
    source_security_group_id=primary_lambda_sg.id,  # Instead of CIDR blocks
    description="MySQL access from Lambda only",
)
```

## Failover Testing Issues

### 15. Manual Failover Procedure Not Documented

**Issue**: No automated way to promote secondary Aurora cluster to primary.

**Symptoms**:
- Confusion during actual disaster
- Extended RTO due to manual intervention
- Potential data loss

**Mitigation**:
- Document failover runbook
- Create automation scripts
- Test failover regularly (quarterly)

**Failover Script**:
```bash
#!/bin/bash
# Promote secondary Aurora cluster to primary

aws rds remove-from-global-cluster \
  --region us-west-2 \
  --db-cluster-identifier dr-payment-secondary-{env} \
  --global-cluster-identifier dr-payment-global-{env}

aws rds modify-db-cluster \
  --region us-west-2 \
  --db-cluster-identifier dr-payment-secondary-{env} \
  --apply-immediately
```

### 16. Route 53 Failover Testing Impact

**Issue**: Testing failover by disabling health checks affects production traffic.

**Symptoms**:
- Production traffic routed to untested secondary
- Potential service disruption
- Customer impact

**Mitigation**:
- Use weighted routing for gradual cutover
- Test in non-production environment first
- Implement blue/green deployment pattern
- Monitor metrics during testing

## Cleanup Issues

### 17. Aurora Global Cluster Deletion Order

**Issue**: Aurora Global Cluster must be deleted before regional clusters.

**Symptoms**:
- "Cannot delete cluster: part of global cluster" errors
- Stack deletion fails
- Manual intervention required

**Mitigation**:
- Remove secondary cluster from global cluster first
- Delete global cluster
- Delete primary cluster last
- Script the deletion order

**Deletion Script**:
```bash
# 1. Remove secondary from global cluster
aws rds remove-from-global-cluster \
  --db-cluster-identifier dr-payment-secondary-{env} \
  --global-cluster-identifier dr-payment-global-{env}

# 2. Delete global cluster
aws rds delete-global-cluster \
  --global-cluster-identifier dr-payment-global-{env}

# 3. Delete regional clusters
cdktf destroy
```

### 18. S3 Bucket Not Empty

**Issue**: S3 buckets with objects cannot be deleted by CDKTF.

**Symptoms**:
- "BucketNotEmpty" errors during destroy
- Stack deletion fails
- Manual cleanup required

**Mitigation**:
- Add lifecycle policy to expire objects
- Create pre-destroy script to empty buckets
- Use force_destroy option (not recommended for production)

**Pre-Destroy Script**:
```bash
#!/bin/bash
# Empty S3 buckets before destroy

for bucket in $(aws s3api list-buckets --query 'Buckets[?starts_with(Name, `dr-payment-docs`)].Name' --output text); do
  echo "Emptying bucket: $bucket"
  aws s3 rm "s3://$bucket" --recursive
  aws s3api delete-bucket-versioning --bucket "$bucket"
done
```

## Monitoring Gaps

### 19. No Application-Level Health Checks

**Issue**: Route 53 health checks verify endpoint availability but not application health.

**Symptoms**:
- Database errors not detected by health checks
- Traffic routed to unhealthy but available endpoint
- False sense of availability

**Mitigation**:
- Implement application health endpoint
- Check database connectivity
- Verify DynamoDB access
- Test S3 access

**Health Endpoint Example**:
```python
def health_check():
    """Application health check endpoint."""
    checks = {
        'database': check_aurora_connection(),
        'dynamodb': check_dynamodb_access(),
        's3': check_s3_access(),
    }
    
    if all(checks.values()):
        return {'status': 'OK', 'checks': checks}
    else:
        return {'status': 'UNHEALTHY', 'checks': checks}, 503
```

### 20. Missing Cost Alerts

**Issue**: No CloudWatch alarms for unexpected cost increases.

**Symptoms**:
- Runaway costs from misconfiguration
- Unexpected AWS bills
- Budget overruns

**Mitigation**:
- Implement AWS Budgets
- Set up billing alarms
- Monitor CloudWatch metrics for resource usage
- Regular cost reviews

**Budget Configuration**:
```python
# Add to stack
from cdktf_cdktf_provider_aws.budgets_budget import BudgetsBudget

BudgetsBudget(
    self,
    "monthly_budget",
    name=f"dr-monthly-budget-{environment_suffix}",
    budget_type="COST",
    limit_amount="1000",
    limit_unit="USD",
    time_unit="MONTHLY",
    notification=[{
        "comparison_operator": "GREATER_THAN",
        "notification_type": "ACTUAL",
        "threshold": 80,
        "threshold_type": "PERCENTAGE",
        "subscriber_email_addresses": ["ops@example.com"],
    }],
)
```

## Summary

The most critical issues to address before production deployment:

1. **Aurora password management**: Move to Secrets Manager
2. **Health check refinement**: Add application-level checks
3. **Failover automation**: Script and test failover procedures
4. **Security group tightening**: Use security group references
5. **Cost monitoring**: Implement budgets and alerts

Regular testing and monitoring will catch most runtime issues before they impact production.
