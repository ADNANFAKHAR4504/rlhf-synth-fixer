# Infrastructure Changes Required to Fix MODEL_RESPONSE.md

## Critical Infrastructure Issues

### 1. **S3 Bucket Retention Policy**
**Problem:** Bucket configured with `removalPolicy: cdk.RemovalPolicy.RETAIN`
**Fix:** Change to `removalPolicy: cdk.RemovalPolicy.DESTROY` and add `autoDeleteObjects: true`
**Impact:** Stack will fail to delete cleanly, leaving orphaned resources

### 2. **Deprecated Lambda Configuration**
**Problem:** Using deprecated `logRetention` property
**Fix:** Create explicit `LogGroup` resource and use `logGroup` parameter instead
```javascript
const lambdaLogGroup = new logs.LogGroup(this, 'SecurityScanLogGroup', {
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
// Then use: logGroup: lambdaLogGroup
```

### 3. **Lambda Code Asset Reference**
**Problem:** `code: lambda.Code.fromAsset('lambda')` requires external directory
**Fix:** Use inline code with `lambda.Code.fromInline()` to make stack self-contained
**Impact:** Deployment will fail if `lambda/` directory doesn't exist

### 4. **CodeDeploy Auto-Rollback Configuration**
**Problem:** `deploymentInAlarm: true` set without associated CloudWatch alarm
**Fix:** Remove `deploymentInAlarm: true` or associate a CloudWatch alarm with the deployment group
```javascript
autoRollback: {
  failedDeployment: true,
  stoppedDeployment: true,
  // Remove deploymentInAlarm
}
```

### 5. **CloudWatch Metric Names**
**Problem:** Invalid metric names `FailedPipeline` and `SuccessfulPipeline`
**Fix:** Use correct AWS metric names: `PipelineExecutionFailure` and `PipelineExecutionSuccess`
**Impact:** Alarms and dashboards will not receive any data

### 6. **CloudWatch Metric Dimensions Format**
**Problem:** Using `dimensions: { PipelineName: ... }` object syntax
**Fix:** Use `dimensionsMap: { PipelineName: ... }` for proper CloudFormation synthesis

### 7. **Environment Suffix Missing**
**Problem:** Hardcoded resource names without environment suffix from props
**Fix:** Extract `environmentSuffix` from props and use it in all resource names:
```javascript
const environmentSuffix = props?.environmentSuffix || 
  this.node.tryGetContext('environmentSuffix') || 'dev';
repositoryName: `healthcare-application-${environmentSuffix}`
```

### 8. **CommonJS vs ES6 Module Syntax**
**Problem:** Using `require()` statements (CommonJS)
**Fix:** Use `import` statements (ES6) to match project configuration
**Impact:** Module loading errors in ES6 environment

### 9. **Outdated Runtime Version**
**Problem:** Lambda using `Runtime.NODEJS_16_X` (deprecated)
**Fix:** Update to `Runtime.NODEJS_20_X` for current LTS support

### 10. **Outdated Build Image**
**Problem:** Using `AMAZON_LINUX_2_3` build image
**Fix:** Update to `AMAZON_LINUX_2_5` for latest security patches

### 11. **Unnecessary Cache Bucket**
**Problem:** Creating separate cache bucket for CodeBuild
**Fix:** Remove cache configuration or use the same artifact bucket with prefix

### 12. **Privileged Build Mode**
**Problem:** `privileged: true` enabled unnecessarily
**Fix:** Set `privileged: false` unless Docker-in-Docker is required
**Security Impact:** Reduces container escape risk

### 13. **CloudWatch Import Path**
**Problem:** Using `cdk.aws_cloudwatch` instead of importing directly
**Fix:** Import cloudwatch module: `import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'`

### 14. **Missing Stack Outputs Descriptions**
**Problem:** CfnOutput resources lack descriptions
**Fix:** Add description field to all outputs for documentation

### 15. **Incomplete BuildSpec Configuration**
**Problem:** BuildSpec missing runtime-versions and proper phase structure
**Fix:** Add `runtime-versions` in install phase:
```javascript
install: {
  'runtime-versions': {
    nodejs: '18',
  },
  commands: [...]
}
```

### 16. **Lambda Inputs in Pipeline Action**
**Problem:** `inputs: [buildOutput]` specified for LambdaInvokeAction
**Fix:** Remove `inputs` parameter - Lambda doesn't directly consume pipeline artifacts this way

### 17. **Missing Explicit Log Group Deletion Policy**
**Problem:** Log groups created without removal policy
**Fix:** Add `removalPolicy: cdk.RemovalPolicy.DESTROY` to all log groups

### 18. **Dashboard Name Not Environment-Specific**
**Problem:** Hardcoded dashboard name `'HealthcarePipeline-Monitoring'`
**Fix:** Include environment suffix: `healthcare-pipeline-${environmentSuffix}`

### 19. **Additional Unused Dashboard Widget**
**Problem:** Second GraphWidget for CodeDeploy metrics not required by prompt
**Fix:** Remove or consolidate into single pipeline monitoring widget

### 20. **Missing Export Statement**
**Problem:** Class exported via app instantiation instead of module export
**Fix:** Use proper ES6 export: `export { TapStack };`

## Summary of Required Changes

**Total Critical Issues:** 20
**Categories:**
- Deprecated APIs: 3 issues
- Configuration Errors: 7 issues  
- Naming/Environment: 4 issues
- Syntax/Import: 3 issues
- Security: 1 issue
- Resource Cleanup: 2 issues

**Expected Outcome:** After applying all fixes, the stack will:
- Deploy successfully without warnings
- Pass all unit tests with 100% coverage
- Support clean deletion without retained resources
- Follow AWS CDK best practices
- Work correctly with CI/CD environment variables