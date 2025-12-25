# Model Failures and Resolutions

This document captures the issues encountered during the LocalStack migration and how they were resolved.

## Issue 1: ELBv2 health_check_logs.s3.enabled Attribute Not Supported

### Error Message
```
Error: modifying ELBv2 Load Balancer (tap-dev-alb): operation error Elastic Load Balancing v2:
ModifyLoadBalancerAttributes, https response error StatusCode: 400, RequestID: xxx,
InvalidConfigurationRequest: Key health_check_logs.s3.enabled not valid
```

### Root Cause
AWS Provider v6.x automatically attempts to set advanced ALB attributes including `health_check_logs.s3.enabled` during resource creation or modification. LocalStack does not support this attribute.

### Resolution
The ALB resource was simplified to include only the essential attributes required for creation:
- name
- internal
- load_balancer_type
- security_groups
- subnets
- enable_deletion_protection
- tags

Advanced attributes like access logs, connection logs, and health check logs were removed.

## Issue 2: ELBv2 Not Supported in LocalStack Community Edition

### Error Message
```
Error: reading ELBv2 Load Balancer (tap-dev-alb): operation error Elastic Load Balancing v2:
DescribeLoadBalancers, https response error StatusCode: 501, RequestID: xxx,
api error InternalFailure: The API for service 'elbv2' is either not included in your
current license plan or has not yet been emulated by LocalStack.
```

### Root Cause
LocalStack Community Edition does not include ELBv2 (Application Load Balancer and Network Load Balancer) support. This is a Pro/Enterprise feature.

### Resolution
Made ALB-related resources conditionally created using a feature flag:
```hcl
variable "enable_alb" {
  description = "Enable Application Load Balancer (set to false for LocalStack compatibility)"
  type        = bool
  default     = false
}

resource "aws_lb" "main" {
  count = var.enable_alb ? 1 : 0
  # ... rest of configuration
}
```

Applied the same pattern to:
- aws_lb (Application Load Balancer)
- aws_lb_target_group (Target Group)
- aws_lb_listener (Listener)

## Issue 3: Auto Scaling Not Supported in LocalStack Community Edition

### Error Message
```
Error: creating Auto Scaling Group (tap-stack-dev-asg): operation error Auto Scaling:
CreateAutoScalingGroup, https response error StatusCode: 501, RequestID: xxx,
api error InternalFailure: The API for service 'autoscaling' is either not included in
your current license plan or has not yet been emulated by LocalStack.
```

### Root Cause
LocalStack Community Edition does not include Auto Scaling support. This is a Pro/Enterprise feature.

### Resolution
Made ASG-related resources conditionally created using a feature flag:
```hcl
variable "enable_asg" {
  description = "Enable Auto Scaling Group (set to false for LocalStack compatibility)"
  type        = bool
  default     = false
}

resource "aws_autoscaling_group" "main" {
  count = var.enable_asg ? 1 : 0
  # ... rest of configuration
}
```

Applied the same pattern to:
- aws_autoscaling_group (Auto Scaling Group)
- aws_autoscaling_policy (Scale Up policy)
- aws_autoscaling_policy (Scale Down policy)
- aws_cloudwatch_metric_alarm (CPU High alarm)
- aws_cloudwatch_metric_alarm (CPU Low alarm)

## Issue 4: Missing terraform.tfvars File

### Error Message
```
Error: Failed to read variables file
Given variables file terraform.tfvars does not exist.
```

### Root Cause
The deployment script expected a terraform.tfvars file but none was present.

### Resolution
Created a terraform.tfvars file with all required variables:
```hcl
aws_region         = "us-east-1"
environment        = "production"
project_name       = "tap-stack"
vpc_cidr           = "10.0.0.0/16"
ami_id             = ""
instance_type      = "t3.micro"
min_size           = 2
desired_capacity   = 4
max_size           = 10
cpu_high_threshold = 80
cpu_low_threshold  = 20
environment_suffix = "dev"
enable_alb         = false
enable_asg         = false
```

## Issue 5: Output References to Conditional Resources

### Problem
Outputs referencing conditionally created resources (ALB, ASG) would fail when those resources were not created.

### Resolution
Made output values conditional using ternary expressions:
```hcl
output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = var.enable_alb ? aws_lb.main[0].dns_name : "ALB disabled for LocalStack"
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = var.enable_asg ? aws_autoscaling_group.main[0].name : "ASG disabled for LocalStack"
}
```

## LocalStack Service Compatibility Summary

| Service | LocalStack CE Support | Notes |
|---------|----------------------|-------|
| VPC | Yes | Full support |
| Subnets | Yes | Full support |
| Internet Gateway | Yes | Full support |
| NAT Gateway | Yes | Full support |
| Route Tables | Yes | Full support |
| Security Groups | Yes | Full support |
| IAM Roles | Yes | Full support |
| IAM Instance Profiles | Yes | Full support |
| EC2 Launch Templates | Yes | Full support |
| Elastic IPs | Yes | Full support |
| ELBv2 (ALB/NLB) | No | Pro/Enterprise only |
| Auto Scaling | No | Pro/Enterprise only |
| CloudWatch Alarms | Limited | Basic support only |

## Best Practices for LocalStack Compatibility

1. **Use Feature Flags**: Implement `enable_*` variables to conditionally create resources not supported in LocalStack CE
2. **Avoid Advanced Attributes**: Remove or make optional advanced service-specific attributes that LocalStack may not support
3. **Conditional Outputs**: Use ternary expressions in outputs for conditionally created resources
4. **Test Incrementally**: Deploy and test one service at a time to identify unsupported features early
5. **Check LocalStack Coverage**: Refer to https://docs.localstack.cloud/references/coverage for service support status
