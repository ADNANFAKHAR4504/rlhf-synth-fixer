# Known Limitations and Considerations

This document outlines known limitations, potential issues, and important considerations for the CI/CD pipeline implementation.

## Deployment Limitations

### 1. Lambda Function Code Deployment

**Issue**: The Lambda function code is embedded in the stack file but needs to be packaged properly for deployment.

**Current Implementation**:
- Lambda code written to `lib/lambda/health_check.py`
- CDKTF Lambda function references the file directly

**Limitation**:
- CDKTF expects a zip file or inline code for Lambda
- Current implementation may require manual packaging

**Workaround**:
```bash
# Package Lambda function
cd lib/lambda
zip -r health_check.zip health_check.py
# Update Lambda function to use zip file
```

**Better Solution**:
Use CDKTF's asset handling or create a separate deployment script.

### 2. Blue-Green Deployment Traffic Switching

**Issue**: Blue-green deployment requires manual traffic switching between target groups.

**Current Implementation**:
- Blue and green target groups created
- ECS service initially points to blue group
- CODE_DEPLOY deployment controller configured

**Limitation**:
- Automatic traffic switching not fully implemented
- Requires AWS CodeDeploy AppSpec configuration

**Recommendation**:
Add CodeDeploy application and deployment group resources for automated blue-green switching.

### 3. Initial Docker Images

**Issue**: ECS services reference ECR images that may not exist on first deployment.

**Current Implementation**:
- Task definitions reference `{ecr-repo}:latest`
- Images expected to be pushed during first pipeline run

**Limitation**:
- First deployment may fail if images don't exist
- Services won't start without valid images

**Workaround**:
```bash
# Build and push placeholder images before infrastructure deployment
for service in api-service auth-service notification-service; do
  docker build -t $service:latest ./placeholder
  docker tag $service:latest {account}.dkr.ecr.{region}.amazonaws.com/$service-dev:latest
  docker push {account}.dkr.ecr.{region}.amazonaws.com/$service-dev:latest
done
```

## Networking Considerations

### 4. Private Subnet Internet Access

**Issue**: ECS tasks in private subnets cannot access internet without NAT Gateway.

**Current Implementation**:
- Private subnets created for ECS tasks
- No NAT Gateway configured (cost optimization)

**Implication**:
- Tasks cannot pull public Docker images
- Tasks cannot access external APIs
- Package installations will fail

**Solutions**:
1. Add NAT Gateway (increases cost by ~$32/month per AZ)
2. Use VPC endpoints for AWS services
3. Host all dependencies in ECR/S3 within VPC

**If NAT Gateway is needed**:
```python
# Add NAT Gateway and route table updates
nat_eip = Eip(self, "nat_eip", vpc=True)
nat_gateway = NatGateway(
    self, "nat_gateway",
    subnet_id=public_subnets[0].id,
    allocation_id=nat_eip.id
)
# Update private route table to route through NAT
```

### 5. ALB Listener Port Allocation

**Issue**: Services use different ports on same ALB (80, 81, 82 for staging; 90, 91, 92 for production).

**Current Implementation**:
- Port calculation: `80 + service_index + (10 if production else 0)`

**Limitation**:
- Not standard HTTP/HTTPS ports
- Requires clients to specify port in URLs
- May not work with some load balancer configurations

**Better Approach**:
Use path-based or host-based routing on standard ports (80/443):
```python
# Use path-based routing
# /api/* → api-service
# /auth/* → auth-service
# /notification/* → notification-service
```

## Security Considerations

### 6. Parameter Store vs Secrets Manager

**Issue**: Sensitive configuration stored in Parameter Store instead of Secrets Manager.

**Current Implementation**:
- SSM Parameter Store used for all configuration
- No encryption at rest specified

**Limitation**:
- Parameter Store basic tier doesn't support automatic rotation
- Not ideal for highly sensitive data like database passwords

**Recommendation**:
Use Secrets Manager for sensitive data:
```python
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret

db_secret = SecretsmanagerSecret(
    self, "db_password",
    name=f"database-password-{environment_suffix}",
    recovery_window_in_days=0  # For destroyability
)
```

### 7. IAM Policy Wildcards

**Issue**: Some IAM policies use wildcards for resource permissions.

**Current Implementation**:
- CodeBuild role has `"Resource": "*"` for some actions
- Lambda role has broad permissions

**Security Risk**:
- Violates principle of least privilege
- Could allow unintended access

**Recommendation**:
Scope down permissions to specific resources:
```python
"Resource": [
    ecr_repos['api-service'].arn,
    ecr_repos['auth-service'].arn,
    ecr_repos['notification-service'].arn
]
```

## Monitoring and Alerting

### 8. CloudWatch Alarm Thresholds

**Issue**: Alarm thresholds are hardcoded and may not suit all applications.

**Current Implementation**:
- 5XX errors > 10 triggers alarm
- Task count < 1 triggers alarm
- Healthy hosts < 1 triggers alarm

**Limitation**:
- One-size-fits-all thresholds
- May cause false positives/negatives
- No baseline or anomaly detection

**Recommendation**:
Make thresholds configurable:
```python
alarm_config = kwargs.get('alarm_config', {
    'error_threshold': 10,
    'task_count_threshold': 1,
    'evaluation_periods': 2
})
```

### 9. SNS Topic Email Subscriptions

**Issue**: SNS topic created but email subscriptions must be added manually.

**Current Implementation**:
- SNS topic created
- No subscriptions configured

**Limitation**:
- Notifications won't be received until subscription confirmed
- Manual step required after deployment

**Post-Deployment Action**:
```bash
aws sns subscribe \
  --topic-arn {topic-arn} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Cost Considerations

### 10. Always-On Resources

**Issue**: Some resources run continuously regardless of usage.

**Resources**:
- ALB: ~$22/month
- ECS tasks: ~$40/month (2 tasks per service, 6 services)
- NAT Gateway (if added): ~$32/month per AZ

**Recommendation**:
For development environments:
- Use Lambda instead of ECS for low-traffic services
- Use single AZ deployment
- Implement auto-scaling with scale-to-zero capability

### 11. CloudWatch Logs Retention

**Issue**: Logs retained for 14 days across multiple log groups.

**Cost Impact**:
- Log ingestion: $0.50 per GB
- Log storage: $0.03 per GB per month
- High-traffic services can generate significant logs

**Optimization**:
- Reduce retention to 7 days for non-critical logs
- Use log sampling for high-volume logs
- Export to S3 for long-term archival at lower cost

## Pipeline Limitations

### 12. Sequential Stage Execution

**Issue**: While builds are parallel, stages execute sequentially.

**Current Implementation**:
- Build stage waits for all 3 builds to complete
- Test stage waits for build stage
- No parallel staging/production testing

**Limitation**:
- Slower overall pipeline execution
- Production deployment waits for manual approval

**Potential Improvement**:
Consider parallel staging/production deployments to separate accounts.

### 13. Monorepo Structure Assumption

**Issue**: Pipeline assumes specific repository structure.

**Expected Structure**:
```
services/
  {service-name}/
    Dockerfile
    app.py
```

**Limitation**:
- Buildspec hardcoded to this structure
- Changes require buildspec updates
- Not flexible for different project layouts

**Solution**:
Make buildspec path configurable or use dynamic detection.

### 14. Manual Approval Timeout

**Issue**: Manual approval stage has no timeout configured.

**Current Implementation**:
- Pipeline waits indefinitely for approval
- No automatic rejection or timeout

**Limitation**:
- Pipeline can be stuck in approval state
- No automatic cleanup of stale approvals

**Recommendation**:
Add timeout to approval action:
```python
configuration={
    "NotificationArn": sns_topic.arn,
    "CustomData": "Please review and approve",
    "TimeoutInMinutes": "1440"  # 24 hours
}
```

## Testing Limitations

### 15. Integration Tests Scope

**Issue**: Integration tests verify infrastructure existence but not functionality.

**Current Coverage**:
- Resources exist
- Configuration matches expectations
- No end-to-end application testing

**Limitation**:
- Doesn't verify services actually work
- No load testing or performance validation

**Recommendation**:
Add functional tests:
```python
def test_service_responds():
    response = requests.get(f"http://{alb_dns}:80/health")
    assert response.status_code == 200
    assert response.json()['status'] == 'healthy'
```

## Disaster Recovery

### 16. Single Region Deployment

**Issue**: All resources in single AWS region (us-east-1).

**Current Implementation**:
- No cross-region replication
- No multi-region failover

**Limitation**:
- Regional outage affects entire application
- No geographic redundancy

**DR Considerations**:
- Backup CodeCommit to second region
- Replicate ECR images cross-region
- Deploy pipeline in secondary region
- Use Route53 health checks for failover

### 17. State Management

**Issue**: Terraform state stored in S3 without DynamoDB locking.

**Current Implementation**:
- S3 backend configured
- File-based locking with `use_lockfile: true`

**Limitation**:
- Concurrent modifications possible
- Risk of state corruption

**Recommendation**:
Add DynamoDB table for state locking:
```python
# Add to backend configuration
dynamodb_table = "terraform-state-lock"
```

## Operational Considerations

### 18. Log Aggregation

**Issue**: Logs scattered across multiple CloudWatch log groups.

**Current Implementation**:
- Separate log groups per service per environment
- No centralized logging solution

**Limitation**:
- Difficult to correlate logs across services
- No full-stack tracing
- Manual log analysis required

**Recommendation**:
Implement centralized logging:
- Use CloudWatch Logs Insights for queries
- Consider ELK stack or CloudWatch Logs Subscription
- Add correlation IDs to application logs

### 19. Backup and Recovery

**Issue**: No automated backup strategy for ECS task configurations.

**Current Implementation**:
- Task definitions versioned by ECS
- No backup of service configurations
- No disaster recovery runbooks

**Recommendation**:
- Export task definitions to S3 regularly
- Document recovery procedures
- Test recovery process periodically
- Consider AWS Backup for supported resources

### 20. Capacity Planning

**Issue**: No auto-scaling configured for ECS services.

**Current Implementation**:
- Fixed desired count (2 tasks per service)
- Manual scaling required

**Limitation**:
- Cannot handle traffic spikes
- Over-provisioned during low traffic
- No cost optimization

**Recommendation**:
Implement ECS auto-scaling:
```python
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy

scaling_target = AppautoscalingTarget(
    self, "ecs_scaling_target",
    max_capacity=10,
    min_capacity=2,
    resource_id=f"service/{cluster.name}/{service.name}",
    scalable_dimension="ecs:service:DesiredCount",
    service_namespace="ecs"
)
```

## Conclusion

While this implementation provides a solid foundation for a CI/CD pipeline, production deployments should address these limitations based on specific requirements, budget, and risk tolerance. Prioritize fixes based on your security, compliance, and operational needs.

Most critical items to address before production:
1. Lambda function packaging (#1)
2. Private subnet internet access (#4)
3. IAM policy scoping (#7)
4. SNS subscriptions (#9)
5. State locking (#17)
