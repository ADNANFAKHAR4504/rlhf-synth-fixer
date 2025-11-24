# Model Failures and Corrections

This document catalogs all issues found in the initial MODEL_RESPONSE implementation and the corrections applied in the IDEAL_RESPONSE.

## Critical Failures

### 1. Inline IAM Policies (Constraint Violation)

**Issue**: The MODEL_RESPONSE used inline IAM policies via `aws.iam.RolePolicy`, which violates the explicit constraint: "IAM roles must follow principle of least privilege with no inline policies allowed."

**Location**:
- `lambdaDynamoPolicy` (line 109)
- `codeBuildPolicy` (line 265)
- `pipelinePolicy` (line 345)

**Impact**: HIGH - Direct violation of stated requirements, fails compliance checks

**Fix**: Convert all inline policies to managed policies using `aws.iam.Policy` and attach them via `aws.iam.RolePolicyAttachment`.

**Before**:
```typescript
const lambdaDynamoPolicy = new aws.iam.RolePolicy('lambdaDynamoPolicy', {
  role: lambdaRole.id,
  policy: pulumi.all([deploymentTable.arn]).apply(([tableArn]) => JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      Resource: tableArn,
    }],
  })),
}, { parent: this });
```

**After**:
```typescript
const lambdaDynamoPolicy = new aws.iam.Policy('lambdaDynamoPolicy', {
  name: `lambda-dynamodb-policy-${environmentSuffix}`,
  policy: pulumi.all([deploymentTable.arn]).apply(([tableArn]) => JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query'],
      Resource: tableArn,
    }],
  })),
  tags: props.tags,
}, { parent: this });

const lambdaDynamoPolicyAttachment = new aws.iam.RolePolicyAttachment('lambdaDynamoPolicyAttachment', {
  role: lambdaRole.name,
  policyArn: lambdaDynamoPolicy.arn,
}, { parent: this });
```

---

### 2. Reserved Concurrent Executions (Account Limit Risk)

**Issue**: Both Lambda functions configured with `reservedConcurrentExecutions: 100`, which:
- Can exceed AWS account concurrency limits (default 1000 per region)
- Violates the PROMPT.md guidance: "AVOID reserved concurrent executions unless absolutely required"
- Risk of deployment failure if account limit is reached

**Location**:
- `blueLambda` (line 132)
- `greenLambda` (line 160)

**Impact**: HIGH - Can cause deployment failures, violates deployment requirements

**Fix**: Remove `reservedConcurrentExecutions` entirely or set to low value (1-5).

**Before**:
```typescript
const blueLambda = new aws.lambda.Function('blueLambda', {
  name: `payment-processor-blue-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: 'index.handler',
  role: lambdaRole.arn,
  memorySize: 512,
  reservedConcurrentExecutions: 100, // PROBLEM
  // ...
});
```

**After**:
```typescript
const blueLambda = new aws.lambda.Function('blueLambda', {
  name: `payment-processor-blue-${environmentSuffix}`,
  runtime: aws.lambda.Runtime.NodeJS18dX,
  handler: 'index.handler',
  role: lambdaRole.arn,
  memorySize: 512,
  // Reserved concurrent executions removed per best practices
  // ...
});
```

---

### 3. CodeDeploy Deployment Group Missing Lambda Target Configuration

**Issue**: The CodeDeploy deployment group doesn't specify the Lambda function target configuration. Without `deploymentStyle` and Lambda-specific configuration, CodeDeploy cannot perform blue-green deployments on Lambda functions.

**Location**: `deploymentGroup` (line 232)

**Impact**: HIGH - Blue-green deployment will fail without proper Lambda configuration

**Fix**: Add `deploymentStyle` with `BLUE_GREEN` deployment type and configure Lambda target with proper alias management.

**Before**:
```typescript
const deploymentGroup = new aws.codedeploy.DeploymentGroup('deploymentGroup', {
  appName: codeDeployApp.name,
  deploymentGroupName: `payment-processor-dg-${environmentSuffix}`,
  serviceRoleArn: codeDeployRole.arn,
  deploymentConfigName: 'CodeDeployDefault.LambdaLinear10PercentEvery10Minutes',
  autoRollbackConfiguration: {
    enabled: true,
    events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
  },
  alarmConfiguration: {
    enabled: true,
    alarms: [errorAlarm.name],
  },
  tags: props.tags,
}, { parent: this });
```

**After**:
```typescript
const deploymentGroup = new aws.codedeploy.DeploymentGroup('deploymentGroup', {
  appName: codeDeployApp.name,
  deploymentGroupName: `payment-processor-dg-${environmentSuffix}`,
  serviceRoleArn: codeDeployRole.arn,
  deploymentConfigName: 'CodeDeployDefault.LambdaLinear10PercentEvery10Minutes',
  deploymentStyle: {
    deploymentOption: 'WITH_TRAFFIC_CONTROL',
    deploymentType: 'BLUE_GREEN',
  },
  autoRollbackConfiguration: {
    enabled: true,
    events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM'],
  },
  alarmConfiguration: {
    enabled: true,
    alarms: [errorAlarm.name],
  },
  tags: props.tags,
}, { parent: this });
```

---

### 4. Lambda Alias Configuration Issue

**Issue**: Lambda alias created with `functionVersion: '$LATEST'`, which is not compatible with CodeDeploy blue-green deployments. CodeDeploy requires a specific version number, not $LATEST.

**Location**: `lambdaAlias` (line 182)

**Impact**: MEDIUM - CodeDeploy cannot perform traffic shifting with $LATEST

**Fix**: Create proper Lambda versions and configure alias with version numbers.

**Before**:
```typescript
const lambdaAlias = new aws.lambda.Alias('lambdaAlias', {
  name: 'live',
  functionName: blueLambda.name,
  functionVersion: '$LATEST', // PROBLEM
}, { parent: this });
```

**After**:
```typescript
const blueLambdaVersion = new aws.lambda.Version('blueLambdaVersion', {
  functionName: blueLambda.name,
}, { parent: this });

const lambdaAlias = new aws.lambda.Alias('lambdaAlias', {
  name: 'live',
  functionName: blueLambda.name,
  functionVersion: blueLambdaVersion.version,
}, { parent: this });
```

---

## Medium-Priority Issues

### 5. GitHub OAuth Token in Pipeline Configuration (Security Risk)

**Issue**: GitHub OAuth token passed as plain text configuration parameter in CodePipeline, which is not secure and may expose credentials.

**Location**: Pipeline source stage configuration (line 405-410)

**Impact**: MEDIUM - Security risk, credentials in plain text

**Fix**: Use AWS CodeStar Connections or AWS Secrets Manager for secure GitHub integration.

**Before**:
```typescript
configuration: {
  Owner: githubOwner,
  Repo: githubRepo,
  Branch: githubBranch,
  OAuthToken: githubToken, // PROBLEM: Plain text
}
```

**After**:
```typescript
// Use CodeStar Connection instead
const codestarConnection = new aws.codestarconnections.Connection('githubConnection', {
  name: `github-connection-${environmentSuffix}`,
  providerType: 'GitHub',
  tags: props.tags,
}, { parent: this });

// In pipeline configuration:
configuration: {
  ConnectionArn: codestarConnection.arn,
  FullRepositoryId: `${githubOwner}/${githubRepo}`,
  BranchName: githubBranch,
  OutputArtifactFormat: 'CODE_ZIP',
}
```

---

### 6. CloudWatch Alarm Threshold Misconfiguration

**Issue**: CloudWatch alarm threshold set to `5` with statistic `Average`, which doesn't properly calculate 5% error rate. The threshold should be 0.05 (5%) when using Average statistic, or use proper metric math.

**Location**: `errorAlarm` (line 189)

**Impact**: MEDIUM - Alarm may not trigger correctly, affecting rollback automation

**Fix**: Use proper percentage calculation or metric math expression.

**Before**:
```typescript
const errorAlarm = new aws.cloudwatch.MetricAlarm('errorAlarm', {
  name: `lambda-errors-${environmentSuffix}`,
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: 'Errors',
  namespace: 'AWS/Lambda',
  period: 300,
  statistic: 'Average',
  threshold: 5, // PROBLEM: Should be 0.05 or use metric math
  // ...
});
```

**After**:
```typescript
const errorAlarm = new aws.cloudwatch.MetricAlarm('errorAlarm', {
  name: `lambda-errors-${environmentSuffix}`,
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricQueries: [
    {
      id: 'errorRate',
      expression: 'errors / invocations * 100',
      label: 'Error Rate (%)',
      returnData: true,
    },
    {
      id: 'errors',
      metric: {
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        stat: 'Sum',
        dimensions: { FunctionName: blueLambda.name },
      },
    },
    {
      id: 'invocations',
      metric: {
        metricName: 'Invocations',
        namespace: 'AWS/Lambda',
        period: 300,
        stat: 'Sum',
        dimensions: { FunctionName: blueLambda.name },
      },
    },
  ],
  threshold: 5, // Now correctly represents 5%
  // ...
});
```

---

### 7. Missing Lambda Function Dependencies

**Issue**: Lambda functions don't declare explicit dependency on the DynamoDB policy attachment, which can cause race conditions during deployment.

**Location**: `blueLambda` and `greenLambda` (lines 126, 154)

**Impact**: MEDIUM - Potential race condition where Lambda tries to access DynamoDB before policy is attached

**Fix**: Add explicit `dependsOn` to ensure IAM policies are attached before Lambda functions are created.

**Before**:
```typescript
const blueLambda = new aws.lambda.Function('blueLambda', {
  // ... configuration
}, { parent: this });
```

**After**:
```typescript
const blueLambda = new aws.lambda.Function('blueLambda', {
  // ... configuration
}, {
  parent: this,
  dependsOn: [lambdaDynamoPolicyAttachment],
});
```

---

### 8. CodePipeline Stage Naming Inconsistency

**Issue**: Pipeline stage "Deploy-Blue" uses Lambda Invoke action, which doesn't align with blue-green deployment pattern. The stage should directly deploy or use CodeDeploy.

**Location**: Pipeline "Deploy-Blue" stage (line 429)

**Impact**: MEDIUM - Misaligned with blue-green deployment workflow

**Fix**: Use CodeDeploy action for deployment or clarify stage purpose.

**Before**:
```typescript
{
  name: 'Deploy-Blue',
  actions: [{
    name: 'Deploy_Blue_Lambda',
    category: 'Invoke',
    owner: 'AWS',
    provider: 'Lambda',
    version: '1',
    inputArtifacts: ['build_output'],
    configuration: {
      FunctionName: blueLambda.name,
    },
  }],
}
```

**After**:
```typescript
// Remove this stage - CodeDeploy handles blue-green deployment in Switch-Traffic stage
// Or modify to be a pre-deployment validation step
{
  name: 'Deploy',
  actions: [{
    name: 'Deploy_Lambda',
    category: 'Deploy',
    owner: 'AWS',
    provider: 'CodeDeploy',
    version: '1',
    inputArtifacts: ['build_output'],
    configuration: {
      ApplicationName: codeDeployApp.name,
      DeploymentGroupName: deploymentGroup.deploymentGroupName,
    },
  }],
}
```

---

## Low-Priority Issues

### 9. Missing S3 Bucket Public Access Block

**Issue**: S3 bucket for pipeline artifacts doesn't have public access block configuration, which is a security best practice.

**Location**: `artifactBucket` (line 43)

**Impact**: LOW - Security best practice, but pipeline artifacts shouldn't be public anyway

**Fix**: Add public access block configuration.

**After**:
```typescript
const artifactBucket = new aws.s3.Bucket('artifactBucket', {
  bucket: `pipeline-artifacts-${environmentSuffix}`,
  versioning: { enabled: true },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
    },
  },
  publicAccessBlockConfiguration: {
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  lifecycleRules: [
    { enabled: true, noncurrentVersionExpiration: { days: 30 } },
  ],
  tags: props.tags,
}, { parent: this });
```

---

### 10. Missing CloudWatch Log Group for Lambda

**Issue**: Lambda functions don't explicitly create CloudWatch log groups, relying on auto-creation. This can cause issues with retention policy management.

**Location**: Lambda function definitions

**Impact**: LOW - Best practice for explicit resource management

**Fix**: Create explicit log groups with retention policies.

**After**:
```typescript
const blueLambdaLogGroup = new aws.cloudwatch.LogGroup('blueLambdaLogGroup', {
  name: pulumi.interpolate`/aws/lambda/${blueLambda.name}`,
  retentionInDays: 7,
  tags: props.tags,
}, { parent: this });
```

---

## Summary Statistics

- **Total Issues**: 10
- **Critical**: 4 (Inline policies, reserved concurrency, CodeDeploy config, Lambda alias)
- **Medium**: 4 (GitHub token, alarm threshold, dependencies, pipeline stage)
- **Low**: 2 (S3 public access, log groups)

## Testing Recommendations

1. **IAM Policy Validation**: Verify all policies are managed policies, not inline
2. **Lambda Concurrency**: Test deployment without reserved concurrency limits
3. **CodeDeploy Blue-Green**: Verify traffic shifting works correctly
4. **CloudWatch Alarms**: Trigger alarm manually to verify rollback automation
5. **Security Scan**: Run security scan on S3 buckets and IAM policies

## Lessons Learned

1. Always convert inline IAM policies to managed policies when constraints prohibit inline policies
2. Avoid reserved Lambda concurrent executions unless explicitly required
3. CodeDeploy for Lambda requires specific alias and version configuration
4. GitHub OAuth tokens should use CodeStar Connections for security
5. CloudWatch metric math provides more accurate percentage calculations
6. Explicit resource dependencies prevent race conditions
7. S3 buckets should always have public access blocks configured