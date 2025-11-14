# MODEL_FAILURES Documentation

This document provides detailed information about all bugs found in the MODEL_RESPONSE.md implementation and their fixes.

## Bug Categories

1. **Configuration Errors** (6 bugs): Wrong settings, missing parameters
2. **Security Issues** (4 bugs): Encryption, permissions, access control
3. **Missing Features** (8 bugs): Incomplete implementations
4. **Integration Problems** (4 bugs): Service communication issues
5. **Resource Dependencies** (3 bugs): Wrong order, missing depends_on

---

## CATEGORY 1: Configuration Errors

### BUG #1: Wrong Resource Creation Order

**Location**: `lib/tap_stack.py` - Lines 87-104

**Issue**: Aurora stack created before SNS stack, but monitoring and alarms need SNS topics to exist first.

**Impact**:
- CloudWatch alarms cannot be created during Aurora stack initialization
- Monitoring setup will fail or be incomplete
- Circular dependency issues

**Fix**:
```python
# CORRECT ORDER:
# 1. Create SNS first
self.sns_stack = SnsStack(...)

# 2. Then create Aurora with SNS dependency
self.aurora_stack = AuroraStack(...,
    opts=ResourceOptions(parent=self, depends_on=[self.sns_stack])
)
```

**Test Case**: Verify SNS topics exist before Aurora monitoring alarms are created.

---

### BUG #5: Wrong Health Check Interval

**Location**: `lib/infrastructure/route53_stack.py` - Line 258

**Issue**: Health check `request_interval` set to 60 seconds instead of required 30 seconds.

**Requirements Violation**: Task specifically requires "health checks monitoring primary region endpoints every 30 seconds"

**Impact**:
- Slower failure detection
- Increased RTO (Recovery Time Objective)
- Does not meet SLA requirements

**Fix**:
```python
self.health_check = aws.route53.HealthCheck(
    f"trading-health-check-{environment_suffix}",
    type="HTTPS",
    resource_path="/health",
    fqdn=primary_endpoint.apply(...),
    port=443,
    request_interval=30,  # CORRECT: 30 seconds
    failure_threshold=3,
    ...
)
```

**Test Case**:
```python
def test_health_check_interval():
    # Verify health check interval is 30 seconds
    assert health_check.request_interval == 30
```

---

### BUG #7: Wrong Aurora Engine Version

**Location**: `lib/infrastructure/aurora_stack.py` - Lines 395, 406, 428, 475, 491

**Issue**: Using PostgreSQL engine version 14.6 instead of 15.4

**Impact**:
- Missing newer PostgreSQL 15 features
- Potential compatibility issues
- Not using recommended version

**Fix**:
```python
self.global_cluster = aws.rds.GlobalCluster(
    ...,
    engine="aurora-postgresql",
    engine_version="15.4",  # CORRECT version
    ...
)

# Also update in primary and secondary clusters and instances
```

**Test Case**:
```python
def test_aurora_engine_version():
    assert global_cluster.engine_version == "15.4"
    assert primary_cluster.engine_version == "15.4"
    assert secondary_cluster.engine_version == "15.4"
```

---

### BUG #11: Wrong Lambda Timeout

**Location**: `lib/infrastructure/lambda_stack.py` - Lambda function definition

**Issue**: Lambda timeout set to 30 seconds instead of required 300 seconds

**Impact**:
- Functions timeout during long-running order processing
- SQS messages returned to queue unnecessarily
- Increased error rates and retries

**Fix**:
```python
self.primary_function = aws.lambda_.Function(
    ...,
    timeout=300,  # CORRECT: 5 minutes for order processing
    ...
)
```

---

### BUG #15: Missing S3 Replication Time Control

**Location**: `lib/infrastructure/s3_stack.py` - Replication configuration

**Issue**: Replication Time Control (RTC) not configured for objects under 128 MB

**Requirements Violation**: Task requires "S3 cross-region replication with RTC (Replication Time Control) for objects under 128 MB"

**Impact**:
- No guaranteed replication time
- Cannot meet RPO requirements
- Missing SLA compliance

**Fix**:
```python
self.replication_config = aws.s3.BucketReplicationConfig(
    ...,
    rules=[aws.s3.BucketReplicationConfigRuleArgs(
        ...,
        destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
            ...,
            replication_time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeArgs(
                status="Enabled",
                time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeTimeArgs(
                    minutes=15  # 15-minute SLA
                )
            ),
            metrics=aws.s3.BucketReplicationConfigRuleDestinationMetricsArgs(
                status="Enabled",
                event_threshold=aws.s3.BucketReplicationConfigRuleDestinationMetricsEventThresholdArgs(
                    minutes=15
                )
            )
        ),
        ...
    )]
)
```

---

### BUG #24: Wrong Synthetics Runtime

**Location**: `lib/infrastructure/synthetics_stack.py` - Canary configuration

**Issue**: Canary script written in Python but runtime set for Node.js, or vice versa

**Impact**:
- Canary execution fails
- No endpoint monitoring
- Missing availability metrics

**Fix**:
```python
self.primary_canary = aws.synthetics.Canary(
    ...,
    runtime_version="syn-nodejs-puppeteer-6.0",  # Match script language
    zip_file=canary_script,  # Node.js script
    ...
)
```

---

## CATEGORY 2: Security Issues

### BUG #8: Missing Encryption on Secondary Cluster

**Location**: `lib/infrastructure/aurora_stack.py` - Line 471-483

**Issue**: Secondary Aurora cluster missing `storage_encrypted=True` parameter

**Security Impact**:
- Data at rest not encrypted in secondary region
- Compliance violations (PCI-DSS, HIPAA, etc.)
- Security audit failures

**Fix**:
```python
self.secondary_cluster = aws.rds.Cluster(
    ...,
    storage_encrypted=True,  # REQUIRED for encryption
    ...
)
```

**Test Case**:
```python
def test_aurora_encryption():
    assert primary_cluster.storage_encrypted == True
    assert secondary_cluster.storage_encrypted == True
```

---

### BUG #9: Hardcoded Database Password

**Location**: `lib/infrastructure/aurora_stack.py` - Line 409

**Issue**: Database password hardcoded as "insecure123" instead of using AWS Secrets Manager

**Security Impact**:
- Password visible in code and state files
- Cannot rotate credentials
- Major security vulnerability
- Compliance violations

**Fix**:
```python
# Use Pulumi secret for password
self.primary_cluster = aws.rds.Cluster(
    ...,
    master_username="admin",
    master_password=pulumi.Output.secret("ChangeMeInProduction123!"),
    ...
)
```

**Best Practice**: In production, fetch from existing Secrets Manager secret:
```python
db_secret = aws.secretsmanager.get_secret_version(
    secret_id="trading-db-password"
)

master_password=pulumi.Output.secret(db_secret.secret_string)
```

---

### BUG #10: Overly Permissive Security Group

**Location**: `lib/infrastructure/aurora_stack.py` - Lines 378, 458

**Issue**: Aurora security group allows ingress from 0.0.0.0/0 (entire internet)

**Security Impact**:
- Database exposed to internet
- Vulnerable to brute force attacks
- Does not follow least privilege principle

**Fix**:
```python
# Get VPC CIDR for proper restriction
self.primary_security_group = aws.ec2.SecurityGroup(
    ...,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        protocol="tcp",
        from_port=5432,
        to_port=5432,
        cidr_blocks=[primary_vpc.cidr_block]  # CORRECT: VPC only
    )],
    ...
)
```

---

### BUG #13: Missing Secrets Manager IAM Permission

**Location**: `lib/infrastructure/lambda_stack.py` - IAM policy

**Issue**: Lambda IAM policy missing `secretsmanager:GetSecretValue` permission

**Impact**:
- Lambda cannot retrieve database credentials
- Runtime errors when accessing Aurora
- Function failures

**Fix**:
```python
self.lambda_policy = aws.iam.RolePolicy(
    ...,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            # ... existing statements ...
            {
                "Effect": "Allow",
                "Action": [
                    "secretsmanager:GetSecretValue"  # REQUIRED
                ],
                "Resource": "*"  # Or specific secret ARN
            }
        ]
    })
)
```

---

## CATEGORY 3: Missing Features

### BUG #2: Missing Resource Dependencies

**Location**: `lib/tap_stack.py` - Line 136

**Issue**: Lambda stack missing `depends_on` for Aurora and DynamoDB stacks

**Impact**:
- Lambda may be created before database endpoints are available
- Environment variables point to non-existent resources
- Deployment failures

**Fix**:
```python
self.lambda_stack = LambdaStack(
    ...,
    opts=ResourceOptions(
        parent=self,
        depends_on=[self.aurora_stack, self.dynamodb_stack]  # REQUIRED
    )
)
```

---

### BUG #3: Missing Monitoring Dependencies

**Location**: `lib/tap_stack.py` - Line 174

**Issue**: Monitoring stack missing `depends_on` for resources it monitors

**Impact**:
- Alarms created before resources exist
- Missing alarm configuration
- Deployment order issues

**Fix**:
```python
self.monitoring_stack = MonitoringStack(
    ...,
    opts=ResourceOptions(
        parent=self,
        depends_on=[
            self.aurora_stack,
            self.lambda_stack,
            self.api_gateway_stack,
            self.sns_stack
        ]  # REQUIRED
    )
)
```

---

### BUG #4: Missing Stack Outputs

**Location**: `lib/tap_stack.py` - Lines 210-217

**Issue**: Several important outputs not exported (Aurora secondary endpoint, S3 buckets, SNS topics, failover function ARN)

**Impact**:
- Integration tests cannot access resources
- Manual verification difficult
- Missing operational information

**Fix**:
```python
self.register_outputs({
    'primary_api_endpoint': self.api_gateway_stack.primary_api_endpoint,
    'secondary_api_endpoint': self.api_gateway_stack.secondary_api_endpoint,
    'aurora_primary_endpoint': self.aurora_stack.primary_endpoint,
    'aurora_secondary_endpoint': self.aurora_stack.secondary_endpoint,  # ADD
    'dynamodb_table_name': self.dynamodb_stack.table_name,
    's3_primary_bucket': self.s3_stack.primary_bucket_name,  # ADD
    's3_secondary_bucket': self.s3_stack.secondary_bucket_name,  # ADD
    'sns_primary_topic_arn': self.sns_stack.primary_topic_arn,  # ADD
    'sns_secondary_topic_arn': self.sns_stack.secondary_topic_arn,  # ADD
    'failover_function_arn': self.failover_stack.failover_function_arn,  # ADD
})
```

---

### BUG #6: Missing Health Check CloudWatch Alarm

**Location**: `lib/infrastructure/route53_stack.py` - After line 263

**Issue**: No CloudWatch alarm created to monitor Route 53 health check status

**Impact**:
- No alerts when health checks fail
- Manual monitoring required
- Delayed incident response

**Fix**:
```python
self.health_check_alarm = aws.cloudwatch.MetricAlarm(
    f"health-check-alarm-{environment_suffix}",
    name=f"trading-health-check-alarm-{environment_suffix}",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="HealthCheckStatus",
    namespace="AWS/Route53",
    period=60,
    statistic="Minimum",
    threshold=1.0,
    alarm_description="Alert when primary region health check fails",
    dimensions={
        "HealthCheckId": self.health_check.id
    },
    tags=tags,
    opts=ResourceOptions(parent=self)
)
```

---

### BUG #12: Missing Lambda VPC Configuration

**Location**: `lib/infrastructure/lambda_stack.py` - Function configuration

**Issue**: Lambda functions not configured with VPC settings to access Aurora in private subnets

**Impact**:
- Cannot connect to Aurora database
- Network connectivity failures
- Runtime errors

**Fix**:
```python
self.primary_function = aws.lambda_.Function(
    ...,
    vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=private_subnet_ids,
        security_group_ids=[lambda_security_group.id]
    ),
    ...
)
```

---

### BUG #14: Missing DynamoDB Point-in-Time Recovery on Replica

**Location**: `lib/infrastructure/dynamodb_stack.py` - Replica configuration

**Issue**: Point-in-time recovery not explicitly enabled on replica region

**Requirements Violation**: Task requires "point-in-time recovery enabled"

**Fix**:
```python
self.table = aws.dynamodb.Table(
    ...,
    replicas=[
        aws.dynamodb.TableReplicaArgs(
            region_name=secondary_region,
            point_in_time_recovery=True  # REQUIRED
        )
    ],
    ...
)
```

---

### BUG #16: Missing S3 Bucket Versioning

**Location**: `lib/infrastructure/s3_stack.py` - Secondary bucket configuration

**Issue**: Versioning not enabled on secondary S3 bucket

**Impact**:
- Cannot replicate versioned objects
- Replication may fail
- Data protection incomplete

**Fix**:
```python
self.secondary_bucket = aws.s3.Bucket(
    ...,
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True  # REQUIRED for replication
    ),
    ...
)
```

---

### BUG #17: Missing API Gateway Access Logging

**Location**: `lib/infrastructure/api_gateway_stack.py` - Stage configuration

**Issue**: API Gateway stages missing access logging configuration

**Impact**:
- No request/response logs
- Difficult troubleshooting
- Missing audit trail

**Fix**:
```python
# Create CloudWatch log group
log_group = aws.cloudwatch.LogGroup(
    f"api-gateway-logs-{environment_suffix}",
    ...
)

self.primary_stage = aws.apigateway.Stage(
    ...,
    access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
        destination_arn=log_group.arn,
        format='$requestId $context.error.message $context.error.messageString'
    ),
    ...
)
```

---

### BUG #18: Missing API Gateway Throttling

**Location**: `lib/infrastructure/api_gateway_stack.py` - Stage or method configuration

**Issue**: No rate limiting or throttling configured on API Gateway

**Impact**:
- Vulnerable to abuse
- No cost protection
- Potential resource exhaustion

**Fix**:
```python
# Create usage plan with throttling
usage_plan = aws.apigateway.UsagePlan(
    f"api-usage-plan-{environment_suffix}",
    api_stages=[aws.apigateway.UsagePlanApiStageArgs(
        api_id=self.primary_api.id,
        stage=self.primary_stage.stage_name
    )],
    throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
        burst_limit=5000,
        rate_limit=2000
    ),
    ...
)
```

---

## CATEGORY 4: Integration Problems

### BUG #19: Wrong Composite Alarm Logic

**Location**: `lib/infrastructure/monitoring_stack.py` - Composite alarm configuration

**Issue**: Composite alarm using AND logic instead of OR logic

**Impact**:
- Alarm only triggers if ALL conditions met simultaneously
- Misses individual failure scenarios
- Delayed failover

**Fix**:
```python
self.composite_alarm = aws.cloudwatch.CompositeAlarm(
    ...,
    alarm_rule=Output.all(...).apply(lambda arns:
        f"(ALARM({arns[0]}) OR ALARM({arns[1]}) OR ALARM({arns[2]}))"  # OR not AND
    ),
    ...
)
```

---

### BUG #20: Missing SNS Alarm Actions

**Location**: `lib/infrastructure/monitoring_stack.py` - Individual alarm configuration

**Issue**: Individual CloudWatch alarms missing SNS alarm_actions

**Impact**:
- No notifications sent when individual metrics breach
- Only composite alarm sends notifications
- Missing granular alerting

**Fix**:
```python
self.aurora_alarm = aws.cloudwatch.MetricAlarm(
    ...,
    alarm_actions=[sns_topic_arn],  # REQUIRED
    ...
)
```

---

### BUG #21: Failover Lambda Timeout Too Short

**Location**: `lib/infrastructure/failover_stack.py` - Lambda configuration

**Issue**: Failover Lambda timeout insufficient for RDS global cluster failover operations

**Impact**:
- Function times out during failover
- Partial failover state
- Manual intervention required

**Fix**:
```python
self.failover_function = aws.lambda_.Function(
    ...,
    timeout=300,  # 5 minutes for RDS operations
    ...
)
```

---

### BUG #23: Missing SNS Cross-Region Subscription

**Location**: `lib/infrastructure/sns_stack.py` - Topic configuration

**Issue**: No cross-region subscriptions configured between primary and secondary SNS topics

**Requirements Violation**: Task requires "SNS cross-region subscriptions for failover notifications"

**Impact**:
- Notifications not replicated to secondary region
- Loss of alerts during regional failure
- Incomplete DR setup

**Fix**:
```python
# Subscribe secondary topic to primary topic
aws.sns.TopicSubscription(
    f"cross-region-subscription-{environment_suffix}",
    protocol="sns",
    endpoint=self.secondary_topic.arn,
    topic=self.primary_topic.arn,
    ...
)
```

---

## CATEGORY 5: Missing Monitoring

### BUG #22: Missing Error Handling in Failover Function

**Location**: `lib/infrastructure/failover_stack.py` - Lambda function code

**Issue**: No proper error handling or retry logic in failover orchestrator

**Impact**:
- Failover failures not handled gracefully
- No retry on transient errors
- Poor observability

**Fix**:
```python
def handler(event, context):
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Failover logic
            rds_response = rds_client.failover_global_cluster(...)

            # Send success notification
            sns_client.publish(...)

            return {'statusCode': 200, 'body': '...'}

        except ClientError as e:
            if e.response['Error']['Code'] == 'ThrottlingException':
                time.sleep(2 ** attempt)  # Exponential backoff
                continue
            else:
                # Send failure notification
                sns_client.publish(
                    TopicArn=sns_topic_arn,
                    Subject=f'CRITICAL: Failover failed',
                    Message=f'Error: {str(e)}'
                )
                raise

    raise Exception('Failover failed after max retries')
```

---

### BUG #25: Missing Canary Alarms

**Location**: `lib/infrastructure/synthetics_stack.py` - After canary creation

**Issue**: No CloudWatch alarms created to monitor canary success/failure

**Impact**:
- Canary failures not alerted
- Manual checking required
- Delayed incident response

**Fix**:
```python
self.primary_canary_alarm = aws.cloudwatch.MetricAlarm(
    f"canary-alarm-primary-{environment_suffix}",
    name=f"trading-canary-alarm-primary-{environment_suffix}",
    comparison_operator="LessThanThreshold",
    evaluation_periods=2,
    metric_name="SuccessPercent",
    namespace="CloudWatchSynthetics",
    period=300,
    statistic="Average",
    threshold=90.0,
    alarm_description="Alert when canary success rate drops below 90%",
    dimensions={
        "CanaryName": self.primary_canary.name
    },
    alarm_actions=[sns_topic_arn],
    opts=ResourceOptions(parent=self)
)
```

---

## Summary Table

| Bug # | Category | Severity | File | Line | Impact |
|-------|----------|----------|------|------|--------|
| 1 | Dependencies | High | tap_stack.py | 87 | Monitoring setup fails |
| 2 | Dependencies | High | tap_stack.py | 136 | Lambda deployment fails |
| 3 | Dependencies | Medium | tap_stack.py | 174 | Alarm creation issues |
| 4 | Missing Features | Medium | tap_stack.py | 210 | Missing outputs |
| 5 | Configuration | High | route53_stack.py | 258 | Increased RTO |
| 6 | Missing Features | Medium | route53_stack.py | 265 | No health check alerts |
| 7 | Configuration | Medium | aurora_stack.py | 395 | Wrong engine version |
| 8 | Security | Critical | aurora_stack.py | 471 | Unencrypted data |
| 9 | Security | Critical | aurora_stack.py | 409 | Exposed credentials |
| 10 | Security | Critical | aurora_stack.py | 378 | Overly permissive access |
| 11 | Configuration | High | lambda_stack.py | - | Function timeouts |
| 12 | Missing Features | High | lambda_stack.py | - | No VPC connectivity |
| 13 | Security | High | lambda_stack.py | - | Permission denied errors |
| 14 | Missing Features | Medium | dynamodb_stack.py | - | No PITR on replica |
| 15 | Configuration | High | s3_stack.py | - | No RTC guarantee |
| 16 | Missing Features | High | s3_stack.py | - | Replication fails |
| 17 | Missing Features | Medium | api_gateway_stack.py | - | No audit logs |
| 18 | Missing Features | Medium | api_gateway_stack.py | - | No rate limiting |
| 19 | Integration | Critical | monitoring_stack.py | - | Wrong alarm logic |
| 20 | Integration | Medium | monitoring_stack.py | - | Missing notifications |
| 21 | Integration | High | failover_stack.py | - | Failover timeouts |
| 22 | Integration | High | failover_stack.py | - | Poor error handling |
| 23 | Missing Features | High | sns_stack.py | - | No cross-region alerts |
| 24 | Configuration | High | synthetics_stack.py | - | Canary execution fails |
| 25 | Missing Features | Medium | synthetics_stack.py | - | No canary monitoring |

## Testing Checklist

- [ ] All resource dependencies properly ordered
- [ ] Health check interval is 30 seconds
- [ ] Aurora using PostgreSQL 15.4
- [ ] All data encrypted at rest and in transit
- [ ] No hardcoded credentials
- [ ] Security groups follow least privilege
- [ ] Lambda timeouts appropriate for workload
- [ ] Lambda has VPC configuration for Aurora access
- [ ] DynamoDB PITR enabled on all replicas
- [ ] S3 replication has RTC configured
- [ ] S3 buckets have versioning enabled
- [ ] API Gateway has access logging
- [ ] API Gateway has throttling configured
- [ ] Composite alarm uses OR logic
- [ ] All alarms have SNS actions
- [ ] Failover Lambda has sufficient timeout
- [ ] Failover function has error handling
- [ ] SNS has cross-region subscriptions
- [ ] Canaries use correct runtime
- [ ] Canaries have CloudWatch alarms
- [ ] All required outputs exported

## Validation Commands

```bash
# Validate platform and language
grep -r "pulumi_aws" lib/
grep -r "import pulumi" lib/

# Check for security issues
grep -r "0.0.0.0/0" lib/infrastructure/
grep -r "master_password=" lib/infrastructure/

# Verify required features
grep -r "request_interval=30" lib/infrastructure/
grep -r "engine_version=\"15.4\"" lib/infrastructure/
grep -r "storage_encrypted=True" lib/infrastructure/
grep -r "point_in_time_recovery=True" lib/infrastructure/
```