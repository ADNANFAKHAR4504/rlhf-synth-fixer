## ❌ Model Failures

### 1. Incorrect CDKTF Import Names
- Used `ApiGatewayV2Api`, `CodedeployApplication` instead of correct `Apigatewayv2Api`, `CodedeployApp`.

### 2. Missing CodedeployDeploymentConfig
- The model omits custom canary deployment configuration using `CodedeployDeploymentConfig`.

### 3. Incorrect LambdaPermission functionName
- Passed `lambdaAlias.arn` instead of `lambdaAlias.functionName`.

### 4. Missing `dependsOn` for API Gateway log group
- Stage creation should depend on log group being ready.

### 5. Rigid CommonTags interface
- Defined as fixed shape instead of using a flexible key-value map.

### 6. Wrong `applicationName` usage in DeploymentGroup
- Used `applicationName` instead of `appName`.

### 7. Invalid Blue/Green config for Lambda
- Added `blueGreenDeploymentConfig` which is not supported for Lambda deployments.

### 8. Missing Deployment Config Outputs
- No output or construct defined for `CodedeployDeploymentConfig`.

### 9. Incorrect sourceCodeHash syntax
- Used a string interpolation instead of `Fn.filebase64sha256(config.filename)`.

### 10. Over-permissive IAM policy for API Gateway logs
- Policy grants access to `*` instead of scoped ARN per log group.

