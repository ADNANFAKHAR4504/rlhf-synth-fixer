# Model Failures and Assumptions

## Assumptions Made

### 1. GitHub vs CodeCommit
**Assumption**: Used CodeCommit as source repository instead of GitHub
**Reason**: The requirement specified GitHub, but for a working demo that can be deployed without external dependencies, CodeCommit was used as a placeholder. In production, this would be replaced with:
```typescript
new codepipeline_actions.GitHubSourceAction({
  actionName: 'Source',
  owner: 'github-owner',
  repo: 'repository-name',
  branch: 'main',
  oauthToken: cdk.SecretValue.secretsManager('github-token'),
  output: sourceOutput,
})
```

### 2. Existing ECS Clusters and Services
**Assumption**: Referenced existing ECS clusters by hardcoded ARNs
**Reason**: Requirement #5 stated "Deploy containerized applications to existing ECS clusters". The implementation assumes clusters named 'staging-cluster' and 'production-cluster' exist. In a real scenario, these would be:
- Imported using `ecs.Cluster.fromClusterAttributes()`
- Retrieved from SSM Parameter Store
- Passed as stack parameters
- Or created as part of a prerequisite stack

### 3. Blue/Green Deployment Configuration
**Assumption**: Blue/Green deployment relies on ECS service configuration
**Reason**: The EcsDeployAction supports Blue/Green deployments, but the actual strategy is configured at the ECS service level (deployment controller type, target groups, etc.). This implementation assumes the ECS services are already configured for Blue/Green deployments. A complete solution would include:
```typescript
// CodeDeploy application and deployment group
const ecsApplication = new codedeploy.EcsApplication(this, 'EcsApp');
const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'BlueGreenDG', {
  application: ecsApplication,
  service: ecsService,
  blueGreenDeploymentConfig: {
    blueTargetGroup: blueTargetGroup,
    greenTargetGroup: greenTargetGroup,
    listener: listener,
  },
  deploymentConfig: codedeploy.EcsDeploymentConfig.CANARY_10PERCENT_5MINUTES,
});
```

### 4. Slack Webhook Integration
**Assumption**: SNS topic created without actual Slack webhook subscription
**Reason**: Slack webhook URLs are sensitive and environment-specific. The implementation creates the SNS topic and events, but doesn't add the actual webhook subscription. In production, this would be added as:
```typescript
const slackWebhookUrl = cdk.aws_ssm.StringParameter.valueForStringParameter(
  this, '/slack/webhook-url'
);
this.notificationTopic.addSubscription(
  new sns_subscriptions.UrlSubscription(slackWebhookUrl, {
    protocol: sns.SubscriptionProtocol.HTTPS,
  })
);
```

### 5. Docker Build Context
**Assumption**: Application has standard npm project structure with Dockerfile in root
**Reason**: The BuildSpec assumes:
- `npm install` and `npm test` work
- Dockerfile exists at repository root
- Test results are in test-results/ directory
In practice, these paths would need to be customized based on actual project structure.

### 6. Test Report Format
**Assumption**: Tests generate JUnit XML format reports
**Reason**: CodeBuild reports support multiple formats, but JUnit XML is most common. The implementation assumes tests write to test-results/ directory in JUnit format. Different test frameworks may require different configuration.

### 7. Resource Naming and Account-Specific Values
**Assumption**: Used account ID in S3 bucket names for global uniqueness
**Reason**: S3 bucket names must be globally unique. The implementation uses `${this.account}` to ensure uniqueness. In production, you might use:
- Organization prefix
- Random suffix
- Pre-provisioned bucket names from configuration

### 8. IAM Role Wildcards
**Assumption**: Some IAM permissions use wildcard resources
**Reason**: Certain ECS and CodeDeploy operations require wildcard resources because:
- Resource ARNs are not known at deployment time
- Services are created dynamically
- Multiple environments share the same pipeline role

In a hardened production environment, these should be:
- Scoped to specific resource patterns
- Restricted by IAM conditions
- Separated into environment-specific roles

### 9. KMS Key Removal Policy
**Assumption**: KMS key set to DESTROY for testing
**Reason**: For easy cleanup during development. In production, this should be:
- `RETAIN` to prevent accidental data loss
- With proper key rotation and backup procedures
- Documented in disaster recovery plan

### 10. Pipeline Artifact Retention
**Assumption**: 30-day retention for artifacts
**Reason**: Balances between audit requirements and storage costs. Different organizations may require:
- Longer retention for compliance (90 days, 1 year)
- Shorter retention to reduce costs
- Different retention for different artifact types

## Potential Issues and Mitigations

### Issue 1: ECS Service Not Found
**Problem**: Pipeline will fail if referenced ECS services don't exist
**Mitigation**: Add validation or create prerequisite stack with ECS resources

### Issue 2: Insufficient CodeBuild Compute
**Problem**: Small compute type may be insufficient for large Docker builds
**Mitigation**: Make compute type configurable or use larger instance

### Issue 3: Manual Approval Timeout
**Problem**: No timeout configured for manual approval
**Mitigation**: Add notification escalation or auto-timeout after configured period

### Issue 4: Pipeline Failure Notifications
**Problem**: Only state changes trigger notifications, not detailed failure reasons
**Mitigation**: Add CloudWatch alarms and more granular event patterns

### Issue 5: Cost Monitoring
**Problem**: Tags alone don't prevent cost overruns
**Mitigation**: Add AWS Budgets alerts and resource cleanup automation

## Areas for Enhancement

1. **Multi-Region Support**: Add cross-region replication for disaster recovery
2. **Security Scanning**: Integrate container vulnerability scanning (ECR scan, third-party tools)
3. **Performance Testing**: Add load testing stage before production deployment
4. **Rollback Automation**: Implement automatic rollback on deployment failure
5. **Secrets Management**: Use AWS Secrets Manager for sensitive configuration
6. **Infrastructure Testing**: Add compliance and security policy testing
7. **Monitoring Integration**: Connect to CloudWatch dashboards and X-Ray tracing
8. **Documentation Generation**: Auto-generate architecture diagrams and documentation