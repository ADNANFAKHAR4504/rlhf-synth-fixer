# MODEL_FAILURES.md

## Code Fixes Applied to MODEL_RESPONSE.md

This document describes the specific code failures found in MODEL_RESPONSE.md and the fixes applied to create the working implementation.

### 1. Missing Auto Scaling Group Health Check

**Failure:**  
The Auto Scaling Group was created without health check configuration, which could result in unhealthy instances remaining in the target group.

```python
# MODEL_RESPONSE.md - Line 265 (Missing health check)
asg = autoscaling.AutoScalingGroup(
    self,
    f"AutoScalingGroup{environment_suffix}",
    vpc=vpc,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    launch_template=launch_template,
    min_capacity=1,
    max_capacity=3,
    desired_capacity=2,
)
```

**Fix Applied:**  
Added ELB health check to ensure only healthy instances serve traffic.

```python
# FIXED - Line 242 (Added health check)
asg = autoscaling.AutoScalingGroup(
    self,
    f"AutoScalingGroup{environment_suffix}",
    vpc=vpc,
    vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
    launch_template=launch_template,
    min_capacity=1,
    max_capacity=3,
    desired_capacity=2,
    health_check=autoscaling.HealthCheck.elb(Duration.minutes(5))
)
```

### 2. Inconsistent Lambda Function Naming

**Failure:**  
Lambda function used naming pattern that didn't match the expected convention used elsewhere in the stack.

```python
# MODEL_RESPONSE.md - Line 378 (Inconsistent naming)
monitoring_lambda = _lambda.Function(
    self,
    f"MonitoringLambda{environment_suffix}",
    ...
)
```

**Fix Applied:**  
Updated Lambda function name to match the consistent naming pattern used in outputs.

```python
# FIXED - Line 354 (Consistent naming)
monitoring_lambda = _lambda.Function(
    self,
    f"MonitorLambdaFunc{environment_suffix}",
    ...
)
```

### 3. Incorrect CloudWatch Log Group Name

**Failure:**  
CloudWatch log group name didn't follow AWS Lambda naming convention, causing potential conflicts.

```python
# MODEL_RESPONSE.md - Line 462 (Incorrect log group name)
lambda_log_group = logs.LogGroup(
    self,
    f"LambdaLogGroup{environment_suffix}",
    log_group_name=f"/aws/lambda/{monitoring_lambda.function_name}",
    ...
)
```

**Fix Applied:**  
Added suffix to log group name to ensure uniqueness and avoid conflicts.

```python
# FIXED - Line 438 (Unique log group name)  
lambda_log_group = logs.LogGroup(
    self,
    f"LambdaLogGroup{environment_suffix}",
    log_group_name=f"/aws/lambda/{monitoring_lambda.function_name}-group",
    ...
)
```

## Summary

These three fixes ensure:
1. Proper health monitoring for auto-scaled instances
2. Consistent resource naming across the stack
3. Unique CloudWatch log group names to prevent conflicts

All fixes maintain the original functionality while improving reliability and consistency of the infrastructure deployment.