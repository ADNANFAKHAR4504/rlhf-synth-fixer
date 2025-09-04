## Issues Encountered During CDK Infrastructure Deployment

Hi, from your AWS CDK infrastructure deployment script re and ran into several issues that need fixing. Here's what's happening:

### Issue 1: AutoScalingGroup CPU Metric Error
The code is failing because your response tried to call `metric_cpu_utilization()` directly on the AutoScalingGroup object, but it turns out this method doesn't exist for ASG. The AutoScalingGroup class doesn't have this built-in metric method like some other CDK constructs do.

**What's breaking:** 
- Attempting to use `self.asg.metric_cpu_utilization()` throws an AttributeError
- Need to create ASG metrics differently than RDS metrics

### Issue 2: RDS Endpoint Port Type Mismatch
When trying to create a CloudFormation output for the RDS endpoint, there's a type error. The `self.rds_instance.instance_endpoint.port` returns a numeric value (float or integer), but `CfnOutput` expects all values to be strings.

**What's breaking:**
- CfnOutput throws a type error when given a non-string value
- The port number needs to be converted to string format

### Issue 3: RDS Monitoring Interval Configuration
The RDS monitoring configuration is failing because your response is using `Duration.minutes(1)` and `Duration.minutes(5)` for the monitoring interval, but RDS expects this value as an integer representing seconds, not a Duration object.

**What's breaking:**
- RDS `monitoring_interval` parameter rejects Duration objects
- It specifically needs an integer value in seconds (like 60 for 1 minute, 300 for 5 minutes)

### What I Need

Could you provide the corrected implementation for the `_create_monitoring_and_logging` method and any other relevant fixes? Specifically:

1. How to properly create CPU metrics for the AutoScalingGroup using CloudWatch constructs
2. The correct way to handle the RDS endpoint port in CfnOutput
3. The proper format for RDS monitoring intervals