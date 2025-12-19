# Potential Issues and Considerations

This document outlines potential issues, edge cases, and considerations for the highly available web application infrastructure implementation.

## Known Limitations

### 1. Private Subnet Internet Access
**Issue**: EC2 instances are deployed in private subnets without NAT Gateway or VPC endpoints.

**Impact**: Instances cannot download packages from the internet during initial setup, which may cause the user data script to fail when running `yum update -y`.

**Solution Options**:
- Add NAT Gateway to private subnets (increases cost by ~$32/month)
- Use VPC endpoints for S3 and EC2 services (more cost-effective)
- Place instances in public subnets (less secure but works for testing)
- Pre-bake AMI with all required packages

**Current Workaround**: For production, instances in private subnets should either:
1. Use a custom AMI with pre-installed software
2. Have NAT Gateway or VPC endpoints configured
3. Be temporarily placed in public subnets for testing purposes

### 2. Health Check Endpoint Reliability
**Issue**: The health check endpoint depends on the user data script successfully installing and starting Apache.

**Impact**: If the user data script fails (due to internet access issues or package availability), instances will never become healthy and will be continuously replaced by Auto Scaling.

**Mitigation**:
- Add comprehensive logging to user data script
- Use CloudWatch Logs to monitor instance initialization
- Consider using Systems Manager Session Manager for debugging
- Implement retry logic in user data script

### 3. Deletion Protection
**Issue**: Application Load Balancer has `enableDeletionProtection: false` for easier testing.

**Impact**: Accidental deletion of the ALB will cause service disruption.

**Recommendation**: For production deployments, set `enableDeletionProtection: true`.

### 4. Cost Considerations
**Issue**: Running 2+ t3.micro instances 24/7 plus an ALB incurs ongoing costs.

**Impact**: Estimated $42-75/month depending on actual instance count and data transfer.

**Optimization Options**:
- Use AWS Free Tier when available
- Implement scheduled scaling to reduce instances during off-peak hours
- Consider using Spot Instances for non-critical workloads
- Use AWS Cost Explorer to monitor and optimize spending

### 5. CloudWatch Alarm Actions
**Issue**: CloudWatch alarms for unhealthy targets don't trigger any actions (no SNS notifications).

**Impact**: Operations team won't be automatically notified of issues.

**Recommendation**: Add SNS topic and subscriptions for alarm notifications:
```typescript
const alarmTopic = new aws.sns.Topic(`tap-alarms-${environmentSuffix}`, {
  displayName: 'Infrastructure Alarms',
});

// Add email subscriptions
new aws.sns.TopicSubscription(`tap-alarm-email-${environmentSuffix}`, {
  topic: alarmTopic.arn,
  protocol: 'email',
  endpoint: 'ops-team@example.com',
});

// Update alarm to use SNS
alarmActions: [scaleUpPolicy.arn, alarmTopic.arn],
```

## Potential Deployment Issues

### 1. AMI Availability
**Issue**: The AMI query searches for the latest Amazon Linux 2 AMI.

**Risk**: AMI IDs change over time; the query might fail or return unexpected results in some regions.

**Mitigation**: Code uses `mostRecent: true` and proper filters to ensure correct AMI selection.

### 2. Instance Profile Propagation Delay
**Issue**: IAM instance profiles may take a few seconds to propagate after creation.

**Impact**: Launch template might fail to attach the instance profile if created immediately.

**Mitigation**: Pulumi's dependency management should handle this automatically, but in rare cases may require retry logic.

### 3. Target Group Registration Delay
**Issue**: New instances take time to register with the target group and pass health checks.

**Impact**: During initial deployment, service won't be available for 5-8 minutes (grace period + health checks).

**Expected Behavior**: This is normal and working as designed.

### 4. Auto Scaling Group Initial Launch
**Issue**: First launch of Auto Scaling Group requires 300 seconds grace period before health checks begin.

**Impact**: Initial deployment takes longer than expected.

**Mitigation**: This is by design to allow instances to fully initialize.

## Security Considerations

### 1. Security Group Rules
**Current State**: ALB allows HTTP from 0.0.0.0/0, instances only allow traffic from ALB.

**Recommendation**: For production:
- Implement AWS WAF for ALB
- Add rate limiting rules
- Enable VPC Flow Logs for monitoring
- Consider using AWS Shield for DDoS protection

### 2. IAM Permissions
**Current State**: Instances have SSM and CloudWatch policies attached.

**Recommendation**: Review and restrict policies to minimum required permissions based on actual application needs.

### 3. HTTPS/TLS
**Current State**: Only HTTP (port 80) is configured.

**Recommendation**: For production:
- Add HTTPS listener with ACM certificate
- Redirect HTTP to HTTPS
- Enable SSL/TLS security policies

## Scaling Behavior Edge Cases

### 1. Rapid Scale Up/Down Cycles
**Issue**: If CPU oscillates around thresholds, may cause frequent scaling actions.

**Mitigation**: 300-second cooldown period helps prevent this, but longer observation periods might be needed.

### 2. Minimum Instance Count During Scaling
**Issue**: If 2 instances are running and one becomes unhealthy, service capacity is reduced by 50% until replacement is ready.

**Mitigation**: Consider increasing minimum size to 3 instances for better fault tolerance.

### 3. Maximum Instance Limit
**Issue**: Hard limit of 6 instances may not be sufficient for extreme traffic spikes.

**Mitigation**: Monitor CPU and request metrics to determine if limit needs adjustment.

## Testing and Validation

### 1. Health Check Timing
**Consideration**: Health check interval (30s) x unhealthy threshold (3) = 90 seconds before instance is marked unhealthy.

**Combined with grace period**: Instances have up to 390 seconds (6.5 minutes) before being replaced.

**Validation**: Test by stopping Apache on an instance and observing replacement timing.

### 2. Load Testing
**Consideration**: Testing with Apache Bench or similar tools may not accurately represent real-world traffic patterns.

**Recommendation**: Use AWS CloudWatch Synthetics for continuous health checks and realistic traffic simulation.

### 3. Failure Scenarios to Test
- Manual instance termination
- Service crash (stop Apache)
- Network connectivity issues
- High CPU load
- Memory exhaustion
- Disk space issues

## Monitoring and Observability Gaps

### 1. Missing Metrics
**Currently not monitored**:
- Memory utilization
- Disk usage
- Network throughput
- Application-level errors
- Request latency

**Recommendation**: Install and configure CloudWatch agent for custom metrics.

### 2. Logging
**Missing**: Application logs, access logs, error logs.

**Recommendation**:
- Enable ALB access logs to S3
- Configure CloudWatch Logs agent on instances
- Implement structured logging in application

### 3. Distributed Tracing
**Missing**: X-Ray tracing for request flows.

**Recommendation**: Enable X-Ray on ALB and instrument application code.

## Recommendations for Production

1. **Add NAT Gateway or VPC Endpoints** for private subnet internet access
2. **Implement HTTPS** with ACM certificates
3. **Add SNS notifications** for CloudWatch alarms
4. **Enable ALB access logs** for audit and debugging
5. **Configure CloudWatch Logs agent** for application logging
6. **Implement AWS WAF** for security
7. **Add backup and disaster recovery** procedures
8. **Create runbook** for common operational tasks
9. **Set up monitoring dashboards** in CloudWatch
10. **Implement automated testing** in CI/CD pipeline

## Summary

The current implementation provides a solid foundation for a highly available, auto-scaling web application. However, several production-readiness improvements are recommended:

- Address private subnet internet access for package installation
- Enhance monitoring and alerting
- Implement HTTPS/TLS
- Add comprehensive logging
- Improve security posture

These enhancements should be prioritized based on specific business requirements and risk tolerance.