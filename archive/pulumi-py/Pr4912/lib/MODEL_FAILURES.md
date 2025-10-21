# Model Response Failures - Training Dataset

This document tracks the intentional bugs introduced in MODEL_RESPONSE.md for training purposes. These are realistic mistakes that an AI model might make when generating infrastructure code.

## Bug 1: Missing environment_suffix in Kinesis Stream Resource Name

**Location**: Line 420
**Issue**: Resource name hardcoded without environment suffix
**Impact**: Cannot deploy multiple environments; resource conflicts

```python
# INCORRECT (MODEL_RESPONSE.md)
self.kinesis_stream = aws.kinesis.Stream(
    "emergency-alert-stream",  # Missing {self.environment_suffix}
    ...
)

# CORRECT (IDEAL_RESPONSE.md)
self.kinesis_stream = aws.kinesis.Stream(
    f"emergency-alert-stream-{self.environment_suffix}",
    ...
)
```

**Severity**: Medium
**Category**: Naming Convention Violation

## Bug 2: RDS Instance without Multi-AZ Enabled

**Location**: Line 479
**Issue**: multi_az=False instead of multi_az=True
**Impact**: No high availability; violates FedRAMP High requirements; single point of failure

```python
# INCORRECT (MODEL_RESPONSE.md)
self.rds_instance = aws.rds.Instance(
    ...
    multi_az=False,  # Should be True for high availability
    ...
)

# CORRECT (IDEAL_RESPONSE.md)
self.rds_instance = aws.rds.Instance(
    ...
    multi_az=True,
    ...
)
```

**Severity**: High
**Category**: High Availability / Compliance Violation

## Bug 3: EFS FileSystem without Encryption

**Location**: Line 559
**Issue**: Missing encrypted=True and kms_key_id parameters
**Impact**: Data at rest not encrypted; violates FedRAMP High FIPS 140-2 requirements

```python
# INCORRECT (MODEL_RESPONSE.md)
self.efs = aws.efs.FileSystem(
    f"emergency-alert-efs-{self.environment_suffix}",
    lifecycle_policies=[...],
    performance_mode="generalPurpose",
    throughput_mode="bursting",
    tags={...}
    # Missing: encrypted=True and kms_key_id
)

# CORRECT (IDEAL_RESPONSE.md)
self.efs = aws.efs.FileSystem(
    f"emergency-alert-efs-{self.environment_suffix}",
    encrypted=True,
    kms_key_id=self.kms_key.arn,
    lifecycle_policies=[...],
    ...
)
```

**Severity**: Critical
**Category**: Security / Encryption / Compliance Violation

## Bug 4: Overly Broad IAM Policy with Wildcards

**Location**: Lines 674-686
**Issue**: Using "kinesis:*" and "Resource": "*" instead of specific actions and resource ARN
**Impact**: Violates least privilege principle; grants excessive permissions

```python
# INCORRECT (MODEL_RESPONSE.md)
self.kinesis_access_policy = aws.iam.RolePolicy(
    f"emergency-alert-kinesis-policy-{self.environment_suffix}",
    role=self.ecs_task_role.id,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "kinesis:*",  # Too broad
            "Resource": "*"  # Should be specific stream ARN
        }]
    }),
    ...
)

# CORRECT (IDEAL_RESPONSE.md)
self.kinesis_access_policy = aws.iam.RolePolicy(
    f"emergency-alert-kinesis-policy-{self.environment_suffix}",
    role=self.ecs_task_role.id,
    policy=self.kinesis_stream.arn.apply(
        lambda arn: json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "kinesis:GetRecords",
                    "kinesis:GetShardIterator",
                    "kinesis:DescribeStream",
                    "kinesis:ListShards",
                    "kinesis:PutRecord",
                    "kinesis:PutRecords"
                ],
                "Resource": arn
            }]
        })
    ),
    ...
)
```

**Severity**: High
**Category**: Security / IAM Least Privilege Violation

## Bug 5: Missing CloudWatch Alarm for RDS

**Location**: Line 960 (comment indicates missing implementation)
**Issue**: No monitoring alarm for critical RDS database resource
**Impact**: No alerting for database CPU, connections, or other critical metrics

```python
# MISSING in MODEL_RESPONSE.md
# Comment at line 960: "# BUG 5: Missing CloudWatch alarm for RDS"

# CORRECT - Should include (IDEAL_RESPONSE.md includes ECS and Kinesis alarms)
# Should add RDS CPU or connection count alarm similar to:
self.rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"emergency-alert-rds-cpu-alarm-{self.environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=80,
    alarm_description="Alert when RDS CPU exceeds 80%",
    alarm_actions=[self.alarm_topic.arn],
    dimensions={
        "DBInstanceIdentifier": self.rds_instance.identifier
    },
    ...
)
```

**Severity**: Medium
**Category**: Monitoring / Observability Gap

## Summary

Total Bugs: 5

- Critical: 1 (EFS encryption)
- High: 2 (RDS Multi-AZ, IAM policy)
- Medium: 2 (Kinesis naming, RDS monitoring)

These bugs represent realistic mistakes that demonstrate understanding requirements but missing specific implementation details for:
1. Naming conventions and environment isolation
2. High availability configuration
3. Encryption compliance
4. Security best practices (least privilege)
5. Comprehensive monitoring

The MODEL_RESPONSE.md should require meaningful fixes to reach IDEAL_RESPONSE.md quality, testing the model's ability to identify and correct security, compliance, and operational issues.
