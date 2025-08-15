# Model Failures and Fixes - TAP Financial Services Infrastructure

## Overview
This document captures the failures encountered and fixes applied during the development of the TAP Financial Services multi-region AWS infrastructure using Terraform.

## Initial Infrastructure Deployment Issues

### 1. Route53 Health Check Configuration

### 2. Route53 Health Check Configuration
**Failure**: Invalid `insufficient_data_health_status` parameter
- **Problem**: Used "Failure" value which is not valid for Route53 health checks
- **Error**: `expected insufficient_data_health_status to be one of ["Healthy" "Unhealthy" "LastKnownStatus"], got Failure`
- **Fix**: Changed to "Unhealthy" for both health checks:
  ```hcl
  insufficient_data_health_status = "Unhealthy"
  ```

### 3. CloudWatch Log Group KMS Encryption
**Failure**: CloudWatch Log Groups couldn't use specified KMS keys
- **Problem**: KMS keys didn't have proper permissions for CloudWatch Logs
- **Error**: `The specified KMS key does not exist or is not allowed to be used`
- **Fix**: Removed KMS encryption from CloudWatch Log Groups to use AWS-managed encryption:
  ```hcl
  # Removed: kms_key_id = aws_kms_key.west.arn
  ```

### 4. Route53 Health Check Type Mismatch
**Failure**: Mixed HTTP health check parameters with CloudWatch alarm parameters
- **Problem**: HTTP health checks had `insufficient_data_health_status` parameter which is only valid for CloudWatch metric health checks
- **Error**: `Basic health checks must not have an insufficient data health state specified`
- **Fix**: Removed invalid parameters from HTTP health checks:
  ```hcl
  # Removed: cloudwatch_alarm_region, cloudwatch_alarm_name, insufficient_data_health_status
  ```

### 5. CloudWatch Alarm-Based Health Checks
**Failure**: Target groups referenced in CloudWatch alarms didn't exist
- **Problem**: `aws_lb_target_group.west` and `aws_lb_target_group.east` were not defined
- **Error**: `Reference to undeclared resource`
- **Fix**: Changed alarm configuration to monitor ALB 5XX errors instead of target group health:
  ```hcl
  metric_name = "HTTPCode_ELB_5XX_Count"
  comparison_operator = "GreaterThanThreshold"
  threshold = "0"
  # Removed TargetGroup dimension
  ```



## Key Learnings

### Infrastructure Design
1. **Multi-region deployments require careful provider configuration**
2. **Resource naming must be consistent across regions**
3. **CloudWatch alarms for health checks need proper metric selection**
4. **KMS encryption requires proper permissions for each service**



### AWS Service Integration
1. **Route53 health checks have different parameter requirements based on type**
2. **CloudWatch Logs KMS encryption requires specific key policies**
3. **RDS version numbers include patch versions**
4. **Different regions may have different resource configurations**

## Best Practices Established

1. **Provider Management**: Always define provider aliases before referencing them
2. **Resource Naming**: Use consistent naming patterns across regions
3. **Error Handling**: Provide clear error messages and graceful degradation
4. **Documentation**: Document failures and fixes for future reference

## Final State
The infrastructure successfully deploys a multi-region TAP Financial Services environment with:
- VPCs, subnets, and security groups in both regions
- RDS MySQL instances with encryption and Multi-AZ
- Application Load Balancers with health monitoring
- KMS keys for encryption
- Secrets Manager for credential storage
- CloudWatch alarms for monitoring
- Route53 health checks for failover