# Common Model Failures in TapStack Implementation

## 1. Constructor Parameter Issues

### Problem
Models often fail to properly handle constructor parameters, leading to:
- Missing `props` parameter in `__init__` method
- Incorrect parameter ordering
- Missing type hints for `TapStackProps`

### Example Failure
```python
def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)  # Missing props handling
```

### Correct Implementation
```python
def __init__(self, scope: Construct, construct_id: str, *, props: Optional[TapStackProps] = None, **kwargs) -> None:
    super().__init__(scope, construct_id, env=props.env if props else None, **kwargs)
```

## 2. Environment Suffix Handling

### Problem
- Not extracting `environment_suffix` from props
- Using hardcoded values instead of dynamic suffixes
- Missing default values when props is None

### Example Failure
```python
# Hardcoded environment
bucket_name='s3-bucket-dev'  # Should be dynamic
```

### Correct Implementation
```python
self.environment_suffix = props.environment_suffix if props else 'dev'
bucket_name=f's3-bucket-{self.environment_suffix}'
```

## 3. Resource Naming Inconsistencies

### Problem
- Inconsistent naming patterns across resources
- Missing environment suffixes in resource names
- Not following AWS naming conventions

### Example Failure
```python
# Inconsistent naming
vpc_name='MyVpc'  # Should include environment suffix
security_group_name='sg'  # Too generic
```

## 4. Security Group Dependencies

### Problem
- Creating security group rules before security groups exist
- Circular dependencies between security groups
- Missing security group assignments to resources

### Example Failure
```python
# Creating rule before security group exists
ec2_sg.add_ingress_rule(alb_sg, ec2.Port.tcp(80))  # alb_sg not yet created
```

## 5. IAM Role and Instance Profile Issues

### Problem
- Missing instance profile creation
- Incorrect IAM policy resource ARNs
- Not associating roles with EC2 instances

### Example Failure
```python
# Missing instance profile
role = iam.Role(...)  # Role created but no instance profile
# EC2 instances can't assume the role without instance profile
```

## 6. RDS Configuration Problems

### Problem
- Missing subnet groups
- Incorrect VPC subnet selection
- Missing encryption configuration
- Improper credential management

### Example Failure
```python
# Missing subnet group
rds.DatabaseInstance(
    vpc=self.vpc,
    # Missing subnet_group parameter
)
```

## 7. Auto Scaling Group Target Group Attachment

### Problem
- Creating ASG and target group separately without proper attachment
- Missing health check configuration
- Incorrect subnet selection for ASG

### Example Failure
```python
# Missing target group attachment
asg = autoscaling.AutoScalingGroup(...)
target_group = elbv2.ApplicationTargetGroup(...)
# No attachment between ASG and target group
```

## 8. CloudWatch Alarms Missing Metrics

### Problem
- Creating alarms without proper metric references
- Missing alarm actions
- Incorrect threshold values

### Example Failure
```python
# Missing metric source
cloudwatch.Alarm(
    metric=cloudwatch.Metric(...)  # Generic metric instead of resource-specific
)
```

## 9. Output Export Names

### Problem
- Missing export names for cross-stack references
- Duplicate export names across environments
- Missing important outputs

### Example Failure
```python
CfnOutput(
    value=self.vpc.vpc_id
    # Missing export_name for cross-stack reference
)
```

## 10. Environment-Specific Resource Configuration

### Problem
- Not adjusting resource configurations based on environment
- Missing production-specific settings (deletion protection, retention policies)
- Inconsistent environment handling

### Example Failure
```python
# Same configuration for all environments
removal_policy=RemovalPolicy.DESTROY  # Should be RETAIN for prod
deletion_protection=False  # Should be True for prod
```

## 11. Missing Import Statements

### Problem
- Forgetting to import required CDK modules
- Missing typing imports
- Incorrect import paths

### Example Failure
```python
# Missing imports
from aws_cdk import Stack  # Missing other required imports like Duration, CfnOutput
```

## 12. Termination Protection

### Problem
- Not setting termination protection for production stacks
- Missing environment-based conditional logic

### Example Failure
```python
# Missing termination protection
super().__init__(scope, construct_id, **kwargs)
# Should include termination_protection for prod
```