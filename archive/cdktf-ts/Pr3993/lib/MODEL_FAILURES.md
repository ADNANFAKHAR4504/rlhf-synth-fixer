# MODEL FAILURES

## Critical Deployment-Breaking Failures

### 1. API Gateway Method and Integration Response Creation Order

**Model Response (Failed):**
Created integration responses before the method responses existed, causing deployment failure: `"No method response exists for method."`

```typescript
// modules.ts - MODEL_RESPONSE
// WRONG: Creating integration response without ensuring method response exists
new aws.apiGatewayIntegrationResponse.ApiGatewayIntegrationResponse(this, `integration-response-options-${integration.path}-${idx}`, {
  restApiId: this.api.id,
  resourceId: resourceId,
  httpMethod: 'OPTIONS',
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'method.response.header.Access-Control-Allow-Methods': `'${integration.methods.join(',')},OPTIONS'`,
    'method.response.header.Access-Control-Allow-Origin': "'*'"
  }
});
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// modules.ts - IDEAL_RESPONSE
// CORRECT: Explicit dependency chain with proper ordering
// 1. Create method first
const optionsMethod = new ApiGatewayMethod(this, `${resourceName}-options-method`, {
  restApiId: this.api.id,
  resourceId: resource.id,
  httpMethod: 'OPTIONS',
  authorization: 'NONE',
});

// 2. Create integration with dependsOn method
const integration = new ApiGatewayIntegration(this, `${resourceName}-options-integration`, {
  restApiId: this.api.id,
  resourceId: resource.id,
  httpMethod: 'OPTIONS',
  type: 'MOCK',
  requestTemplates: {
    'application/json': '{"statusCode": 200}',
  },
  dependsOn: [optionsMethod], // Critical dependency
});

// 3. Create method response with dependsOn method
const methodResponse = new ApiGatewayMethodResponse(this, `${resourceName}-options-response`, {
  restApiId: this.api.id,
  resourceId: resource.id,
  httpMethod: optionsMethod.httpMethod,
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Headers': true,
    'method.response.header.Access-Control-Allow-Methods': true,
    'method.response.header.Access-Control-Allow-Origin': true,
  },
  dependsOn: [optionsMethod], // Critical dependency
});

// 4. Create integration response with dependsOn BOTH
const integrationResponse = new ApiGatewayIntegrationResponse(this, `${resourceName}-options-integration-response`, {
  restApiId: this.api.id,
  resourceId: resource.id,
  httpMethod: optionsMethod.httpMethod,
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'method.response.header.Access-Control-Allow-Methods':
      "'GET,POST,PUT,DELETE,OPTIONS'",
    'method.response.header.Access-Control-Allow-Origin': "'*'",
  },
  responseTemplates: {
    'application/json': '',
  },
  dependsOn: [integration, methodResponse], // Must depend on BOTH
});
```

---

### 2. API Gateway Deployment Dependencies

**Model Response (Failed):**
Failed to track dependencies for deployment, resulting in: `"No integration defined for method"`

```typescript
// modules.ts - MODEL_RESPONSE
// WRONG: No dependency tracking, immediate deployment creation
const deployment = new aws.apiGatewayDeployment.ApiGatewayDeployment(this, 'deployment', {
  restApiId: this.api.id,
  lifecycle: {
    createBeforeDestroy: true
  }
});
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// modules.ts - IDEAL_RESPONSE
// CORRECT: Comprehensive dependency tracking system
export class ApiGatewayConstruct extends Construct {
  private readonly allDependencies: any[] = [];

  public addCorsOptions(...): ApiMethodDependencies {
    // ... create resources ...
    
    // Track all created resources
    this.allDependencies.push(
      optionsMethod,
      integration,
      methodResponse,
      integrationResponse
    );
    
    return { method, integration, methodResponse, integrationResponse };
  }
  
  public createLambdaIntegration(...): ApiMethodDependencies {
    // ... create resources ...
    
    // Track dependencies
    this.allDependencies.push(method, integration);
    
    return { method, integration };
  }
  
  public getDeploymentDependencies(): any[] {
    return this.allDependencies;
  }
}

// tap-stack.ts - IDEAL_RESPONSE
// Use collected dependencies for deployment
const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
  restApiId: apiGateway.api.id,
  dependsOn: apiGateway.getDeploymentDependencies(), // All dependencies
  description: `Deployment for ${environmentSuffix} stage at ${new Date().toISOString()}`,
});
```

---

### 3. Deprecated AWS Region Data Source Attribute

**Model Response (Failed):**
Used deprecated `name` attribute causing warnings that could lead to future failures.

```typescript
// tap-stack.ts - MODEL_RESPONSE (Line 86)
// WRONG: Using deprecated attribute
"value": "https://${aws_api_gateway_rest_api.api-gateway_api_57BFA6D4.id}.execute-api.${data.aws_region.current-region (current-region).name}.amazonaws.com/${aws_api_gateway_stage.api-stage.stage_name}"
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// tap-stack.ts - IDEAL_RESPONSE
// CORRECT: Using DataAwsRegion with proper attribute access
const currentRegion = new DataAwsRegion(this, 'current-region');

new TerraformOutput(this, 'api-gateway-url', {
  value: `https://${apiGateway.api.id}.execute-api.${currentRegion.name}.amazonaws.com/${apiStage.stageName}`,
  description: 'API Gateway endpoint URL',
});
```

---

### 4. Lambda Code Deployment Architecture

**Model Response (Failed):**
Used problematic inline code override pattern and TerraformAsset incorrectly.

```typescript
// modules.ts - MODEL_RESPONSE
// WRONG: Creating fake assets and override patterns
const asset = new TerraformAsset(this, 'lambda-asset', {
  path: `/tmp/${config.functionName}-${Date.now()}`,
  type: 'archive'
});

// Creating two Lambda functions and overriding
const inlineCodeOverride = new aws.lambdaFunction.LambdaFunction(this, 'function-inline', {
  functionName: config.functionName,
  // ...
  inlineCode: config.inlineCode,
});

// Problematic override
this.lambda = inlineCodeOverride;
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// modules.ts - IDEAL_RESPONSE
// CORRECT: Using DataArchiveFile for proper inline code packaging
const lambdaCode = `
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const dynamodb = new AWS.DynamoDB.DocumentClient();

${config.inlineCode}
`;

const archive = new DataArchiveFile(this, 'lambda-archive', {
  type: 'zip',
  outputPath: `${config.functionName}.zip`,
  source: [
    {
      content: lambdaCode,
      filename: 'index.js',
    },
  ],
});

this.lambda = new LambdaFunction(this, 'function', {
  functionName: config.functionName,
  role: this.role.arn,
  handler: config.handler,
  runtime: config.runtime || 'nodejs18.x',
  filename: archive.outputPath,
  sourceCodeHash: archive.outputBase64Sha256, // Proper hash for updates
  tags,
  dependsOn: [this.logGroup], // Ensure log group exists first
});
```

---

### 5. Missing Archive Provider Configuration

**Model Response (Failed):**
Failed to configure Archive provider, leading to inability to properly package Lambda code.

```typescript
// tap-stack.ts - MODEL_RESPONSE
// MISSING: No Archive provider configured
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// tap-stack.ts - IDEAL_RESPONSE
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);
    
    // Configure Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');
    
    // ... rest of configuration
  }
}
```

---

### 6. S3 Backend State Locking Configuration

**Model Response (Failed):**
Missing S3 backend configuration and state locking mechanism.

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// tap-stack.ts - IDEAL_RESPONSE
// Configure S3 Backend with native state locking
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});

// Enable S3 state locking
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

---

### 7. Resource Naming and Type Safety

**Model Response (Failed):**
Used complex resource ID generation that could cause conflicts and made debugging difficult.

```typescript
// MODEL_RESPONSE
// Complex, error-prone resource naming
`resource-${currentPath.replace(/[^a-zA-Z0-9]/g, '-')}`
`method-${integration.path}-${method}-${idx}`
`integration-${integration.path}-${method}-${idx}`
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// IDEAL_RESPONSE
// Clean, semantic resource naming
'products-resource'
'product-id-resource'
'products-GET-method'
'products-GET-integration'
```

---

### 8. Lambda IAM Policy Resource ARN Construction

**Model Response (Failed):**
Hardcoded region in IAM policy ARNs and overly broad permissions.

```typescript
// MODEL_RESPONSE
Resource: `arn:aws:ssm:${stackConfig.region}:*:parameter/${stackConfig.projectName}/${stackConfig.environment}/*`
```

**Actual Fix (IDEAL_RESPONSE):**
```typescript
// IDEAL_RESPONSE
// Uses data sources for dynamic resolution
Resource: `arn:aws:ssm:${currentRegion.name}:${current.accountId}:parameter/ecommerce/${environmentSuffix}/tables/*`
```

These fixes ensure proper resource ordering, dependency management, and prevent the deployment failures encountered in the MODEL_RESPONSE.