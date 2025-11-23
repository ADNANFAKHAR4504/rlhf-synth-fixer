# Known Issues and Improvements Needed

This document tracks known issues in the MODEL_RESPONSE implementation that need to be addressed by the QA phase.

## Critical Issues

### 1. Aurora Global Database Configuration

**Issue**: The current implementation creates separate Aurora clusters in primary and secondary regions but does NOT properly configure them as an Aurora Global Database.

**Current Code**:
```python
# Primary cluster - standalone
cluster = rds.DatabaseCluster(...)

# Secondary cluster - standalone (with note)
cluster = rds.DatabaseCluster(...)
# Note: In real implementation, this would need CfnGlobalCluster
```

**Impact**:
- No actual global database replication between regions
- Write forwarding not configured
- Does not meet the requirement for Aurora Global Database

**Required Fix**:
- Use `rds.CfnGlobalCluster` to create the global database construct
- Attach primary cluster to global cluster
- Attach secondary cluster to global cluster after primary is available
- Configure write forwarding on secondary cluster
- Ensure proper dependencies and timing (20-30 minute wait for primary)

**Reference**: See tasks 3z4jg7, 5b0vj4 (similar failures with Aurora Global Database)

---

### 2. S3 Cross-Region Replication Not Fully Implemented

**Issue**: The code creates IAM roles and permissions for S3 replication but does NOT configure the actual replication rules.

**Current Code**:
```python
# Note: CfnBucket.ReplicationConfigurationProperty would be used
# for actual replication configuration with RTC
```

**Impact**:
- S3 buckets created but no replication configured
- RTC (Replication Time Control) not enabled
- Does not meet requirement for cross-region replication

**Required Fix**:
- Use `s3.CfnBucket` or escape hatch to configure `ReplicationConfiguration`
- Add `ReplicationRule` with `ReplicationTimeControl` enabled
- Configure destination bucket ARN
- Set up proper priority and filter rules

---

### 3. Route 53 Health Check Incorrect Configuration

**Issue**: The health check is configured for HTTPS with port 443, but the ALB listener only supports HTTP on port 80.

**Current Code**:
```python
health_check_config=route53.CfnHealthCheck.HealthCheckConfigProperty(
    type="HTTPS",  # ← HTTPS
    port=443,      # ← Port 443
    ...
)
# But ALB only has HTTP listener on port 80
```

**Impact**:
- Health checks will always fail
- Failover will not work correctly
- Route 53 will never mark primary as healthy

**Required Fix**:
- Change health check type to "HTTP"
- Change port to 80
- Or add HTTPS listener with ACM certificate to ALB

---

### 4. EventBridge Cross-Region Replication Not Implemented

**Issue**: EventBridge event bus and rules created but no cross-region targets configured.

**Current Code**:
```python
if self.is_primary:
    # Add cross-region target
    # Note: This would use EventBridge global endpoints in production
    pass  # ← No implementation
```

**Impact**:
- Events not replicated between regions
- No cross-region event delivery

**Required Fix**:
- Add EventBridge API destination or cross-region event bus target
- Configure event bus policy for cross-region delivery
- Set up proper IAM permissions for cross-region event publishing

---

### 5. Secondary Region Route 53 Records Not Created

**Issue**: Route 53 weighted records only created in primary region. Secondary region needs its own record with weight=0.

**Current Code**:
```python
# Note: Secondary region health check and record would be created
# in the secondary region stack with weight=0
```

**Impact**:
- Secondary region ALB not registered with Route 53
- Failover cannot work - no secondary endpoint to failover to

**Required Fix**:
- Create Route 53 health check in secondary region
- Create weighted record in secondary region with weight=0
- Reference the same hosted zone (requires cross-region lookup or parameter)
- Configure proper failover routing policy

---

## Medium Priority Issues

### 6. Missing __init__.py Files

**Issue**: The lib/ directory needs an `__init__.py` file for Python module imports.

**Impact**: Import errors when running CDK commands.

**Required Fix**: Add empty `__init__.py` to lib/ directory.

---

### 7. Hardcoded Domain Name

**Issue**: Route 53 hosted zone uses example domain `trading-{suffix}.example.com`.

**Current Code**:
```python
zone_name=f"trading-{self.environment_suffix}.example.com"
```

**Impact**: Cannot be used for actual DNS routing without custom domain.

**Required Fix**: Make domain name a parameter or use environment variable.

---

### 8. Missing Aurora Global Database Replication Lag Metric

**Issue**: CloudWatch alarm uses wrong metric for global database replication lag.

**Current Code**:
```python
metric=self.aurora_cluster.metric_global_database_replicated_write_io(...)
```

**Impact**: Alarm may not accurately measure replication lag.

**Required Fix**: Use `AuroraGlobalDBReplicationLag` metric from CloudWatch namespace.

---

### 9. DynamoDB Global Table May Fail on Secondary

**Issue**: DynamoDB global table only created in primary region. CDK automatically handles replication, but secondary stack may encounter conflicts.

**Current Code**:
```python
if self.is_primary:
    self.dynamodb_table = self._create_dynamodb_global_table()
```

**Impact**: Secondary stack may try to access non-existent table.

**Required Fix**:
- Import existing table in secondary region
- Or use conditional logic to only output table name from primary

---

### 10. ECS Container Image Placeholder

**Issue**: Uses sample container image instead of actual trading application.

**Current Code**:
```python
image=ecs.ContainerImage.from_registry("amazon/amazon-ecs-sample")
```

**Impact**: Sample image may not have /health endpoint, causing health checks to fail.

**Required Fix**:
- Use actual trading application image
- Or ensure sample image has proper health check endpoint
- Document that image needs to be replaced

---

## Low Priority Issues

### 11. Missing CDK App Metadata

**Issue**: No cdk.json configuration file.

**Impact**: CDK CLI may need additional parameters.

**Required Fix**: Create cdk.json with proper app configuration.

---

### 12. No .gitignore

**Issue**: No .gitignore file for Python CDK project.

**Impact**: Generated files and cdk.out/ may be committed.

**Required Fix**: Add standard CDK Python .gitignore.

---

## Testing Recommendations

1. **Aurora Global Database**: Test primary cluster deployment, wait for "available" state, then test secondary attachment
2. **S3 Replication**: Verify objects replicate with RTC enabled
3. **Route 53 Failover**: Simulate primary region failure and verify DNS switches to secondary
4. **Health Checks**: Verify ALB health checks work correctly
5. **Cross-Region Dependencies**: Test that secondary stack properly depends on primary resources

---

## Summary

**Total Issues**: 12
- **Critical**: 5 (Aurora Global DB, S3 replication, Route 53 health check, EventBridge, secondary R53 records)
- **Medium**: 5 (init files, domain name, replication metric, DynamoDB, container image)
- **Low**: 2 (cdk.json, .gitignore)

The implementation provides a good foundation but requires significant fixes to meet all requirements, particularly around Aurora Global Database configuration and cross-region service integrations.
